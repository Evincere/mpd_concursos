import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { RoleManagementComponent } from './role-management.component';
import { RoleManagementService } from '@core/services/roles/role-management.service';
import { AuthorizationService } from '@core/services/roles/authorization.service';
import { CustomNotificationService } from '@shared/components/custom-notification/custom-notification.service';
import { CustomDialogService } from '@shared/components/custom-dialog/custom-dialog.service';
import { 
  Role, 
  Permission, 
  RoleStatistics,
  RoleType,
  RoleLevel 
} from '@shared/interfaces/roles/role.interface';

describe('RoleManagementComponent', () => {
  let component: RoleManagementComponent;
  let fixture: ComponentFixture<RoleManagementComponent>;
  let roleManagementServiceSpy: jasmine.SpyObj<RoleManagementService>;
  let authorizationServiceSpy: jasmine.SpyObj<AuthorizationService>;
  let notificationServiceSpy: jasmine.SpyObj<CustomNotificationService>;
  let dialogServiceSpy: jasmine.SpyObj<CustomDialogService>;

  // Mock data
  const mockRole: Role = {
    id: 'role-1',
    name: 'Test Role',
    description: 'Test role description',
    type: 'CUSTOM' as RoleType,
    level: 'USER' as RoleLevel,
    permissions: [],
    isSystem: false,
    isActive: true,
    userCount: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'admin',
    updatedBy: 'admin'
  };

  const mockPermission: Permission = {
    id: 'perm-1',
    name: 'Test Permission',
    description: 'Test permission description',
    module: 'users',
    action: 'READ',
    resource: 'user',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockStatistics: RoleStatistics = {
    totalRoles: 10,
    activeRoles: 8,
    systemRoles: 2,
    customRoles: 8,
    totalPermissions: 50,
    usersWithRoles: 100,
    usersWithoutRoles: 5,
    roleDistribution: [],
    permissionUsage: []
  };

  beforeEach(async () => {
    const roleSpy = jasmine.createSpyObj('RoleManagementService', [
      'loadRoles',
      'loadPermissions',
      'getRoleStatistics',
      'createRole',
      'updateRole',
      'deleteRole',
      'toggleRoleStatus'
    ]);
    const authSpy = jasmine.createSpyObj('AuthorizationService', ['hasPermission']);
    const notificationSpy = jasmine.createSpyObj('CustomNotificationService', [
      'showSuccess',
      'showError',
      'showWarning'
    ]);
    const dialogSpy = jasmine.createSpyObj('CustomDialogService', ['showConfirmDialog']);

    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        RoleManagementComponent
      ],
      providers: [
        { provide: RoleManagementService, useValue: roleSpy },
        { provide: AuthorizationService, useValue: authSpy },
        { provide: CustomNotificationService, useValue: notificationSpy },
        { provide: CustomDialogService, useValue: dialogSpy }
      ]
    }).compileComponents();

    roleManagementServiceSpy = TestBed.inject(RoleManagementService) as jasmine.SpyObj<RoleManagementService>;
    authorizationServiceSpy = TestBed.inject(AuthorizationService) as jasmine.SpyObj<AuthorizationService>;
    notificationServiceSpy = TestBed.inject(CustomNotificationService) as jasmine.SpyObj<CustomNotificationService>;
    dialogServiceSpy = TestBed.inject(CustomDialogService) as jasmine.SpyObj<CustomDialogService>;

    // Setup default spy returns
    roleManagementServiceSpy.loadRoles.and.returnValue(of([mockRole]));
    roleManagementServiceSpy.loadPermissions.and.returnValue(of([mockPermission]));
    roleManagementServiceSpy.getRoleStatistics.and.returnValue(of(mockStatistics));

    fixture = TestBed.createComponent(RoleManagementComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component initialization', () => {
    it('should load data on init', () => {
      fixture.detectChanges();

      expect(roleManagementServiceSpy.loadRoles).toHaveBeenCalled();
      expect(roleManagementServiceSpy.loadPermissions).toHaveBeenCalled();
      expect(roleManagementServiceSpy.getRoleStatistics).toHaveBeenCalled();
      expect(component.roles).toEqual([mockRole]);
      expect(component.permissions).toEqual([mockPermission]);
      expect(component.statistics).toEqual(mockStatistics);
    });

    it('should handle error when loading data', () => {
      roleManagementServiceSpy.loadRoles.and.returnValue(throwError('Error'));

      fixture.detectChanges();

      expect(notificationServiceSpy.showError).toHaveBeenCalledWith('Error al cargar los datos');
      expect(component.loading).toBe(false);
    });

    it('should initialize forms correctly', () => {
      fixture.detectChanges();

      expect(component.roleForm).toBeDefined();
      expect(component.searchForm).toBeDefined();
      expect(component.roleForm.get('type')?.value).toBe('CUSTOM');
      expect(component.roleForm.get('level')?.value).toBe('USER');
      expect(component.roleForm.get('isActive')?.value).toBe(true);
    });
  });

  describe('Role management', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show create role form', () => {
      component.showCreateRoleForm();

      expect(component.showCreateForm).toBe(true);
      expect(component.selectedRole).toBeNull();
      expect(component.roleForm.get('type')?.value).toBe('CUSTOM');
    });

    it('should select and populate role for editing', () => {
      component.selectRole(mockRole);

      expect(component.selectedRole).toBe(mockRole);
      expect(component.roleForm.get('name')?.value).toBe(mockRole.name);
      expect(component.roleForm.get('description')?.value).toBe(mockRole.description);
    });

    it('should cancel edit and reset form', () => {
      component.selectedRole = mockRole;
      component.showCreateForm = true;

      component.cancelEdit();

      expect(component.showCreateForm).toBe(false);
      expect(component.selectedRole).toBeNull();
    });

    it('should create new role successfully', () => {
      const newRole = { ...mockRole, id: 'role-2' };
      roleManagementServiceSpy.createRole.and.returnValue(of(newRole));

      component.roleForm.patchValue({
        name: 'New Role',
        description: 'New role description',
        type: 'CUSTOM',
        level: 'USER',
        isActive: true,
        permissions: []
      });

      component.saveRole();

      expect(roleManagementServiceSpy.createRole).toHaveBeenCalled();
      expect(notificationServiceSpy.showSuccess).toHaveBeenCalledWith('Rol creado exitosamente');
      expect(component.showCreateForm).toBe(false);
    });

    it('should update existing role successfully', () => {
      const updatedRole = { ...mockRole, name: 'Updated Role' };
      roleManagementServiceSpy.updateRole.and.returnValue(of(updatedRole));

      component.selectedRole = mockRole;
      component.roleForm.patchValue({
        name: 'Updated Role',
        description: 'Updated description'
      });

      component.saveRole();

      expect(roleManagementServiceSpy.updateRole).toHaveBeenCalledWith(mockRole.id, jasmine.any(Object));
      expect(notificationServiceSpy.showSuccess).toHaveBeenCalledWith('Rol actualizado exitosamente');
      expect(component.showCreateForm).toBe(false);
    });

    it('should not save role with invalid form', () => {
      component.roleForm.patchValue({
        name: '', // Invalid - required
        description: ''
      });

      component.saveRole();

      expect(roleManagementServiceSpy.createRole).not.toHaveBeenCalled();
      expect(roleManagementServiceSpy.updateRole).not.toHaveBeenCalled();
    });

    it('should handle error when creating role', () => {
      roleManagementServiceSpy.createRole.and.returnValue(throwError('Error'));

      component.roleForm.patchValue({
        name: 'New Role',
        description: 'New role description'
      });

      component.saveRole();

      expect(notificationServiceSpy.showError).toHaveBeenCalledWith('Error al crear el rol');
      expect(component.loading).toBe(false);
    });
  });

  describe('Role deletion', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not delete system role', () => {
      const systemRole = { ...mockRole, isSystem: true };

      component.deleteRole(systemRole);

      expect(notificationServiceSpy.showWarning).toHaveBeenCalledWith('No se pueden eliminar roles del sistema');
      expect(dialogServiceSpy.showConfirmDialog).not.toHaveBeenCalled();
    });

    it('should not delete role with assigned users', () => {
      const roleWithUsers = { ...mockRole, userCount: 5 };

      component.deleteRole(roleWithUsers);

      expect(notificationServiceSpy.showWarning).toHaveBeenCalledWith(
        'No se puede eliminar el rol "Test Role" porque tiene 5 usuarios asignados'
      );
      expect(dialogServiceSpy.showConfirmDialog).not.toHaveBeenCalled();
    });

    it('should delete role after confirmation', () => {
      const roleToDelete = { ...mockRole, userCount: 0 };
      dialogServiceSpy.showConfirmDialog.and.returnValue(of(true));
      roleManagementServiceSpy.deleteRole.and.returnValue(of(undefined));

      component.deleteRole(roleToDelete);

      expect(dialogServiceSpy.showConfirmDialog).toHaveBeenCalled();
      expect(roleManagementServiceSpy.deleteRole).toHaveBeenCalledWith(roleToDelete.id);
      expect(notificationServiceSpy.showSuccess).toHaveBeenCalledWith('Rol eliminado exitosamente');
    });

    it('should not delete role when confirmation is cancelled', () => {
      const roleToDelete = { ...mockRole, userCount: 0 };
      dialogServiceSpy.showConfirmDialog.and.returnValue(of(false));

      component.deleteRole(roleToDelete);

      expect(dialogServiceSpy.showConfirmDialog).toHaveBeenCalled();
      expect(roleManagementServiceSpy.deleteRole).not.toHaveBeenCalled();
    });
  });

  describe('Role status toggle', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not toggle system role status', () => {
      const systemRole = { ...mockRole, isSystem: true };

      component.toggleRoleStatus(systemRole);

      expect(notificationServiceSpy.showWarning).toHaveBeenCalledWith('No se puede cambiar el estado de roles del sistema');
      expect(roleManagementServiceSpy.toggleRoleStatus).not.toHaveBeenCalled();
    });

    it('should toggle role status successfully', () => {
      const updatedRole = { ...mockRole, isActive: false };
      roleManagementServiceSpy.toggleRoleStatus.and.returnValue(of(updatedRole));

      component.toggleRoleStatus(mockRole);

      expect(roleManagementServiceSpy.toggleRoleStatus).toHaveBeenCalledWith(mockRole.id, false);
      expect(notificationServiceSpy.showSuccess).toHaveBeenCalledWith('Rol desactivado exitosamente');
    });

    it('should handle error when toggling role status', () => {
      roleManagementServiceSpy.toggleRoleStatus.and.returnValue(throwError('Error'));

      component.toggleRoleStatus(mockRole);

      expect(notificationServiceSpy.showError).toHaveBeenCalledWith('Error al cambiar el estado del rol');
    });
  });

  describe('Filtering and search', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.roles = [
        mockRole,
        { ...mockRole, id: 'role-2', name: 'Admin Role', type: 'SYSTEM' as RoleType },
        { ...mockRole, id: 'role-3', name: 'Manager Role', isActive: false }
      ];
    });

    it('should filter roles by search term', () => {
      component.searchForm.patchValue({ search: 'admin' });
      component['applySearchFilter']('admin');

      expect(component.filteredRoles.length).toBe(1);
      expect(component.filteredRoles[0].name).toBe('Admin Role');
    });

    it('should apply filters correctly', () => {
      component.filters = { type: 'SYSTEM', isActive: true };
      component['applyFilters']();

      expect(component.filteredRoles.length).toBe(1);
      expect(component.filteredRoles[0].type).toBe('SYSTEM');
    });

    it('should clear filters', () => {
      component.filters = { search: 'test', type: 'CUSTOM' };
      component.clearFilters();

      expect(component.searchForm.get('search')?.value).toBe('');
      expect(component.currentPage).toBe(1);
    });
  });

  describe('View modes', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should change view mode', () => {
      component.setViewMode('cards');
      expect(component.viewMode).toBe('cards');

      component.setViewMode('matrix');
      expect(component.viewMode).toBe('matrix');
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should change page', () => {
      component.onPageChange(2);
      expect(component.currentPage).toBe(2);
    });

    it('should get paginated roles', () => {
      component.filteredRoles = Array(30).fill(mockRole);
      component.pageSize = 10;
      component.currentPage = 2;

      const paginatedRoles = component.getPaginatedRoles();
      expect(paginatedRoles.length).toBe(10);
    });
  });

  describe('Permission management', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should get permissions by module', () => {
      component.permissions = [
        { ...mockPermission, module: 'users' },
        { ...mockPermission, id: 'perm-2', module: 'roles' },
        { ...mockPermission, id: 'perm-3', module: 'users' }
      ];

      const grouped = component.getPermissionsByModule();
      expect(grouped.size).toBe(2);
      expect(grouped.get('users')?.length).toBe(2);
      expect(grouped.get('roles')?.length).toBe(1);
    });

    it('should check if permission is selected', () => {
      component.roleForm.patchValue({ permissions: ['perm-1', 'perm-2'] });

      expect(component.isPermissionSelected('perm-1')).toBe(true);
      expect(component.isPermissionSelected('perm-3')).toBe(false);
    });

    it('should toggle permission selection', () => {
      component.roleForm.patchValue({ permissions: ['perm-1'] });

      // Add permission
      component.togglePermission('perm-2');
      expect(component.roleForm.get('permissions')?.value).toContain('perm-2');

      // Remove permission
      component.togglePermission('perm-1');
      expect(component.roleForm.get('permissions')?.value).not.toContain('perm-1');
    });

    it('should toggle module permissions', () => {
      const modulePermissions = [
        { ...mockPermission, id: 'perm-1' },
        { ...mockPermission, id: 'perm-2' }
      ];
      component.roleForm.patchValue({ permissions: [] });

      // Select all
      component.toggleModulePermissions(modulePermissions);
      expect(component.roleForm.get('permissions')?.value).toEqual(['perm-1', 'perm-2']);

      // Deselect all
      component.toggleModulePermissions(modulePermissions);
      expect(component.roleForm.get('permissions')?.value).toEqual([]);
    });
  });

  describe('Utility methods', () => {
    it('should get role type color', () => {
      expect(component.getRoleTypeColor('SYSTEM')).toBe('primary');
      expect(component.getRoleTypeColor('CUSTOM')).toBe('success');
    });

    it('should get role level color', () => {
      expect(component.getRoleLevelColor('SUPER_ADMIN')).toBe('danger');
      expect(component.getRoleLevelColor('USER')).toBe('success');
    });

    it('should check if field is invalid', () => {
      component.roleForm.get('name')?.markAsTouched();
      component.roleForm.get('name')?.setErrors({ required: true });

      expect(component.isFieldInvalid('name')).toBe(true);
    });

    it('should get field error message', () => {
      component.roleForm.get('name')?.setErrors({ required: true });
      expect(component.getFieldError('name')).toBe('name es requerido');

      component.roleForm.get('name')?.setErrors({ minlength: { requiredLength: 3, actualLength: 1 } });
      expect(component.getFieldError('name')).toBe('name debe tener al menos 3 caracteres');
    });
  });
});
