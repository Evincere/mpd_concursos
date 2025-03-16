import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, interval, Subject, of } from 'rxjs';
import { map, takeUntil, catchError } from 'rxjs/operators';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root'
})
export class ExamenTimeService {
  private readonly SYNC_INTERVAL = 30000; // 30 segundos
  private readonly MAX_TIME_DRIFT = 5000; // 5 segundos de diferencia máxima permitida
  private serverOffset = 0;
  private lastSyncTime = 0;
  private timeChecks: number[] = [];
  private startTime: number = 0;
  private destroy$ = new Subject<void>();
  private tiempoRestante$ = new BehaviorSubject<number>(0);
  private duracionTotal: number = 0; // Duración total en segundos

  private serverTime$ = new BehaviorSubject<number>(Date.now());

  constructor(private http: HttpClient) {
    this.initializeTimeSync();
  }

  private initializeTimeSync(): void {
    // Sincronización inicial
    this.syncWithServer();

    // Sincronización periódica
    interval(this.SYNC_INTERVAL).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.syncWithServer();
      this.detectTimeDrift();
    });
  }

  private isValidTimestamp(timestamp: number): boolean {
    return !isNaN(timestamp) &&
           timestamp > 0 &&
           timestamp < 8640000000000000; // Máximo timestamp válido en JS
  }

  private formatDate(timestamp: number): string {
    try {
      if (!this.isValidTimestamp(timestamp)) {
        throw new Error('Timestamp inválido');
      }
      return new Date(timestamp).toISOString();
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return 'Fecha inválida';
    }
  }

  private syncWithServer(): void {
    console.log('TimeService: Sincronizando con el servidor...');

    const requestStartTime = Date.now();

    this.http.get<{ timestamp: number }>(`${environment.apiUrl}/time`).pipe(
      map(response => {
        const requestEndTime = Date.now();
        const roundTripTime = requestEndTime - requestStartTime;
        const serverTime = response?.timestamp;

        // Si el timestamp es undefined o null, usar el tiempo local
        if (serverTime === undefined || serverTime === null) {
          console.warn('TimeService: Timestamp del servidor no proporcionado, usando tiempo local');
          return { timestamp: Date.now(), offset: 0 };
        }

        // Validar que el timestamp del servidor sea válido
        if (!this.isValidTimestamp(serverTime)) {
          console.warn('TimeService: Timestamp del servidor inválido:', serverTime);
          return { timestamp: Date.now(), offset: 0 };
        }

        // Calcular el offset aproximado considerando la latencia
        const clientTime = requestStartTime + (roundTripTime / 2);
        const newOffset = serverTime - clientTime;

        // Si el offset es muy grande, podría indicar un problema
        if (Math.abs(newOffset) > 24 * 60 * 60 * 1000) { // 24 horas
          console.warn('TimeService: Offset demasiado grande:', newOffset);
          return { timestamp: Date.now(), offset: 0 };
        }

        return { timestamp: serverTime, offset: newOffset };
      }),
      catchError(error => {
        console.error('TimeService: Error en la sincronización:', error);
        return of({ timestamp: Date.now(), offset: 0 });
      })
    ).subscribe({
      next: (result) => {
        if ('offset' in result) {
          this.serverOffset = result.offset ?? 0;
          console.log('TimeService: Nuevo offset:', this.serverOffset);
        }
        this.lastSyncTime = Date.now();
        this.serverTime$.next(result.timestamp);
      }
    });
  }

  private detectTimeDrift(): void {
    if (this.timeChecks.length === 0) return;

    try {
      const currentOffset = this.serverOffset;
      const avgOffset = this.timeChecks.reduce((a, b) => a + b, 0) / this.timeChecks.length;

      // Detectar cambios bruscos en el offset
      if (Math.abs(currentOffset - avgOffset) > this.MAX_TIME_DRIFT) {
        this.handleTimeDriftViolation({
          currentOffset,
          averageOffset: avgOffset,
          drift: Math.abs(currentOffset - avgOffset)
        });
      }
    } catch (error) {
      console.error('TimeService: Error detectando drift de tiempo:', error);
    }
  }

  private handleTimeDriftViolation(driftInfo: any): void {
    try {
      const violation = {
        type: 'TIME_MANIPULATION',
        severity: 'HIGH',
        details: driftInfo,
        timestamp: this.getCurrentServerTime()
      };
      console.warn('TimeService: Detectada manipulación de tiempo:', violation);
    } catch (error) {
      console.error('TimeService: Error manejando violación de tiempo:', error);
    }
  }

  getCurrentServerTime(): number {
    const currentTime = Date.now() + this.serverOffset;
    const isValid = this.isValidTimestamp(currentTime);

    if (!isValid) {
      console.warn('TimeService: Tiempo actual inválido, usando tiempo local');
      return Date.now();
    }

    // Si han pasado más de 2 minutos desde la última sincronización, forzar una nueva
    if (Date.now() - this.lastSyncTime > 120000) {
      console.log('TimeService: Forzando sincronización por tiempo excedido');
      this.syncWithServer();
    }

    return currentTime;
  }

  getTimeRemaining(): number {
    if (this.startTime === 0 || this.duracionTotal === 0) {
      console.log('TimeService: No hay tiempo restante (startTime o duracionTotal es 0)');
      // En lugar de devolver 0, devolvemos la duración total en segundos
      // para que el contador comience con el tiempo correcto
      return this.duracionTotal;
    }

    const currentTime = this.getCurrentServerTime();
    const tiempoTranscurrido = currentTime - this.startTime;

    if (tiempoTranscurrido < 0) {
      console.warn('TimeService: Tiempo transcurrido negativo, ajustando a 0');
      return this.duracionTotal;
    }

    // Asegurarnos de que las unidades sean consistentes
    // duracionTotal está en segundos, pero tiempoTranscurrido está en milisegundos
    const tiempoRestante = (this.duracionTotal * 1000) - tiempoTranscurrido;
    const tiempoRestanteSegundos = Math.max(0, Math.floor(tiempoRestante / 1000));

    console.log('TimeService: Cálculo de tiempo restante:', {
      currentTime: new Date(currentTime).toISOString(),
      startTime: new Date(this.startTime).toISOString(),
      tiempoTranscurrido: Math.floor(tiempoTranscurrido / 1000),
      duracionTotal: this.duracionTotal,
      tiempoRestante: tiempoRestanteSegundos
    });

    return tiempoRestanteSegundos;
  }

  validateTimestamp(timestamp: number): boolean {
    if (!this.isValidTimestamp(timestamp)) return false;
    const currentTime = this.getCurrentServerTime();
    const timeDiff = Math.abs(currentTime - timestamp);
    return timeDiff <= this.MAX_TIME_DRIFT;
  }

  detener(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.startTime = 0;
    this.duracionTotal = 0;
    this.tiempoRestante$.next(0);
  }

  getTiempoUtilizado(): number {
    if (this.startTime === 0) return 0;
    return Math.max(0, this.getCurrentServerTime() - this.startTime);
  }

  iniciar(duracionMinutos: number): Observable<number> {
    if (!duracionMinutos || duracionMinutos <= 0) {
      console.error('TimeService: Duración inválida:', duracionMinutos);
      return new Observable(observer => {
        observer.error(new Error('Duración inválida'));
        return () => {};
      });
    }

    console.log('TimeService: Iniciando temporizador con duración:', duracionMinutos, 'minutos');

    return new Observable(observer => {
      let subscription: any;

      try {
        // Convertir minutos a segundos
        this.duracionTotal = duracionMinutos * 60;
        this.startTime = this.getCurrentServerTime();

        console.log('TimeService: Tiempo inicial:', this.formatDate(this.startTime));
        console.log('TimeService: Duración total en segundos:', this.duracionTotal);

        // Emitir el tiempo inicial inmediatamente
        const tiempoRestanteInicial = this.getTimeRemaining();
        this.tiempoRestante$.next(tiempoRestanteInicial);
        observer.next(tiempoRestanteInicial);

        // Iniciar el intervalo
        subscription = interval(1000).pipe(
          takeUntil(this.destroy$),
          map(() => {
            const tiempoRestante = this.getTimeRemaining();
            this.tiempoRestante$.next(tiempoRestante);
            return tiempoRestante;
          })
        ).subscribe({
          next: (tiempo) => observer.next(tiempo),
          error: (error) => {
            console.error('TimeService: Error en el temporizador:', error);
            observer.error(error);
          },
          complete: () => {
            console.log('TimeService: Temporizador completado');
            observer.complete();
          }
        });
      } catch (error) {
        console.error('TimeService: Error iniciando el temporizador:', error);
        observer.error(error);
      }

      // Cleanup function
      return () => {
        if (subscription) {
          subscription.unsubscribe();
          console.log('TimeService: Temporizador detenido');
        }
      };
    });
  }
}
