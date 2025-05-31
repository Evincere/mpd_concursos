/**
 * Utilidades para inyección de dependencias
 */
import { Injectable, Type, inject } from '@angular/core';

/**
 * Decorador para clases que necesitan ser inyectables
 * @param providedIn Ámbito de provisión ('root' para toda la aplicación)
 * @returns Decorador Injectable configurado
 */
export function InjectableService(providedIn: 'root' | Type<any> | 'platform' | 'any' | null = 'root') {
  return Injectable({ providedIn });
}

/**
 * Clase base para servicios inyectables
 * Extiende esta clase en lugar de usar el decorador @Injectable
 */
@Injectable({ providedIn: 'root' })
export class BaseService {
  constructor() {
    // Constructor vacío
  }
}

/**
 * Clase base para estrategias inyectables
 * Extiende esta clase en lugar de usar el decorador @Injectable
 */
@Injectable()
export class BaseStrategy {
  constructor() {
    // Constructor vacío
  }
}

/**
 * Obtiene una instancia de un servicio mediante inyección
 * @param token Token de inyección (clase del servicio)
 * @returns Instancia del servicio
 */
export function getService<T>(token: Type<T>): T {
  return inject(token);
}

/**
 * Crea una fábrica para un servicio
 * @param factory Función de fábrica que crea el servicio
 * @param deps Dependencias de la fábrica
 * @returns Proveedor de fábrica para el servicio
 */
export function createServiceFactory<T>(
  factory: (...deps: any[]) => T,
  deps: Type<any>[]
) {
  return {
    provide: Object.getPrototypeOf(factory).constructor,
    useFactory: factory,
    deps
  };
}
