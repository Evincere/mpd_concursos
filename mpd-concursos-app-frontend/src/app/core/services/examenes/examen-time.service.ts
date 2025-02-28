import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, interval, Subject } from 'rxjs';
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

  private syncWithServer(): void {
    const clientTime = Date.now();

    this.http.get<{ timestamp: number }>(`${environment.apiUrl}/time`)
      .pipe(
        catchError(error => {
          console.error('Error al sincronizar tiempo:', error);
          return [];
        })
      )
      .subscribe(response => {
        const serverTime = response.timestamp;
        const roundTripTime = Date.now() - clientTime;
        const estimatedServerTime = serverTime + (roundTripTime / 2);

        this.serverOffset = estimatedServerTime - Date.now();
        this.lastSyncTime = Date.now();
        this.serverTime$.next(this.getCurrentServerTime());

        // Guardar para detección de manipulación
        this.timeChecks.push(this.serverOffset);
        if (this.timeChecks.length > 10) {
          this.timeChecks.shift();
        }
      });
  }

  private detectTimeDrift(): void {
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
  }

  private handleTimeDriftViolation(driftInfo: any): void {
    // Emitir evento de violación de seguridad
    const violation = {
      type: 'TIME_MANIPULATION',
      severity: 'HIGH',
      details: driftInfo,
      timestamp: this.getCurrentServerTime()
    };

    // TODO: Notificar al servicio de seguridad
    console.warn('Detected time manipulation:', violation);
  }

  getCurrentServerTime(): number {
    return Date.now() + this.serverOffset;
  }

  getTimeRemaining(endTime: number): number {
    return Math.max(0, endTime - this.getCurrentServerTime());
  }

  validateTimestamp(timestamp: number): boolean {
    const currentTime = this.getCurrentServerTime();
    const timeDiff = Math.abs(currentTime - timestamp);

    // Permitir una diferencia máxima de 5 segundos
    return timeDiff <= this.MAX_TIME_DRIFT;
  }

  detener(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getTiempoUtilizado(): number {
    return this.getCurrentServerTime() - this.startTime;
  }

  iniciar(duracionSegundos: number): Observable<number> {
    this.startTime = this.getCurrentServerTime();
    const tiempoFinal = this.startTime + (duracionSegundos * 1000);

    interval(1000).pipe(
      takeUntil(this.destroy$),
      map(() => {
        const tiempoRestante = Math.max(0, Math.floor((tiempoFinal - this.getCurrentServerTime()) / 1000));
        this.tiempoRestante$.next(tiempoRestante);
        return tiempoRestante;
      })
    ).subscribe();

    return this.tiempoRestante$.asObservable();
  }
}
