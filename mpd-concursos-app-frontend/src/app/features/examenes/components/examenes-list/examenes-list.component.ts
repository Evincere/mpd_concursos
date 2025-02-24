import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { RouterModule } from '@angular/router';
import { ExamenesService } from '@core/services/examenes/examenes.service';
import { Examen, ESTADO_EXAMEN } from '@shared/interfaces/examen/examen.interface';
import { SecurityViolationType } from '@core/interfaces/security/security-violation.interface';

@Component({
  selector: 'app-examenes-list',
  templateUrl: './examenes-list.component.html',
  styleUrls: ['./examenes-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    RouterModule
  ]
})
export class ExamenesListComponent implements OnInit {
  examenes: Examen[] = [];
  readonly ESTADO_EXAMEN = ESTADO_EXAMEN;

  constructor(private examenesService: ExamenesService) {}

  ngOnInit(): void {
    this.cargarExamenes();
  }

  private cargarExamenes(): void {
    this.examenesService.getExamenes().subscribe(
      examenes => this.examenes = examenes
    );
  }

  getEstadoClass(estado: string): string {
    return `estado-${estado.toLowerCase()}`;
  }

  getEstadoLabel(estado: string): string {
    const labels: { [key: string]: string } = {
      'DISPONIBLE': 'Disponible',
      'EN_CURSO': 'En Curso',
      'FINALIZADO': 'Finalizado',
      'ANULADO': 'Anulado'
    };
    return labels[estado] || estado;
  }

  getInfraccionLabel(tipo: SecurityViolationType): string {
    const labels: Record<SecurityViolationType, string> = {
      FULLSCREEN_EXIT: 'Salida del modo pantalla completa',
      FULLSCREEN_DENIED: 'Modo pantalla completa denegado',
      TAB_SWITCH: 'Cambio de pestaña',
      KEYBOARD_SHORTCUT: 'Atajo de teclado no permitido',
      CLIPBOARD_OPERATION: 'Operación de copiar/pegar',
      INACTIVITY_TIMEOUT: 'Tiempo de inactividad excedido',
      NETWORK_VIOLATION: 'Violación de seguridad de red',
      SUSPICIOUS_BEHAVIOR: 'Comportamiento sospechoso',
      TIME_MANIPULATION: 'Manipulación del tiempo',
      TIME_DRIFT: 'Desincronización del tiempo',
      SUSPICIOUS_ANSWER: 'Respuesta sospechosa',
      ANSWER_TOO_FAST: 'Respuesta demasiado rápida',
      ANSWER_TOO_SLOW: 'Tiempo de respuesta excedido',
      SUSPICIOUS_PATTERN: 'Patrón de respuestas sospechoso',
      POST_INCIDENT_VALIDATION_FAILED: 'Validación post-incidente fallida',
      FULLSCREEN_REQUIRED: 'Pantalla completa requerida',
      FULLSCREEN_WARNING: 'Advertencia de pantalla completa'
    };
    return labels[tipo] || 'Violación de seguridad no especificada';
  }
}
