import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, tap, switchMap, catchError } from 'rxjs/operators';

import { Card } from '@shared/interfaces/concurso/card.interface';
import { RecentConcurso } from '@shared/interfaces/concurso/recent-concurso.interface';
import { InscripcionState } from '@core/models/inscripcion/inscripcion-state.enum';
import { ConcursosService } from '@core/services/concursos/concursos.service';
import { InscriptionService } from '@core/services/inscripcion/inscription.service';
import { LoggingService } from '@core/services/logging/logging.service'; // Import LoggingService
import { Contest } from '@shared/interfaces/concurso/concurso.interface'; // Import Contest interface for clarity


@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly LOG_TAG = 'DashboardService'; // Tag for logging

  constructor(
    private concursosService: ConcursosService,
    private inscriptionService: InscriptionService,
    private loggingService: LoggingService // Inject LoggingService
  ) {
    this.loggingService.debug(`[${this.LOG_TAG}] Initializing DashboardService.`, undefined, this.LOG_TAG);
  }

  /**
   * Retrieves the data for the dashboard cards.
   * This involves fetching contest and inscription data.
   * @returns An Observable of an array of Card objects.
   */
  getDashboardCards(): Observable<Card[]> {
    this.loggingService.info(`[${this.LOG_TAG}] Fetching dashboard cards data.`, undefined, this.LOG_TAG);

    // Fetch all contests to calculate "Active Contests" and "Expiring Soon"
    return this.concursosService.getConcursos().pipe(
      map((concursos: Contest[] | any) => { // Assuming getConcursos returns Contest[] or a similar structure
        // Ensure it's an array for consistency
        const concursosArray = Array.isArray(concursos) ? concursos : (concursos?.content || []);
        this.loggingService.debug(`[${this.LOG_TAG}] Received ${concursosArray.length} contests from ConcursosService.`, undefined, this.LOG_TAG);

        // Filter active contests using dynamic status logic
        const concursosActivos = this.calculateActiveContests(concursosArray);
        this.loggingService.debug(`[${this.LOG_TAG}] Calculated active contests with dynamic logic: ${concursosActivos}.`, undefined, this.LOG_TAG);

        // Filter contests expiring soon (within 7 days and still PUBLISHED)
        const proximosAVencer = concursosArray.filter((c: any) => {
          const fechaFin = new Date(c['endDate'] as string);
          const hoy = new Date();
          const diasRestantes = Math.ceil((fechaFin.getTime() - hoy.getTime()) / (1000 * 3600 * 24));
          const esProximoAVencer = diasRestantes <= 7 && diasRestantes > 0 && c['status'] === 'PUBLISHED';

          if (esProximoAVencer) {
            this.loggingService.debug(`[${this.LOG_TAG}] Contest "${c['title']}" is expiring soon (${diasRestantes} days left).`, c, this.LOG_TAG);
          }
          return esProximoAVencer;
        }).length;
        this.loggingService.debug(`[${this.LOG_TAG}] Calculated contests expiring soon: ${proximosAVencer}.`, undefined, this.LOG_TAG);

        // Initial set of cards (My Applications count will be updated later)
        const cards: Card[] = [
          {
            title: 'Concursos Activos',
            count: concursosActivos,
            icon: 'fa-gavel',
            color: '#10b981', // green-500
            description: 'Concursos disponibles para inscripción'
          },
          {
            title: 'Mis Postulaciones',
            count: 0, // This will be updated below with inscription data
            icon: 'fa-file-alt',
            color: '#3b82f6', // blue-500
            description: 'Postulaciones activas y pendientes'
          },
          {
            title: 'Próximos a Vencer',
            count: proximosAVencer,
            icon: 'fa-clock',
            color: '#f59e0b', // amber-500
            description: 'Concursos que cierran en 7 días o menos'
          },
        ];

        this.loggingService.debug(`[${this.LOG_TAG}] Initial dashboard cards created based on contest data.`, cards, this.LOG_TAG);
        return cards;
      }),
      // Use switchMap to fetch inscriptions after initial cards are built
      switchMap(cards => {
        this.loggingService.debug(`[${this.LOG_TAG}] Fetching user inscriptions to update "Mis Postulaciones" card.`, undefined, this.LOG_TAG);
        return this.inscriptionService.getUserInscriptions().pipe(
          map((inscriptionsResponse: any) => {
            const inscriptionsArray = inscriptionsResponse.content || [];
            this.loggingService.debug(`[${this.LOG_TAG}] Received ${inscriptionsArray.length} inscriptions from InscriptionService.`, undefined, this.LOG_TAG);

            // Filter active applications (including pending, excluding cancelled, rejected, and not enrolled)
            const postulacionesActivas = inscriptionsArray.filter((p: any) => {
              const estado = (p['estado'] as string | undefined)?.toUpperCase(); // Use 'estado' from Postulacion interface
              // Log detailed status checking for each application
              this.loggingService.debug(`[${this.LOG_TAG}] Checking application ID: ${p['id']} with status: "${estado}".`, undefined, this.LOG_TAG);

              // If estado is undefined or null, consider it as not active
              if (!estado) {
                this.loggingService.debug(`[${this.LOG_TAG}] Application ID: ${p['id']} has no status, considering as inactive.`, undefined, this.LOG_TAG);
                return false;
              }

              // States that should be counted as active applications
              const estadosActivos = [
                InscripcionState.PENDING.toUpperCase(), // Inscription pending validation
                InscripcionState.APPROVED.toUpperCase(), // Inscription approved
                InscripcionState.ACTIVE.toUpperCase(), // Active inscription (REFACTORING: Standard state)
                'PENDING',    // Variants of pending
                'PENDIENTE',
                'CONFIRMADA', // Legacy confirmed state (treat as pending)
                'APPROVED',   // Variants of approved
                'APROBADA',
                'APROBADO',
                'INSCRIPTO',
                'IN_PROCESS', // Variants of in-process
                'EN_PROCESO',
                'COMPLETED_WITH_DOCS',    // ✅ Completed inscription states
                'COMPLETED_PENDING_DOCS', // ✅ Inscription with pending docs states
                'ACTIVO'                  // ✅ Spanish variant for active
              ];

              const esActiva = estadosActivos.includes(estado);
              this.loggingService.debug(`[${this.LOG_TAG}] Application ID: ${p['id']} is active: ${esActiva}.`, undefined, this.LOG_TAG);
              return esActiva;
            });

            // Update the "Mis Postulaciones" card count
            const updatedCards = cards.map(card => {
              if (card.title === 'Mis Postulaciones') {
                return { ...card, count: postulacionesActivas.length };
              }
              return card;
            });

            this.loggingService.info(`[${this.LOG_TAG}] Dashboard cards updated with inscription data. Mis Postulaciones count: ${postulacionesActivas.length}.`, updatedCards, this.LOG_TAG);
            return updatedCards;
          }),
          catchError(error => {
            // Para usuarios nuevos sin postulaciones, un 404 es esperado y no es un error real
            if (error.status === 404) {
              this.loggingService.debug(`[${this.LOG_TAG}] No inscriptions found for user (expected for new users).`, undefined, this.LOG_TAG);
            } else {
              this.loggingService.error(`[${this.LOG_TAG}] Error fetching user inscriptions for dashboard cards:`, error, this.LOG_TAG);
            }
            // Return original cards if inscription fetching fails, to not block the display
            return of(cards);
          })
        );
      }),
      tap(finalCards => {
        this.loggingService.info(`[${this.LOG_TAG}] Final dashboard cards ready.`, finalCards, this.LOG_TAG);
      }),
      catchError(error => {
        this.loggingService.error(`[${this.LOG_TAG}] Overall error in getDashboardCards pipeline:`, error, this.LOG_TAG);
        // Return an empty array of cards or default values if initial contest fetching fails
        return of([
          { title: 'Concursos Activos', count: 0, icon: 'fa-gavel', color: '#10b981', description: 'Error al cargar' },
          { title: 'Mis Postulaciones', count: 0, icon: 'fa-file-alt', color: '#3b82f6', description: 'Error al cargar' },
          { title: 'Próximos a Vencer', count: 0, icon: 'fa-clock', color: '#f59e0b', description: 'Error al cargar' }
        ]);
      })
    );
  }

  /**
   * Retrieves a list of recent contests.
   * @returns An Observable of an array of RecentConcurso objects.
   */
  getRecentConcursos(): Observable<RecentConcurso[]> {
    this.loggingService.info(`[${this.LOG_TAG}] Fetching recent contests.`, undefined, this.LOG_TAG);
    return this.concursosService.getConcursos().pipe(
      map((concursos: any) => {
        // Convert to array if necessary (assuming getConcursos might return a single item or content property)
        const concursosArray = Array.isArray(concursos) ? concursos : (concursos?.content || []);
        this.loggingService.debug(`[${this.LOG_TAG}] Received ${concursosArray.length} contests for recent list.`, undefined, this.LOG_TAG);

        // Sort by start date, most recent first, then take the top 5
        const recentConcursos = concursosArray
          .sort((a: any, b: any) => {
            const dateA = new Date(a['startDate'] as string);
            const dateB = new Date(b['startDate'] as string);
            return dateB.getTime() - dateA.getTime(); // Descending order
          })
          .slice(0, 5) // Take top 5
          .map((concurso: any) => {
            const mappedConcurso: RecentConcurso = {
              id: (concurso['id'] as number | string).toString(),
              titulo: concurso['title'] as string,
              fecha: typeof concurso['startDate'] === 'string'
                ? concurso['startDate'] as string
                : (concurso['startDate'] as Date).toISOString().split('T')[0], // Format to YYYY-MM-DD
              estado: this.mapStatus(concurso['status'] as string) // Map status to Spanish
            };
            this.loggingService.debug(`[${this.LOG_TAG}] Mapped recent contest:`, mappedConcurso, this.LOG_TAG);
            return mappedConcurso;
          });
        this.loggingService.info(`[${this.LOG_TAG}] Recent contests processed. Count: ${recentConcursos.length}.`, undefined, this.LOG_TAG);
        return recentConcursos;
      }),
      catchError(error => {
        this.loggingService.error(`[${this.LOG_TAG}] Error fetching recent contests:`, error, this.LOG_TAG);
        return of([]); // Return an empty array on error
      })
    );
  }

  /**
   * Maps an English status string to a Spanish equivalent.
   * @param status The status string (e.g., 'ACTIVE', 'PENDING').
   * @returns The mapped Spanish status.
   */
  private mapStatus(status: string): string {
    const normalizedStatus = status.toUpperCase();
    let mapped = '';
    switch (normalizedStatus) {
      case 'PUBLISHED':
        mapped = 'Publicado';
        break;
      case 'ACTIVE':
        mapped = 'Activo';
        break;
      case 'PENDING':
        mapped = 'Pendiente';
        break;
      case 'CLOSED':
        mapped = 'Cerrado';
        break;
      case 'FINISHED':
        mapped = 'Finalizado';
        break;
      case 'DRAFT':
        mapped = 'Borrador';
        break;
      case 'ARCHIVED':
        mapped = 'Archivado';
        break;
      default:
        mapped = 'Desconocido';
        break;
    }
    this.loggingService.debug(`[${this.LOG_TAG}] Mapped status "${status}" to "${mapped}".`, undefined, this.LOG_TAG);
    return mapped;
  }

  /**
   * Calcula concursos realmente activos usando lógica de estados dinámicos
   * Un concurso es activo si está PUBLISHED y tiene inscripciones abiertas
   */
  private calculateActiveContests(concursos: any[]): number {
    const ahora = new Date();

    return concursos.filter((concurso: any) => {
      // Usar estado dinámico calculado por el backend
      const currentStatus = concurso['currentStatus'] || concurso['status'];
      return currentStatus === 'ACTIVE';
    }).length;
  }
}
