import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, tap, switchMap, catchError } from 'rxjs/operators';

import { Card } from '@shared/interfaces/concurso/card.interface';
import { RecentConcurso } from '@shared/interfaces/concurso/recent-concurso.interface';
import { InscripcionState } from '@core/models/inscripcion/inscripcion-state.enum';
import { ConcursosService } from '@core/services/concursos/concursos.service';
import { InscriptionService } from '@core/services/inscripcion/inscription.service';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  constructor(
    private concursosService: ConcursosService,
    private inscriptionService: InscriptionService
  ) {}

  getDashboardCards(): Observable<Card[]> {
    console.log('[DashboardService] Iniciando obtención de cards...');

    return this.concursosService.getConcursos().pipe(
      map((concursos: unknown) => {
        console.log('[DashboardService] Concursos obtenidos:', concursos);
        const concursosArray = concursos as Record<string, unknown>[];
        const concursosActivos = concursosArray.filter(c => c['status'] === 'ACTIVE').length;
        const proximosAVencer = concursosArray.filter(c => {
          const fechaFin = new Date(c['endDate'] as string);
          const hoy = new Date();
          const diasRestantes = Math.ceil((fechaFin.getTime() - hoy.getTime()) / (1000 * 3600 * 24));
          return diasRestantes <= 7 && diasRestantes > 0 && c['status'] === 'ACTIVE';
        }).length;

        const cards: Card[] = [
          {
            title: 'Concursos Activos',
            count: concursosActivos,
            icon: 'fa-gavel',
            color: '#10b981',
          },
          {
            title: 'Mis Postulaciones',
            count: 0,
            icon: 'fa-file-alt',
            color: '#3b82f6',
          },
          {
            title: 'Próximos a Vencer',
            count: proximosAVencer,
            icon: 'fa-clock',
            color: '#f59e0b',
          },
        ];
        return cards;
      }),
      switchMap(cards => {
        console.log('[DashboardService] Obteniendo inscripciones para actualizar cards');
        return this.inscriptionService.inscriptions.pipe(
          map((inscriptions: unknown) => {
            console.log('[DashboardService] Inscripciones recibidas:', inscriptions);
            const inscriptionsArray = inscriptions as Record<string, unknown>[];

            // Filtrar postulaciones activas (incluyendo pendientes, pero excluyendo canceladas, rechazadas y no inscritas)
            const postulacionesActivas = inscriptionsArray.filter(p => {
              const estado = (p['state'] as string | undefined)?.toUpperCase();
              console.log('[DashboardService] Estado de postulación:', estado, 'ID:', p['id']);

              if (!estado) {
                console.log('[DashboardService] Estado no definido, considerando como inactiva');
                return false;
              }

              // Estados que deben contarse como postulaciones activas
              const estadosActivos = [
                InscripcionState.PENDING.toUpperCase(),   // Inscripción pendiente de validación
                InscripcionState.APPROVED.toUpperCase(),  // Inscripción aprobada
                InscripcionState.IN_PROCESS.toUpperCase(), // Inscripción en proceso
                'PENDING',   // Variantes de pendiente
                'PENDIENTE',
                'APPROVED',  // Variantes de aprobado
                'APROBADA',
                'APROBADO',
                'INSCRIPTO',
                'IN_PROCESS', // Variantes de en proceso
                'EN_PROCESO'
              ];

              const esActiva = estadosActivos.includes(estado);
              console.log('[DashboardService] ¿Postulación activa?:', esActiva, 'ID:', p['id'], 'Estado:', estado);

              return esActiva;
            });

            console.log('[DashboardService] Postulaciones activas:', postulacionesActivas);
            cards[1].count = postulacionesActivas.length;
            console.log('[DashboardService] Cards actualizados:', cards);
            return cards;
          })
        );
      }),
      tap(cards => console.log('[DashboardService] Cards finales:', cards))
    );
  }

  getRecentConcursos(): Observable<RecentConcurso[]> {
    console.log('[DashboardService] Obteniendo concursos recientes...');

    return this.concursosService.getConcursos().pipe(
      map((concursos: unknown) => {
        const concursosArray = concursos as Record<string, unknown>[];
        // Ordenar por fecha de inicio, más recientes primero
        const recentConcursos = concursosArray
          .sort((a, b) => {
            const dateA = new Date(a['startDate'] as string);
            const dateB = new Date(b['startDate'] as string);
            return dateB.getTime() - dateA.getTime();
          })
          .slice(0, 5)
          .map(concurso => ({
            id: (concurso['id'] as number | string).toString(),
            titulo: concurso['title'] as string,
            fecha: typeof concurso['startDate'] === 'string'
              ? concurso['startDate'] as string
              : (concurso['startDate'] as Date).toISOString().split('T')[0],
            estado: concurso['status'] as string
          }));

        console.log('[DashboardService] Concursos recientes obtenidos:', recentConcursos);
        return recentConcursos;
      }),
      catchError(error => {
        console.error('[DashboardService] Error al obtener concursos recientes:', error);
        return of([]);
      })
    );
  }

  private mapStatus(status: string): string {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return 'Activo';
      case 'PENDING':
        return 'Pendiente';
      case 'CLOSED':
        return 'Cerrado';
      case 'FINISHED':
        return 'Finalizado';
      default:
        return 'Desconocido';
    }
  }
}
