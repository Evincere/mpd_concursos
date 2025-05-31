/**
 * Opciones para el decorador de medición de rendimiento
 */
export interface PerformanceMeasureOptions {
  /**
   * Nombre de la medición
   */
  name?: string;
  
  /**
   * Si se debe registrar en la consola
   */
  logToConsole?: boolean;
  
  /**
   * Umbral en milisegundos para considerar una ejecución lenta
   */
  slowThreshold?: number;
}

/**
 * Decorador para medir el rendimiento de un método
 * @param options Opciones de medición
 * @returns Decorador de método
 */
export function MeasurePerformance(options: PerformanceMeasureOptions = {}): MethodDecorator {
  return function(
    target: Object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = function(...args: any[]) {
      const methodName = options.name || propertyKey.toString();
      const startTime = performance.now();
      
      try {
        const result = originalMethod.apply(this, args);
        
        // Si el resultado es una promesa o un observable, medir cuando se complete
        if (result && typeof result.then === 'function') {
          return result.then((value: any) => {
            logPerformance(methodName, startTime, options);
            return value;
          }).catch((error: any) => {
            logPerformance(methodName, startTime, options);
            throw error;
          });
        } else if (result && typeof result.subscribe === 'function') {
          const originalSubscribe = result.subscribe;
          result.subscribe = function(...subscribeArgs: any[]) {
            logPerformance(methodName, startTime, options);
            return originalSubscribe.apply(this, subscribeArgs);
          };
        } else {
          logPerformance(methodName, startTime, options);
        }
        
        return result;
      } catch (error) {
        logPerformance(methodName, startTime, options);
        throw error;
      }
    };
    
    return descriptor;
  };
}

/**
 * Registra el rendimiento de un método
 * @param methodName Nombre del método
 * @param startTime Tiempo de inicio
 * @param options Opciones de medición
 */
function logPerformance(
  methodName: string,
  startTime: number,
  options: PerformanceMeasureOptions
): void {
  const endTime = performance.now();
  const executionTime = endTime - startTime;
  const slowThreshold = options.slowThreshold || 100;
  
  // Registrar en la consola si está habilitado
  if (options.logToConsole !== false) {
    const isSlow = executionTime > slowThreshold;
    
    if (isSlow) {
      console.warn(
        `%c⚠️ Rendimiento lento: ${methodName} - ${executionTime.toFixed(2)}ms (umbral: ${slowThreshold}ms)`,
        'color: #ff9800; font-weight: bold;'
      );
    } else {
      console.log(
        `%c📊 Rendimiento: ${methodName} - ${executionTime.toFixed(2)}ms`,
        'color: #4caf50;'
      );
    }
  }
  
  // Registrar en Performance API si está disponible
  if (typeof performance !== 'undefined' && typeof performance.mark === 'function') {
    const markStart = `${methodName}_start`;
    const markEnd = `${methodName}_end`;
    const measureName = `⏱️ ${methodName}`;
    
    performance.mark(markStart);
    performance.mark(markEnd);
    performance.measure(measureName, markStart, markEnd);
    
    // Limpiar marcas para evitar fugas de memoria
    performance.clearMarks(markStart);
    performance.clearMarks(markEnd);
  }
}

/**
 * Clase para medir el rendimiento de bloques de código
 */
export class PerformanceTracker {
  private static readonly timers = new Map<string, number>();
  private static readonly counters = new Map<string, number>();
  private static readonly averages = new Map<string, { total: number; count: number }>();
  
  /**
   * Inicia un temporizador
   * @param name Nombre del temporizador
   */
  static startTimer(name: string): void {
    this.timers.set(name, performance.now());
  }
  
  /**
   * Detiene un temporizador y registra el tiempo
   * @param name Nombre del temporizador
   * @param logToConsole Si se debe registrar en la consola
   * @returns Tiempo de ejecución en milisegundos
   */
  static stopTimer(name: string, logToConsole = true): number {
    const startTime = this.timers.get(name);
    
    if (startTime === undefined) {
      console.warn(`Timer "${name}" was never started`);
      return 0;
    }
    
    const endTime = performance.now();
    const executionTime = endTime - startTime;
    
    // Actualizar promedio
    const average = this.averages.get(name) || { total: 0, count: 0 };
    average.total += executionTime;
    average.count += 1;
    this.averages.set(name, average);
    
    if (logToConsole) {
      console.log(
        `%c📊 ${name} - ${executionTime.toFixed(2)}ms (promedio: ${(average.total / average.count).toFixed(2)}ms)`,
        'color: #2196f3;'
      );
    }
    
    // Limpiar el temporizador
    this.timers.delete(name);
    
    return executionTime;
  }
  
  /**
   * Incrementa un contador
   * @param name Nombre del contador
   * @param amount Cantidad a incrementar
   */
  static incrementCounter(name: string, amount = 1): void {
    const currentValue = this.counters.get(name) || 0;
    this.counters.set(name, currentValue + amount);
  }
  
  /**
   * Obtiene el valor de un contador
   * @param name Nombre del contador
   * @returns Valor del contador
   */
  static getCounter(name: string): number {
    return this.counters.get(name) || 0;
  }
  
  /**
   * Reinicia un contador
   * @param name Nombre del contador
   */
  static resetCounter(name: string): void {
    this.counters.delete(name);
  }
  
  /**
   * Obtiene el promedio de un temporizador
   * @param name Nombre del temporizador
   * @returns Promedio en milisegundos
   */
  static getAverage(name: string): number {
    const average = this.averages.get(name);
    
    if (!average || average.count === 0) {
      return 0;
    }
    
    return average.total / average.count;
  }
  
  /**
   * Reinicia todos los temporizadores y contadores
   */
  static reset(): void {
    this.timers.clear();
    this.counters.clear();
    this.averages.clear();
  }
  
  /**
   * Registra un resumen de rendimiento
   */
  static logSummary(): void {
    console.group('📊 Resumen de rendimiento');
    
    if (this.averages.size > 0) {
      console.log('%cPromedios de tiempo:', 'font-weight: bold;');
      
      this.averages.forEach((value, key) => {
        console.log(
          `  ${key}: ${(value.total / value.count).toFixed(2)}ms (${value.count} ejecuciones)`
        );
      });
    }
    
    if (this.counters.size > 0) {
      console.log('%cContadores:', 'font-weight: bold;');
      
      this.counters.forEach((value, key) => {
        console.log(`  ${key}: ${value}`);
      });
    }
    
    if (this.timers.size > 0) {
      console.warn('%cTemporizadores activos:', 'font-weight: bold; color: #ff9800;');
      
      this.timers.forEach((value, key) => {
        const activeTime = performance.now() - value;
        console.warn(`  ${key}: ${activeTime.toFixed(2)}ms (activo)`);
      });
    }
    
    console.groupEnd();
  }
}
