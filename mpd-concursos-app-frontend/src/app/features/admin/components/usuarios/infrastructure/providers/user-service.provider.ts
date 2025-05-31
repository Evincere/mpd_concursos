import { Provider, InjectionToken } from '@angular/core';
import { UserRepositoryPort } from '../../application/ports/user-repository.port';
import { OptimizedUserRepositoryAdapter } from '../adapters/optimized-user-repository.adapter';

/**
 * Token de inyección para el repositorio de usuarios
 */
export const USER_REPOSITORY_TOKEN = new InjectionToken<UserRepositoryPort>('UserRepositoryPort');

/**
 * Proveedor para el servicio de usuarios
 * Configura la inyección de dependencias para el servicio de usuarios
 * utilizando el adaptador optimizado
 */
export const USER_SERVICE_PROVIDER: Provider[] = [
  {
    provide: USER_REPOSITORY_TOKEN,
    useClass: OptimizedUserRepositoryAdapter
  },
  // El servicio UserService se proporciona directamente en su propia clase
  // con providedIn: 'root'
];
