import { Component, OnInit } from '@angular/core';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-reportes-admin',
  templateUrl: './reportes-admin.component.html',
  styleUrls: ['./reportes-admin.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule
  ]
})
export class ReportesAdminComponent implements OnInit {
  // Datos hardcodeados para la demostración
  examenes = [
    {
      id: 1,
      titulo: 'Examen de Derecho Penal',
      tipo: 'multiple_choice',
      fechaInicio: new Date(2023, 4, 10),
      fechaFin: new Date(2023, 4, 20),
      participantes: 120,
      completados: 98,
      aprobados: 85,
      promedioCalificacion: 78.5,
      tiempoPromedio: 45
    },
    {
      id: 2,
      titulo: 'Examen de Derecho Civil',
      tipo: 'desarrollo',
      fechaInicio: new Date(2023, 4, 15),
      fechaFin: new Date(2023, 4, 25),
      participantes: 95,
      completados: 82,
      aprobados: 70,
      promedioCalificacion: 72.3,
      tiempoPromedio: 60
    },
    {
      id: 3,
      titulo: 'Examen de Procedimientos',
      tipo: 'mixto',
      fechaInicio: new Date(2023, 5, 1),
      fechaFin: new Date(2023, 5, 10),
      participantes: 150,
      completados: 130,
      aprobados: 110,
      promedioCalificacion: 81.7,
      tiempoPromedio: 55
    },
    {
      id: 4,
      titulo: 'Examen de Derecho Constitucional',
      tipo: 'multiple_choice',
      fechaInicio: new Date(2023, 5, 5),
      fechaFin: new Date(2023, 5, 15),
      participantes: 110,
      completados: 95,
      aprobados: 88,
      promedioCalificacion: 85.2,
      tiempoPromedio: 40
    }
  ];

  // Datos para gráficos
  barChartData = {
    labels: ['Examen 1', 'Examen 2', 'Examen 3', 'Examen 4'],
    datasets: [
      {
        label: 'Participantes',
        data: [120, 95, 150, 110],
        backgroundColor: 'rgba(54, 162, 235, 0.5)'
      },
      {
        label: 'Aprobados',
        data: [85, 70, 110, 88],
        backgroundColor: 'rgba(75, 192, 192, 0.5)'
      }
    ]
  };

  pieChartData = {
    labels: ['Aprobados', 'Reprobados', 'No completados'],
    datasets: [
      {
        data: [353, 98, 74],
        backgroundColor: [
          'rgba(75, 192, 192, 0.5)',
          'rgba(255, 99, 132, 0.5)',
          'rgba(255, 205, 86, 0.5)'
        ]
      }
    ]
  };

  lineChartData = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May'],
    datasets: [
      {
        label: 'Nuevos usuarios',
        data: [45, 38, 52, 35, 15],
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)'
      }
    ]
  };

  // Datos de usuarios
  usuarios = {
    total: 1245,
    nuevos: {
      enero: 45,
      febrero: 38,
      marzo: 52,
      abril: 35,
      mayo: 15
    },
    porRol: {
      admin: 12,
      evaluador: 28,
      participante: 1205
    },
    activos: 980,
    inactivos: 265
  };

  // Datos de actividad
  actividad = [
    { tipo: 'login', cantidad: 2450, porcentaje: 45 },
    { tipo: 'examen_iniciado', cantidad: 1200, porcentaje: 22 },
    { tipo: 'examen_finalizado', cantidad: 980, porcentaje: 18 },
    { tipo: 'perfil_actualizado', cantidad: 520, porcentaje: 10 },
    { tipo: 'postulacion', cantidad: 280, porcentaje: 5 }
  ];

  selectedExamen: any = null;

  constructor() { }

  ngOnInit(): void {
  }

  getTotalParticipantes(): number {
    return this.examenes.reduce((sum, examen) => sum + examen.participantes, 0);
  }

  getTotalCompletados(): number {
    return this.examenes.reduce((sum, examen) => sum + examen.completados, 0);
  }

  getPromedioCalificacion(): string {
    const promedio = this.examenes.reduce((sum, examen) => sum + examen.promedioCalificacion, 0) / this.examenes.length;
    return promedio.toFixed(1);
  }

  onTabChange(event: MatTabChangeEvent): void {
    // Aquí se podrían cargar datos específicos según la pestaña seleccionada
    console.log('Tab changed to:', event.index);
  }

  exportarReporte(formato: string): void {
    // Aquí se implementaría la lógica para exportar reportes
    console.log(`Exportando reporte en formato ${formato}`);
    // Simular descarga
    setTimeout(() => {
      alert(`Reporte exportado en formato ${formato}`);
    }, 1000);
  }

  selectExamen(examen: any): void {
    this.selectedExamen = examen;
  }

  getTipoExamenText(tipo: string): string {
    switch (tipo) {
      case 'multiple_choice': return 'Opción múltiple';
      case 'desarrollo': return 'Desarrollo';
      case 'mixto': return 'Mixto';
      default: return tipo;
    }
  }
}
