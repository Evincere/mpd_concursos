import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

// Custom Components
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';

// Models
import { UserProfile } from '@core/models/perfil.model';

@Component({
  selector: 'app-perfil-cv',
  standalone: true,
  imports: [
    CommonModule,
    CustomButtonComponent
  ],
  template: `
    <div class="cv-container">
      <!-- Action Sidebar -->
      <aside class="cv-sidebar">
        <div class="sidebar-content">
          <div class="action-group">
            <h3>
              <i class="fas fa-briefcase" aria-hidden="true"></i>
              Experiencia Laboral
            </h3>
            <p>Agregue su experiencia profesional para mejorar su perfil</p>
            <app-custom-button
              color="primary"
              icon="fa-plus"
              label="Agregar Experiencia"
              [disabled]="isLoading"
              (buttonClick)="onAddExperience()">
            </app-custom-button>
          </div>

          <div class="action-group">
            <h3>
              <i class="fas fa-graduation-cap" aria-hidden="true"></i>
              Educación
            </h3>
            <p>Registre sus títulos y certificaciones académicas</p>
            <app-custom-button
              color="primary"
              icon="fa-plus"
              label="Agregar Educación"
              [disabled]="isLoading"
              (buttonClick)="onAddEducation()">
            </app-custom-button>
          </div>

          <!-- Loading Indicator -->
          <div *ngIf="isLoading" class="loading-indicator">
            <div class="spinner"></div>
            <span>Procesando...</span>
          </div>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="cv-content">
        <!-- Experience Section -->
        <section class="cv-section">
          <div class="section-header">
            <h2>
              <i class="fas fa-briefcase" aria-hidden="true"></i>
              Experiencia Laboral
            </h2>
            <span class="item-count" *ngIf="experiencias && experiencias.length > 0">
              {{ experiencias.length }} {{ experiencias.length === 1 ? 'experiencia' : 'experiencias' }}
            </span>
          </div>

          <div class="section-content">
              <!-- Experience List -->
              <div *ngIf="experiencias && experiencias.length > 0" class="experience-list">
                <div *ngFor="let exp of experiencias; let i = index" class="experience-item">
                  <div class="experience-header">
                    <div class="experience-title-group">
                      <h3 class="experience-title">{{ getExperienceProperty(exp, 'cargo') || 'Sin cargo especificado' }}</h3>
                      <span class="experience-company">{{ getExperienceProperty(exp, 'empresa') || 'Empresa no especificada' }}</span>
                    </div>
                    <div class="experience-badges">
                      <span *ngIf="getExperienceProperty(exp, 'certificadoId') || getExperienceProperty(exp, 'documentUrl')" 
                            class="document-badge" 
                            title="Tiene certificado adjunto">
                        <i class="fas fa-file-certificate" aria-hidden="true"></i>
                        Certificado
                      </span>
                      <span *ngIf="isCurrentJob(exp)" class="current-badge">
                        <i class="fas fa-clock" aria-hidden="true"></i>
                        Actual
                      </span>
                    </div>
                  </div>

                  <div class="experience-body">
                    <div class="experience-details">
                      <div class="detail-item">
                        <i class="fas fa-calendar" aria-hidden="true"></i>
                        <span class="detail-label">Período:</span>
                        <span class="detail-value">
                          {{ formatDate(getExperienceProperty(exp, 'fechaInicio')) }} - 
                          {{ getExperienceProperty(exp, 'fechaFin') ? formatDate(getExperienceProperty(exp, 'fechaFin')) : 'Actual' }}
                        </span>
                      </div>
                      
                      <div class="detail-item" *ngIf="getExperienceProperty(exp, 'descripcion')">
                        <i class="fas fa-info-circle" aria-hidden="true"></i>
                        <span class="detail-label">Descripción:</span>
                        <span class="detail-value">{{ getExperienceProperty(exp, 'descripcion') }}</span>
                      </div>

                      <div class="detail-item" *ngIf="getExperienceProperty(exp, 'comentario')">
                        <i class="fas fa-comment" aria-hidden="true"></i>
                        <span class="detail-label">Comentarios:</span>
                        <span class="detail-value">{{ getExperienceProperty(exp, 'comentario') }}</span>
                      </div>
                    </div>

                    <div class="experience-actions">
                      <app-custom-button
                        *ngIf="getExperienceProperty(exp, 'certificadoId')"
                        color="primary"
                        variant="stroked"
                        icon="fa-file-pdf"
                        label="Ver certificado"
                        (buttonClick)="viewCertificate(getExperienceProperty(exp, 'certificadoId'))">
                      </app-custom-button>
                      
                      <app-custom-button
                        color="warn"
                        variant="stroked"
                        icon="fa-trash"
                        label="Eliminar"
                        (buttonClick)="onDeleteExperience(i)">
                      </app-custom-button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Empty State -->
              <div *ngIf="!experiencias || experiencias.length === 0" class="empty-state">
                <div class="empty-icon">
                  <i class="fas fa-briefcase" aria-hidden="true"></i>
                </div>
                <h3>No hay experiencia laboral registrada</h3>
                <p>Comience agregando su experiencia profesional para mejorar su perfil</p>
                <app-custom-button
                  color="primary"
                  icon="fa-plus"
                  label="Agregar Primera Experiencia"
                  (buttonClick)="onAddExperience()">
                </app-custom-button>
              </div>
            </div>
        </section>

        <!-- Education Section -->
        <section class="cv-section">
          <div class="section-header">
            <h2>
              <i class="fas fa-graduation-cap" aria-hidden="true"></i>
              Educación
            </h2>
            <span class="item-count" *ngIf="educacionList && educacionList.length > 0">
              {{ educacionList.length }} {{ educacionList.length === 1 ? 'título' : 'títulos' }}
            </span>
          </div>

          <div class="section-content">
              <!-- Education List -->
              <div *ngIf="educacionList && educacionList.length > 0" class="education-list">
                <div *ngFor="let edu of educacionList; let i = index" class="education-item">
                  <div class="education-header">
                    <div class="education-title-group">
                      <h3 class="education-title">{{ getEducationProperty(edu, 'titulo') || getEducationProperty(edu, 'title') || 'Sin título especificado' }}</h3>
                      <span class="education-institution">{{ getEducationProperty(edu, 'institucion') || getEducationProperty(edu, 'institution') || 'Institución no especificada' }}</span>
                    </div>
                    <div class="education-badges">
                      <span class="status-badge" [ngClass]="getEducationStatus(edu)">
                        <i class="fas" [ngClass]="getEducationStatusIcon(edu)" aria-hidden="true"></i>
                        {{ getEducationProperty(edu, 'estado') || getEducationProperty(edu, 'status') || 'Estado no especificado' }}
                      </span>
                      <span *ngIf="getEducationProperty(edu, 'documentoPdf')" class="document-badge">
                        <i class="fas fa-file-pdf" aria-hidden="true"></i>
                        Documento
                      </span>
                    </div>
                  </div>

                  <div class="education-body">
                    <div class="education-details">
                      <div class="detail-item">
                        <i class="fas fa-tag" aria-hidden="true"></i>
                        <span class="detail-label">Tipo:</span>
                        <span class="detail-value">{{ getEducationProperty(edu, 'tipo') || getEducationProperty(edu, 'type') || 'No especificado' }}</span>
                      </div>
                      
                      <div class="detail-item" *ngIf="getEducationProperty(edu, 'fechaEmision') || getEducationProperty(edu, 'issueDate')">
                        <i class="fas fa-calendar" aria-hidden="true"></i>
                        <span class="detail-label">Fecha:</span>
                        <span class="detail-value">{{ formatDate(getEducationProperty(edu, 'fechaEmision') || getEducationProperty(edu, 'issueDate')) }}</span>
                      </div>

                      <!-- Dynamic properties based on education type -->
                      <ng-container *ngFor="let detail of getEducationDetails(edu)">
                        <div class="detail-item">
                          <i class="fas fa-info" aria-hidden="true"></i>
                          <span class="detail-label">{{ detail.label }}:</span>
                          <span class="detail-value">{{ detail.value }}</span>
                        </div>
                      </ng-container>
                    </div>

                    <div class="education-actions">
                      <app-custom-button
                        *ngIf="getEducationProperty(edu, 'documentoPdf')"
                        color="primary"
                        variant="stroked"
                        icon="fa-file-pdf"
                        label="Ver documento"
                        (buttonClick)="viewEducationDocument(edu)">
                      </app-custom-button>
                      
                      <app-custom-button
                        color="warn"
                        variant="stroked"
                        icon="fa-trash"
                        label="Eliminar"
                        (buttonClick)="onDeleteEducation(getEducationProperty(edu, 'id') || '')">
                      </app-custom-button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Empty State -->
              <div *ngIf="!educacionList || educacionList.length === 0" class="empty-state">
                <div class="empty-icon">
                  <i class="fas fa-graduation-cap" aria-hidden="true"></i>
                </div>
                <h3>No hay educación registrada</h3>
                <p>Agregue sus títulos y certificaciones para completar su perfil académico</p>
                <app-custom-button
                  color="primary"
                  icon="fa-plus"
                  label="Agregar Primera Educación"
                  (buttonClick)="onAddEducation()">
                </app-custom-button>
              </div>
            </div>
        </section>
      </main>
    </div>
  `,
  styleUrls: ['./perfil-cv.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PerfilCvComponent {
  @Input() userProfile: UserProfile | null = null;
  @Input() experiencias: any[] = [];
  @Input() educacionList: any[] = [];
  @Input() isLoading = false;

  @Output() addExperience = new EventEmitter<void>();
  @Output() addEducation = new EventEmitter<void>();
  @Output() deleteExperience = new EventEmitter<number>();
  @Output() deleteEducation = new EventEmitter<string>();

  onAddExperience(): void {
    this.addExperience.emit();
  }

  onAddEducation(): void {
    this.addEducation.emit();
  }

  onDeleteExperience(index: number): void {
    this.deleteExperience.emit(index);
  }

  onDeleteEducation(id: string): void {
    this.deleteEducation.emit(id);
  }

  getExperienceProperty(exp: any, property: string): any {
    return exp?.get ? exp.get(property)?.value : exp?.[property];
  }

  getEducationProperty(edu: any, property: string): any {
    return edu?.[property];
  }

  isCurrentJob(exp: any): boolean {
    const endDate = this.getExperienceProperty(exp, 'fechaFin');
    return !endDate || endDate === null;
  }

  formatDate(date: string | Date): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
  }

  getEducationStatus(edu: any): string {
    const status = this.getEducationProperty(edu, 'estado') || this.getEducationProperty(edu, 'status');
    if (status === 'finalizado' || status === 'Completado') return 'completed';
    return 'in-progress';
  }

  getEducationStatusIcon(edu: any): string {
    const status = this.getEducationStatus(edu);
    return status === 'completed' ? 'fa-check-circle' : 'fa-clock';
  }

  getEducationDetails(edu: any): {label: string, value: any}[] {
    const details: {label: string, value: any}[] = [];
    const type = this.getEducationProperty(edu, 'tipo') || this.getEducationProperty(edu, 'type');
    
    // Add details based on education type
    if (type?.includes('Carrera') || type?.includes('Título')) {
      const duration = this.getEducationProperty(edu, 'duracionAnios') || this.getEducationProperty(edu, 'durationYears');
      const average = this.getEducationProperty(edu, 'promedio') || this.getEducationProperty(edu, 'average');
      
      if (duration) details.push({ label: 'Duración', value: `${duration} años` });
      if (average) details.push({ label: 'Promedio', value: average });
    }
    
    if (type?.includes('Posgrado') || type?.includes('Especialización') || type?.includes('Maestría') || type?.includes('Doctorado')) {
      const thesis = this.getEducationProperty(edu, 'temaTesis') || this.getEducationProperty(edu, 'thesisTopic');
      if (thesis) details.push({ label: 'Tema de tesis', value: thesis });
    }
    
    if (type?.includes('Diplomatura') || type?.includes('Curso')) {
      const hours = this.getEducationProperty(edu, 'cargaHoraria') || this.getEducationProperty(edu, 'hourlyLoad');
      const evaluation = this.getEducationProperty(edu, 'tuvoEvaluacionFinal') || this.getEducationProperty(edu, 'hadFinalEvaluation');
      
      if (hours) details.push({ label: 'Carga horaria', value: `${hours} horas` });
      if (evaluation !== undefined) details.push({ label: 'Evaluación final', value: evaluation ? 'Sí' : 'No' });
    }
    
    return details;
  }

  viewCertificate(certificateId: string): void {
    // Implementation for viewing certificate
  }

  viewEducationDocument(education: any): void {
    // Implementation for viewing education document
  }
}
