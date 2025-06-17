import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';

import { ProfileImageManagerComponent } from './profile-image-manager.component';

/**
 * Componente de demostración para ProfileImageManagerComponent
 * 
 * Muestra diferentes configuraciones y usos del componente unificado
 * 
 * @author MPD Development Team
 * @version 1.0.0
 * @since 2025-06
 */
@Component({
  selector: 'app-profile-image-manager-demo',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatDividerModule,
    ProfileImageManagerComponent
  ],
  template: `
    <div class="demo-container glass-layout">
      <div class="glass-container">
        
        <div class="demo-header glass-card">
          <h1>Profile Image Manager - Componente Unificado</h1>
          <p>Este componente reemplaza todos los componentes anteriores de upload de imagen de perfil</p>
        </div>

        <div class="demo-grid glass-grid grid-2">
          
          <!-- Configuración Estándar -->
          <div class="demo-section glass-card">
            <h2>Configuración Estándar</h2>
            <p>Uso típico en páginas de perfil de usuario</p>
            
            <app-profile-image-manager
              [showRemoveButton]="true"
              [showUploadInfo]="true"
              size="medium"
              (imageUploaded)="onImageUploaded($event)"
              (imageRemoved)="onImageRemoved()"
              (uploadError)="onUploadError($event)">
            </app-profile-image-manager>
          </div>

          <!-- Configuración Compacta -->
          <div class="demo-section glass-card">
            <h2>Configuración Compacta</h2>
            <p>Para uso en sidebars o espacios reducidos</p>
            
            <app-profile-image-manager
              [showRemoveButton]="false"
              [showUploadInfo]="false"
              size="small"
              (imageUploaded)="onImageUploaded($event)">
            </app-profile-image-manager>
          </div>

          <!-- Configuración Grande -->
          <div class="demo-section glass-card">
            <h2>Configuración Grande</h2>
            <p>Para páginas de configuración de perfil</p>
            
            <app-profile-image-manager
              [showRemoveButton]="true"
              [showUploadInfo]="true"
              size="large"
              imageAlt="Imagen de perfil del usuario"
              (imageUploaded)="onImageUploaded($event)"
              (imageRemoved)="onImageRemoved()"
              (uploadError)="onUploadError($event)">
            </app-profile-image-manager>
          </div>

          <!-- Con Imagen Inicial -->
          <div class="demo-section glass-card">
            <h2>Con Imagen Inicial</h2>
            <p>Componente con imagen predefinida</p>
            
            <app-profile-image-manager
              [initialImageUrl]="demoImageUrl"
              [showRemoveButton]="true"
              [showUploadInfo]="false"
              size="medium"
              (imageUploaded)="onImageUploaded($event)"
              (imageRemoved)="onImageRemoved()">
            </app-profile-image-manager>
          </div>
        </div>

        <!-- Información de Eventos -->
        <div class="events-section glass-card">
          <h2>Eventos del Componente</h2>
          <mat-divider></mat-divider>
          
          <div class="events-log">
            <div *ngFor="let event of events" class="event-item">
              <span class="event-type" [class]="'event-' + event.type">{{ event.type }}</span>
              <span class="event-message">{{ event.message }}</span>
              <span class="event-time">{{ event.timestamp | date:'HH:mm:ss' }}</span>
            </div>
            
            <div *ngIf="events.length === 0" class="no-events">
              No hay eventos registrados
            </div>
          </div>
          
          <button mat-raised-button class="glass-btn" (click)="clearEvents()">
            Limpiar Eventos
          </button>
        </div>

        <!-- Guía de Migración -->
        <div class="migration-guide glass-card">
          <h2>Guía de Migración</h2>
          <mat-divider></mat-divider>
          
          <div class="migration-content">
            <h3>Componentes Reemplazados:</h3>
            <ul>
              <li><code>ProfileImageUploadComponent</code></li>
              <li><code>ProfileImageManagerComponent</code> (anterior)</li>
              <li><code>PerfilPersonalInfoComponent</code> (funcionalidad de imagen)</li>
            </ul>
            
            <h3>Migración Simple:</h3>
            <pre><code>// ANTES
&lt;app-profile-image-upload (imageUploaded)="onUpload($event)"&gt;&lt;/app-profile-image-upload&gt;

// DESPUÉS
&lt;app-profile-image-manager 
  (imageUploaded)="onUpload($event)"
  (imageRemoved)="onRemove()"
  (uploadError)="onError($event)"&gt;
&lt;/app-profile-image-manager&gt;</code></pre>
            
            <h3>Beneficios:</h3>
            <ul>
              <li>✅ Código unificado sin duplicaciones</li>
              <li>✅ Glassmorphism design system</li>
              <li>✅ Mejor UX con notificaciones toast</li>
              <li>✅ Accesibilidad WCAG AA</li>
              <li>✅ Responsive design</li>
              <li>✅ Manejo robusto de errores</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./profile-image-manager-demo.component.scss']
})
export class ProfileImageManagerDemoComponent {
  
  // Demo image URL for testing
  demoImageUrl = 'https://via.placeholder.com/150/4CAF50/FFFFFF?text=DEMO';
  
  // Events log
  events: Array<{
    type: 'uploaded' | 'removed' | 'error';
    message: string;
    timestamp: Date;
  }> = [];
  
  /**
   * Handle image uploaded event
   */
  onImageUploaded(imageUrl: string): void {
    this.addEvent('uploaded', `Imagen subida: ${imageUrl}`);
  }
  
  /**
   * Handle image removed event
   */
  onImageRemoved(): void {
    this.addEvent('removed', 'Imagen eliminada exitosamente');
  }
  
  /**
   * Handle upload error event
   */
  onUploadError(error: string): void {
    this.addEvent('error', `Error: ${error}`);
  }
  
  /**
   * Add event to log
   */
  private addEvent(type: 'uploaded' | 'removed' | 'error', message: string): void {
    this.events.unshift({
      type,
      message,
      timestamp: new Date()
    });
    
    // Keep only last 10 events
    if (this.events.length > 10) {
      this.events = this.events.slice(0, 10);
    }
  }
  
  /**
   * Clear events log
   */
  clearEvents(): void {
    this.events = [];
  }
}
