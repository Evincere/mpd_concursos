import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomButtonComponent } from '../custom-button/custom-button.component';
import { Router } from '@angular/router';

export interface DesarrolloConfig {
  titulo: string;
  subtitulo: string;
  descripcion?: string;
  imagen: string;
  mensajeHumor: string;
  colorTema: string;
  iconoPrincipal: string;
  caracteristicasFuturas?: string[];
  emailContacto?: string;
}

@Component({
  selector: 'app-en-desarrollo',
  standalone: true,
  imports: [CommonModule, CustomButtonComponent],
  template: `
    <div class="desarrollo-container" [style.--color-tema]="config.colorTema">
      <!-- Header con animación -->
      <div class="desarrollo-header">
        <div class="icono-principal">
          <i [class]="'fas ' + config.iconoPrincipal" aria-hidden="true"></i>
        </div>
        <h1 class="titulo-principal">{{ config.titulo }}</h1>
        <p class="subtitulo">{{ config.subtitulo }}</p>
      </div>

      <!-- Imagen central con efecto glassmorphism -->
      <div class="imagen-container">
        <div class="imagen-frame">
          <img [src]="config.imagen" [alt]="config.titulo" class="imagen-desarrollo">
          <div class="imagen-overlay">
            <div class="construccion-badge">
              <i class="fas fa-hard-hat" aria-hidden="true"></i>
              <span>En Construcción</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Mensaje con humor -->
      <div class="mensaje-humor">
        <div class="humor-bubble">
          <i class="fas fa-smile-wink humor-icon" aria-hidden="true"></i>
          <p class="humor-text">{{ config.mensajeHumor }}</p>
        </div>
      </div>

      <!-- Descripción -->
      <div class="descripcion-section" *ngIf="config.descripcion">
        <p class="descripcion-text">{{ config.descripcion }}</p>
      </div>

      <!-- Email de contacto -->
      <div class="contacto-section" *ngIf="config.emailContacto">
        <div class="contacto-card">
          <i class="fas fa-envelope contacto-icon" aria-hidden="true"></i>
          <div class="contacto-info">
            <h3 class="contacto-titulo">¿Necesitas asistencia?</h3>
            <p class="contacto-descripcion">Contáctanos para cualquier consulta o soporte técnico</p>
            <a [href]="'mailto:' + config.emailContacto" class="contacto-email">
              {{ config.emailContacto }}
            </a>
          </div>
        </div>
      </div>

      <!-- Características futuras -->
      <div class="caracteristicas-section" *ngIf="config.caracteristicasFuturas && config.caracteristicasFuturas.length > 0">
        <h3 class="caracteristicas-titulo">
          <i class="fas fa-rocket" aria-hidden="true"></i>
          ¿Qué viene en el futuro?
        </h3>
        <div class="caracteristicas-grid">
          <div class="caracteristica-item" *ngFor="let caracteristica of config.caracteristicasFuturas; let i = index">
            <div class="caracteristica-numero">{{ i + 1 }}</div>
            <span class="caracteristica-texto">{{ caracteristica }}</span>
          </div>
        </div>
      </div>

      <!-- Botones de acción -->
      <div class="acciones-section">
        <app-custom-button
          color="primary"
          variant="primary"
          icon="fa-arrow-left"
          label="Volver al Dashboard"
          (buttonClick)="volverDashboard()">
        </app-custom-button>
      </div>

      <!-- Elementos decorativos animados -->
      <div class="decoracion-elementos">
        <div class="elemento-flotante elemento-1">
          <i class="fas fa-code" aria-hidden="true"></i>
        </div>
        <div class="elemento-flotante elemento-2">
          <i class="fas fa-laptop-code" aria-hidden="true"></i>
        </div>
        <div class="elemento-flotante elemento-3">
          <i class="fas fa-coffee" aria-hidden="true"></i>
        </div>
        <div class="elemento-flotante elemento-4">
          <i class="fas fa-lightbulb" aria-hidden="true"></i>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./en-desarrollo.component.scss']
})
export class EnDesarrolloComponent {
  @Input() config!: DesarrolloConfig;

  constructor(private router: Router) {}

  volverDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
