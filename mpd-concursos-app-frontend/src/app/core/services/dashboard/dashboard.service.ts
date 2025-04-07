import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, tap, switchMap, catchError } from 'rxjs/operators';
import { ConcursosService } from '../concursos/concursos.service';
import { InscriptionService } from '../inscripcion/inscription.service';
import { Card } from '@shared/interfaces/concurso/card.interface';
import { Concurso } from '@shared/interfaces/concurso/concurso.interface';
import { RecentConcurso } from '@shared/interfaces/concurso/recent-concurso.interface';
import { InscripcionState } from '@core/models/inscripcion/inscripcion-state.enum';

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
      map(concursos => {
        console.log('[DashboardService] Concursos obtenidos:', concursos);
        const concursosActivos = concursos.filter(c => c.status === 'ACTIVE').length;
        const proximosAVencer = concursos.filter(c => {
          const fechaFin = new Date(c.endDate);
          const hoy = new Date();
          const diasRestantes = Math.ceil((fechaFin.getTime() - hoy.getTime()) / (1000 * 3600 * 24));
          return diasRestantes <= 7 && diasRestantes > 0 && c.status === 'ACTIVE';
        }).length;

        const cards: Card[] = [
          {
            title: 'Concursos Activos',
            count: concursosActivos,
            icon: 'fa-gavel',
            color: '#4CAF50',
          },
          {
            title: 'Mis Postulaciones',
            count: 0,
            icon: 'fa-file-alt',
            color: '#2196F3',
          },
          {
            title: 'Próximos a Vencer',
            count: proximosAVencer,
            icon: 'fa-clock',
            color: '#FF9800',
          },
        ];
        return cards;
      }),
      switchMap(cards => {
        console.log('[DashboardService] Obteniendo inscripciones para actualizar cards');
        return this.inscriptionService.inscriptions.pipe(
          map(inscriptions => {
            console.log('[DashboardService] Inscripciones recibidas:', inscriptions);
            
            // Filtrar postulaciones activas (no canceladas ni rechazadas)
            const postulacionesActivas = inscriptions.filter(p => {
              const estado = p.state?.toUpperCase();
              console.log('[DashboardService] Estado de postulación:', estado, 'ID:', p.id);
              
              if (!estado) {
                console.log('[DashboardService] Estado no definido, considerando como inactiva');
                return false;
              }

              const estadosInactivos = [
                InscripcionState.CANCELLED.toUpperCase(),
                InscripcionState.REJECTED.toUpperCase(),
                'CANCELED',
                'CANCELLED',
                'CANCELADA',
                'CANCELADO',
                'REJECTED',
                'RECHAZADA',
                'RECHAZADO'
              ];
              
              const esActiva = !estadosInactivos.includes(estado);
              console.log('[DashboardService] ¿Postulación activa?:', esActiva, 'ID:', p.id);
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
      map(concursos => {
        // Ordenar por fecha de inicio, más recientes primero
        const recentConcursos = concursos
          .sort((a, b) => {
            const dateA = new Date(a.startDate);
            const dateB = new Date(b.startDate);
            return dateB.getTime() - dateA.getTime();
          })
          .slice(0, 5)
          .map(concurso => ({
            id: concurso.id.toString(),
            titulo: concurso.title,
            fecha: typeof concurso.startDate === 'string' 
              ? concurso.startDate 
              : concurso.startDate.toISOString().split('T')[0],
            estado: concurso.status
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
