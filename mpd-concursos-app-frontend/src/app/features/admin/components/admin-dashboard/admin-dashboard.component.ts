import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterModule } from '@angular/router';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  description: string;
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule
  ]
})
export class AdminDashboardComponent implements OnInit {
  menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'dashboard',
      route: '/admin/dashboard',
      description: 'Vista general del sistema'
    },
    {
      label: 'Usuarios',
      icon: 'people',
      route: '/admin/usuarios',
      description: 'Gestión de usuarios del sistema'
    },
    {
      label: 'Exámenes',
      icon: 'assignment',
      route: '/admin/examenes',
      description: 'Administración de exámenes'
    },
    {
      label: 'Reportes',
      icon: 'assessment',
      route: '/admin/reportes',
      description: 'Reportes y estadísticas'
    },
    {
      label: 'Configuración',
      icon: 'settings',
      route: '/admin/configuracion',
      description: 'Configuración del sistema'
    }
  ];

  // Estadísticas para el dashboard
  stats = {
    totalUsuarios: 1245,
    usuariosNuevos: 87,
    examenesActivos: 12,
    examenesCompletados: 342
  };

  // Actividad reciente
  actividadReciente = [
    { tipo: 'usuario', accion: 'registro', usuario: 'María López', fecha: new Date(2023, 5, 15, 10, 30) },
    { tipo: 'examen', accion: 'creación', usuario: 'Admin', examen: 'Examen de Derecho Civil', fecha: new Date(2023, 5, 14, 14, 45) },
    { tipo: 'examen', accion: 'finalización', usuario: 'Juan Pérez', examen: 'Examen de Procedimiento', fecha: new Date(2023, 5, 14, 9, 15) },
    { tipo: 'usuario', accion: 'actualización', usuario: 'Carlos Gómez', fecha: new Date(2023, 5, 13, 16, 20) },
    { tipo: 'sistema', accion: 'backup', usuario: 'Sistema', fecha: new Date(2023, 5, 13, 1, 0) }
  ];

  constructor(private router: Router) { }

  ngOnInit(): void {
    // Aquí se podrían cargar datos reales del backend
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  getTipoIcono(tipo: string): string {
    switch (tipo) {
      case 'usuario': return 'person';
      case 'examen': return 'assignment';
      case 'sistema': return 'computer';
      default: return 'info';
    }
  }

  getAccionTexto(accion: string): string {
    switch (accion) {
      case 'registro': return 'se registró';
      case 'creación': return 'creó';
      case 'finalización': return 'finalizó';
      case 'actualización': return 'actualizó su perfil';
      case 'backup': return 'realizó copia de seguridad';
      default: return accion;
    }
  }
}
