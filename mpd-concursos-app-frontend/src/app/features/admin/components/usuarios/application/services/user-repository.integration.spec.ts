import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserService } from './user.service';
import { OptimizedUserRepositoryAdapter } from '../../infrastructure/adapters/optimized-user-repository.adapter';
import { UserRepositoryPort } from '../ports/user-repository.port';
import { USER_REPOSITORY_TOKEN } from '../../infrastructure/providers/user-service.provider';
import { ApiService } from '@core/services/api/api.service';
import { CacheService } from '@core/services/cache/cache.service';
import { ApiErrorService } from '@core/services/error/api-error.service';
import { environment } from '@environments/environment';
import { UserStatus } from '../../domain/models/user.model';
import { first } from 'rxjs/operators';

describe('UserService + Repository - Integration', () => {
  let service: UserService;
  let repository: UserRepositoryPort;
  let httpMock: HttpTestingController;
  let cacheService: CacheService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        UserService,
        ApiService,
        CacheService,
        ApiErrorService,
        { provide: USER_REPOSITORY_TOKEN, useClass: OptimizedUserRepositoryAdapter }
      ]
    });

    service = TestBed.inject(UserService);
    repository = TestBed.inject(USER_REPOSITORY_TOKEN);
    httpMock = TestBed.inject(HttpTestingController);
    cacheService = TestBed.inject(CacheService);

    // Limpiar caché antes de cada prueba
    cacheService.clear();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
    expect(repository).toBeTruthy();
  });

  describe('getUsers', () => {
    it('should make HTTP request and return paginated response', (done) => {
      // Datos de prueba
      const mockResponse = {
        users: [
          {
            id: '1',
            username: 'user1',
            firstName: 'User',
            lastName: 'One',
            email: 'user1@example.com',
            dni: '12345678',
            status: UserStatus.ACTIVE,
            roles: ['USER'],
            createdAt: new Date(),
            enabled: true
          }
        ],
        total: 1,
        page: 0,
        size: 10
      };

      // Llamar al método
      service.getUsers().subscribe((response) => {
        expect(response.users.length).toBe(1);
        expect(response.users[0].id).toBe('1');
        expect(response.total).toBe(1);
        expect(response.page).toBe(0);
        expect(response.size).toBe(10);
        done();
      });

      // Verificar la solicitud HTTP
      const req = httpMock.expectOne(`${environment.apiUrl}/api/users`);
      expect(req.request.method).toBe('GET');

      // Responder con datos de prueba
      req.flush(mockResponse);
    });

    it('should apply filters to HTTP request', () => {
      // Filtros de prueba
      const filters = {
        search: 'test',
        role: 'ADMIN',
        status: UserStatus.ACTIVE,
        page: 1,
        size: 20
      };

      // Llamar al método con filtros
      service.loadUsers(filters).subscribe();

      // Verificar la solicitud HTTP
      const req = httpMock.expectOne(request => {
        return request.url === `${environment.apiUrl}/api/users` &&
               request.params.get('search') === 'test' &&
               request.params.get('role') === 'ADMIN' &&
               request.params.get('status') === UserStatus.ACTIVE &&
               request.params.get('page') === '1' &&
               request.params.get('size') === '20';
      });

      expect(req.request.method).toBe('GET');

      // Responder con datos vacíos
      req.flush({ users: [], total: 0 });
    });

    it('should use cache for repeated requests', () => {
      // Datos de prueba
      const mockResponse = { users: [], total: 0 };

      // Primera solicitud
      service.loadUsers().subscribe();

      // Verificar la solicitud HTTP
      const req1 = httpMock.expectOne(`${environment.apiUrl}/api/users`);
      req1.flush(mockResponse);

      // Segunda solicitud con los mismos parámetros
      service.loadUsers().subscribe();

      // No debería haber una segunda solicitud HTTP
      httpMock.expectNone(`${environment.apiUrl}/api/users`);
    });
  });

  describe('getUserById', () => {
    it('should make HTTP request and return user data', (done) => {
      // Datos de prueba
      const mockUser = {
        id: '1',
        username: 'user1',
        firstName: 'User',
        lastName: 'One',
        email: 'user1@example.com',
        dni: '12345678',
        status: UserStatus.ACTIVE,
        roles: ['USER'],
        createdAt: new Date(),
        enabled: true
      };

      // Llamar al método
      service.getUserById('1').subscribe((user) => {
        expect(user).toBeDefined();
        expect(user.id).toBe('1');
        expect(user.username).toBe('user1');
        done();
      });

      // Verificar la solicitud HTTP
      const req = httpMock.expectOne(`${environment.apiUrl}/api/users/1`);
      expect(req.request.method).toBe('GET');

      // Responder con datos de prueba
      req.flush(mockUser);
    });
  });

  describe('createUser', () => {
    it('should make HTTP request and refresh users list', () => {
      // Datos de prueba
      const newUser = {
        username: 'newuser',
        email: 'newuser@example.com',
        firstName: 'New',
        lastName: 'User',
        roles: ['USER']
      };

      const mockResponse = {
        id: '3',
        ...newUser,
        status: UserStatus.ACTIVE,
        createdAt: new Date().toISOString()
      };

      // Espiar método loadUsers
      spyOn(service, 'loadUsers').and.callThrough();

      // Llamar al método
      service.createUser(newUser).subscribe();

      // Verificar la solicitud HTTP
      const req = httpMock.expectOne(`${environment.apiUrl}/api/users`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newUser);

      // Responder con datos de prueba
      req.flush(mockResponse);

      // Verificar que se recargaron los usuarios
      expect(service.loadUsers).toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    it('should make HTTP request and refresh users list', () => {
      // Datos de prueba
      const updatedUser = {
        id: '1',
        firstName: 'Updated',
        lastName: 'User'
      };

      const mockResponse = {
        id: '1',
        username: 'user1',
        email: 'user1@example.com',
        firstName: 'Updated',
        lastName: 'User',
        status: UserStatus.ACTIVE,
        roles: ['USER'],
        createdAt: new Date().toISOString()
      };

      // Espiar método loadUsers
      spyOn(service, 'loadUsers').and.callThrough();

      // Llamar al método
      service.updateUser(updatedUser).subscribe();

      // Verificar la solicitud HTTP
      const req = httpMock.expectOne(`${environment.apiUrl}/api/users/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updatedUser);

      // Responder con datos de prueba
      req.flush(mockResponse);

      // Verificar que se recargaron los usuarios
      expect(service.loadUsers).toHaveBeenCalled();
    });

    it('should update selectedUser if it matches the updated user', (done) => {
      // Primero seleccionar un usuario
      const mockUser = {
        id: '1',
        username: 'user1',
        firstName: 'User',
        lastName: 'One',
        email: 'user1@example.com',
        status: UserStatus.ACTIVE,
        roles: ['USER'],
        createdAt: new Date().toISOString()
      };

      // Llamar a getUserById
      service.getUserById('1').subscribe();

      // Responder a la solicitud
      const req1 = httpMock.expectOne(`${environment.apiUrl}/api/users/1`);
      req1.flush(mockUser);

      // Datos para actualizar
      const updatedUser = {
        id: '1',
        firstName: 'Updated',
        lastName: 'User'
      };

      const mockResponse = {
        ...mockUser,
        firstName: 'Updated',
        lastName: 'User'
      };

      // Suscribirse al observable de usuario seleccionado
      service.selectedUser$.pipe(first()).subscribe(user => {
        expect(user).not.toBeNull();
        expect(user?.id).toBe('1');
        expect(user?.firstName).toBe('Updated');
        expect(user?.lastName).toBe('User');
        done();
      });

      // Llamar al método
      service.updateUser(updatedUser).subscribe();

      // Verificar la solicitud HTTP
      const req2 = httpMock.expectOne(`${environment.apiUrl}/api/users/1`);
      req2.flush(mockResponse);
    });
  });

  describe('deleteUser', () => {
    it('should make HTTP request and refresh users list', () => {
      // Espiar método loadUsers
      spyOn(service, 'loadUsers').and.callThrough();

      // Llamar al método
      service.deleteUser('1').subscribe();

      // Verificar la solicitud HTTP
      const req = httpMock.expectOne(`${environment.apiUrl}/api/users/1`);
      expect(req.request.method).toBe('DELETE');

      // Responder con éxito
      req.flush({});

      // Verificar que se recargaron los usuarios
      expect(service.loadUsers).toHaveBeenCalled();
    });
  });

  describe('changeUserStatus', () => {
    it('should make HTTP request and refresh users list', () => {
      // Datos de prueba
      const statusChange = {
        userId: '1',
        status: UserStatus.INACTIVE
      };

      const mockResponse = {
        id: '1',
        username: 'user1',
        firstName: 'User',
        lastName: 'One',
        email: 'user1@example.com',
        status: UserStatus.INACTIVE,
        roles: ['USER'],
        createdAt: new Date().toISOString()
      };

      // Espiar método loadUsers
      spyOn(service, 'loadUsers').and.callThrough();

      // Llamar al método
      service.changeUserStatus(statusChange).subscribe();

      // Verificar la solicitud HTTP
      const req = httpMock.expectOne(`${environment.apiUrl}/api/users/1/status`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(statusChange);

      // Responder con datos de prueba
      req.flush(mockResponse);

      // Verificar que se recargaron los usuarios
      expect(service.loadUsers).toHaveBeenCalled();
    });
  });
});
