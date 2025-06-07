import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RoleManagementService } from './role-management.service';
import { environment } from '@environments/environment';
import { 
  Role, 
  Permission, 
  UserRole, 
  RoleStatistics,
  RoleType,
  RoleLevel 
} from '@shared/interfaces/roles/role.interface';

describe('RoleManagementService', () => {
  let service: RoleManagementService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/roles`;

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

  const mockUserRole: UserRole = {
    id: 'user-role-1',
    userId: 'user-1',
    roleId: 'role-1',
    assignedAt: new Date(),
    assignedBy: 'admin',
    isActive: true
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

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RoleManagementService]
    });
    service = TestBed.inject(RoleManagementService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadRoles', () => {
    it('should load roles successfully', () => {
      const mockRoles = [mockRole];

      service.loadRoles().subscribe(roles => {
        expect(roles).toEqual(mockRoles);
        expect(roles.length).toBe(1);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockRoles);
    });

    it('should handle error when loading roles', () => {
      service.loadRoles().subscribe(roles => {
        expect(roles).toEqual([]);
      });

      const req = httpMock.expectOne(apiUrl);
      req.error(new ErrorEvent('Network error'));
    });
  });

  describe('getRoleById', () => {
    it('should get role by id successfully', () => {
      const roleId = 'role-1';

      service.getRoleById(roleId).subscribe(role => {
        expect(role).toEqual(mockRole);
      });

      const req = httpMock.expectOne(`${apiUrl}/${roleId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockRole);
    });

    it('should return null when role not found', () => {
      const roleId = 'non-existent';

      service.getRoleById(roleId).subscribe(role => {
        expect(role).toBeNull();
      });

      const req = httpMock.expectOne(`${apiUrl}/${roleId}`);
      req.error(new ErrorEvent('Not found'));
    });
  });

  describe('createRole', () => {
    it('should create role successfully', () => {
      const newRole = { ...mockRole };
      delete (newRole as any).id;
      delete (newRole as any).createdAt;
      delete (newRole as any).updatedAt;

      service.createRole(newRole).subscribe(role => {
        expect(role).toEqual(mockRole);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newRole);
      req.flush(mockRole);
    });

    it('should handle error when creating role', () => {
      const newRole = { ...mockRole };
      delete (newRole as any).id;

      service.createRole(newRole).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
        }
      });

      const req = httpMock.expectOne(apiUrl);
      req.error(new ErrorEvent('Creation failed'));
    });
  });

  describe('updateRole', () => {
    it('should update role successfully', () => {
      const roleId = 'role-1';
      const updates = { name: 'Updated Role' };
      const updatedRole = { ...mockRole, ...updates };

      service.updateRole(roleId, updates).subscribe(role => {
        expect(role).toEqual(updatedRole);
      });

      const req = httpMock.expectOne(`${apiUrl}/${roleId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updates);
      req.flush(updatedRole);
    });
  });

  describe('deleteRole', () => {
    it('should delete role successfully', () => {
      const roleId = 'role-1';

      service.deleteRole(roleId).subscribe(result => {
        expect(result).toBeUndefined();
      });

      const req = httpMock.expectOne(`${apiUrl}/${roleId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('toggleRoleStatus', () => {
    it('should toggle role status successfully', () => {
      const roleId = 'role-1';
      const isActive = false;
      const updatedRole = { ...mockRole, isActive };

      service.toggleRoleStatus(roleId, isActive).subscribe(role => {
        expect(role.isActive).toBe(isActive);
      });

      const req = httpMock.expectOne(`${apiUrl}/${roleId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ isActive });
      req.flush(updatedRole);
    });
  });

  describe('loadPermissions', () => {
    it('should load permissions successfully', () => {
      const mockPermissions = [mockPermission];

      service.loadPermissions().subscribe(permissions => {
        expect(permissions).toEqual(mockPermissions);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/permissions`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPermissions);
    });
  });

  describe('assignPermissionsToRole', () => {
    it('should assign permissions to role successfully', () => {
      const roleId = 'role-1';
      const permissionIds = ['perm-1', 'perm-2'];
      const updatedRole = { ...mockRole, permissions: [mockPermission] };

      service.assignPermissionsToRole(roleId, permissionIds).subscribe(role => {
        expect(role).toEqual(updatedRole);
      });

      const req = httpMock.expectOne(`${apiUrl}/${roleId}/permissions`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ permissionIds });
      req.flush(updatedRole);
    });
  });

  describe('getUserRoles', () => {
    it('should get user roles successfully', () => {
      const userId = 'user-1';
      const mockUserRoles = [mockUserRole];

      service.getUserRoles(userId).subscribe(userRoles => {
        expect(userRoles).toEqual(mockUserRoles);
      });

      const req = httpMock.expectOne(`${apiUrl}/users/${userId}/roles`);
      expect(req.request.method).toBe('GET');
      req.flush(mockUserRoles);
    });
  });

  describe('assignRoleToUser', () => {
    it('should assign role to user successfully', () => {
      const userId = 'user-1';
      const roleId = 'role-1';
      const context = { department: 'IT' };

      service.assignRoleToUser(userId, roleId, context).subscribe(userRole => {
        expect(userRole).toEqual(mockUserRole);
      });

      const req = httpMock.expectOne(`${apiUrl}/users/${userId}/roles`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ roleId, context });
      req.flush(mockUserRole);
    });
  });

  describe('removeRoleFromUser', () => {
    it('should remove role from user successfully', () => {
      const userId = 'user-1';
      const roleId = 'role-1';

      service.removeRoleFromUser(userId, roleId).subscribe(result => {
        expect(result).toBeUndefined();
      });

      const req = httpMock.expectOne(`${apiUrl}/users/${userId}/roles/${roleId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('getRoleStatistics', () => {
    it('should get role statistics successfully', () => {
      service.getRoleStatistics().subscribe(statistics => {
        expect(statistics).toEqual(mockStatistics);
      });

      const req = httpMock.expectOne(`${apiUrl}/statistics`);
      expect(req.request.method).toBe('GET');
      req.flush(mockStatistics);
    });
  });

  describe('getFilteredRoles', () => {
    it('should filter roles by type', () => {
      const roles = [
        { ...mockRole, type: 'SYSTEM' as RoleType },
        { ...mockRole, id: 'role-2', type: 'CUSTOM' as RoleType }
      ];

      // Simular que ya tenemos roles cargados
      service['rolesSubject'].next(roles);

      service.getFilteredRoles({ type: 'CUSTOM' }).subscribe(filteredRoles => {
        expect(filteredRoles.length).toBe(1);
        expect(filteredRoles[0].type).toBe('CUSTOM');
      });
    });

    it('should filter roles by search term', () => {
      const roles = [
        { ...mockRole, name: 'Admin Role' },
        { ...mockRole, id: 'role-2', name: 'User Role' }
      ];

      service['rolesSubject'].next(roles);

      service.getFilteredRoles({ search: 'admin' }).subscribe(filteredRoles => {
        expect(filteredRoles.length).toBe(1);
        expect(filteredRoles[0].name).toBe('Admin Role');
      });
    });

    it('should filter roles by active status', () => {
      const roles = [
        { ...mockRole, isActive: true },
        { ...mockRole, id: 'role-2', isActive: false }
      ];

      service['rolesSubject'].next(roles);

      service.getFilteredRoles({ isActive: true }).subscribe(filteredRoles => {
        expect(filteredRoles.length).toBe(1);
        expect(filteredRoles[0].isActive).toBe(true);
      });
    });
  });

  describe('getCurrentRoles', () => {
    it('should return current roles', () => {
      const roles = [mockRole];
      service['rolesSubject'].next(roles);

      const currentRoles = service.getCurrentRoles();
      expect(currentRoles).toEqual(roles);
    });
  });

  describe('getCurrentPermissions', () => {
    it('should return current permissions', () => {
      const permissions = [mockPermission];
      service['permissionsSubject'].next(permissions);

      const currentPermissions = service.getCurrentPermissions();
      expect(currentPermissions).toEqual(permissions);
    });
  });
});
