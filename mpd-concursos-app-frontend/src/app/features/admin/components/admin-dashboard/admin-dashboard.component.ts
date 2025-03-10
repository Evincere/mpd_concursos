import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent {
  adminModules = [
    {
      title: 'Administración de Preguntas',
      description: 'Crear, editar y asignar preguntas a exámenes',
      icon: 'question_answer',
      route: '/admin/preguntas'
    },
    {
      title: 'Administración de Exámenes',
      description: 'Gestionar exámenes, fechas y configuraciones',
      icon: 'assignment',
      route: '/admin/examenes'
    },
    {
      title: 'Administración de Usuarios',
      description: 'Gestionar usuarios y permisos',
      icon: 'people',
      route: '/admin/usuarios'
    }
  ];
} 