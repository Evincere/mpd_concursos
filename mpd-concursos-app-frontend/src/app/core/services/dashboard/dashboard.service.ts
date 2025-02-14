import { Injectable } from '@angular/core';
import { Observable, combineLatest } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ConcursosService } from '../concursos/concursos.service';
import { InscripcionService } from '../inscripcion/inscripcion.service';
import { Card } from '@shared/interfaces/concurso/card.interface';
import { Concurso } from '@shared/interfaces/concurso/concurso.interface';
import { RecentConcurso } from '@shared/interfaces/concurso/recent-concurso.interface';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  constructor(
    private concursosService: ConcursosService,
    private inscripcionService: InscripcionService
  ) {}

  getDashboardCards(): Observable<Card[]> {
    console.log('[DashboardService] Iniciando obtención de datos para cards...');

    return combineLatest([
      this.concursosService.getConcursos(),
      this.inscripcionService.getInscripcionesUsuario()
    ]).pipe(
      tap(([concursos, inscripciones]) => {
        console.log('[DashboardService] Datos recibidos:');
        console.log('- Concursos:', concursos);
        console.log('- Inscripciones:', inscripciones);
      }),
      map(([concursos, inscripciones]) => {
        const concursosActivos = concursos.filter(c => c.status === 'ACTIVE').length;
        const misPostulaciones = Array.isArray(inscripciones) ? inscripciones.length : 0;
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
            count: misPostulaciones,
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

        console.log('[DashboardService] Cards generadas:', cards);
        return cards;
      })
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
