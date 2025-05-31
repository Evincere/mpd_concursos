/**
 * Opciones para la función de memorización
 */
export interface MemoizeOptions {
  /**
   * Tiempo de expiración en milisegundos
   */
  expirationTime?: number;
  
  /**
   * Tamaño máximo de la caché
   */
  maxCacheSize?: number;
}

/**
 * Entrada de caché para la función de memorización
 */
interface CacheEntry<T> {
  /**
   * Valor almacenado en caché
   */
  value: T;
  
  /**
   * Timestamp de expiración
   */
  expiration?: number;
}

/**
 * Decorador para memorizar el resultado de una función
 * @param options Opciones de memorización
 * @returns Decorador de método
 */
export function Memoize(options: MemoizeOptions = {}): MethodDecorator {
  const { expirationTime, maxCacheSize = 100 } = options;
  
  return function(
    target: Object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    if (descriptor.value) {
      const originalMethod = descriptor.value;
      const cacheMap = new Map<string, CacheEntry<any>>();
      const accessOrder: string[] = [];
      
      descriptor.value = function(...args: any[]) {
        const key = JSON.stringify(args);
        
        // Verificar si el resultado está en caché y no ha expirado
        if (cacheMap.has(key)) {
          const entry = cacheMap.get(key)!;
          
          // Verificar si la entrada ha expirado
          if (expirationTime && entry.expiration && entry.expiration < Date.now()) {
            cacheMap.delete(key);
            const index = accessOrder.indexOf(key);
            if (index !== -1) {
              accessOrder.splice(index, 1);
            }
          } else {
            // Actualizar el orden de acceso
            const index = accessOrder.indexOf(key);
            if (index !== -1) {
              accessOrder.splice(index, 1);
            }
            accessOrder.push(key);
            
            return entry.value;
          }
        }
        
        // Calcular el resultado
        const result = originalMethod.apply(this, args);
        
        // Almacenar el resultado en caché
        const entry: CacheEntry<any> = {
          value: result
        };
        
        if (expirationTime) {
          entry.expiration = Date.now() + expirationTime;
        }
        
        cacheMap.set(key, entry);
        accessOrder.push(key);
        
        // Eliminar entradas antiguas si se excede el tamaño máximo
        if (maxCacheSize && cacheMap.size > maxCacheSize) {
          const oldestKey = accessOrder.shift();
          if (oldestKey) {
            cacheMap.delete(oldestKey);
          }
        }
        
        return result;
      };
    }
    
    return descriptor;
  };
}

/**
 * Función para memorizar una función
 * @param fn Función a memorizar
 * @param options Opciones de memorización
 * @returns Función memorizada
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  options: MemoizeOptions = {}
): T {
  const { expirationTime, maxCacheSize = 100 } = options;
  const cache = new Map<string, CacheEntry<ReturnType<T>>>();
  const accessOrder: string[] = [];
  
  return function(this: any, ...args: Parameters<T>): ReturnType<T> {
    const key = JSON.stringify(args);
    
    // Verificar si el resultado está en caché y no ha expirado
    if (cache.has(key)) {
      const entry = cache.get(key)!;
      
      // Verificar si la entrada ha expirado
      if (expirationTime && entry.expiration && entry.expiration < Date.now()) {
        cache.delete(key);
        const index = accessOrder.indexOf(key);
        if (index !== -1) {
          accessOrder.splice(index, 1);
        }
      } else {
        // Actualizar el orden de acceso
        const index = accessOrder.indexOf(key);
        if (index !== -1) {
          accessOrder.splice(index, 1);
        }
        accessOrder.push(key);
        
        return entry.value;
      }
    }
    
    // Calcular el resultado
    const result = fn.apply(this, args);
    
    // Almacenar el resultado en caché
    const entry: CacheEntry<ReturnType<T>> = {
      value: result
    };
    
    if (expirationTime) {
      entry.expiration = Date.now() + expirationTime;
    }
    
    cache.set(key, entry);
    accessOrder.push(key);
    
    // Eliminar entradas antiguas si se excede el tamaño máximo
    if (maxCacheSize && cache.size > maxCacheSize) {
      const oldestKey = accessOrder.shift();
      if (oldestKey) {
        cache.delete(oldestKey);
      }
    }
    
    return result;
  } as T;
}
