import { TestBed } from '@angular/core/testing';
import { UserService } from './user.service';
import { UserRepositoryPort } from '../ports/user-repository.port';
import { USER_REPOSITORY_TOKEN } from '../../infrastructure/providers/user-service.provider';
import { MockUserRepository, mockUsers } from '../../testing/test-utils';
import { UserStatus, CreateUserRequest, UpdateUserRequest } from '../../domain/models/user.model';
import { first } from 'rxjs/operators';

describe('UserService', () => {
  let service: UserService;
  let repository: UserRepositoryPort;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UserService,
        { provide: USER_REPOSITORY_TOKEN, useClass: MockUserRepository }
      ]
    });

    service = TestBed.inject(UserService);
    repository = TestBed.inject(USER_REPOSITORY_TOKEN);

    // Espiar métodos del repositorio
    spyOn(repository, 'getUsers').and.callThrough();
    spyOn(repository, 'getUserById').and.callThrough();
    spyOn(repository, 'createUser').and.callThrough();
    spyOn(repository, 'updateUser').and.callThrough();
    spyOn(repository, 'deleteUser').and.callThrough();
    spyOn(repository, 'changeUserStatus').and.callThrough();
    spyOn(repository, 'changeUserRoles').and.callThrough();
    spyOn(repository, 'resetPassword').and.callThrough();
    spyOn(repository, 'getUserAuditLogs').and.callThrough();
    spyOn(repository, 'getUserStats').and.callThrough();
    spyOn(repository, 'getAvailableRoles').and.callThrough();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getUsers', () => {
    it('should call repository.getUsers with correct filters', () => {
      const filters = { page: 0, size: 10, search: 'test' };

      service.getUsers(filters).subscribe();

      expect(repository.getUsers).toHaveBeenCalledWith(filters);
    });

    it('should return paginated users response', (done) => {
      const filters = { page: 0, size: 10, search: 'test' };

      service.getUsers(filters).subscribe((response) => {
        expect(response).toBeDefined();
        expect(response.users).toBeDefined();
        expect(Array.isArray(response.users)).toBe(true);
        expect(response.total).toBeDefined();
        expect(typeof response.total).toBe('number');

        done();
      });
    });

    it('should handle empty filters', (done) => {
      service.getUsers().subscribe((response) => {
        expect(response).toBeDefined();
        expect(response.users).toBeDefined();
        expect(Array.isArray(response.users)).toBe(true);

        done();
      });
    });
  });

  describe('getUserById', () => {
    it('should call repository.getUserById with correct id', () => {
      const userId = '1';

      service.getUserById(userId).subscribe();

      expect(repository.getUserById).toHaveBeenCalledWith(userId);
    });

    it('should return user data', (done) => {
      const userId = '1';

      service.getUserById(userId).subscribe((user) => {
        expect(user).toBeDefined();
        expect(user.id).toBe(userId);

        done();
      });
    });
  });

  describe('createUser', () => {
    it('should call repository.createUser with correct data', () => {
      const newUser: CreateUserRequest = {
        username: 'newuser',
        email: 'newuser@example.com',
        firstName: 'New',
        lastName: 'User',
        dni: '99887766',
        roles: ['USER'],
        enabled: true
      };

      service.createUser(newUser).subscribe();

      expect(repository.createUser).toHaveBeenCalledWith(newUser);
    });

    it('should refresh users list after creation', () => {
      const newUser: CreateUserRequest = {
        username: 'newuser',
        email: 'newuser@example.com',
        firstName: 'New',
        lastName: 'User',
        dni: '99887766',
        roles: ['USER'],
        enabled: true
      };

      service.createUser(newUser).subscribe();

      // Verificar que se llamó a getUsers para refrescar la lista
      expect(repository.getUsers).toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    it('should call repository.updateUser with correct data', () => {
      const updatedUser: UpdateUserRequest = {
        id: '1',
        firstName: 'Updated',
        lastName: 'User'
      };

      service.updateUser(updatedUser).subscribe();

      expect(repository.updateUser).toHaveBeenCalledWith(updatedUser);
    });

    it('should return updated user data', (done) => {
      const updatedUser: UpdateUserRequest = {
        id: '1',
        firstName: 'Updated',
        lastName: 'User'
      };

      service.updateUser(updatedUser).subscribe((user) => {
        expect(user).toBeDefined();
        expect(user.id).toBe('1');
        expect(user.firstName).toBe('Updated');

        done();
      });
    });

    it('should refresh users list after update', () => {
      const updatedUser: UpdateUserRequest = {
        id: '1',
        firstName: 'Updated',
        lastName: 'User'
      };

      service.updateUser(updatedUser).subscribe();

      // Verificar que se llamó a getUsers para refrescar la lista
      expect(repository.getUsers).toHaveBeenCalled();
    });
  });

  describe('deleteUser', () => {
    it('should call repository.deleteUser with correct id', () => {
      const userId = '1';

      service.deleteUser(userId).subscribe();

      expect(repository.deleteUser).toHaveBeenCalledWith(userId);
    });

    it('should return success response', (done) => {
      const userId = '1';

      service.deleteUser(userId).subscribe((response) => {
        expect(response).toBeDefined();
        expect(response.success).toBeDefined();
        expect(response.message).toBeDefined();

        done();
      });
    });

    it('should refresh users list after deletion', () => {
      service.deleteUser('1').subscribe();

      // Verificar que se llamó a getUsers para refrescar la lista
      expect(repository.getUsers).toHaveBeenCalled();
    });
  });

  describe('changeUserStatus', () => {
    it('should call repository.changeUserStatus with correct data', () => {
      const statusChange = {
        userId: '1',
        status: UserStatus.INACTIVE,
        reason: 'Test reason'
      };

      service.changeUserStatus(statusChange).subscribe();

      expect(repository.changeUserStatus).toHaveBeenCalledWith(statusChange);
    });

    it('should return updated user data', (done) => {
      const statusChange = {
        userId: '1',
        status: UserStatus.INACTIVE
      };

      service.changeUserStatus(statusChange).subscribe((user) => {
        expect(user).toBeDefined();
        expect(user.id).toBe('1');
        expect(user.status).toBe(UserStatus.INACTIVE);

        done();
      });
    });

    it('should refresh users list after status change', () => {
      const statusChange = {
        userId: '1',
        status: UserStatus.INACTIVE
      };

      service.changeUserStatus(statusChange).subscribe();

      // Verificar que se llamó a getUsers para refrescar la lista
      expect(repository.getUsers).toHaveBeenCalled();
    });
  });

  describe('changeUserRoles', () => {
    it('should call repository.changeUserRoles with correct data', () => {
      const rolesChange = {
        userId: '1',
        roles: ['ADMIN', 'USER']
      };

      service.changeUserRoles(rolesChange).subscribe();

      expect(repository.changeUserRoles).toHaveBeenCalledWith(rolesChange);
    });

    it('should return updated user data', (done) => {
      const rolesChange = {
        userId: '1',
        roles: ['ADMIN', 'USER']
      };

      service.changeUserRoles(rolesChange).subscribe((user) => {
        expect(user).toBeDefined();
        expect(user.id).toBe('1');
        expect(user.roles).toEqual(['ADMIN', 'USER']);

        done();
      });
    });

    it('should refresh users list after roles change', () => {
      const rolesChange = {
        userId: '1',
        roles: ['ADMIN', 'USER']
      };

      service.changeUserRoles(rolesChange).subscribe();

      // Verificar que se llamó a getUsers para refrescar la lista
      expect(repository.getUsers).toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should call repository.resetPassword with correct data', () => {
      const resetRequest = {
        userId: '1',
        sendEmail: true
      };

      service.resetPassword(resetRequest).subscribe();

      expect(repository.resetPassword).toHaveBeenCalledWith(resetRequest);
    });

    it('should return success response', (done) => {
      const resetRequest = {
        userId: '1',
        sendEmail: true
      };

      service.resetPassword(resetRequest).subscribe((response) => {
        expect(response).toBeDefined();
        expect(response.success).toBeDefined();
        expect(response.message).toBeDefined();

        done();
      });
    });
  });

  describe('getUserAuditLogs', () => {
    it('should call repository.getUserAuditLogs with correct id', () => {
      const userId = '1';

      service.getUserAuditLogs(userId).subscribe();

      expect(repository.getUserAuditLogs).toHaveBeenCalledWith(userId);
    });

    it('should return audit logs array', (done) => {
      const userId = '1';

      service.getUserAuditLogs(userId).subscribe((logs) => {
        expect(logs).toBeDefined();
        expect(Array.isArray(logs)).toBe(true);

        done();
      });
    });
  });

  describe('getUserStats', () => {
    it('should call repository.getUserStats', () => {
      service.getUserStats().subscribe();

      expect(repository.getUserStats).toHaveBeenCalled();
    });

    it('should return user statistics', (done) => {
      service.getUserStats().subscribe((stats) => {
        expect(stats).toBeDefined();
        expect(typeof stats.totalUsers).toBe('number');
        expect(typeof stats.activeUsers).toBe('number');

        done();
      });
    });
  });

  describe('getAvailableRoles', () => {
    it('should call repository.getAvailableRoles', () => {
      service.getAvailableRoles().subscribe();

      expect(repository.getAvailableRoles).toHaveBeenCalled();
    });

    it('should return roles array', (done) => {
      service.getAvailableRoles().subscribe((roles) => {
        expect(roles).toBeDefined();
        expect(Array.isArray(roles)).toBe(true);

        done();
      });
    });
  });

  describe('check methods', () => {
    it('should call repository.checkUsernameExists with correct username', () => {
      const username = 'testuser';

      service.checkUsernameExists(username).subscribe();

      expect(repository.checkUsernameExists).toHaveBeenCalledWith(username);
    });

    it('should call repository.checkEmailExists with correct email', () => {
      const email = 'test@example.com';

      service.checkEmailExists(email).subscribe();

      expect(repository.checkEmailExists).toHaveBeenCalledWith(email);
    });

    it('should call repository.checkDniExists with correct dni', () => {
      const dni = '12345678';

      service.checkDniExists(dni).subscribe();

      expect(repository.checkDniExists).toHaveBeenCalledWith(dni);
    });
  });
});
