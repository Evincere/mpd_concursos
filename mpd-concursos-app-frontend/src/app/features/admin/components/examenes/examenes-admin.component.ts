import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ESTADO_EXAMEN, TipoExamen } from '@shared/interfaces/examen/examen.interface';
import { ExamenFormComponent } from './examen-form/examen-form.component';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-examenes-admin',
  templateUrl: './examenes-admin.component.html',
  styleUrls: ['./examenes-admin.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    MatSnackBarModule,
    MatMenuModule
  ]
})
export class ExamenesAdminComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['id', 'titulo', 'tipo', 'estado', 'fechaInicio', 'duracion', 'puntajeMaximo', 'acciones'];
  dataSource = new MatTableDataSource<any>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Datos hardcodeados para la demostración
  examenes = [
    {
      id: '1',
      titulo: 'Examen de Derecho Penal',
      descripcion: 'Evaluación sobre conceptos fundamentales de derecho penal',
      tipo: TipoExamen.TECNICO_JURIDICO,
      estado: ESTADO_EXAMEN.ACTIVO,
      duracion: 120,
      puntajeMaximo: 100,
      fechaInicio: '2023-04-01T10:00:00',
      intentosPermitidos: 1,
      intentosRealizados: 0,
      requisitos: ['Conocimientos básicos de derecho penal'],
      reglasExamen: ['No se permite consultar material', 'Tiempo límite de 2 horas'],
      materialesPermitidos: ['Ninguno']
    },
    {
      id: '2',
      titulo: 'Examen de Procedimientos Administrativos',
      descripcion: 'Evaluación sobre procedimientos administrativos en el ámbito público',
      tipo: TipoExamen.TECNICO_ADMINISTRATIVO,
      estado: ESTADO_EXAMEN.BORRADOR,
      duracion: 90,
      puntajeMaximo: 80,
      fechaInicio: '2023-04-15T14:00:00',
      intentosPermitidos: 2,
      intentosRealizados: 0,
      requisitos: ['Conocimientos de procedimientos administrativos'],
      reglasExamen: ['Se permite consultar normativa', 'Tiempo límite de 1.5 horas'],
      materialesPermitidos: ['Código de Procedimientos Administrativos']
    },
    {
      id: '3',
      titulo: 'Evaluación Psicológica',
      descripcion: 'Evaluación de aptitudes y competencias psicológicas',
      tipo: TipoExamen.PSICOLOGICO,
      estado: ESTADO_EXAMEN.FINALIZADO,
      duracion: 60,
      puntajeMaximo: 50,
      fechaInicio: '2023-03-10T09:00:00',
      intentosPermitidos: 1,
      intentosRealizados: 1,
      requisitos: ['Ninguno'],
      reglasExamen: ['Responder con sinceridad', 'Tiempo límite de 1 hora'],
      materialesPermitidos: ['Ninguno']
    },
    {
      id: '4',
      titulo: 'Examen de Derecho Constitucional',
      descripcion: 'Evaluación sobre principios constitucionales y derechos fundamentales',
      tipo: TipoExamen.TECNICO_JURIDICO,
      estado: ESTADO_EXAMEN.DISPONIBLE,
      duracion: 150,
      puntajeMaximo: 120,
      fechaInicio: '2023-04-20T11:00:00',
      intentosPermitidos: 1,
      intentosRealizados: 0,
      requisitos: ['Conocimientos de derecho constitucional'],
      reglasExamen: ['No se permite consultar material', 'Tiempo límite de 2.5 horas'],
      materialesPermitidos: ['Ninguno']
    },
    {
      id: '5',
      titulo: 'Examen de Gestión Documental',
      descripcion: 'Evaluación sobre procesos de gestión documental y archivo',
      tipo: TipoExamen.TECNICO_ADMINISTRATIVO,
      estado: ESTADO_EXAMEN.ANULADO,
      duracion: 75,
      puntajeMaximo: 60,
      fechaInicio: '2023-03-05T10:00:00',
      intentosPermitidos: 2,
      intentosRealizados: 0,
      requisitos: ['Conocimientos de gestión documental'],
      reglasExamen: ['Se permite consultar manuales', 'Tiempo límite de 1.25 horas'],
      materialesPermitidos: ['Manual de Gestión Documental'],
      motivoAnulacion: {
        fecha: '2023-03-04T15:30:00',
        infracciones: ['CONTENIDO_INCORRECTO'],
        motivo: 'Errores en el contenido de las preguntas'
      }
    }
  ];

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.dataSource.data = this.examenes;
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  crearExamen() {
    const dialogRef = this.dialog.open(ExamenFormComponent, {
      width: '800px',
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Simular creación de examen
        const nuevoExamen = {
          ...result,
          id: (this.examenes.length + 1).toString(),
          estado: ESTADO_EXAMEN.BORRADOR
        };
        this.examenes.push(nuevoExamen);
        this.dataSource.data = this.examenes;
        this.snackBar.open('Examen creado correctamente', 'Cerrar', { duration: 3000 });
      }
    });
  }

  editarExamen(examen: any) {
    const dialogRef = this.dialog.open(ExamenFormComponent, {
      width: '800px',
      data: { mode: 'edit', examen }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Simular actualización de examen
        const index = this.examenes.findIndex(e => e.id === examen.id);
        if (index !== -1) {
          this.examenes[index] = { ...this.examenes[index], ...result };
          this.dataSource.data = this.examenes;
          this.snackBar.open('Examen actualizado correctamente', 'Cerrar', { duration: 3000 });
        }
      }
    });
  }

  cambiarEstado(examen: any, nuevoEstado: ESTADO_EXAMEN) {
    // Simular cambio de estado
    const index = this.examenes.findIndex(e => e.id === examen.id);
    if (index !== -1) {
      this.examenes[index].estado = nuevoEstado;
      this.dataSource.data = this.examenes;
      this.snackBar.open(`Estado del examen cambiado a ${nuevoEstado}`, 'Cerrar', { duration: 3000 });
    }
  }

  eliminarExamen(examen: any) {
    if (confirm(`¿Está seguro de eliminar el examen "${examen.titulo}"?`)) {
      // Simular eliminación
      this.examenes = this.examenes.filter(e => e.id !== examen.id);
      this.dataSource.data = this.examenes;
      this.snackBar.open('Examen eliminado correctamente', 'Cerrar', { duration: 3000 });
    }
  }

  getTipoExamenText(tipo: TipoExamen): string {
    switch (tipo) {
      case TipoExamen.TECNICO_JURIDICO:
        return 'Técnico Jurídico';
      case TipoExamen.TECNICO_ADMINISTRATIVO:
        return 'Técnico Administrativo';
      case TipoExamen.PSICOLOGICO:
        return 'Psicológico';
      default:
        return 'Desconocido';
    }
  }

  getEstadoClass(estado: ESTADO_EXAMEN): string {
    switch (estado) {
      case ESTADO_EXAMEN.ACTIVO:
        return 'estado-activo';
      case ESTADO_EXAMEN.BORRADOR:
        return 'estado-borrador';
      case ESTADO_EXAMEN.FINALIZADO:
        return 'estado-finalizado';
      case ESTADO_EXAMEN.ANULADO:
        return 'estado-anulado';
      case ESTADO_EXAMEN.DISPONIBLE:
        return 'estado-disponible';
      case ESTADO_EXAMEN.EN_CURSO:
        return 'estado-en-curso';
      default:
        return '';
    }
  }
}
