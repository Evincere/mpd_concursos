import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule, Router } from '@angular/router';

import { Examen, TipoExamen, EstadoExamen } from '@shared/interfaces/examen/examen.interface';

@Component({
  selector: 'app-examen-detalle',
  templateUrl: './examen-detalle.component.html',
  styleUrls: ['./examen-detalle.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatListModule,
    MatTooltipModule,
    RouterModule
  ]
})
export class ExamenDetalleComponent implements OnInit {
  examen: Examen = {
    id: '1',
    titulo: 'Examen Técnico Jurídico 2024',
    tipo: TipoExamen.TECNICO_JURIDICO,
    fechaInicio: '2024-03-15T10:00:00',
    fechaFin: '2024-03-15T12:00:00',
    estado: EstadoExamen.PENDIENTE,
    descripcion: `Este examen evaluará conocimientos jurídicos generales necesarios para el desempeño en el Ministerio Público de la Defensa.

    Temas principales:
    - Derecho Constitucional
    - Derecho Penal
    - Derecho Procesal
    - Derechos Humanos

    Instrucciones importantes:
    - Lea cuidadosamente cada pregunta antes de responder
    - No se permite consultar material durante el examen
    - Responda todas las preguntas, no hay penalización por respuestas incorrectas`,
    duracion: 120,
    puntajeMaximo: 100,
    intentosPermitidos: 1,
    intentosRealizados: 0,
    requisitos: [
      'Documento de identidad válido',
      'Conexión estable a internet',
      'Cámara web funcionando',
      'Ambiente silencioso y bien iluminado'
    ],
    reglasExamen: [
      'No se permite consultar material externo',
      'La cámara debe permanecer encendida',
      'No se permiten interrupciones',
      'Tiempo límite estricto'
    ],
    materialesPermitidos: [
      'Constitución Nacional',
      'Código Penal',
      'Código Procesal Penal'
    ]
  };

  constructor(private router: Router) {}

  ngOnInit(): void {}

  obtenerClaseEstado(): string {
    const clases = {
      [EstadoExamen.PENDIENTE]: 'estado-pendiente',
      [EstadoExamen.EN_CURSO]: 'estado-en-curso',
      [EstadoExamen.COMPLETADO]: 'estado-completado',
      [EstadoExamen.VENCIDO]: 'estado-vencido'
    };
    return clases[this.examen.estado];
  }

  obtenerClaseTipo(): string {
    const clases = {
      [TipoExamen.TECNICO_JURIDICO]: 'tipo-juridico',
      [TipoExamen.TECNICO_ADMINISTRATIVO]: 'tipo-administrativo',
      [TipoExamen.SERVICIOS_AUXILIARES]: 'tipo-auxiliar'
    };
    return clases[this.examen.tipo];
  }

  iniciarExamen(): void {
    this.router.navigate([`/dashboard/examenes/${this.examen.id}/rendir`]);
  }
}
