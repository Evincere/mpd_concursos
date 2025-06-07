import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { of } from 'rxjs';
import { PermissionGuard, RoleGuard, RoleLevelGuard } from './permission.guard';
import { AuthorizationService } from '@core/services/roles/authorization.service';
import { CustomNotificationService } from '@shared/components/custom-notification/custom-notification.service';

describe('Permission Guards', () => {
  let authorizationServiceSpy: jasmine.SpyObj<AuthorizationService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let notificationServiceSpy: jasmine.SpyObj<CustomNotificationService>;

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('AuthorizationService', [
      'hasAllPermissions',
      'hasAnyPermission',
      'hasAnyRole',
      'hasRoleLevel',
      'currentUserPermissions$'
    ]);
    const routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);
    const notificationSpy = jasmine.createSpyObj('CustomNotificationService', ['showError']);

    TestBed.configureTestingModule({
      providers: [
        PermissionGuard,
        RoleGuard,
        RoleLevelGuard,
        { provide: AuthorizationService, useValue: authSpy },
        { provide: Router, useValue: routerSpyObj },
        { provide: CustomNotificationService, useValue: notificationSpy }
      ]
    });

    authorizationServiceSpy = TestBed.inject(AuthorizationService) as jasmine.SpyObj<AuthorizationService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    notificationServiceSpy = TestBed.inject(CustomNotificationService) as jasmine.SpyObj<CustomNotificationService>;
  });

  describe('PermissionGuard', () => {
    let guard: PermissionGuard;

    beforeEach(() => {
      guard = TestBed.inject(PermissionGuard);
    });

    it('should be created', () => {
      expect(guard).toBeTruthy();
    });

    describe('canActivate', () => {
      it('should allow access when user has required permissions', (done) => {
        const route = new ActivatedRouteSnapshot();
        route.data = { permissions: 'users.read' };
        const state = { url: '/users' } as RouterStateSnapshot;

        authorizationServiceSpy.hasAllPermissions.and.returnValue(of(true));

        guard.canActivate(route, state).subscribe(result => {
          expect(result).toBe(true);
          expect(authorizationServiceSpy.hasAllPermissions).toHaveBeenCalledWith(['users.read'], undefined);
          done();
        });
      });

      it('should deny access when user lacks required permissions', (done) => {
        const route = new ActivatedRouteSnapshot();
        route.data = { permissions: 'users.delete' };
        const state = { url: '/users/delete' } as RouterStateSnapshot;

        authorizationServiceSpy.hasAllPermissions.and.returnValue(of(false));

        guard.canActivate(route, state).subscribe(result => {
          expect(result).toBe(false);
          expect(notificationServiceSpy.showError).toHaveBeenCalledWith('No tienes permisos para acceder a esta sección');
          expect(routerSpy.navigate).toHaveBeenCalledWith(['/access-denied'], {
            queryParams: { returnUrl: '/users/delete' }
          });
          done();
        });
      });

      it('should allow access when no permissions are configured', (done) => {
        const route = new ActivatedRouteSnapshot();
        route.data = {};
        const state = { url: '/public' } as RouterStateSnapshot;

        guard.canActivate(route, state).subscribe(result => {
          expect(result).toBe(true);
          expect(authorizationServiceSpy.hasAllPermissions).not.toHaveBeenCalled();
          done();
        });
      });

      it('should handle permission arrays', (done) => {
        const route = new ActivatedRouteSnapshot();
        route.data = { permissions: ['users.read', 'users.write'] };
        const state = { url: '/users' } as RouterStateSnapshot;

        authorizationServiceSpy.hasAllPermissions.and.returnValue(of(true));

        guard.canActivate(route, state).subscribe(result => {
          expect(result).toBe(true);
          expect(authorizationServiceSpy.hasAllPermissions).toHaveBeenCalledWith(['users.read', 'users.write'], undefined);
          done();
        });
      });

      it('should use any operator when specified', (done) => {
        const route = new ActivatedRouteSnapshot();
        route.data = { 
          permissions: ['users.read', 'users.write'],
          permissionOperator: 'any'
        };
        const state = { url: '/users' } as RouterStateSnapshot;

        authorizationServiceSpy.hasAnyPermission.and.returnValue(of(true));

        guard.canActivate(route, state).subscribe(result => {
          expect(result).toBe(true);
          expect(authorizationServiceSpy.hasAnyPermission).toHaveBeenCalledWith(['users.read', 'users.write'], undefined);
          done();
        });
      });

      it('should include route parameters in context', (done) => {
        const route = new ActivatedRouteSnapshot();
        route.data = { permissions: 'users.read' };
        route.params = { userId: '123' };
        route.queryParams = { department: 'IT' };
        const state = { url: '/users/123' } as RouterStateSnapshot;

        authorizationServiceSpy.hasAllPermissions.and.returnValue(of(true));

        guard.canActivate(route, state).subscribe(result => {
          expect(result).toBe(true);
          expect(authorizationServiceSpy.hasAllPermissions).toHaveBeenCalledWith(
            ['users.read'], 
            jasmine.objectContaining({
              userId: '123',
              query_department: 'IT'
            })
          );
          done();
        });
      });

      it('should use custom redirect URL when specified', (done) => {
        const route = new ActivatedRouteSnapshot();
        route.data = { 
          permissions: 'admin.access',
          redirectTo: '/login'
        };
        const state = { url: '/admin' } as RouterStateSnapshot;

        authorizationServiceSpy.hasAllPermissions.and.returnValue(of(false));

        guard.canActivate(route, state).subscribe(result => {
          expect(result).toBe(false);
          expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
          done();
        });
      });

      it('should use custom notification message when specified', (done) => {
        const route = new ActivatedRouteSnapshot();
        route.data = { 
          permissions: 'admin.access',
          notificationMessage: 'Acceso restringido a administradores'
        };
        const state = { url: '/admin' } as RouterStateSnapshot;

        authorizationServiceSpy.hasAllPermissions.and.returnValue(of(false));

        guard.canActivate(route, state).subscribe(result => {
          expect(result).toBe(false);
          expect(notificationServiceSpy.showError).toHaveBeenCalledWith('Acceso restringido a administradores');
          done();
        });
      });

      it('should not show notification when disabled', (done) => {
        const route = new ActivatedRouteSnapshot();
        route.data = { 
          permissions: 'admin.access',
          showNotification: false
        };
        const state = { url: '/admin' } as RouterStateSnapshot;

        authorizationServiceSpy.hasAllPermissions.and.returnValue(of(false));

        guard.canActivate(route, state).subscribe(result => {
          expect(result).toBe(false);
          expect(notificationServiceSpy.showError).not.toHaveBeenCalled();
          done();
        });
      });
    });

    describe('canActivateChild', () => {
      it('should work the same as canActivate', (done) => {
        const route = new ActivatedRouteSnapshot();
        route.data = { permissions: 'users.read' };
        const state = { url: '/users' } as RouterStateSnapshot;

        authorizationServiceSpy.hasAllPermissions.and.returnValue(of(true));

        guard.canActivateChild(route, state).subscribe(result => {
          expect(result).toBe(true);
          done();
        });
      });
    });

    describe('canLoad', () => {
      it('should work with route configuration', (done) => {
        const route = { data: { permissions: 'users.read' } };
        const segments = [{ path: 'users', parameters: {} }] as any;

        authorizationServiceSpy.hasAllPermissions.and.returnValue(of(true));

        guard.canLoad(route, segments).subscribe(result => {
          expect(result).toBe(true);
          done();
        });
      });
    });
  });

  describe('RoleGuard', () => {
    let guard: RoleGuard;

    beforeEach(() => {
      guard = TestBed.inject(RoleGuard);
    });

    it('should be created', () => {
      expect(guard).toBeTruthy();
    });

    describe('canActivate', () => {
      it('should allow access when user has required role', (done) => {
        const route = new ActivatedRouteSnapshot();
        route.data = { roles: 'ADMIN' };
        const state = { url: '/admin' } as RouterStateSnapshot;

        authorizationServiceSpy.hasAnyRole.and.returnValue(of(true));

        guard.canActivate(route, state).subscribe(result => {
          expect(result).toBe(true);
          expect(authorizationServiceSpy.hasAnyRole).toHaveBeenCalledWith(['ADMIN']);
          done();
        });
      });

      it('should deny access when user lacks required role', (done) => {
        const route = new ActivatedRouteSnapshot();
        route.data = { roles: 'ADMIN' };
        const state = { url: '/admin' } as RouterStateSnapshot;

        authorizationServiceSpy.hasAnyRole.and.returnValue(of(false));

        guard.canActivate(route, state).subscribe(result => {
          expect(result).toBe(false);
          expect(notificationServiceSpy.showError).toHaveBeenCalledWith('No tienes el rol necesario para acceder a esta sección');
          done();
        });
      });

      it('should allow access when no roles are configured', (done) => {
        const route = new ActivatedRouteSnapshot();
        route.data = {};
        const state = { url: '/public' } as RouterStateSnapshot;

        guard.canActivate(route, state).subscribe(result => {
          expect(result).toBe(true);
          expect(authorizationServiceSpy.hasAnyRole).not.toHaveBeenCalled();
          done();
        });
      });

      it('should handle role arrays', (done) => {
        const route = new ActivatedRouteSnapshot();
        route.data = { roles: ['ADMIN', 'MANAGER'] };
        const state = { url: '/admin' } as RouterStateSnapshot;

        authorizationServiceSpy.hasAnyRole.and.returnValue(of(true));

        guard.canActivate(route, state).subscribe(result => {
          expect(result).toBe(true);
          expect(authorizationServiceSpy.hasAnyRole).toHaveBeenCalledWith(['ADMIN', 'MANAGER']);
          done();
        });
      });
    });
  });

  describe('RoleLevelGuard', () => {
    let guard: RoleLevelGuard;

    beforeEach(() => {
      guard = TestBed.inject(RoleLevelGuard);
    });

    it('should be created', () => {
      expect(guard).toBeTruthy();
    });

    describe('canActivate', () => {
      it('should allow access when user has required role level', (done) => {
        const route = new ActivatedRouteSnapshot();
        route.data = { roleLevel: 'ADMIN' };
        const state = { url: '/admin' } as RouterStateSnapshot;

        authorizationServiceSpy.hasRoleLevel.and.returnValue(of(true));

        guard.canActivate(route, state).subscribe(result => {
          expect(result).toBe(true);
          expect(authorizationServiceSpy.hasRoleLevel).toHaveBeenCalledWith('ADMIN');
          done();
        });
      });

      it('should deny access when user lacks required role level', (done) => {
        const route = new ActivatedRouteSnapshot();
        route.data = { roleLevel: 'ADMIN' };
        const state = { url: '/admin' } as RouterStateSnapshot;

        authorizationServiceSpy.hasRoleLevel.and.returnValue(of(false));

        guard.canActivate(route, state).subscribe(result => {
          expect(result).toBe(false);
          expect(notificationServiceSpy.showError).toHaveBeenCalledWith('No tienes el nivel de acceso necesario para esta sección');
          done();
        });
      });

      it('should allow access when no role level is configured', (done) => {
        const route = new ActivatedRouteSnapshot();
        route.data = {};
        const state = { url: '/public' } as RouterStateSnapshot;

        guard.canActivate(route, state).subscribe(result => {
          expect(result).toBe(true);
          expect(authorizationServiceSpy.hasRoleLevel).not.toHaveBeenCalled();
          done();
        });
      });
    });
  });

  describe('Error handling', () => {
    let permissionGuard: PermissionGuard;

    beforeEach(() => {
      permissionGuard = TestBed.inject(PermissionGuard);
    });

    it('should handle authorization service errors gracefully', (done) => {
      const route = new ActivatedRouteSnapshot();
      route.data = { permissions: 'users.read' };
      const state = { url: '/users' } as RouterStateSnapshot;

      authorizationServiceSpy.hasAllPermissions.and.throwError('Service error');

      permissionGuard.canActivate(route, state).subscribe(result => {
        expect(result).toBe(false);
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/access-denied'], {
          queryParams: { returnUrl: '/users' }
        });
        done();
      });
    });
  });
});
