import { Injectable } from '@angular/core';
import { Observable, combineLatest, of, BehaviorSubject } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import {
  EstadoPerfil,
  ProximoVencimiento,
  AccionRapida,
  DashboardData,
  SeccionPendiente,
  DashboardUtils, // Assuming DashboardUtils is available
  PrioridadVencimiento,
  TipoVencimiento,
  TipoAccion
} from '@shared/interfaces/dashboard/dashboard-widgets.interface';
import { ProfileService, UserProfile } from '@core/services/profile/profile.service';
import { InscriptionService } from '@core/services/inscripcion/inscription.service';
import { ConcursosService } from '@core/services/concursos/concursos.service';
import { LoggingService } from '@core/services/logging/logging.service';
import { UserDashboardService, UserDeadline, UserStats } from '@core/services/dashboard/user-dashboard.service';
import { Contest } from '@shared/interfaces/concurso/concurso.interface'; // Assuming Contest interface

@Injectable({
  providedIn: 'root'
})
export class DashboardWidgetsService {
  private readonly dashboardData$ = new BehaviorSubject<DashboardData | null>(null);
  private readonly LOG_TAG = 'DashboardWidgetsService'; // Tag for logging

  constructor(
    private profileService: ProfileService,
    private inscriptionService: InscriptionService,
    private concursosService: ConcursosService,
    private loggingService: LoggingService,
    private userDashboardService: UserDashboardService
  ) {
    this.loggingService.debug(`[${this.LOG_TAG}] Initializing DashboardWidgetsService.`, undefined, this.LOG_TAG);
  }

  /**
   * Retrieves all necessary data for the dashboard widgets.
   * Combines data from profile, inscriptions, and contests services.
   * @returns An Observable of DashboardData.
   */
  getDashboardData(): Observable<DashboardData> {
    this.loggingService.info(`[${this.LOG_TAG}] Fetching all dashboard data.`, undefined, this.LOG_TAG);

    return combineLatest([
      this.getEstadoPerfil(),
      this.getProximosVencimientos(),
      this.getAccionesRapidas(),
      // TODO: Add NotificationsService.getNotifications() if needed for `notificaciones`
      // TODO: Add metrics data from other services if available
    ]).pipe(
      map(([estadoPerfil, proximosVencimientos, accionesRapidas]) => {
        const dashboardData: DashboardData = {
          estadoPerfil,
          proximosVencimientos,
          accionesRapidas,
          notificaciones: [], // Placeholder, replace with actual notifications
          metricas: { // Example metrics, adjust as needed
            inscripcionesTotales: 0, // Should be calculated from inscriptionService data
            inscripcionesActivas: (accionesRapidas.find(a => a.id === 'completar-inscripciones')?.badge || 0),
            inscripcionesAprobadas: 0, // Needs specific logic
            documentosSubidos: 0, // Needs specific logic
            concursosDisponibles: 0, // Placeholder - SeccionPendiente doesn't have cantidad property
            proximosVencimientos: proximosVencimientos.length,
            notificacionesPendientes: 0 // Placeholder
          },
          configuracionWidgets: [] // Placeholder
        };
        this.loggingService.info(`[${this.LOG_TAG}] Dashboard data compiled successfully.`, dashboardData, this.LOG_TAG);
        this.dashboardData$.next(dashboardData); // Update BehaviorSubject
        return dashboardData;
      }),
      catchError(error => {
        this.loggingService.error(`[${this.LOG_TAG}] Error loading dashboard data:`, error, this.LOG_TAG);
        const defaultData = this.getDefaultDashboardData();
        this.dashboardData$.next(defaultData); // Update BehaviorSubject with default data on error
        return of(defaultData);
      })
    );
  }

  /**
   * Calculates the user's profile status, including completeness and pending sections.
   * Now uses real data from UserDashboardService when available.
   * @returns An Observable of EstadoPerfil.
   */
  private getEstadoPerfil(): Observable<EstadoPerfil> {
    this.loggingService.info(`[${this.LOG_TAG}] Calculating user profile status with real data.`, undefined, this.LOG_TAG);

    return combineLatest([
      this.profileService.getUserProfile(),
      this.userDashboardService.getProfileStats().pipe(
        catchError(error => {
          this.loggingService.warn(`[${this.LOG_TAG}] Could not fetch profile stats from backend, using fallback calculation:`, error, this.LOG_TAG);
          return of(null); // Fallback to null if backend is not available
        })
      )
    ]).pipe(
      map(([userProfile, profileStats]) => {
        let completitud: number;
        let secciones: SeccionPendiente[];
        let documentosVencidos = 0;
        let ultimaActualizacion = new Date();

        if (profileStats) {
          // Use real data from backend
          this.loggingService.info(`[${this.LOG_TAG}] Using real profile stats from backend.`, profileStats, this.LOG_TAG);
          completitud = profileStats.completionPercentage;
          documentosVencidos = 0; // TODO: Add to backend response
          ultimaActualizacion = new Date(profileStats.lastUpdated);

          // Create sections based on backend data
          secciones = [
            {
              nombre: 'Información Personal',
              descripcion: 'Datos básicos del perfil',
              prioridad: 'ALTA',
              ruta: '/dashboard/perfil',
              icono: 'fa-user',
              completada: profileStats.hasBasicInfo
            },
            {
              nombre: 'Información de Contacto',
              descripcion: 'Teléfono y dirección',
              prioridad: 'MEDIA',
              ruta: '/dashboard/perfil',
              icono: 'fa-phone',
              completada: profileStats.hasContactInfo
            },
            {
              nombre: 'Experiencia Laboral',
              descripcion: 'Historial profesional',
              prioridad: 'MEDIA',
              ruta: '/dashboard/perfil',
              icono: 'fa-briefcase',
              completada: profileStats.hasExperience
            },
            {
              nombre: 'Educación',
              descripcion: 'Formación académica',
              prioridad: 'MEDIA',
              ruta: '/dashboard/perfil',
              icono: 'fa-graduation-cap',
              completada: profileStats.hasEducation
            }
          ];
        } else {
          // Fallback to original calculation
          this.loggingService.info(`[${this.LOG_TAG}] Using fallback profile calculation.`, undefined, this.LOG_TAG);
          secciones = this.getSeccionesPerfil(userProfile);
          completitud = DashboardUtils.calcularCompletitudPerfil(secciones);
        }

        const estadoPerfil: EstadoPerfil = {
          completitud,
          seccionesPendientes: secciones.filter((s: SeccionPendiente) => !s.completada),
          documentosVencidos,
          ultimaActualizacion,
          puntajeCompletitud: this.calcularPuntajeCompletitud(completitud, secciones)
        };

        this.loggingService.debug(`[${this.LOG_TAG}] Profile status calculated:`, estadoPerfil, this.LOG_TAG);
        return estadoPerfil;
      }),
      catchError(error => {
        this.loggingService.error(`[${this.LOG_TAG}] Error calculating profile status:`, error, this.LOG_TAG);
        return of(this.getDefaultEstadoPerfil());
      })
    );
  }

  /**
   * Retrieves the upcoming critical expirations (contests, documents, etc.).
   * Now uses real data from UserDashboardService when available.
   * @returns An Observable of an array of ProximoVencimiento.
   */
  private getProximosVencimientos(): Observable<ProximoVencimiento[]> {
    this.loggingService.info(`[${this.LOG_TAG}] Getting upcoming critical expirations with real data.`, undefined, this.LOG_TAG);

    return this.userDashboardService.getUserDeadlines(30).pipe(
      map((deadlines: UserDeadline[]) => {
        this.loggingService.info(`[${this.LOG_TAG}] Using real deadlines from backend.`, deadlines, this.LOG_TAG);

        // Convert UserDeadline to ProximoVencimiento
        const vencimientos: ProximoVencimiento[] = deadlines.map(deadline => ({
          id: deadline.id,
          tipo: this.mapDeadlineTypeToTipoVencimiento(deadline.type),
          titulo: deadline.title,
          descripcion: deadline.description,
          fechaLimite: new Date(deadline.deadline),
          diasRestantes: deadline.daysRemaining,
          prioridad: this.mapPriorityToPrioridadVencimiento(deadline.priority),
          concursoId: deadline.contestId,
          accionRequerida: deadline.actionRequired,
          ruta: deadline.route
        }));

        const topVencimientos = vencimientos.slice(0, 5); // Limit to top 5
        this.loggingService.info(`[${this.LOG_TAG}] Found ${topVencimientos.length} critical expirations from backend.`, topVencimientos, this.LOG_TAG);
        return topVencimientos;
      }),
      catchError(error => {
        this.loggingService.warn(`[${this.LOG_TAG}] Could not fetch deadlines from backend, using fallback calculation:`, error, this.LOG_TAG);

        // Fallback to original logic
        return combineLatest([
          this.concursosService.getConcursos(),
          this.inscriptionService.getUserInscriptions()
        ]).pipe(
          map(([concursos, inscripciones]) => {
            const vencimientos: ProximoVencimiento[] = [];
            const hoy = new Date();

        const concursosArray: Contest[] = Array.isArray(concursos) ? concursos : (concursos as any)?.content || [];
        const inscripcionesArray: any[] = Array.isArray(inscripciones) ? inscripciones : (inscripciones as any)?.content || [];

        this.loggingService.debug(`[${this.LOG_TAG}] Processing ${concursosArray.length} contests and ${inscripcionesArray.length} inscriptions for expirations.`, undefined, this.LOG_TAG);

        // Contest inscription expirations
        concursosArray
          .filter(c => c['status'] === 'PUBLISHED')
          .forEach(concurso => {
            const fechaFin = new Date(concurso['endDate'] as string);
            const diasRestantes = Math.ceil((fechaFin.getTime() - hoy.getTime()) / (1000 * 3600 * 24));

            if (diasRestantes >= 0 && diasRestantes <= 30) { // Consider expirations within next 30 days
              vencimientos.push({
                id: `concurso-${concurso['id']}`,
                tipo: TipoVencimiento.INSCRIPCION,
                titulo: `Inscripción: ${concurso['title']}`,
                descripcion: `Cierre de inscripciones`,
                fechaLimite: fechaFin,
                diasRestantes,
                prioridad: DashboardUtils.calcularPrioridadVencimiento(diasRestantes), // Assumed to be provided by DashboardUtils
                concursoId: concurso['id'] as string,
                accionRequerida: 'Completar inscripción',
                ruta: `/dashboard/concursos/${concurso['id']}`
              });
              this.loggingService.debug(`[${this.LOG_TAG}] Added contest inscription expiration: ${concurso['title']} (${diasRestantes} days left).`, undefined, this.LOG_TAG);
            }
          });

        // ✅ CORRECCIÓN: Plazos perentorios de documentación (3 días hábiles después del cierre)
        inscripcionesArray
          .filter(i => (i['estado'] as string)?.toUpperCase() === 'COMPLETED_PENDING_DOCS')
          .forEach(inscripcion => {
            const concurso = concursosArray.find(c => c['id'] === inscripcion['concursoId']);
            if (concurso) {
              const fechaCierre = new Date(concurso['endDate'] as string);
              // ✅ CORRECCIÓN: Calcular 3 días HÁBILES después del cierre
              const fechaLimiteDoc = this.addBusinessDays(fechaCierre, 3);
              // Establecer hora límite a las 23:59:59
              fechaLimiteDoc.setHours(23, 59, 59, 999);

              const diasRestantes = Math.ceil((fechaLimiteDoc.getTime() - hoy.getTime()) / (1000 * 3600 * 24));

              if (diasRestantes >= 0) { // Solo mostrar si aún está activo o venció hoy
                // ✅ MEJORA: Información más clara y específica
                const tituloMejorado = diasRestantes === 0
                  ? `¡ÚLTIMO DÍA! Documentos: ${concurso['title']}`
                  : `Documentos: ${concurso['title']}`;

                const descripcionMejorada = diasRestantes === 0
                  ? 'Plazo perentorio vence HOY a las 23:59'
                  : `Plazo perentorio: ${diasRestantes} días hábiles restantes`;

                vencimientos.push({
                  id: `docs-${inscripcion['id']}`,
                  tipo: TipoVencimiento.DOCUMENTOS,
                  titulo: tituloMejorado,
                  descripcion: descripcionMejorada,
                  fechaLimite: fechaLimiteDoc,
                  diasRestantes,
                  prioridad: DashboardUtils.calcularPrioridadVencimiento(diasRestantes),
                  concursoId: concurso['id'] as string,
                  accionRequerida: diasRestantes === 0 ? 'COMPLETAR HOY' : 'Completar documentación',
                  ruta: `/dashboard/concursos/${concurso['id']}/inscripcion`
                });
                this.loggingService.debug(`[${this.LOG_TAG}] Added pending document expiration: ${concurso['title']} (${diasRestantes} days left).`, undefined, this.LOG_TAG);
              }
            } else {
              this.loggingService.warn(`[${this.LOG_TAG}] Could not find matching contest for inscription ID: ${inscripcion['id']} with pending documents. Skipping document expiration for this inscription.`, undefined, this.LOG_TAG);
            }
          });

        // Sort by priority (ALTA, MEDIA, BAJA) and then by remaining days
        vencimientos.sort((a, b) => {
          const prioridadOrder = { 'ALTA': 0, 'MEDIA': 1, 'BAJA': 2 } as { [key in PrioridadVencimiento]: number };
          const prioridadDiff = prioridadOrder[a.prioridad] - prioridadOrder[b.prioridad];
          if (prioridadDiff !== 0) return prioridadDiff;
          return a.diasRestantes - b.diasRestantes;
        });

            const topVencimientos = vencimientos.slice(0, 5); // Limit to top 5 critical expirations
            this.loggingService.info(`[${this.LOG_TAG}] Found ${topVencimientos.length} critical expirations (fallback calculation).`, topVencimientos, this.LOG_TAG);
            return topVencimientos;
          }),
          catchError(fallbackError => {
            this.loggingService.error(`[${this.LOG_TAG}] Error in fallback calculation:`, fallbackError, this.LOG_TAG);
            return of([]);
          })
        );
      })
    );
  }

  /**
   * Generates contextual quick actions based on user's profile and application status.
   * @returns An Observable of an array of AccionRapida.
   */
  private getAccionesRapidas(): Observable<AccionRapida[]> {
    this.loggingService.info(`[${this.LOG_TAG}] Generating quick actions.`, undefined, this.LOG_TAG);

    return combineLatest([
      this.profileService.getUserProfile(),
      this.inscriptionService.getUserInscriptions(),
      this.getProximosVencimientos() // Re-use already calculated vencimientos
    ]).pipe(
      map(([userProfile, inscripciones, vencimientos]) => {
        const acciones: AccionRapida[] = [];

        // Action: Complete profile
        const completitudPerfil = this.calcularCompletitudBasica(userProfile);
        if (completitudPerfil < 100) { // Only show if not 100% complete
          acciones.push({
            id: 'completar-perfil',
            titulo: 'Completar Perfil',
            descripcion: `${completitudPerfil}% completado`,
            icono: 'fa-user-edit',
            ruta: '/dashboard/perfil',
            badge: Math.round((100 - completitudPerfil) / 20), // Badge indicating urgency/steps needed
            urgente: completitudPerfil < 50, // More urgent if less than 50%
            tipo: TipoAccion.PERFIL,
            visible: true
          });
          this.loggingService.debug(`[${this.LOG_TAG}] Added 'Completar Perfil' action (completeness: ${completitudPerfil}%).`, undefined, this.LOG_TAG);
        }

        // Action: Pending inscriptions (those needing documents)
        const inscripcionesArray: any[] = Array.isArray(inscripciones) ? inscripciones : (inscripciones as any)?.content || [];
        const inscripcionesPendientes = inscripcionesArray
          .filter(i => (i['estado'] as string)?.toUpperCase() === 'COMPLETED_PENDING_DOCS').length;

        if (inscripcionesPendientes > 0) {
          acciones.push({
            id: 'completar-inscripciones',
            titulo: 'Completar Inscripciones',
            descripcion: `${inscripcionesPendientes} con documentos pendientes`,
            icono: 'fa-file-upload',
            ruta: '/dashboard/postulaciones',
            badge: inscripcionesPendientes,
            urgente: true, // Always urgent if pending documents
            tipo: TipoAccion.DOCUMENTO,
            visible: true
          });
          this.loggingService.debug(`[${this.LOG_TAG}] Added 'Completar Inscripciones' action (${inscripcionesPendientes} pending docs).`, undefined, this.LOG_TAG);
        }

        // Action: Critical expirations
        const vencimientosCriticos = vencimientos?.filter(v => v.prioridad === 'ALTA').length || 0;
        if (vencimientosCriticos > 0) {
          acciones.push({
            id: 'vencimientos-criticos',
            titulo: 'Vencimientos Críticos',
            descripcion: `${vencimientosCriticos} elementos por vencer`,
            icono: 'fa-exclamation-triangle',
            ruta: '/dashboard', // Can link to dashboard itself or a dedicated expirations section
            badge: vencimientosCriticos,
            urgente: true,
            tipo: TipoAccion.NOTIFICACION,
            visible: true
          });
          this.loggingService.debug(`[${this.LOG_TAG}] Added 'Vencimientos Críticos' action (${vencimientosCriticos} critical expirations).`, undefined, this.LOG_TAG);
        }

        // Action: Explore contests (always available)
        acciones.push({
          id: 'explorar-concursos',
          titulo: 'Explorar Concursos',
          descripcion: 'Buscar nuevas oportunidades',
          icono: 'fa-search',
          ruta: '/dashboard/concursos',
          urgente: false,
          tipo: TipoAccion.INSCRIPCION,
          visible: true
        });
        this.loggingService.debug(`[${this.LOG_TAG}] Added 'Explorar Concursos' action.`, undefined, this.LOG_TAG);


        const finalActions = acciones.slice(0, 4); // Limit to a maximum of 4 quick actions
        this.loggingService.info(`[${this.LOG_TAG}] Quick actions generated. Total: ${finalActions.length}.`, finalActions, this.LOG_TAG);
        return finalActions;
      }),
      catchError(error => {
        this.loggingService.error(`[${this.LOG_TAG}] Error generating quick actions:`, error, this.LOG_TAG);
        return of(this.getDefaultAccionesRapidas());
      })
    );
  }

  // --- Private Helper Methods ---

  /**
   * Gets profile sections with completion status.
   * @param userProfile The user's profile.
   * @returns Array of SeccionPendiente with completion status.
   */
  private getSeccionesPerfil(userProfile: UserProfile | null): SeccionPendiente[] {
    const secciones: SeccionPendiente[] = [
      {
        nombre: 'Información Personal',
        descripcion: 'Datos básicos del perfil',
        prioridad: 'ALTA',
        ruta: '/dashboard/perfil',
        icono: 'fa-user',
        completada: !!(userProfile?.dni && userProfile?.email && userProfile?.firstName && userProfile?.lastName)
      },
      {
        nombre: 'Experiencia Laboral',
        descripcion: 'Historial profesional',
        prioridad: 'MEDIA',
        ruta: '/dashboard/perfil',
        icono: 'fa-briefcase',
        completada: !!(userProfile?.experiencias && userProfile.experiencias.length > 0)
      },
      {
        nombre: 'Educación',
        descripcion: 'Formación académica',
        prioridad: 'MEDIA',
        ruta: '/dashboard/perfil',
        icono: 'fa-graduation-cap',
        completada: !!(userProfile?.educacion && userProfile.educacion.length > 0)
      },
      {
        nombre: 'Documentación',
        descripcion: 'Documentos requeridos',
        prioridad: 'ALTA',
        ruta: '/dashboard/perfil',
        icono: 'fa-file-alt',
        completada: this.verificarDocumentacion(userProfile)
      }
    ];

    this.loggingService.debug(`[${this.LOG_TAG}] Profile sections calculated:`, secciones, this.LOG_TAG);
    return secciones;
  }

  /**
   * Placeholder for actual document verification logic.
   * @param userProfile The user's profile.
   * @returns boolean indicating if documentation is considered complete.
   */
  private verificarDocumentacion(userProfile: UserProfile | null): boolean {
    // TODO: Implement real document verification logic here (e.g., checking specific document statuses)
    // For now, we consider documentation complete if DNI is present.
    const isDniPresent = !!(userProfile?.dni);
    this.loggingService.debug(`[${this.LOG_TAG}] Basic documentation check (DNI present): ${isDniPresent}.`, undefined, this.LOG_TAG);
    return isDniPresent;
  }

  /**
   * Calculates a completeness score based on overall completeness and high-priority sections.
   * @param completitud Overall completeness percentage.
   * @param secciones Array of pending sections.
   * @returns Calculated completeness score.
   */
  private calcularPuntajeCompletitud(completitud: number, secciones: SeccionPendiente[]): number {
    const bonusPrioridad = secciones
      .filter(s => s.completada && s.prioridad === 'ALTA')
      .length * 10;
    const score = completitud + bonusPrioridad;
    this.loggingService.debug(`[${this.LOG_TAG}] Calculated completeness score: ${score} (completeness: ${completitud}, bonus: ${bonusPrioridad}).`, undefined, this.LOG_TAG);
    return score;
  }

  /**
   * Calculates a basic profile completeness percentage based on key fields.
   * @param userProfile The user's profile.
   * @returns Basic completeness percentage (0-100).
   */
  private calcularCompletitudBasica(userProfile: UserProfile | null): number {
    if (!userProfile) {
      this.loggingService.warn(`[${this.LOG_TAG}] User profile is null for basic completeness calculation. Returning 0.`, undefined, this.LOG_TAG);
      return 0;
    }

    let puntos = 0;
    const maxPuntos = 5; // DNI, email, telefono, experiencias, educacion

    if (userProfile.dni) puntos++;
    if (userProfile.email) puntos++;
    if (userProfile.telefono) puntos++;
    if (userProfile.experiencias && userProfile.experiencias.length > 0) puntos++;
    if (userProfile.educacion && userProfile.educacion.length > 0) puntos++;

    const basicCompleteness = Math.round((puntos / maxPuntos) * 100);
    this.loggingService.debug(`[${this.LOG_TAG}] Basic profile completeness calculated: ${basicCompleteness}%. (Points: ${puntos}/${maxPuntos}).`, undefined, this.LOG_TAG);
    return basicCompleteness;
  }

  // --- Default Data Methods (for error handling or initial state) ---

  private getDefaultEstadoPerfil(): EstadoPerfil {
    const defaultState = {
      completitud: 0,
      seccionesPendientes: [],
      documentosVencidos: 0,
      ultimaActualizacion: new Date(),
      puntajeCompletitud: 0
    };
    this.loggingService.debug(`[${this.LOG_TAG}] Returning default profile status.`, defaultState, this.LOG_TAG);
    return defaultState;
  }

  private getDefaultAccionesRapidas(): AccionRapida[] {
    const defaultActions = [
      {
        id: 'explorar-concursos', // Always offer to explore contests
        titulo: 'Explorar Concursos',
        descripcion: 'Buscar nuevas oportunidades',
        icono: 'fa-search',
        ruta: '/dashboard/concursos',
        urgente: false,
        tipo: TipoAccion.INSCRIPCION,
        visible: true
      },
      {
        id: 'completar-perfil', // Offer to complete profile if no profile data available
        titulo: 'Completar Perfil',
        descripcion: 'Actualiza tu información profesional',
        icono: 'fa-user-edit',
        ruta: '/dashboard/perfil',
        urgente: false,
        tipo: TipoAccion.PERFIL,
        visible: true
      }
    ];
    this.loggingService.debug(`[${this.LOG_TAG}] Returning default quick actions.`, defaultActions, this.LOG_TAG);
    return defaultActions;
  }

  private getDefaultDashboardData(): DashboardData {
    const defaultData = {
      estadoPerfil: this.getDefaultEstadoPerfil(),
      proximosVencimientos: [],
      accionesRapidas: this.getDefaultAccionesRapidas(),
      notificaciones: [],
      metricas: {
        inscripcionesTotales: 0,
        inscripcionesActivas: 0,
        inscripcionesAprobadas: 0,
        documentosSubidos: 0,
        concursosDisponibles: 0,
        proximosVencimientos: 0,
        notificacionesPendientes: 0
      },
      configuracionWidgets: []
    };
    this.loggingService.debug(`[${this.LOG_TAG}] Returning default dashboard data.`, defaultData, this.LOG_TAG);
    return defaultData;
  }

  /**
   * Returns the current dashboard data as an observable.
   * Consumers can subscribe to this to get real-time updates without re-fetching all data.
   * @returns An Observable of DashboardData or null initially.
   */
  get currentDashboardData$(): Observable<DashboardData | null> {
    return this.dashboardData$.asObservable();
  }

  // --- Mapping Methods for UserDashboardService Integration ---

  /**
   * Maps UserDeadline type to TipoVencimiento
   */
  private mapDeadlineTypeToTipoVencimiento(type: string): TipoVencimiento {
    switch (type) {
      case 'INSCRIPTION':
        return TipoVencimiento.INSCRIPCION;
      case 'DOCUMENTS':
        return TipoVencimiento.DOCUMENTOS;
      case 'EXAM':
        return TipoVencimiento.EXAMEN;
      case 'RESULT':
        return TipoVencimiento.RESULTADO;
      default:
        return TipoVencimiento.INSCRIPCION;
    }
  }

  /**
   * Maps UserDeadline priority to PrioridadVencimiento
   */
  private mapPriorityToPrioridadVencimiento(priority: string): PrioridadVencimiento {
    switch (priority) {
      case 'HIGH':
        return PrioridadVencimiento.ALTA;
      case 'MEDIUM':
        return PrioridadVencimiento.MEDIA;
      case 'LOW':
        return PrioridadVencimiento.BAJA;
      default:
        return PrioridadVencimiento.MEDIA;
    }
  }

  /**
   * ✅ NUEVO MÉTODO: Agregar días hábiles a una fecha
   * Excluye sábados y domingos
   */
  private addBusinessDays(date: Date, businessDays: number): Date {
    const result = new Date(date);
    let daysAdded = 0;

    while (daysAdded < businessDays) {
      result.setDate(result.getDate() + 1);
      // Si no es fin de semana (sábado = 6, domingo = 0)
      if (result.getDay() !== 0 && result.getDay() !== 6) {
        daysAdded++;
      }
    }

    return result;
  }
}
