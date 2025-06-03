import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { ActivityItem } from '../../../../../../core/services/admin/admin-dashboard.service';

@Component({
  selector: 'app-activity-feed',
  templateUrl: './activity-feed.component.html',
  styleUrls: ['./activity-feed.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    RouterModule
  ]
})
export class ActivityFeedComponent {
  @Input() activities: ActivityItem[] = [];
  @Input() title = 'Actividad Reciente';
  @Input() viewAllLink: string | null = null;
  @Input() viewAllLabel = 'Ver toda la actividad';
  @Input() emptyMessage = 'No hay actividad reciente';
  @Input() maxItems = 5;

  getActivityIcon(tipo: string): string {
    switch (tipo) {
      case 'usuario': return 'person';
      case 'concurso': return 'gavel';
      case 'inscripcion': return 'how_to_reg';
      case 'examen': return 'assignment';
      case 'documento': return 'description';
      case 'sistema': return 'computer';
      default: return 'info';
    }
  }

  getActivityIconColor(tipo: string): string {
    switch (tipo) {
      case 'usuario': return '#9c27b0'; // Púrpura
      case 'concurso': return '#4caf50'; // Verde
      case 'inscripcion': return '#ff9800'; // Naranja
      case 'examen': return '#2196f3'; // Azul
      case 'documento': return '#795548'; // Marrón
      case 'sistema': return '#607d8b'; // Gris azulado
      default: return '#9e9e9e'; // Gris
    }
  }

  getActivityText(activity: ActivityItem): string {
    const text = `<strong>${activity.usuario}</strong> `;

    switch (activity.tipo) {
      case 'usuario':
        switch (activity.accion) {
          case 'registro': return text + 'se registró en el sistema';
          case 'actualización': return text + 'actualizó su perfil';
          default: return text + activity.accion;
        }

      case 'concurso':
        switch (activity.accion) {
          case 'creación': return text + `creó el concurso <strong>${activity.entidadNombre}</strong>`;
          case 'publicación': return text + `publicó el concurso <strong>${activity.entidadNombre}</strong>`;
          case 'finalización': return text + `finalizó el concurso <strong>${activity.entidadNombre}</strong>`;
          default: return text + `${activity.accion} el concurso <strong>${activity.entidadNombre}</strong>`;
        }

      case 'inscripcion':
        switch (activity.accion) {
          case 'aprobación': return text + `aprobó la inscripción de <strong>${activity.detalles?.['postulante']}</strong>`;
          case 'rechazo': return text + `rechazó la inscripción de <strong>${activity.detalles?.['postulante']}</strong>`;
          default: return text + `${activity.accion} la inscripción <strong>${activity.entidadNombre}</strong>`;
        }

      case 'examen':
        switch (activity.accion) {
          case 'creación': return text + `creó el examen <strong>${activity.entidadNombre}</strong>`;
          case 'finalización': return text + `finalizó el examen <strong>${activity.entidadNombre}</strong>`;
          default: return text + `${activity.accion} el examen <strong>${activity.entidadNombre}</strong>`;
        }

      case 'documento':
        switch (activity.accion) {
          case 'aprobación': return text + `aprobó el documento <strong>${activity.entidadNombre}</strong>`;
          case 'rechazo': return text + `rechazó el documento <strong>${activity.entidadNombre}</strong>`;
          default: return text + `${activity.accion} el documento <strong>${activity.entidadNombre}</strong>`;
        }

      case 'sistema':
        switch (activity.accion) {
          case 'backup': return text + 'realizó una copia de seguridad';
          case 'mantenimiento': return text + `realizó mantenimiento: <strong>${activity.detalles?.['tipo']}</strong>`;
          default: return text + activity.accion;
        }

      default:
        return text + activity.accion;
    }
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);

    if (diffSec < 60) {
      return 'Ahora mismo';
    } else if (diffMin < 60) {
      return `Hace ${diffMin} ${diffMin === 1 ? 'minuto' : 'minutos'}`;
    } else if (diffHour < 24) {
      return `Hace ${diffHour} ${diffHour === 1 ? 'hora' : 'horas'}`;
    } else if (diffDay < 7) {
      return `Hace ${diffDay} ${diffDay === 1 ? 'día' : 'días'}`;
    } else {
      return new Date(date).toLocaleDateString();
    }
  }
}
