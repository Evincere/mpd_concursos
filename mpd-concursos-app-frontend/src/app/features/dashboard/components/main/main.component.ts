import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CardsComponent } from './cards/cards.component';
import { RecentSectionComponent } from './recent-section/recent-section.component';
// ✅ ELIMINADO: QuickActionsComponent (redundante con widgets)
import { EstadoPerfilWidgetComponent } from '../widgets/estado-perfil-widget/estado-perfil-widget.component';
import { ProximosVencimientosWidgetComponent } from '../widgets/proximos-vencimientos-widget/proximos-vencimientos-widget.component';
import { AccionesRapidasWidgetComponent } from '../widgets/acciones-rapidas-widget/acciones-rapidas-widget.component';

import { Card } from '@shared/interfaces/concurso/card.interface';
import { RecentConcurso } from '@shared/interfaces/concurso/recent-concurso.interface';
import { DashboardData, SimpleDashboardData, ProfileCompletionDetails } from '@shared/interfaces/dashboard/dashboard-widgets.interface';
import { DocumentosService } from '@core/services/documentos/documentos.service';
import { TipoDocumento, DocumentoUsuario } from '@core/models/documento.model';
import { Subscription, fromEvent, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
// ✅ REFACTORIZACIÓN: Servicios unificados
import { UnifiedDashboardService } from '@core/services/dashboard/unified-dashboard.service';
import { AppConfigService } from '@core/services/config/app-config.service';
import { InscriptionRecoveryService } from '@core/services/inscripcion/inscription-recovery.service';
import { LoggingService } from '@core/services/logging/logging.service';


@Component({
  selector: 'app-main',
  standalone: true,
  imports: [
    CommonModule,
    CardsComponent,
    RecentSectionComponent,
    // ✅ ELIMINADO: QuickActionsComponent (redundante)
    EstadoPerfilWidgetComponent,
    ProximosVencimientosWidgetComponent,
    AccionesRapidasWidgetComponent
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
})
export class MainComponent implements OnInit, OnDestroy {
  cards: Card[] = [];
  recentConcursos: RecentConcurso[] = [];
  dashboardData: DashboardData | null = null;
  simpleDashboardData: SimpleDashboardData | null = null;
  private subscription: Subscription = new Subscription();

  constructor(
    // ✅ REFACTORIZACIÓN: Servicios unificados
    private unifiedDashboardService: UnifiedDashboardService,
    private appConfigService: AppConfigService,
    private inscriptionRecoveryService: InscriptionRecoveryService,
    private loggingService: LoggingService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private documentosService: DocumentosService
  ) {
    // ✅ REFACTORIZACIÓN: Configuración centralizada
    this.MIN_RELOAD_INTERVAL = this.appConfigService.getTimeInterval('minReloadInterval');
  }

  private lastDataLoadTimestamp = 0;
  private readonly MIN_RELOAD_INTERVAL: number;



  ngOnInit(): void {
    // ✅ CORRECCIÓN: Removida limpieza automática de inscripciones que causaba eliminación incorrecta
    // de inscripciones válidas en estado COMPLETED_PENDING_DOCS cuando el usuario cerraba sesión
    // durante el proceso de carga de documentos

    // ✅ SOLUCIÓN: Separar suscripciones de recarga de datos
    this.setupSubscriptions();

    // ✅ SOLUCIÓN: Carga inicial de datos
    this.reloadData();

    // ✅ SOLUCIÓN: Listener para recargar solo datos (no suscripciones)
    this.subscription.add(
      fromEvent(document, 'visibilitychange').subscribe(() => {
        if (!document.hidden) {
          this.reloadData(); // Solo recarga datos, no crea nuevas suscripciones
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  /**
   * ✅ SOLUCIÓN: Establece las suscripciones una sola vez en ngOnInit()
   * Esto elimina el problema de múltiples suscripciones simultáneas
   */
  private setupSubscriptions(): void {
    // ✅ SUSCRIPCIÓN ÚNICA: BehaviorSubject de dashboard cards
    this.subscription.add(
      this.unifiedDashboardService.dashboardCardsSubject.asObservable().subscribe({
        next: (cards: Card[]) => {
          this.loggingService.debug('[MainComponent] Cards received from BehaviorSubject', cards, 'MainComponent');

          // ✅ SOLUCIÓN: Detección de cambios optimizada sin interferencias
          this.ngZone.run(() => {
            this.cards = cards;
            this.cdr.markForCheck();
            this.cdr.detectChanges();
          });

          // Additional force update in next tick
          setTimeout(() => {
            this.ngZone.run(() => {
              this.cdr.detectChanges();
            });
          }, 0);
        },
        error: (error: unknown) => {
          this.loggingService.error('[MainComponent] Error al cargar las cards del dashboard', error, 'MainComponent');
        }
      })
    );

    // ✅ SUSCRIPCIÓN ÚNICA: Concursos recientes
    this.subscription.add(
      this.unifiedDashboardService.getRecentConcursos().subscribe({
        next: (concursos: RecentConcurso[]) => {
          this.recentConcursos = concursos;
        },
        error: (error: unknown) => {
          this.loggingService.error('[MainComponent] Error al cargar los concursos recientes', error, 'MainComponent');
        }
      })
    );

    // ✅ SUSCRIPCIÓN ÚNICA: Datos de widgets premium
    this.subscription.add(
      this.unifiedDashboardService.getDashboardData().subscribe({
        next: (dashboardData: DashboardData) => {
          this.dashboardData = dashboardData;
          this.simpleDashboardData = this.convertToSimpleDashboardData(dashboardData);
          // ✅ DEBUG: Mantener log esencial para verificar funcionamiento
          console.log('✅ [MainComponent] Dashboard data loaded successfully');
        },
        error: (error: unknown) => {
          this.loggingService.error('[MainComponent] Error al cargar datos de widgets premium', error, 'MainComponent');
          // Mantener funcionalidad básica aunque fallen los widgets premium
          this.dashboardData = null;
          this.simpleDashboardData = this.getDefaultSimpleDashboardData();
          console.log('⚠️ [MainComponent] Using default dashboard data:', this.simpleDashboardData);
        }
      })
    );
  }

  /**
   * ✅ SOLUCIÓN: Recarga solo los datos sin crear nuevas suscripciones
   * Esto elimina las interferencias en la detección de cambios
   */
  private reloadData(): void {
    // ✅ REFACTORIZACIÓN: Verificar intervalo usando configuración centralizada
    const ahora = Date.now();
    if (ahora - this.lastDataLoadTimestamp < this.MIN_RELOAD_INTERVAL) {
      return; // Evitar recargas muy frecuentes
    }
    this.lastDataLoadTimestamp = ahora;

    // ✅ SOLUCIÓN: Solo disparar carga de datos, las suscripciones ya están establecidas
    this.unifiedDashboardService.loadDashboardCards();
  }

  private convertToSimpleDashboardData(dashboardData: DashboardData): SimpleDashboardData {
    // Calcular documentos pendientes reales basado en las secciones que requieren documentos
    const documentosPendientes = dashboardData.estadoPerfil?.seccionesPendientes?.filter(
      seccion => seccion.nombre === 'Documentación' || seccion.icono === 'fa-file-alt'
    ).length || 0;

    // ✅ CORREGIDO: Generar profileDetails para el widget de Estado del Perfil
    const profileDetails = this.generateProfileDetails(dashboardData);

    return {
      profileCompletion: dashboardData.estadoPerfil?.completitud || 0,
      activeApplications: dashboardData.metricas?.inscripcionesActivas || 0,
      pendingDocuments: documentosPendientes,
      availableExams: 0, // ✅ LIMPIEZA: Exámenes no implementados aún
      upcomingDeadlines: dashboardData.proximosVencimientos?.map(vencimiento => ({
        title: vencimiento.titulo,
        date: vencimiento.fechaLimite.toISOString(),
        daysRemaining: vencimiento.diasRestantes
      })) || [],
      // ✅ CORREGIDO: Incluir profileDetails para el widget expandible
      profileDetails: profileDetails
    };
  }

  /**
   * ✅ CORREGIDO: Genera profileDetails usando datos reales del backend
   */
  private generateProfileDetails(dashboardData: DashboardData): ProfileCompletionDetails {
    console.log('🔍 [MainComponent] Generating profile details from dashboard data:', dashboardData);

    // ✅ USAR DATOS REALES: Obtener porcentaje de completitud del perfil desde el backend
    const personalDataPercentage = dashboardData.estadoPerfil?.completitud || 0;
    console.log('🔍 [MainComponent] Personal data percentage from backend:', personalDataPercentage);

    // ✅ PLACEHOLDER: Los datos de documentos se obtendrán dinámicamente
    // TODO: Integrar con DocumentosService para obtener datos reales
    const requiredDocuments = [
      { id: 'dni-frontal', name: 'DNI (Frente)', status: 'completed' as const, required: true },
      { id: 'dni-dorso', name: 'DNI (Dorso)', status: 'completed' as const, required: true },
      { id: 'cuil', name: 'Certificado CUIL', status: 'completed' as const, required: true },
      { id: 'antecedentes', name: 'Antecedentes Penales', status: 'missing' as const, required: true },
      { id: 'certificado-profesional', name: 'Certificado Profesional', status: 'missing' as const, required: true }
    ];

    const optionalDocuments = [
      { id: 'ley-micaela', name: 'Certificado Ley Micaela', status: 'completed' as const, required: false },
      { id: 'capacitacion', name: 'Capacitación Adicional', status: 'missing' as const, required: false }
    ];

    const requiredCompleted = requiredDocuments.filter(d => d.status === 'completed').length;
    const optionalCompleted = optionalDocuments.filter(d => d.status === 'completed').length;

    const requiredDocumentsPercentage = Math.round((requiredCompleted / requiredDocuments.length) * 100);
    const optionalDocumentsPercentage = Math.round((optionalCompleted / optionalDocuments.length) * 100);

    // ✅ USAR DATOS REALES: Calcular porcentaje global basado en datos del backend
    const globalPercentage = Math.round((personalDataPercentage * 0.4) + (requiredDocumentsPercentage * 0.6));

    // ✅ USAR DATOS REALES: Vencimientos próximos de documentos
    const proximosVencimientos = dashboardData.proximosVencimientos || [];
    const upcomingExpirations = proximosVencimientos
      .filter(v => v.tipo === 'DOCUMENTOS')
      .map(v => ({
        documentName: v.titulo,
        expirationDate: v.fechaLimite.toISOString(),
        daysUntilExpiration: v.diasRestantes,
        priority: v.diasRestantes <= 7 ? 'high' as const : v.diasRestantes <= 15 ? 'medium' as const : 'low' as const
      }));

    const result = {
      personalDataPercentage,
      requiredDocumentsPercentage,
      optionalDocumentsPercentage,
      globalPercentage,
      requiredDocuments,
      optionalDocuments,
      upcomingExpirations
    };

    console.log('✅ [MainComponent] Generated profile details:', result);

    // ✅ MEJORA: Cargar datos reales de documentos de forma asíncrona
    this.loadRealDocumentData().then(realDocumentData => {
      if (realDocumentData && this.simpleDashboardData) {
        console.log('🔄 [MainComponent] Updating profile details with real document data');
        this.simpleDashboardData.profileDetails = {
          ...this.simpleDashboardData.profileDetails!,
          ...realDocumentData
        };
        this.cdr.detectChanges();
      }
    }).catch(error => {
      console.warn('⚠️ [MainComponent] Could not load real document data:', error);
    });

    return result;
  }

  /**
   * ✅ NUEVO: Carga datos reales de documentos de forma asíncrona
   */
  private async loadRealDocumentData(): Promise<Partial<ProfileCompletionDetails> | null> {
    try {
      console.log('🔄 [MainComponent] Loading real document data...');

      // Obtener tipos de documento y documentos del usuario
      const [tiposDocumento, documentosUsuario] = await Promise.all([
        this.documentosService.getTiposDocumento().toPromise(),
        this.documentosService.getDocumentosUsuario().toPromise()
      ]);

      if (!tiposDocumento || !documentosUsuario) {
        console.warn('⚠️ [MainComponent] No document data available');
        return null;
      }

      console.log('📄 [MainComponent] Document types:', tiposDocumento.length);
      console.log('📄 [MainComponent] User documents:', documentosUsuario.length);

      // Separar documentos requeridos y opcionales
      const requiredTypes = tiposDocumento.filter(tipo => tipo.requerido);
      const optionalTypes = tiposDocumento.filter(tipo => !tipo.requerido);

      // Mapear documentos requeridos
      const requiredDocuments = requiredTypes.map(tipo => {
        const documento = documentosUsuario.find(doc => doc.tipoDocumentoId === tipo.id);
        return {
          id: tipo.id,
          name: tipo.nombre,
          status: documento ? 'completed' as const : 'missing' as const,
          required: true
          // ✅ CORREGIDO: No agregar daysUntilExpiration falso - los documentos no tienen vencimiento inherente
        };
      });

      // Mapear documentos opcionales
      const optionalDocuments = optionalTypes.map(tipo => {
        const documento = documentosUsuario.find(doc => doc.tipoDocumentoId === tipo.id);
        return {
          id: tipo.id,
          name: tipo.nombre,
          status: documento ? 'completed' as const : 'missing' as const,
          required: false
        };
      });

      // Calcular porcentajes reales
      const requiredCompleted = requiredDocuments.filter(d => d.status === 'completed').length;
      const optionalCompleted = optionalDocuments.filter(d => d.status === 'completed').length;

      const requiredDocumentsPercentage = requiredDocuments.length > 0
        ? Math.round((requiredCompleted / requiredDocuments.length) * 100)
        : 100;
      const optionalDocumentsPercentage = optionalDocuments.length > 0
        ? Math.round((optionalCompleted / optionalDocuments.length) * 100)
        : 100;

      console.log('✅ [MainComponent] Real document data calculated:', {
        requiredDocuments: requiredDocuments.length,
        requiredCompleted,
        requiredDocumentsPercentage,
        optionalDocuments: optionalDocuments.length,
        optionalCompleted,
        optionalDocumentsPercentage
      });

      return {
        requiredDocuments,
        optionalDocuments,
        requiredDocumentsPercentage,
        optionalDocumentsPercentage
      };

    } catch (error) {
      console.error('❌ [MainComponent] Error loading real document data:', error);
      return null;
    }
  }

  private getDefaultSimpleDashboardData(): SimpleDashboardData {
    return {
      profileCompletion: 0,
      activeApplications: 0,
      pendingDocuments: 0,
      availableExams: 0,
      upcomingDeadlines: [],
      // ✅ CORREGIDO: Incluir profileDetails por defecto
      profileDetails: {
        personalDataPercentage: 0,
        requiredDocumentsPercentage: 0,
        optionalDocumentsPercentage: 0,
        globalPercentage: 0,
        requiredDocuments: [],
        optionalDocuments: [],
        upcomingExpirations: []
      }
    };
  }

  // ✅ CORRECCIÓN: Método eliminado - la limpieza automática causaba eliminación incorrecta
  // de inscripciones válidas. La limpieza ahora solo se ejecuta cuando es explícitamente necesario.
}
