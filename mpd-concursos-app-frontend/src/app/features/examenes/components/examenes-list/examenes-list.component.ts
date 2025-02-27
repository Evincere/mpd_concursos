import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { RouterLink } from '@angular/router';
// Cambiamos la importación para asegurarnos de usar la correcta
import { Examen, TipoExamen, ESTADO_EXAMEN } from '@shared/interfaces/examen/examen.interface';
import { SecurityViolationType } from '@core/interfaces/security/security-violation.interface';
import { ExamenesService } from '@core/services/examenes/examenes.service';

@Component({
  selector: 'app-examenes-list',
  templateUrl: './examenes-list.component.html',
  styleUrls: ['./examenes-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonToggleModule,
    RouterLink
  ]
})
export class ExamenesListComponent implements OnInit {
  readonly ESTADO_EXAMEN = ESTADO_EXAMEN;
  examenes: Examen[] = [];
  searchText: string = '';
  estadoFilter: string = 'TODOS';

  constructor(private examenesService: ExamenesService) {}

  ngOnInit(): void {
    this.cargarExamenes();
  }

  // Método de ayuda para verificar si el examen puede iniciarse
  puedeIniciarExamen(examen: Examen): boolean {
    // Solo se puede iniciar si está disponible (los exámenes anulados nunca estarán disponibles)
    return examen.estado === ESTADO_EXAMEN.DISPONIBLE;
  }

  // Método de ayuda para verificar si el examen está anulado
  esExamenAnulado(examen: Examen): boolean {
    // Verificación estricta del estado
    const estadoNormalizado = String(examen.estado || '').toUpperCase().trim();
    const esAnulado = estadoNormalizado === 'ANULADO';
    
    console.log(`[ExamenesListComponent] Verificación de estado anulado para examen ${examen.id}:`, {
      estadoOriginal: examen.estado,
      estadoNormalizado,
      esAnulado,
      comparacionDirecta: examen.estado === ESTADO_EXAMEN.ANULADO
    });
    
    return esAnulado || estadoNormalizado.includes('ANULADO');
  }

  cargarExamenes(): void {
    this.examenesService.getExamenes().subscribe(examenes => {
      this.examenes = examenes;
    });
  }

  examenesFiltrados(): Examen[] {
    return this.examenes.filter(examen => {
      // Filtro por texto de búsqueda (título o descripción)
      const matchesSearch = this.searchText ? 
        examen.titulo.toLowerCase().includes(this.searchText.toLowerCase()) || 
        (examen.descripcion?.toLowerCase().includes(this.searchText.toLowerCase()) ?? false) : 
        true;
      
      // Filtro por estado
      const matchesEstado = this.estadoFilter === 'TODOS' ? 
        true : 
        examen.estado === this.estadoFilter;
      
      return matchesSearch && matchesEstado;
    });
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case ESTADO_EXAMEN.DISPONIBLE:
        return 'estado-disponible';
      case ESTADO_EXAMEN.EN_CURSO:
        return 'estado-en-curso';
      case ESTADO_EXAMEN.FINALIZADO:
        return 'estado-finalizado';
      case ESTADO_EXAMEN.ANULADO:
        return 'estado-anulado';
      default:
        return '';
    }
  }

  getEstadoLabel(estado: string): string {
    switch (estado) {
      case ESTADO_EXAMEN.DISPONIBLE:
        return 'Disponible';
      case ESTADO_EXAMEN.EN_CURSO:
        return 'En Curso';
      case ESTADO_EXAMEN.FINALIZADO:
        return 'Finalizado';
      case ESTADO_EXAMEN.ANULADO:
        return 'Anulado';
      default:
        return estado;
    }
  }

  getTipoClass(tipo: string): string {
    switch (tipo) {
      case TipoExamen.TECNICO_JURIDICO:
        return 'tipo-juridico';
      case TipoExamen.TECNICO_ADMINISTRATIVO:
        return 'tipo-administrativo';
      case TipoExamen.PSICOLOGICO:
        return 'tipo-psicologico';
      default:
        return '';
    }
  }

  getInfraccionIcono(tipo: SecurityViolationType): string {
    const iconos: Partial<Record<SecurityViolationType, string>> = {
      FULLSCREEN_EXIT: 'fullscreen_exit',
      FULLSCREEN_DENIED: 'block',
      TAB_SWITCH: 'tab',
      KEYBOARD_SHORTCUT: 'keyboard',
      CLIPBOARD_OPERATION: 'content_copy',
      INACTIVITY_TIMEOUT: 'timer_off',
      NETWORK_VIOLATION: 'wifi_off',
      SUSPICIOUS_BEHAVIOR: 'report_problem',
      TIME_MANIPULATION: 'access_time',
      TIME_DRIFT: 'update',
      SUSPICIOUS_ANSWER: 'help_outline',
      ANSWER_TOO_FAST: 'flash_on',
      ANSWER_TOO_SLOW: 'hourglass_empty',
      SUSPICIOUS_PATTERN: 'analytics',
      POST_INCIDENT_VALIDATION_FAILED: 'error_outline',
      FULLSCREEN_REQUIRED: 'screen_lock_landscape',
      FULLSCREEN_WARNING: 'warning'
    };
    
    return iconos[tipo] || 'error';
  }

  getInfraccionLabel(tipo: SecurityViolationType): string {
    const labels: Record<SecurityViolationType, string> = {
      FULLSCREEN_EXIT: 'Salida no autorizada del modo pantalla completa',
      FULLSCREEN_DENIED: 'Acceso a pantalla completa denegado intencionalmente',
      TAB_SWITCH: 'Cambio a otra pestaña o aplicación durante el examen',
      KEYBOARD_SHORTCUT: 'Uso de atajos de teclado no permitidos',
      CLIPBOARD_OPERATION: 'Intento de copiar/pegar contenido no autorizado',
      INACTIVITY_TIMEOUT: 'Sesión abandonada por tiempo prolongado',
      NETWORK_VIOLATION: 'Intento de acceso a recursos de red no autorizados',
      SUSPICIOUS_BEHAVIOR: 'Comportamiento sospechoso detectado durante el examen',
      TIME_MANIPULATION: 'Intento de manipulación del tiempo del sistema',
      TIME_DRIFT: 'Desincronización grave del tiempo del sistema',
      SUSPICIOUS_ANSWER: 'Patrón de respuestas con indicios de trampa',
      ANSWER_TOO_FAST: 'Respuestas ingresadas con velocidad sospechosa',
      ANSWER_TOO_SLOW: 'Tiempo de respuesta excedido significativamente',
      SUSPICIOUS_PATTERN: 'Patrón de comportamiento sospechoso detectado',
      POST_INCIDENT_VALIDATION_FAILED: 'Validación posterior al incidente fallida',
      FULLSCREEN_REQUIRED: 'Negativa a utilizar el modo pantalla completa requerido',
      FULLSCREEN_WARNING: 'Múltiples intentos de salir del modo pantalla completa'
    };
    return labels[tipo] || 'Violación de seguridad no especificada';
  }

  // Método para controlar la visibilidad del botón "Iniciar Examen"
  mostrarBotonIniciarExamen(examen: Examen): boolean {
    // Primera verificación: si está anulado, nunca mostrar el botón
    if (this.esExamenAnulado(examen)) {
      console.log(`[ExamenesListComponent] Botón oculto - Examen ${examen.id} está anulado`);
      return false;
    }

    // Segunda verificación: solo mostrar si está explícitamente DISPONIBLE
    const estaDisponible = String(examen.estado).toUpperCase().trim() === String(ESTADO_EXAMEN.DISPONIBLE).toUpperCase().trim();
    
    console.log(`[ExamenesListComponent] Verificación de disponibilidad para examen ${examen.id}:`, {
      estado: examen.estado,
      estadoEsperado: ESTADO_EXAMEN.DISPONIBLE,
      estaDisponible
    });

    return estaDisponible;
  }
}
