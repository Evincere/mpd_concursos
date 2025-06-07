import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, timer } from 'rxjs';
import { map, distinctUntilChanged, shareReplay } from 'rxjs/operators';
import { ConcursosService } from './concursos/concursos.service';
import { InscriptionService } from './inscripcion/inscription.service';
import { IInscription } from '@shared/interfaces/inscripcion/inscription.interface';

/**
 * Interfaz para indicadores del sidebar
 */
export interface SidebarIndicator {
  id: string;
  value: number | string;
  color: 'primary' | 'accent' | 'warn' | 'success' | 'info';
  priority: 'high' | 'medium' | 'low';
  lastUpdated: Date;
}

/**
 * Interfaz para alertas del sistema
 */
export interface SystemAlert {
  id: string;
  type: 'urgent' | 'warning' | 'info';
  title: string;
  message: string;
  moduleId: string;
  itemId: string;
  timestamp: Date;
  acknowledged: boolean;
}

/**
 * Servicio centralizado para gestión de notificaciones e indicadores administrativos
 */
@Injectable({
  providedIn: 'root'
})
export class AdminNotificationsService {
  
  // Estados internos
  private indicatorsSubject = new BehaviorSubject<Map<string, SidebarIndicator>>(new Map());
  private alertsSubject = new BehaviorSubject<SystemAlert[]>([]);
  private lastUpdateSubject = new BehaviorSubject<Date>(new Date());

  // Observables públicos
  public indicators$ = this.indicatorsSubject.asObservable();
  public alerts$ = this.alertsSubject.asObservable();
  public lastUpdate$ = this.lastUpdateSubject.asObservable();

  // Indicadores específicos
  public concursosCount$ = this.indicators$.pipe(
    map(indicators => indicators.get('concursos-total')?.value || 0),
    distinctUntilChanged()
  );

  public inscripcionesPendientes$ = this.indicators$.pipe(
    map(indicators => indicators.get('inscripciones-pendientes')?.value || 0),
    distinctUntilChanged()
  );

  public documentosPendientes$ = this.indicators$.pipe(
    map(indicators => indicators.get('documentos-pendientes')?.value || 0),
    distinctUntilChanged()
  );

  public alertasUrgentes$ = this.alerts$.pipe(
    map(alerts => alerts.filter(alert => alert.type === 'urgent' && !alert.acknowledged).length),
    distinctUntilChanged()
  );

  constructor(
    private concursosService: ConcursosService,
    private inscriptionService: InscriptionService
  ) {
    this.initializeIndicators();
    this.startPeriodicUpdates();
  }

  /**
   * Inicializa los indicadores del sistema
   */
  private initializeIndicators(): void {
    // Actualizar indicadores de concursos
    this.concursosService.getConcursos().subscribe(concursos => {
      this.updateIndicator('concursos-total', {
        id: 'concursos-total',
        value: concursos.length,
        color: 'primary',
        priority: 'medium',
        lastUpdated: new Date()
      });

      // Concursos próximos a vencer
      const proximosVencer = concursos.filter(c => {
        if (c.endDate) {
          const fechaFin = new Date(c.endDate);
          const ahora = new Date();
          const diasRestantes = Math.ceil((fechaFin.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24));
          return diasRestantes <= 7 && diasRestantes > 0;
        }
        return false;
      }).length;

      this.updateIndicator('concursos-proximos-vencer', {
        id: 'concursos-proximos-vencer',
        value: proximosVencer,
        color: proximosVencer > 0 ? 'warn' : 'success',
        priority: proximosVencer > 0 ? 'high' : 'low',
        lastUpdated: new Date()
      });
    });

    // Actualizar indicadores de inscripciones
    this.inscriptionService.inscriptions.subscribe((inscripciones: IInscription[]) => {
      // Total de inscripciones
      this.updateIndicator('inscripciones-total', {
        id: 'inscripciones-total',
        value: inscripciones.length,
        color: 'primary',
        priority: 'medium',
        lastUpdated: new Date()
      });

      // Inscripciones pendientes
      const pendientes = inscripciones.filter(i => 
        ['PENDING', 'IN_PROCESS', 'COMPLETED_PENDING_DOCS'].includes(i.state)
      ).length;

      this.updateIndicator('inscripciones-pendientes', {
        id: 'inscripciones-pendientes',
        value: pendientes,
        color: pendientes > 0 ? 'warn' : 'success',
        priority: pendientes > 10 ? 'high' : 'medium',
        lastUpdated: new Date()
      });

      // Documentos pendientes de revisión
      const documentosPendientes = inscripciones.filter(i => 
        i.state === 'COMPLETED_PENDING_DOCS'
      ).length;

      this.updateIndicator('documentos-pendientes', {
        id: 'documentos-pendientes',
        value: documentosPendientes,
        color: documentosPendientes > 0 ? 'accent' : 'success',
        priority: documentosPendientes > 5 ? 'high' : 'medium',
        lastUpdated: new Date()
      });

      // Generar alertas si es necesario
      this.generateSystemAlerts(inscripciones);
    });
  }

  /**
   * Actualiza un indicador específico
   */
  private updateIndicator(id: string, indicator: SidebarIndicator): void {
    const currentIndicators = this.indicatorsSubject.value;
    currentIndicators.set(id, indicator);
    this.indicatorsSubject.next(new Map(currentIndicators));
    this.lastUpdateSubject.next(new Date());
  }

  /**
   * Obtiene un indicador específico
   */
  public getIndicator(id: string): Observable<SidebarIndicator | undefined> {
    return this.indicators$.pipe(
      map(indicators => indicators.get(id)),
      distinctUntilChanged()
    );
  }

  /**
   * Obtiene todos los indicadores
   */
  public getAllIndicators(): Observable<SidebarIndicator[]> {
    return this.indicators$.pipe(
      map(indicators => Array.from(indicators.values())),
      shareReplay(1)
    );
  }

  /**
   * Genera alertas del sistema basadas en los datos
   */
  private generateSystemAlerts(inscripciones: IInscription[]): void {
    const alerts: SystemAlert[] = [];

    // Alerta por inscripciones pendientes de larga duración
    const inscripcionesPendientesLargaDuracion = inscripciones.filter(i => {
      if (i.state === 'PENDING' && i.createdAt) {
        const fechaCreacion = new Date(i.createdAt);
        const ahora = new Date();
        const diasPendiente = Math.ceil((ahora.getTime() - fechaCreacion.getTime()) / (1000 * 60 * 60 * 24));
        return diasPendiente > 7;
      }
      return false;
    });

    if (inscripcionesPendientesLargaDuracion.length > 0) {
      alerts.push({
        id: 'inscripciones-pendientes-larga-duracion',
        type: 'urgent',
        title: 'Inscripciones Pendientes',
        message: `${inscripcionesPendientesLargaDuracion.length} inscripciones llevan más de 7 días pendientes`,
        moduleId: 'inscripciones',
        itemId: 'inscripciones-pendientes',
        timestamp: new Date(),
        acknowledged: false
      });
    }

    // Alerta por documentos sin revisar
    const documentosSinRevisar = inscripciones.filter(i => i.state === 'COMPLETED_PENDING_DOCS');
    if (documentosSinRevisar.length > 10) {
      alerts.push({
        id: 'documentos-sin-revisar',
        type: 'warning',
        title: 'Documentos Pendientes',
        message: `${documentosSinRevisar.length} documentos esperan revisión`,
        moduleId: 'inscripciones',
        itemId: 'documentos-pendientes',
        timestamp: new Date(),
        acknowledged: false
      });
    }

    this.alertsSubject.next(alerts);
  }

  /**
   * Marca una alerta como reconocida
   */
  public acknowledgeAlert(alertId: string): void {
    const currentAlerts = this.alertsSubject.value;
    const updatedAlerts = currentAlerts.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    );
    this.alertsSubject.next(updatedAlerts);
  }

  /**
   * Fuerza una actualización de todos los indicadores
   */
  public forceUpdate(): void {
    this.initializeIndicators();
  }

  /**
   * Inicia actualizaciones periódicas cada 5 minutos
   */
  private startPeriodicUpdates(): void {
    timer(0, 5 * 60 * 1000).subscribe(() => {
      this.initializeIndicators();
    });
  }

  /**
   * Obtiene el estado de salud del sistema
   */
  public getSystemHealth(): Observable<{
    status: 'healthy' | 'warning' | 'critical';
    indicators: number;
    alerts: number;
    lastUpdate: Date;
  }> {
    return combineLatest([
      this.indicators$,
      this.alerts$,
      this.lastUpdate$
    ]).pipe(
      map(([indicators, alerts, lastUpdate]) => {
        const urgentAlerts = alerts.filter(a => a.type === 'urgent' && !a.acknowledged).length;
        const warningAlerts = alerts.filter(a => a.type === 'warning' && !a.acknowledged).length;
        
        let status: 'healthy' | 'warning' | 'critical' = 'healthy';
        if (urgentAlerts > 0) {
          status = 'critical';
        } else if (warningAlerts > 0) {
          status = 'warning';
        }

        return {
          status,
          indicators: indicators.size,
          alerts: alerts.length,
          lastUpdate
        };
      }),
      shareReplay(1)
    );
  }
}
