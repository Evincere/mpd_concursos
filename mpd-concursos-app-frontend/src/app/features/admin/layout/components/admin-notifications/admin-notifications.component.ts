import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';

interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: Date;
  read: boolean;
  link?: string;
}

@Component({
  selector: 'app-admin-notifications',
  templateUrl: './admin-notifications.component.html',
  styleUrls: ['./admin-notifications.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatDividerModule
  ]
})
export class AdminNotificationsComponent implements OnInit {
  notifications: AdminNotification[] = [];

  // Evento para cerrar el panel de notificaciones
  closeNotifications(): void {
    // Emitir evento o llamar a un servicio para cerrar el panel
    // En una implementación real, esto podría emitir un evento al componente padre
    console.log('Cerrando panel de notificaciones');
    // Aquí se podría emitir un evento si fuera necesario
  }

  ngOnInit(): void {
    // Cargar notificaciones de ejemplo (en una implementación real, esto vendría de un servicio)
    this.loadMockNotifications();
  }

  markAsRead(notification: AdminNotification): void {
    notification.read = true;
  }

  markAllAsRead(): void {
    this.notifications.forEach(notification => {
      notification.read = true;
    });
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'info': return 'info';
      case 'warning': return 'warning';
      case 'error': return 'error';
      case 'success': return 'check_circle';
      default: return 'notifications';
    }
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
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
      return date.toLocaleDateString();
    }
  }

  private loadMockNotifications(): void {
    const now = new Date();

    this.notifications = [
      {
        id: '1',
        title: 'Nueva inscripción pendiente',
        message: 'Juan Pérez ha completado su inscripción y está pendiente de revisión.',
        type: 'info',
        timestamp: new Date(now.getTime() - 5 * 60 * 1000), // 5 minutos atrás
        read: false,
        link: '/admin/inscripciones/pendientes'
      },
      {
        id: '2',
        title: 'Documento rechazado',
        message: 'Se ha rechazado un documento de María López. Se requiere revisión.',
        type: 'warning',
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 horas atrás
        read: false,
        link: '/admin/documentos'
      },
      {
        id: '3',
        title: 'Concurso finalizado',
        message: 'El concurso "Defensor Público" ha finalizado. Revise los resultados.',
        type: 'success',
        timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 día atrás
        read: true,
        link: '/admin/concursos/listado'
      },
      {
        id: '4',
        title: 'Error en el sistema',
        message: 'Se ha detectado un error en el módulo de exámenes. Contacte al soporte técnico.',
        type: 'error',
        timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 días atrás
        read: true
      },
      {
        id: '5',
        title: 'Nuevo usuario registrado',
        message: 'Carlos Gómez se ha registrado en el sistema.',
        type: 'info',
        timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 días atrás
        read: true,
        link: '/admin/usuarios'
      }
    ];
  }
}
