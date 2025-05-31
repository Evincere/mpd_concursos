import { TestBed } from '@angular/core/testing';
import { OptimizedUserRepositoryAdapter } from './optimized-user-repository.adapter';
import { ApiService } from '@core/services/api/api.service';
import { of, throwError } from 'rxjs';
import { UserStatus } from '../../domain/models/user.model';

describe('OptimizedUserRepositoryAdapter', () => {
  let adapter: OptimizedUserRepositoryAdapter;
  let apiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    // Crear spy para el servicio de API
    const apiServiceSpy = jasmine.createSpyObj('ApiService', [
      'get',
      'post',
      'put',
      'patch',
      'delete'
    ]);
    
    TestBed.configureTestingModule({
      providers: [
        OptimizedUserRepositoryAdapter,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });
    
    adapter = TestBed.inject(OptimizedUserRepositoryAdapter);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  it('should be created', () => {
    expect(adapter).toBeTruthy();
  });
  
  describe('getUsers', () => {
    it('should call apiService.get with correct endpoint and parameters', () => {
      // Configurar respuesta del servicio
      const mockResponse = {
        users: [
          { id: '1', firstName: 'Test', lastName: 'User' }
        ],
        total: 1
      };
      apiService.get.and.returnValue(of(mockResponse));
      
      // Configurar filtros
      const filters = {
        page: 0,
        size: 10,
        search: 'test',
        role: 'ADMIN',
        status: 'ACTIVE',
        sort: 'firstName',
        direction: 'asc'
      };
      
      // Llamar al método
      adapter.getUsers(filters).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });
      
      // Verificar que se llamó al servicio con los parámetros correctos
      expect(apiService.get).toHaveBeenCalledWith(
        'api/users',
        {
          params: filters,
          cache: jasmine.any(Object),
          maxRetries: jasmine.any(Number),
          retryDelay: jasmine.any(Number)
        }
      );
    });
    
    it('should handle error and return empty result', () => {
      // Configurar servicio para devolver error
      apiService.get.and.returnValue(throwError(() => new Error('Test error')));
      
      // Llamar al método
      adapter.getUsers().subscribe(response => {
        expect(response.users).toEqual([]);
        expect(response.total).toBe(0);
      });
    });
  });
  
  describe('getUserById', () => {
    it('should call apiService.get with correct endpoint', () => {
      // Configurar respuesta del servicio
      const mockUser = { id: '1', firstName: 'Test', lastName: 'User' };
      apiService.get.and.returnValue(of(mockUser));
      
      // Llamar al método
      adapter.getUserById('1').subscribe(user => {
        expect(user).toEqual(mockUser);
      });
      
      // Verificar que se llamó al servicio con el endpoint correcto
      expect(apiService.get).toHaveBeenCalledWith(
        'api/users/1',
        { cache: jasmine.any(Object) }
      );
    });
    
    it('should throw error when API call fails', (done) => {
      // Configurar servicio para devolver error
      apiService.get.and.returnValue(throwError(() => new Error('Test error')));
      
      // Llamar al método
      adapter.getUserById('1').subscribe({
        error: error => {
          expect(error).toBeTruthy();
          done();
        }
      });
    });
  });
  
  describe('createUser', () => {
    it('should call apiService.post with correct endpoint and data', () => {
      // Configurar respuesta del servicio
      const mockUser = { id: '1', firstName: 'Test', lastName: 'User' };
      apiService.post.and.returnValue(of(mockUser));
      
      // Datos para crear usuario
      const userData = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com'
      };
      
      // Llamar al método
      adapter.createUser(userData).subscribe(user => {
        expect(user).toEqual(mockUser);
      });
      
      // Verificar que se llamó al servicio con el endpoint y datos correctos
      expect(apiService.post).toHaveBeenCalledWith(
        'api/users',
        userData
      );
    });
  });
  
  describe('updateUser', () => {
    it('should call apiService.put with correct endpoint and data', () => {
      // Configurar respuesta del servicio
      const mockUser = { id: '1', firstName: 'Updated', lastName: 'User' };
      apiService.put.and.returnValue(of(mockUser));
      
      // Datos para actualizar usuario
      const userData = {
        id: '1',
        firstName: 'Updated'
      };
      
      // Llamar al método
      adapter.updateUser(userData).subscribe(user => {
        expect(user).toEqual(mockUser);
      });
      
      // Verificar que se llamó al servicio con el endpoint y datos correctos
      expect(apiService.put).toHaveBeenCalledWith(
        'api/users/1',
        userData
      );
    });
  });
  
  describe('deleteUser', () => {
    it('should call apiService.delete with correct endpoint', () => {
      // Configurar respuesta del servicio
      apiService.delete.and.returnValue(of(undefined));
      
      // Llamar al método
      adapter.deleteUser('1').subscribe();
      
      // Verificar que se llamó al servicio con el endpoint correcto
      expect(apiService.delete).toHaveBeenCalledWith(
        'api/users/1'
      );
    });
  });
  
  describe('changeUserStatus', () => {
    it('should call apiService.patch with correct endpoint and data', () => {
      // Configurar respuesta del servicio
      const mockUser = { id: '1', status: UserStatus.INACTIVE };
      apiService.patch.and.returnValue(of(mockUser));
      
      // Datos para cambiar estado
      const statusChange = {
        userId: '1',
        status: UserStatus.INACTIVE
      };
      
      // Llamar al método
      adapter.changeUserStatus(statusChange).subscribe(user => {
        expect(user).toEqual(mockUser);
      });
      
      // Verificar que se llamó al servicio con el endpoint y datos correctos
      expect(apiService.patch).toHaveBeenCalledWith(
        'api/users/1/status',
        statusChange
      );
    });
  });
  
  describe('changeUserRoles', () => {
    it('should call apiService.patch with correct endpoint and data', () => {
      // Configurar respuesta del servicio
      const mockUser = { id: '1', roles: ['ADMIN', 'USER'] };
      apiService.patch.and.returnValue(of(mockUser));
      
      // Datos para cambiar roles
      const rolesChange = {
        userId: '1',
        roles: ['ADMIN', 'USER']
      };
      
      // Llamar al método
      adapter.changeUserRoles(rolesChange).subscribe(user => {
        expect(user).toEqual(mockUser);
      });
      
      // Verificar que se llamó al servicio con el endpoint y datos correctos
      expect(apiService.patch).toHaveBeenCalledWith(
        'api/users/1/roles',
        rolesChange
      );
    });
  });
  
  describe('resetPassword', () => {
    it('should call apiService.post with correct endpoint and data', () => {
      // Configurar respuesta del servicio
      apiService.post.and.returnValue(of(undefined));
      
      // Datos para restablecer contraseña
      const resetRequest = {
        userId: '1',
        sendEmail: true
      };
      
      // Llamar al método
      adapter.resetPassword(resetRequest).subscribe();
      
      // Verificar que se llamó al servicio con el endpoint y datos correctos
      expect(apiService.post).toHaveBeenCalledWith(
        'api/users/1/reset-password',
        resetRequest
      );
    });
  });
  
  describe('getUserAuditLogs', () => {
    it('should call apiService.get with correct endpoint', () => {
      // Configurar respuesta del servicio
      const mockLogs = [
        { id: '1', action: 'LOGIN' }
      ];
      apiService.get.and.returnValue(of(mockLogs));
      
      // Llamar al método
      adapter.getUserAuditLogs('1').subscribe(logs => {
        expect(logs).toEqual(mockLogs);
      });
      
      // Verificar que se llamó al servicio con el endpoint correcto
      expect(apiService.get).toHaveBeenCalledWith(
        'api/users/1/audit-logs',
        { cache: jasmine.any(Object) }
      );
    });
  });
  
  describe('getUserStats', () => {
    it('should call apiService.get with correct endpoint', () => {
      // Configurar respuesta del servicio
      const mockStats = { totalUsers: 10 };
      apiService.get.and.returnValue(of(mockStats));
      
      // Llamar al método
      adapter.getUserStats().subscribe(stats => {
        expect(stats).toEqual(mockStats);
      });
      
      // Verificar que se llamó al servicio con el endpoint correcto
      expect(apiService.get).toHaveBeenCalledWith(
        'api/users/stats',
        { cache: jasmine.any(Object) }
      );
    });
  });
  
  describe('getAvailableRoles', () => {
    it('should call apiService.get with correct endpoint', () => {
      // Configurar respuesta del servicio
      const mockRoles = [
        { id: 'ADMIN', name: 'Administrador' }
      ];
      apiService.get.and.returnValue(of(mockRoles));
      
      // Llamar al método
      adapter.getAvailableRoles().subscribe(roles => {
        expect(roles).toEqual(mockRoles);
      });
      
      // Verificar que se llamó al servicio con el endpoint correcto
      expect(apiService.get).toHaveBeenCalledWith(
        'api/roles',
        { cache: jasmine.any(Object) }
      );
    });
  });
  
  describe('check methods', () => {
    it('should call apiService.get with correct endpoint for checkUsernameExists', () => {
      // Configurar respuesta del servicio
      apiService.get.and.returnValue(of({ exists: true }));
      
      // Llamar al método
      adapter.checkUsernameExists('testuser').subscribe(exists => {
        expect(exists).toBe(true);
      });
      
      // Verificar que se llamó al servicio con el endpoint correcto
      expect(apiService.get).toHaveBeenCalledWith(
        'api/users/check-username',
        { params: { username: 'testuser' } }
      );
    });
    
    it('should call apiService.get with correct endpoint for checkEmailExists', () => {
      // Configurar respuesta del servicio
      apiService.get.and.returnValue(of({ exists: false }));
      
      // Llamar al método
      adapter.checkEmailExists('test@example.com').subscribe(exists => {
        expect(exists).toBe(false);
      });
      
      // Verificar que se llamó al servicio con el endpoint correcto
      expect(apiService.get).toHaveBeenCalledWith(
        'api/users/check-email',
        { params: { email: 'test@example.com' } }
      );
    });
    
    it('should call apiService.get with correct endpoint for checkDniExists', () => {
      // Configurar respuesta del servicio
      apiService.get.and.returnValue(of({ exists: true }));
      
      // Llamar al método
      adapter.checkDniExists('12345678').subscribe(exists => {
        expect(exists).toBe(true);
      });
      
      // Verificar que se llamó al servicio con el endpoint correcto
      expect(apiService.get).toHaveBeenCalledWith(
        'api/users/check-dni',
        { params: { dni: '12345678' } }
      );
    });
  });
});
