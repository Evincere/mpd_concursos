import { TestBed } from '@angular/core/testing';
import { of, BehaviorSubject } from 'rxjs';
import { AuthorizationService, AuthorizationContext } from './authorization.service';
import { AuthService } from '@core/services/auth.service';
import { RoleManagementService } from './role-management.service';
import { 
  Permission, 
  Role, 
  UserEffectivePermissions,
  RoleLevel 
} from '@shared/interfaces/roles/role.interface';

describe('AuthorizationService', () => {
  let service: AuthorizationService;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let roleManagementServiceSpy: jasmine.SpyObj<RoleManagementService>;

  // Mock data
  const mockUser = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com'
  };

  const mockPermission: Permission = {
    id: 'users.read',
    name: 'Read Users',
    description: 'Permission to read users',
    module: 'users',
    action: 'READ',
    resource: 'user',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockRole: Role = {
    id: 'role-1',
    name: 'Test Role',
    description: 'Test role',
    type: 'CUSTOM',
    level: 'USER' as RoleLevel,
    permissions: [mockPermission],
    isSystem: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockUserPermissions: UserEffectivePermissions = {
    userId: 'user-1',
    roles: [mockRole],
    permissions: [mockPermission],
    deniedPermissions: [],
    inheritedPermissions: [],
    directPermissions: [mockPermission],
    contextualPermissions: [],
    lastCalculated: new Date()
  };

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser'], {
      currentUser$: new BehaviorSubject(mockUser)
    });
    const roleSpy = jasmine.createSpyObj('RoleManagementService', ['getUserEffectivePermissions']);

    TestBed.configureTestingModule({
      providers: [
        AuthorizationService,
        { provide: AuthService, useValue: authSpy },
        { provide: RoleManagementService, useValue: roleSpy }
      ]
    });

    service = TestBed.inject(AuthorizationService);
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    roleManagementServiceSpy = TestBed.inject(RoleManagementService) as jasmine.SpyObj<RoleManagementService>;

    // Setup default spy returns
    roleManagementServiceSpy.getUserEffectivePermissions.and.returnValue(of(mockUserPermissions));
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('hasPermission', () => {
    beforeEach(() => {
      // Simular que el usuario tiene permisos cargados
      service['currentUserPermissionsSubject'].next(mockUserPermissions);
    });

    it('should return true when user has permission', (done) => {
      service.hasPermission('users.read').subscribe(hasPermission => {
        expect(hasPermission).toBe(true);
        done();
      });
    });

    it('should return false when user does not have permission', (done) => {
      service.hasPermission('users.delete').subscribe(hasPermission => {
        expect(hasPermission).toBe(false);
        done();
      });
    });

    it('should work with permission object', (done) => {
      service.hasPermission(mockPermission).subscribe(hasPermission => {
        expect(hasPermission).toBe(true);
        done();
      });
    });

    it('should handle context-based permissions', (done) => {
      const context: AuthorizationContext = { department: 'IT' };
      
      service.hasPermission('users.read', context).subscribe(hasPermission => {
        expect(hasPermission).toBe(true);
        done();
      });
    });
  });

  describe('hasAllPermissions', () => {
    beforeEach(() => {
      service['currentUserPermissionsSubject'].next(mockUserPermissions);
    });

    it('should return true when user has all permissions', (done) => {
      service.hasAllPermissions(['users.read']).subscribe(hasAll => {
        expect(hasAll).toBe(true);
        done();
      });
    });

    it('should return false when user is missing some permissions', (done) => {
      service.hasAllPermissions(['users.read', 'users.delete']).subscribe(hasAll => {
        expect(hasAll).toBe(false);
        done();
      });
    });

    it('should return true for empty permissions array', (done) => {
      service.hasAllPermissions([]).subscribe(hasAll => {
        expect(hasAll).toBe(true);
        done();
      });
    });
  });

  describe('hasAnyPermission', () => {
    beforeEach(() => {
      service['currentUserPermissionsSubject'].next(mockUserPermissions);
    });

    it('should return true when user has at least one permission', (done) => {
      service.hasAnyPermission(['users.read', 'users.delete']).subscribe(hasAny => {
        expect(hasAny).toBe(true);
        done();
      });
    });

    it('should return false when user has none of the permissions', (done) => {
      service.hasAnyPermission(['users.delete', 'users.create']).subscribe(hasAny => {
        expect(hasAny).toBe(false);
        done();
      });
    });

    it('should return false for empty permissions array', (done) => {
      service.hasAnyPermission([]).subscribe(hasAny => {
        expect(hasAny).toBe(false);
        done();
      });
    });
  });

  describe('checkAuthorization', () => {
    beforeEach(() => {
      service['currentUserPermissionsSubject'].next(mockUserPermissions);
    });

    it('should return authorized result when user has permission', (done) => {
      service.checkAuthorization('users.read').subscribe(result => {
        expect(result.authorized).toBe(true);
        expect(result.requiredPermissions).toContain('users.read');
        expect(result.missingPermissions).toEqual([]);
        done();
      });
    });

    it('should return unauthorized result when user lacks permission', (done) => {
      service.checkAuthorization('users.delete').subscribe(result => {
        expect(result.authorized).toBe(false);
        expect(result.requiredPermissions).toContain('users.delete');
        expect(result.missingPermissions).toContain('users.delete');
        expect(result.reason).toBe('Permission not granted');
        done();
      });
    });

    it('should handle permission object input', (done) => {
      service.checkAuthorization(mockPermission).subscribe(result => {
        expect(result.authorized).toBe(true);
        done();
      });
    });

    it('should include context in result', (done) => {
      const context: AuthorizationContext = { department: 'IT' };
      
      service.checkAuthorization('users.read', context).subscribe(result => {
        expect(result.context).toEqual(context);
        done();
      });
    });
  });

  describe('hasRole', () => {
    beforeEach(() => {
      service['currentUserPermissionsSubject'].next(mockUserPermissions);
    });

    it('should return true when user has role', (done) => {
      service.hasRole('role-1').subscribe(hasRole => {
        expect(hasRole).toBe(true);
        done();
      });
    });

    it('should return false when user does not have role', (done) => {
      service.hasRole('role-2').subscribe(hasRole => {
        expect(hasRole).toBe(false);
        done();
      });
    });

    it('should return false when user permissions are null', (done) => {
      service['currentUserPermissionsSubject'].next(null);
      
      service.hasRole('role-1').subscribe(hasRole => {
        expect(hasRole).toBe(false);
        done();
      });
    });
  });

  describe('hasAnyRole', () => {
    beforeEach(() => {
      service['currentUserPermissionsSubject'].next(mockUserPermissions);
    });

    it('should return true when user has at least one role', (done) => {
      service.hasAnyRole(['role-1', 'role-2']).subscribe(hasAny => {
        expect(hasAny).toBe(true);
        done();
      });
    });

    it('should return false when user has none of the roles', (done) => {
      service.hasAnyRole(['role-2', 'role-3']).subscribe(hasAny => {
        expect(hasAny).toBe(false);
        done();
      });
    });
  });

  describe('hasRoleLevel', () => {
    beforeEach(() => {
      service['currentUserPermissionsSubject'].next(mockUserPermissions);
    });

    it('should return true when user has required level or higher', (done) => {
      service.hasRoleLevel('USER').subscribe(hasLevel => {
        expect(hasLevel).toBe(true);
        done();
      });
    });

    it('should return true when user has higher level', (done) => {
      service.hasRoleLevel('GUEST').subscribe(hasLevel => {
        expect(hasLevel).toBe(true);
        done();
      });
    });

    it('should return false when user has lower level', (done) => {
      service.hasRoleLevel('ADMIN').subscribe(hasLevel => {
        expect(hasLevel).toBe(false);
        done();
      });
    });
  });

  describe('clearAuthorizationCache', () => {
    it('should clear the authorization cache', () => {
      // Agregar algo al cache
      service['authorizationCache'].set('test-key', {
        authorized: true,
        requiredPermissions: [],
        userPermissions: [],
        missingPermissions: []
      });

      expect(service['authorizationCache'].size).toBe(1);

      service.clearAuthorizationCache();

      expect(service['authorizationCache'].size).toBe(0);
    });
  });

  describe('getCurrentUserPermissions', () => {
    it('should return current user permissions', () => {
      service['currentUserPermissionsSubject'].next(mockUserPermissions);
      
      const permissions = service.getCurrentUserPermissions();
      expect(permissions).toEqual(mockUserPermissions);
    });

    it('should return null when no permissions loaded', () => {
      service['currentUserPermissionsSubject'].next(null);
      
      const permissions = service.getCurrentUserPermissions();
      expect(permissions).toBeNull();
    });
  });

  describe('refreshUserPermissions', () => {
    it('should refresh user permissions', (done) => {
      authServiceSpy.getCurrentUser.and.returnValue(mockUser);
      
      service.refreshUserPermissions().subscribe(permissions => {
        expect(permissions).toEqual(mockUserPermissions);
        expect(roleManagementServiceSpy.getUserEffectivePermissions).toHaveBeenCalledWith('user-1', false);
        done();
      });
    });

    it('should return null when no current user', (done) => {
      authServiceSpy.getCurrentUser.and.returnValue(null);
      
      service.refreshUserPermissions().subscribe(permissions => {
        expect(permissions).toBeNull();
        done();
      });
    });
  });

  describe('checkMultiplePermissions', () => {
    beforeEach(() => {
      service['currentUserPermissionsSubject'].next(mockUserPermissions);
    });

    it('should check multiple permissions', (done) => {
      const permissions = [
        { permission: 'users.read' },
        { permission: 'users.delete' }
      ];

      service.checkMultiplePermissions(permissions).subscribe(results => {
        expect(results.size).toBe(2);
        expect(results.get('users.read')?.authorized).toBe(true);
        expect(results.get('users.delete')?.authorized).toBe(false);
        done();
      });
    });

    it('should handle permissions with context', (done) => {
      const permissions = [
        { permission: 'users.read', context: { department: 'IT' } }
      ];

      service.checkMultiplePermissions(permissions).subscribe(results => {
        expect(results.size).toBe(1);
        expect(results.get('users.read')?.context).toEqual({ department: 'IT' });
        done();
      });
    });
  });

  describe('cache functionality', () => {
    beforeEach(() => {
      service['currentUserPermissionsSubject'].next(mockUserPermissions);
    });

    it('should use cache for repeated permission checks', (done) => {
      let callCount = 0;
      
      // Spy on the private method that evaluates permissions
      spyOn<any>(service, 'evaluatePermission').and.callFake(() => {
        callCount++;
        return of({
          authorized: true,
          requiredPermissions: ['users.read'],
          userPermissions: ['users.read'],
          missingPermissions: []
        });
      });

      // First call
      service.checkAuthorization('users.read').subscribe(() => {
        // Second call (should use cache)
        service.checkAuthorization('users.read').subscribe(() => {
          expect(callCount).toBe(1); // Should only be called once due to caching
          done();
        });
      });
    });

    it('should clear cache when user permissions change', () => {
      // Add something to cache
      service['authorizationCache'].set('test-key', {
        authorized: true,
        requiredPermissions: [],
        userPermissions: [],
        missingPermissions: []
      });

      expect(service['authorizationCache'].size).toBe(1);

      // Trigger permissions change
      service['currentUserPermissionsSubject'].next(mockUserPermissions);

      expect(service['authorizationCache'].size).toBe(0);
    });
  });
});
