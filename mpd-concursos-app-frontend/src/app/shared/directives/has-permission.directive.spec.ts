import { Component, TemplateRef, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';
import { 
  HasPermissionDirective, 
  HasRoleDirective, 
  HasRoleLevelDirective,
  DisableIfNoPermissionDirective 
} from './has-permission.directive';
import { AuthorizationService } from '@core/services/roles/authorization.service';

// Test component for HasPermissionDirective
@Component({
  template: `
    <div *hasPermission="permission; context: permissionContext; operator: permissionOperator">
      Content with permission
    </div>
    <div *hasPermission="permission; else: elseTemplate">
      Content with permission
    </div>
    <ng-template #elseTemplate>
      <div>No permission content</div>
    </ng-template>
  `
})
class TestHasPermissionComponent {
  permission = 'users.read';
  permissionContext = { department: 'IT' };
  permissionOperator: 'all' | 'any' = 'all';
  
  @ViewChild('elseTemplate') elseTemplate!: TemplateRef<any>;
}

// Test component for HasRoleDirective
@Component({
  template: `
    <div *hasRole="role; operator: roleOperator">
      Content with role
    </div>
    <div *hasRole="role; else: elseTemplate">
      Content with role
    </div>
    <ng-template #elseTemplate>
      <div>No role content</div>
    </ng-template>
  `
})
class TestHasRoleComponent {
  role = 'ADMIN';
  roleOperator: 'all' | 'any' = 'any';
  
  @ViewChild('elseTemplate') elseTemplate!: TemplateRef<any>;
}

// Test component for HasRoleLevelDirective
@Component({
  template: `
    <div *hasRoleLevel="level; orHigher: orHigher">
      Content with role level
    </div>
    <div *hasRoleLevel="level; else: elseTemplate">
      Content with role level
    </div>
    <ng-template #elseTemplate>
      <div>No role level content</div>
    </ng-template>
  `
})
class TestHasRoleLevelComponent {
  level = 'ADMIN';
  orHigher = true;
  
  @ViewChild('elseTemplate') elseTemplate!: TemplateRef<any>;
}

// Test component for DisableIfNoPermissionDirective
@Component({
  template: `
    <button [disableIfNoPermission]="permission" 
            [disableIfNoPermissionContext]="permissionContext"
            [disableIfNoPermissionOperator]="permissionOperator">
      Test Button
    </button>
  `
})
class TestDisableIfNoPermissionComponent {
  permission = 'users.delete';
  permissionContext = { userId: '123' };
  permissionOperator: 'all' | 'any' = 'all';
}

describe('Authorization Directives', () => {
  let authorizationServiceSpy: jasmine.SpyObj<AuthorizationService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('AuthorizationService', [
      'hasAllPermissions',
      'hasAnyPermission',
      'hasAnyRole',
      'hasRoleLevel'
    ]);

    TestBed.configureTestingModule({
      declarations: [
        TestHasPermissionComponent,
        TestHasRoleComponent,
        TestHasRoleLevelComponent,
        TestDisableIfNoPermissionComponent
      ],
      imports: [
        HasPermissionDirective,
        HasRoleDirective,
        HasRoleLevelDirective,
        DisableIfNoPermissionDirective
      ],
      providers: [
        { provide: AuthorizationService, useValue: spy }
      ]
    });

    authorizationServiceSpy = TestBed.inject(AuthorizationService) as jasmine.SpyObj<AuthorizationService>;
  });

  describe('HasPermissionDirective', () => {
    let component: TestHasPermissionComponent;
    let fixture: ComponentFixture<TestHasPermissionComponent>;

    beforeEach(() => {
      fixture = TestBed.createComponent(TestHasPermissionComponent);
      component = fixture.componentInstance;
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should show content when user has permission', () => {
      authorizationServiceSpy.hasAllPermissions.and.returnValue(of(true));

      fixture.detectChanges();

      const content = fixture.nativeElement.querySelector('div');
      expect(content).toBeTruthy();
      expect(content.textContent.trim()).toBe('Content with permission');
    });

    it('should hide content when user does not have permission', () => {
      authorizationServiceSpy.hasAllPermissions.and.returnValue(of(false));

      fixture.detectChanges();

      const content = fixture.nativeElement.querySelector('div');
      expect(content).toBeFalsy();
    });

    it('should show else template when user does not have permission', () => {
      authorizationServiceSpy.hasAllPermissions.and.returnValue(of(false));

      fixture.detectChanges();

      const elseContent = fixture.nativeElement.querySelector('div');
      expect(elseContent?.textContent.trim()).toBe('No permission content');
    });

    it('should use any operator when specified', () => {
      component.permissionOperator = 'any';
      authorizationServiceSpy.hasAnyPermission.and.returnValue(of(true));

      fixture.detectChanges();

      expect(authorizationServiceSpy.hasAnyPermission).toHaveBeenCalled();
    });

    it('should pass context to authorization service', () => {
      authorizationServiceSpy.hasAllPermissions.and.returnValue(of(true));

      fixture.detectChanges();

      expect(authorizationServiceSpy.hasAllPermissions).toHaveBeenCalledWith(
        ['users.read'],
        component.permissionContext
      );
    });

    it('should handle permission array', () => {
      component.permission = ['users.read', 'users.write'] as any;
      authorizationServiceSpy.hasAllPermissions.and.returnValue(of(true));

      fixture.detectChanges();

      expect(authorizationServiceSpy.hasAllPermissions).toHaveBeenCalledWith(
        ['users.read', 'users.write'],
        component.permissionContext
      );
    });
  });

  describe('HasRoleDirective', () => {
    let component: TestHasRoleComponent;
    let fixture: ComponentFixture<TestHasRoleComponent>;

    beforeEach(() => {
      fixture = TestBed.createComponent(TestHasRoleComponent);
      component = fixture.componentInstance;
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should show content when user has role', () => {
      authorizationServiceSpy.hasAnyRole.and.returnValue(of(true));

      fixture.detectChanges();

      const content = fixture.nativeElement.querySelector('div');
      expect(content).toBeTruthy();
      expect(content.textContent.trim()).toBe('Content with role');
    });

    it('should hide content when user does not have role', () => {
      authorizationServiceSpy.hasAnyRole.and.returnValue(of(false));

      fixture.detectChanges();

      const content = fixture.nativeElement.querySelector('div');
      expect(content).toBeFalsy();
    });

    it('should show else template when user does not have role', () => {
      authorizationServiceSpy.hasAnyRole.and.returnValue(of(false));

      fixture.detectChanges();

      const elseContent = fixture.nativeElement.querySelector('div');
      expect(elseContent?.textContent.trim()).toBe('No role content');
    });

    it('should handle role array', () => {
      component.role = ['ADMIN', 'MANAGER'] as any;
      authorizationServiceSpy.hasAnyRole.and.returnValue(of(true));

      fixture.detectChanges();

      expect(authorizationServiceSpy.hasAnyRole).toHaveBeenCalledWith(['ADMIN', 'MANAGER']);
    });
  });

  describe('HasRoleLevelDirective', () => {
    let component: TestHasRoleLevelComponent;
    let fixture: ComponentFixture<TestHasRoleLevelComponent>;

    beforeEach(() => {
      fixture = TestBed.createComponent(TestHasRoleLevelComponent);
      component = fixture.componentInstance;
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should show content when user has required role level', () => {
      authorizationServiceSpy.hasRoleLevel.and.returnValue(of(true));

      fixture.detectChanges();

      const content = fixture.nativeElement.querySelector('div');
      expect(content).toBeTruthy();
      expect(content.textContent.trim()).toBe('Content with role level');
    });

    it('should hide content when user does not have required role level', () => {
      authorizationServiceSpy.hasRoleLevel.and.returnValue(of(false));

      fixture.detectChanges();

      const content = fixture.nativeElement.querySelector('div');
      expect(content).toBeFalsy();
    });

    it('should show else template when user does not have role level', () => {
      authorizationServiceSpy.hasRoleLevel.and.returnValue(of(false));

      fixture.detectChanges();

      const elseContent = fixture.nativeElement.querySelector('div');
      expect(elseContent?.textContent.trim()).toBe('No role level content');
    });

    it('should call hasRoleLevel with correct level', () => {
      authorizationServiceSpy.hasRoleLevel.and.returnValue(of(true));

      fixture.detectChanges();

      expect(authorizationServiceSpy.hasRoleLevel).toHaveBeenCalledWith('ADMIN');
    });
  });

  describe('DisableIfNoPermissionDirective', () => {
    let component: TestDisableIfNoPermissionComponent;
    let fixture: ComponentFixture<TestDisableIfNoPermissionComponent>;

    beforeEach(() => {
      fixture = TestBed.createComponent(TestDisableIfNoPermissionComponent);
      component = fixture.componentInstance;
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should not disable button when user has permission', () => {
      authorizationServiceSpy.hasAllPermissions.and.returnValue(of(true));

      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button.disabled).toBe(false);
      expect(button.classList.contains('permission-disabled')).toBe(false);
    });

    it('should disable button when user does not have permission', () => {
      authorizationServiceSpy.hasAllPermissions.and.returnValue(of(false));

      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button.disabled).toBe(true);
      expect(button.classList.contains('permission-disabled')).toBe(true);
      expect(button.getAttribute('title')).toBe('No tienes permisos para realizar esta acción');
    });

    it('should use any operator when specified', () => {
      component.permissionOperator = 'any';
      authorizationServiceSpy.hasAnyPermission.and.returnValue(of(false));

      fixture.detectChanges();

      expect(authorizationServiceSpy.hasAnyPermission).toHaveBeenCalled();
    });

    it('should pass context to authorization service', () => {
      authorizationServiceSpy.hasAllPermissions.and.returnValue(of(true));

      fixture.detectChanges();

      expect(authorizationServiceSpy.hasAllPermissions).toHaveBeenCalledWith(
        ['users.delete'],
        component.permissionContext
      );
    });

    it('should handle permission array', () => {
      component.permission = ['users.delete', 'users.update'] as any;
      authorizationServiceSpy.hasAllPermissions.and.returnValue(of(true));

      fixture.detectChanges();

      expect(authorizationServiceSpy.hasAllPermissions).toHaveBeenCalledWith(
        ['users.delete', 'users.update'],
        component.permissionContext
      );
    });

    it('should disable when no permissions provided', () => {
      component.permission = [] as any;

      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('button');
      expect(button.disabled).toBe(true);
    });
  });

  describe('Directive lifecycle', () => {
    let component: TestHasPermissionComponent;
    let fixture: ComponentFixture<TestHasPermissionComponent>;

    beforeEach(() => {
      fixture = TestBed.createComponent(TestHasPermissionComponent);
      component = fixture.componentInstance;
    });

    it('should update view when permission changes', () => {
      authorizationServiceSpy.hasAllPermissions.and.returnValue(of(true));
      fixture.detectChanges();

      let content = fixture.nativeElement.querySelector('div');
      expect(content).toBeTruthy();

      // Change permission and simulate authorization change
      component.permission = 'users.write';
      authorizationServiceSpy.hasAllPermissions.and.returnValue(of(false));
      fixture.detectChanges();

      content = fixture.nativeElement.querySelector('div');
      expect(content).toBeFalsy();
    });

    it('should update view when context changes', () => {
      authorizationServiceSpy.hasAllPermissions.and.returnValue(of(true));
      fixture.detectChanges();

      let content = fixture.nativeElement.querySelector('div');
      expect(content).toBeTruthy();

      // Change context
      component.permissionContext = { department: 'HR' };
      authorizationServiceSpy.hasAllPermissions.and.returnValue(of(false));
      fixture.detectChanges();

      content = fixture.nativeElement.querySelector('div');
      expect(content).toBeFalsy();
    });
  });
});
