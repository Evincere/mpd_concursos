import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, tap, switchMap, catchError } from 'rxjs/operators';
import { ConcursosService } from '../concursos/concursos.service';
import { InscriptionService } from '../inscripcion/inscription.service';
import { Card } from '@shared/interfaces/concurso/card.interface';
import { Concurso } from '@shared/interfaces/concurso/concurso.interface';
import { RecentConcurso } from '@shared/interfaces/concurso/recent-concurso.interface';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  constructor(
    private concursosService: ConcursosService,
    private inscriptionService: InscriptionService
  ) {}

  getDashboardCards(): Observable<Card[]> {
    console.log('[DashboardService] Iniciando obtención de datos para cards...');

    return this.concursosService.getConcursos().pipe(
      map(concursos => {
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
        return this.inscriptionService.getUserInscriptions().pipe(
          map(response => {
            cards[1].count = response.content.length;
            return cards;
          }),
          catchError(() => of(cards)) // Si hay error, retornamos las cards sin modificar
        );
      }),
      tap(cards => console.log('[DashboardService] Cards generadas:', cards))
    );
  }

  getRecentConcursos(): Observable<RecentConcurso[]> {
    console.log('[DashboardService] Obteniendo concursos recientes...');

    return this.concursosService.getConcursos().pipe(
      map(concursos => {
        // Ordenar por fecha de inicio, más recientes primero
        const sortedConcursos = [...concursos].sort((a, b) =>
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );

        // Tomar los 5 más recientes
        const recentConcursos = sortedConcursos.slice(0, 5).map(c => ({
          id: c.id,
          titulo: c.title,
          fecha: c.startDate,
          estado: this.mapStatus(c.status)
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
