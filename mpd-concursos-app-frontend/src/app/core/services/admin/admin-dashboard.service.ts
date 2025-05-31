import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface DashboardStats {
  usuarios: {
    total: number;
    nuevos: number;
    activos: number;
    porRol: Record<string, number>;
  };
  concursos: {
    total: number;
    activos: number;
    proximos: number;
    finalizados: number;
  };
  inscripciones: {
    total: number;
    pendientes: number;
    aprobadas: number;
    rechazadas: number;
  };
  examenes: {
    total: number;
    activos: number;
    completados: number;
    pendientes: number;
  };
  documentos: {
    total: number;
    pendientes: number;
    aprobados: number;
    rechazados: number;
  };
}

export interface ActivityItem {
  id: string;
  tipo: 'usuario' | 'concurso' | 'inscripcion' | 'examen' | 'documento' | 'sistema';
  accion: string;
  usuario: string;
  usuarioId?: string;
  entidadId?: string;
  entidadNombre?: string;
  fecha: Date;
  detalles?: Record<string, unknown>;
}

export interface QuickAccessWidget {
  id: string;
  title: string;
  icon: string;
  count: number;
  route: string;
  color: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminDashboardService {
  private apiUrl = `${environment.apiUrl}/admin/dashboard`;

  constructor(private http: HttpClient) {}


  /**
   * Obtiene las estadísticas para el dashboard
   */
  getStats(): Observable<DashboardStats> {
    // En una implementación real, esto sería una llamada a la API
    // return this.http.get<DashboardStats>(`${this.apiUrl}/stats`).pipe(
    //   catchError(error => {
    //     console.error('Error obteniendo estadísticas del dashboard:', error);
    //     return of(this.getMockStats());
    //   })
    // );

    // Implementación mock para desarrollo
    return of(this.getMockStats());
  }

  /**
   * Obtiene la actividad reciente para el dashboard
   * @param limit Número máximo de elementos a devolver
   * @param tipo Tipo de actividad a filtrar (opcional)
   */
  getRecentActivity(limit = 10, tipo?: 'usuario' | 'concurso' | 'inscripcion' | 'examen' | 'documento' | 'sistema'): Observable<ActivityItem[]> {
    // En una implementación real, esto sería una llamada a la API
    // let url = `${this.apiUrl}/activity?limit=${limit}`;
    // if (tipo) {
    //   url += `&tipo=${tipo}`;
    // }
    // return this.http.get<ActivityItem[]>(url).pipe(
    //   catchError(error => {
    //     console.error('Error obteniendo actividad reciente:', error);
    //     return of(this.getMockActivity(tipo).slice(0, limit));
    //   })
    // );

    // Implementación mock para desarrollo
    return of(this.getMockActivity(tipo).slice(0, limit));
  }

  /**
   * Obtiene los widgets de acceso rápido para el dashboard
   */
  getQuickAccessWidgets(): Observable<QuickAccessWidget[]> {
    // En una implementación real, esto sería una llamada a la API o configuración del usuario
    // return this.http.get<QuickAccessWidget[]>(`${this.apiUrl}/widgets`).pipe(
    //   catchError(error => {
    //     console.error('Error obteniendo widgets de acceso rápido:', error);
    //     return of(this.getMockWidgets());
    //   })
    // );

    // Implementación mock para desarrollo
    return of(this.getMockWidgets());
  }

  /**
   * Genera estadísticas mock para desarrollo
   */
  private getMockStats(): DashboardStats {
    return {
      usuarios: {
        total: 1245,
        nuevos: 87,
        activos: 956,
        porRol: {
          'ROLE_ADMIN': 15,
          'ROLE_USER': 1230
        }
      },
      concursos: {
        total: 48,
        activos: 12,
        proximos: 8,
        finalizados: 28
      },
      inscripciones: {
        total: 3567,
        pendientes: 124,
        aprobadas: 2890,
        rechazadas: 553
      },
      examenes: {
        total: 354,
        activos: 12,
        completados: 342,
        pendientes: 0
      },
      documentos: {
        total: 8976,
        pendientes: 342,
        aprobados: 7890,
        rechazados: 744
      }
    };
  }

  /**
   * Genera actividad reciente mock para desarrollo
   * @param tipo Tipo de actividad a filtrar (opcional)
   */
  private getMockActivity(tipo?: 'usuario' | 'concurso' | 'inscripcion' | 'examen' | 'documento' | 'sistema'): ActivityItem[] {
    const now = new Date();

    const activities: ActivityItem[] = [
      {
        id: '1',
        tipo: 'usuario',
        accion: 'registro',
        usuario: 'María López',
        usuarioId: '123',
        fecha: new Date(now.getTime() - 5 * 60 * 1000) // 5 minutos atrás
      },
      {
        id: '2',
        tipo: 'examen',
        accion: 'creación',
        usuario: 'Admin',
        usuarioId: '1',
        entidadId: '456',
        entidadNombre: 'Examen de Derecho Civil',
        fecha: new Date(now.getTime() - 2 * 60 * 60 * 1000) // 2 horas atrás
      },
      {
        id: '3',
        tipo: 'examen',
        accion: 'finalización',
        usuario: 'Juan Pérez',
        usuarioId: '789',
        entidadId: '457',
        entidadNombre: 'Examen de Procedimiento',
        fecha: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) // 1 día atrás
      },
      {
        id: '4',
        tipo: 'usuario',
        accion: 'actualización',
        usuario: 'Carlos Gómez',
        usuarioId: '101',
        fecha: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) // 2 días atrás
      },
      {
        id: '5',
        tipo: 'sistema',
        accion: 'backup',
        usuario: 'Sistema',
        fecha: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) // 3 días atrás
      },
      {
        id: '6',
        tipo: 'concurso',
        accion: 'publicación',
        usuario: 'Admin',
        usuarioId: '1',
        entidadId: '201',
        entidadNombre: 'Concurso para Defensor Público',
        fecha: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000) // 4 días atrás
      },
      {
        id: '7',
        tipo: 'inscripcion',
        accion: 'aprobación',
        usuario: 'Admin',
        usuarioId: '1',
        entidadId: '301',
        entidadNombre: 'Inscripción de Laura Martínez',
        detalles: { postulante: 'Laura Martínez', concurso: 'Defensor Público' },
        fecha: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) // 5 días atrás
      },
      {
        id: '11',
        tipo: 'inscripcion',
        accion: 'creación',
        usuario: 'María González',
        usuarioId: '102',
        entidadId: '302',
        entidadNombre: 'Inscripción de María González',
        detalles: { postulante: 'María González', concurso: 'Fiscal Adjunto' },
        fecha: new Date(now.getTime() - 3 * 60 * 60 * 1000) // 3 horas atrás
      },
      {
        id: '12',
        tipo: 'inscripcion',
        accion: 'rechazo',
        usuario: 'Admin',
        usuarioId: '1',
        entidadId: '303',
        entidadNombre: 'Inscripción de Carlos Ruiz',
        detalles: { postulante: 'Carlos Ruiz', concurso: 'Asesor Tutelar', motivo: 'Documentación incompleta' },
        fecha: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) // 1 día atrás
      },
      {
        id: '13',
        tipo: 'inscripcion',
        accion: 'actualización',
        usuario: 'Ana López',
        usuarioId: '103',
        entidadId: '304',
        entidadNombre: 'Inscripción de Ana López',
        detalles: { postulante: 'Ana López', concurso: 'Curador Público', cambio: 'Documentos actualizados' },
        fecha: new Date(now.getTime() - 6 * 60 * 60 * 1000) // 6 horas atrás
      },
      {
        id: '8',
        tipo: 'documento',
        accion: 'rechazo',
        usuario: 'Admin',
        usuarioId: '1',
        entidadId: '401',
        entidadNombre: 'Certificado de Antecedentes',
        detalles: { postulante: 'Pedro Sánchez', motivo: 'Documento ilegible' },
        fecha: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000) // 6 días atrás
      },
      {
        id: '9',
        tipo: 'concurso',
        accion: 'finalización',
        usuario: 'Admin',
        usuarioId: '1',
        entidadId: '202',
        entidadNombre: 'Concurso para Fiscal',
        fecha: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // 7 días atrás
      },
      {
        id: '10',
        tipo: 'sistema',
        accion: 'mantenimiento',
        usuario: 'Sistema',
        detalles: { duración: '2 horas', tipo: 'Actualización de base de datos' },
        fecha: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000) // 8 días atrás
      }
    ];

    // Filtrar por tipo si se especifica
    if (tipo) {
      return activities.filter(activity => activity.tipo === tipo);
    }

    return activities;
  }

  /**
   * Genera widgets de acceso rápido mock para desarrollo
   */
  private getMockWidgets(): QuickAccessWidget[] {
    return [
      {
        id: '1',
        title: 'Inscripciones Pendientes',
        icon: 'pending',
        count: 124,
        route: '/admin/inscripciones/pendientes',
        color: '#ff9800',
        description: 'Inscripciones que requieren revisión'
      },
      {
        id: '2',
        title: 'Documentos por Revisar',
        icon: 'description',
        count: 342,
        route: '/admin/documentos',
        color: '#2196f3',
        description: 'Documentos pendientes de validación'
      },
      {
        id: '3',
        title: 'Concursos Activos',
        icon: 'gavel',
        count: 12,
        route: '/admin/concursos/listado',
        color: '#4caf50',
        description: 'Concursos en proceso actualmente'
      },
      {
        id: '4',
        title: 'Usuarios Nuevos',
        icon: 'person_add',
        count: 87,
        route: '/admin/usuarios',
        color: '#9c27b0',
        description: 'Usuarios registrados recientemente'
      }
    ];
  }
}
