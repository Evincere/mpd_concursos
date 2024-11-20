import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatChipsModule } from '@angular/material/chips';
import { RouterLink } from '@angular/router';
import { MatBadgeModule } from '@angular/material/badge';

@Component({
  selector: 'app-postulaciones',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatChipsModule,
    RouterLink,
    MatBadgeModule
  ],
  templateUrl: './postulaciones.component.html',
  styleUrls: ['./postulaciones.component.scss']
})
export class PostulacionesComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  
  dataSource!: MatTableDataSource<any>;
  displayedColumns: string[] = ['concurso', 'cargo', 'dependencia', 'fechaPostulacion', 'estado', 'acciones'];

  postulaciones: any[] = [
    {
      id: 1,
      concurso: 'Concurso para Defensor Público',
      cargo: 'Defensor Público',
      dependencia: 'Defensoría Pública',
      fechaPostulacion: new Date('2024-03-15'),
      estado: 'Pendiente'
    },
    {
      id: 2,
      concurso: 'Concurso para Fiscal',
      cargo: 'Fiscal',
      dependencia: 'Ministerio Público',
      fechaPostulacion: new Date('2024-03-10'),
      estado: 'Aprobada'
    },
    {
      id: 3,
      concurso: 'Concurso para Juez',
      cargo: 'Juez',
      dependencia: 'Poder Judicial',
      fechaPostulacion: new Date('2024-03-05'),
      estado: 'Rechazada'
    },
    {
      id: 4,
      concurso: 'Concurso para Secretario Judicial',
      cargo: 'Secretario Judicial',
      dependencia: 'Corte Superior de Justicia',
      fechaPostulacion: new Date('2024-03-18'),
      estado: 'Pendiente'
    },
    {
      id: 5,
      concurso: 'Concurso para Asistente Legal',
      cargo: 'Asistente Legal',
      dependencia: 'Ministerio Público',
      fechaPostulacion: new Date('2024-03-12'),
      estado: 'Aprobada'
    },
    {
      id: 6,
      concurso: 'Concurso para Especialista Legal',
      cargo: 'Especialista Legal',
      dependencia: 'Poder Judicial',
      fechaPostulacion: new Date('2024-02-28'),
      estado: 'Rechazada'
    },
    {
      id: 7,
      concurso: 'Concurso para Asistente en Función Fiscal',
      cargo: 'Asistente en Función Fiscal',
      dependencia: 'Ministerio Público',
      fechaPostulacion: new Date('2024-03-20'),
      estado: 'Pendiente'
    },
    {
      id: 8,
      concurso: 'Concurso para Especialista en Derecho Tributario',
      cargo: 'Especialista en Derecho Tributario',
      dependencia: 'Poder Judicial',
      fechaPostulacion: new Date('2024-03-25'),
      estado: 'Pendiente'
    },
    {
      id: 9,
      concurso: 'Concurso para Asesor Jurídico',
      cargo: 'Asesor Jurídico',
      dependencia: 'Ministerio Público',
      fechaPostulacion: new Date('2024-03-30'),
      estado: 'Pendiente'
    },
    {
      id: 10,
      concurso: 'Concurso para Especialista en Derecho Laboral',
      cargo: 'Especialista en Derecho Laboral',
      dependencia: 'Poder Judicial',
      fechaPostulacion: new Date('2024-03-22'),
      estado: 'Pendiente'
    },
    {
      id: 11,
      concurso: 'Concurso para Especialista en Derecho Civil',
      cargo: 'Especialista en Derecho Civil',
      dependencia: 'Poder Judicial',
      fechaPostulacion: new Date('2024-03-27'),
      estado: 'Pendiente'
    },
    {
      id: 12,
      concurso: 'Concurso para Especialista en Derecho Penal',
      cargo: 'Especialista en Derecho Penal',
      dependencia: 'Poder Judicial',
      fechaPostulacion: new Date('2024-03-31'),
      estado: 'Pendiente'
    }
  ];

  constructor() {
    this.dataSource = new MatTableDataSource(this.postulaciones);
  }

  ngOnInit(): void {
    // Inicialización si es necesaria
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    
    // Configurar los textos en español del paginador
    this.paginator._intl.itemsPerPageLabel = 'Items por página';
    this.paginator._intl.nextPageLabel = 'Siguiente';
    this.paginator._intl.previousPageLabel = 'Anterior';
    this.paginator._intl.getRangeLabel = (page: number, pageSize: number, length: number) => {
      if (length === 0 || pageSize === 0) {
        return `0 de ${length}`;
      }
      length = Math.max(length, 0);
      const startIndex = page * pageSize;
      const endIndex = startIndex < length ? 
        Math.min(startIndex + pageSize, length) : 
        startIndex + pageSize;
      return `${startIndex + 1} - ${endIndex} de ${length}`;
    };
  }

  verDetalle(id: number): void {
    console.log('Ver detalle de postulación:', id);
  }
}
