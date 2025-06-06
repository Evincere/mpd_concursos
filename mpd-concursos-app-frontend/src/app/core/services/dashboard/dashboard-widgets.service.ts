import { Injectable } from '@angular/core';
import { Observable, combineLatest, of, BehaviorSubject } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { 
  EstadoPerfil, 
  ProximoVencimiento, 
  AccionRapida, 
  DashboardData,
  SeccionPendiente,
  DashboardUtils,
  PrioridadVencimiento,
  TipoVencimiento,
  TipoAccion
} from '@shared/interfaces/dashboard/dashboard-widgets.interface';
import { ProfileService, UserProfile } from '@core/services/profile/profile.service';
import { InscriptionService } from '@core/services/inscripcion/inscription.service';
import { ConcursosService } from '@core/services/concursos/concursos.service';

@Injectable({
  providedIn: 'root'
})
export class DashboardWidgetsService {
  private readonly dashboardData$ = new BehaviorSubject<DashboardData | null>(null);

  constructor(
    private profileService: ProfileService,
    private inscriptionService: InscriptionService,
    private concursosService: ConcursosService
  ) {}

  /**
   * Obtiene todos los datos necesarios para los widgets del dashboard
   */
  getDashboardData(): Observable<DashboardData> {
    console.log('[DashboardWidgetsService] Iniciando carga de datos de widgets...');

    return combineLatest([
      this.getEstadoPerfil(),
      this.getProximosVencimientos(),
      this.getAccionesRapidas()
    ]).pipe(
      map(([estadoPerfil, proximosVencimientos, accionesRapidas]) => {
        const dashboardData: DashboardData = {
          estadoPerfil,
          proximosVencimientos,
          accionesRapidas,
          notificaciones: [], // TODO: Implementar cuando esté el servicio de notificaciones
          metricas: {
            inscripcionesTotales: 0,
            inscripcionesActivas: 0,
            inscripcionesAprobadas: 0,
            documentosSubidos: 0,
            concursosDisponibles: 0,
            proximosVencimientos: proximosVencimientos.length,
            notificacionesPendientes: 0
          },
          configuracionWidgets: []
        };

        console.log('[DashboardWidgetsService] Datos de dashboard compilados:', dashboardData);
        this.dashboardData$.next(dashboardData);
        return dashboardData;
      }),
      catchError(error => {
        console.error('[DashboardWidgetsService] Error al cargar datos del dashboard:', error);
        return of(this.getDefaultDashboardData());
      })
    );
  }

  /**
   * Calcula el estado del perfil del usuario
   */
  private getEstadoPerfil(): Observable<EstadoPerfil> {
    console.log('[DashboardWidgetsService] Calculando estado del perfil...');

    return this.profileService.getUserProfile().pipe(
      map((userProfile: UserProfile) => {
        const secciones: SeccionPendiente[] = [
          {
            nombre: 'Información Personal',
            descripcion: 'Datos básicos y de contacto',
            prioridad: 'ALTA',
            ruta: '/dashboard/perfil',
            icono: 'fa-user',
            completada: !!(userProfile?.dni && userProfile?.email && userProfile?.telefono)
          },
          {
            nombre: 'Experiencia Laboral',
            descripcion: 'Historial profesional',
            prioridad: 'ALTA',
            ruta: '/dashboard/perfil',
            icono: 'fa-briefcase',
            completada: !!(userProfile?.experiencias && userProfile.experiencias.length > 0)
          },
          {
            nombre: 'Formación Académica',
            descripcion: 'Títulos y certificaciones',
            prioridad: 'MEDIA',
            ruta: '/dashboard/perfil',
            icono: 'fa-graduation-cap',
            completada: !!(userProfile?.educacion && userProfile.educacion.length > 0)
          },
          {
            nombre: 'Documentación',
            descripcion: 'DNI, títulos y certificados',
            prioridad: 'ALTA',
            ruta: '/dashboard/perfil',
            icono: 'fa-file-alt',
            completada: this.verificarDocumentacion(userProfile)
          }
        ];

        const completitud = DashboardUtils.calcularCompletitudPerfil(secciones);

        const estadoPerfil: EstadoPerfil = {
          completitud,
          seccionesPendientes: secciones.filter(s => !s.completada),
          documentosVencidos: 0, // TODO: Implementar lógica de vencimiento
          ultimaActualizacion: new Date(), // Usar fecha actual por ahora
          puntajeCompletitud: this.calcularPuntajeCompletitud(completitud, secciones)
        };

        console.log('[DashboardWidgetsService] Estado del perfil calculado:', estadoPerfil);
        return estadoPerfil;
      }),
      catchError(error => {
        console.error('[DashboardWidgetsService] Error al calcular estado del perfil:', error);
        return of(this.getDefaultEstadoPerfil());
      })
    );
  }

  /**
   * Obtiene los próximos vencimientos críticos
   */
  private getProximosVencimientos(): Observable<ProximoVencimiento[]> {
    console.log('[DashboardWidgetsService] Obteniendo próximos vencimientos...');

    return combineLatest([
      this.concursosService.getConcursos(),
      this.inscriptionService.inscriptions
    ]).pipe(
      map(([concursos, inscripciones]) => {
        const vencimientos: ProximoVencimiento[] = [];
        const hoy = new Date();

        // Vencimientos de inscripciones a concursos
        const concursosArray = concursos as unknown as Array<Record<string, unknown>>;
        concursosArray
          .filter(c => c['status'] === 'PUBLISHED')
          .forEach(concurso => {
            const fechaFin = new Date(concurso['endDate'] as string);
            const diasRestantes = Math.ceil((fechaFin.getTime() - hoy.getTime()) / (1000 * 3600 * 24));

            if (diasRestantes >= 0 && diasRestantes <= 30) {
              vencimientos.push({
                id: `concurso-${concurso['id']}`,
                tipo: TipoVencimiento.INSCRIPCION,
                titulo: `Inscripción: ${concurso['title']}`,
                descripcion: `Cierre de inscripciones`,
                fechaLimite: fechaFin,
                diasRestantes,
                prioridad: DashboardUtils.calcularPrioridadVencimiento(diasRestantes),
                concursoId: concurso['id'] as string,
                accionRequerida: 'Completar inscripción',
                ruta: `/dashboard/concursos/${concurso['id']}`
              });
            }
          });

        // Vencimientos de documentos pendientes
        const inscripcionesArray = inscripciones as unknown as Array<Record<string, unknown>>;
        inscripcionesArray
          .filter(i => i['status'] === 'COMPLETED_PENDING_DOCS')
          .forEach(inscripcion => {
            // Calcular fecha límite (3 días después del cierre del concurso)
            const concurso = concursosArray.find(c => c['id'] === inscripcion['contestId']);
            if (concurso) {
              const fechaCierre = new Date(concurso['endDate'] as string);
              const fechaLimiteDoc = new Date(fechaCierre);
              fechaLimiteDoc.setDate(fechaLimiteDoc.getDate() + 3);

              const diasRestantes = Math.ceil((fechaLimiteDoc.getTime() - hoy.getTime()) / (1000 * 3600 * 24));

              if (diasRestantes >= 0) {
                vencimientos.push({
                  id: `docs-${inscripcion['id']}`,
                  tipo: TipoVencimiento.DOCUMENTOS,
                  titulo: `Documentos: ${concurso['title']}`,
                  descripcion: 'Completar documentación pendiente',
                  fechaLimite: fechaLimiteDoc,
                  diasRestantes,
                  prioridad: DashboardUtils.calcularPrioridadVencimiento(diasRestantes),
                  concursoId: concurso['id'] as string,
                  accionRequerida: 'Subir documentos',
                  ruta: `/dashboard/concursos/${concurso['id']}/inscripcion`
                });
              }
            }
          });

        // Ordenar por prioridad y días restantes
        vencimientos.sort((a, b) => {
          const prioridadOrder = { 'ALTA': 0, 'MEDIA': 1, 'BAJA': 2 };
          const prioridadDiff = prioridadOrder[a.prioridad] - prioridadOrder[b.prioridad];
          if (prioridadDiff !== 0) return prioridadDiff;
          return a.diasRestantes - b.diasRestantes;
        });

        console.log('[DashboardWidgetsService] Próximos vencimientos encontrados:', vencimientos);
        return vencimientos.slice(0, 5); // Máximo 5 vencimientos
      }),
      catchError(error => {
        console.error('[DashboardWidgetsService] Error al obtener vencimientos:', error);
        return of([]);
      })
    );
  }

  /**
   * Genera acciones rápidas contextuales basadas en el estado del usuario
   */
  private getAccionesRapidas(): Observable<AccionRapida[]> {
    console.log('[DashboardWidgetsService] Generando acciones rápidas...');

    return combineLatest([
      this.profileService.getUserProfile(),
      this.inscriptionService.inscriptions,
      this.getProximosVencimientos()
    ]).pipe(
      map(([userProfile, inscripciones, vencimientos]) => {
        const acciones: AccionRapida[] = [];

        // Acción: Completar perfil
        const completitudPerfil = this.calcularCompletitudBasica(userProfile);
        if (completitudPerfil < 80) {
          acciones.push({
            id: 'completar-perfil',
            titulo: 'Completar Perfil',
            descripcion: `${completitudPerfil}% completado`,
            icono: 'fa-user-edit',
            ruta: '/dashboard/perfil',
            badge: Math.round((100 - completitudPerfil) / 20),
            urgente: completitudPerfil < 50,
            tipo: TipoAccion.PERFIL,
            visible: true
          });
        }

        // Acción: Inscripciones pendientes
        const inscripcionesPendientes = (inscripciones as unknown as Array<Record<string, unknown>>)
          .filter(i => i['status'] === 'COMPLETED_PENDING_DOCS').length;

        if (inscripcionesPendientes > 0) {
          acciones.push({
            id: 'completar-inscripciones',
            titulo: 'Completar Inscripciones',
            descripcion: `${inscripcionesPendientes} con documentos pendientes`,
            icono: 'fa-file-upload',
            ruta: '/dashboard/postulaciones',
            badge: inscripcionesPendientes,
            urgente: true,
            tipo: TipoAccion.DOCUMENTO,
            visible: true
          });
        }

        // Acción: Vencimientos críticos
        const vencimientosCriticos = vencimientos?.filter(v => v.prioridad === 'ALTA').length || 0;
        if (vencimientosCriticos > 0) {
          acciones.push({
            id: 'vencimientos-criticos',
            titulo: 'Vencimientos Críticos',
            descripcion: `${vencimientosCriticos} elementos por vencer`,
            icono: 'fa-exclamation-triangle',
            ruta: '/dashboard',
            badge: vencimientosCriticos,
            urgente: true,
            tipo: TipoAccion.NOTIFICACION,
            visible: true
          });
        }

        // Acción: Explorar concursos
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

        console.log('[DashboardWidgetsService] Acciones rápidas generadas:', acciones);
        return acciones.slice(0, 4); // Máximo 4 acciones
      }),
      catchError(error => {
        console.error('[DashboardWidgetsService] Error al generar acciones rápidas:', error);
        return of(this.getDefaultAccionesRapidas());
      })
    );
  }

  // Métodos auxiliares privados
  private verificarDocumentacion(userProfile: UserProfile | null): boolean {
    // TODO: Implementar lógica real de verificación de documentos
    // Por ahora, consideramos que la documentación está completa si tiene DNI
    return !!(userProfile?.dni);
  }

  private calcularPuntajeCompletitud(completitud: number, secciones: SeccionPendiente[]): number {
    const bonusPrioridad = secciones
      .filter(s => s.completada && s.prioridad === 'ALTA')
      .length * 10;
    return completitud + bonusPrioridad;
  }

  private calcularCompletitudBasica(userProfile: UserProfile | null): number {
    if (!userProfile) return 0;

    let puntos = 0;
    const maxPuntos = 5;

    if (userProfile.dni) puntos++;
    if (userProfile.email) puntos++;
    if (userProfile.telefono) puntos++;
    if (userProfile.experiencias && userProfile.experiencias.length > 0) puntos++;
    if (userProfile.educacion && userProfile.educacion.length > 0) puntos++;

    return Math.round((puntos / maxPuntos) * 100);
  }

  private getDefaultEstadoPerfil(): EstadoPerfil {
    return {
      completitud: 0,
      seccionesPendientes: [],
      documentosVencidos: 0,
      ultimaActualizacion: new Date(),
      puntajeCompletitud: 0
    };
  }

  private getDefaultAccionesRapidas(): AccionRapida[] {
    return [
      {
        id: 'completar-perfil',
        titulo: 'Completar Perfil',
        descripcion: 'Actualiza tu información profesional',
        icono: 'fa-user-edit',
        ruta: '/dashboard/perfil',
        urgente: false,
        tipo: TipoAccion.PERFIL,
        visible: true
      }
    ];
  }

  private getDefaultDashboardData(): DashboardData {
    return {
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
  }
}
