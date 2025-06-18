/**
 * CV Preview Component - Optimized CV preview with lazy loading
 * 
 * This component provides a preview of the complete CV with:
 * - Lazy loading of preview data
 * - Print-friendly layout
 * - Export functionality integration
 */

import { 
  Component, 
  OnInit, 
  OnDestroy, 
  ChangeDetectionStrategy,
  inject,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, combineLatest } from 'rxjs';

import { CvStateService, ExperienceCvService, EducationCvService } from '../../../../core/services/cv';
import { Experience, Education, CvData } from '../../../../core/models/cv';

@Component({
  selector: 'app-cv-preview',
  standalone: false, // Part of CvModule
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cv-preview-container">
      
      <!-- Preview Header -->
      <div class="preview-header">
        <div class="header-content">
          <h2 class="preview-title">
            <i class="fas fa-eye" aria-hidden="true"></i>
            Vista Previa del CV
          </h2>
          
          <p class="preview-description">
            Revisa cómo se verá tu currículum antes de exportarlo
          </p>
        </div>
        
        <div class="preview-actions">
          <button class="action-btn print-btn" 
                  (click)="printPreview()"
                  [attr.aria-label]="'Imprimir vista previa'">
            <i class="fas fa-print" aria-hidden="true"></i>
            Imprimir
          </button>
          
          <button class="action-btn export-btn" 
                  (click)="exportToPdf()"
                  [attr.aria-label]="'Exportar a PDF'">
            <i class="fas fa-file-pdf" aria-hidden="true"></i>
            Exportar PDF
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading()" class="loading-state">
        <div class="loading-spinner">
          <i class="fas fa-spinner fa-spin" aria-hidden="true"></i>
        </div>
        <p>Generando vista previa...</p>
      </div>

      <!-- CV Preview Content -->
      <div *ngIf="!isLoading() && cvData()" 
           class="cv-preview-content"
           #previewContent>
        
        <!-- Personal Header -->
        <div class="cv-header">
          <div class="personal-info">
            <h1 class="full-name">{{ getUserFullName() }}</h1>
            <div class="contact-info">
              <div class="contact-item">
                <i class="fas fa-envelope" aria-hidden="true"></i>
                {{ getUserEmail() }}
              </div>
              <div class="contact-item">
                <i class="fas fa-phone" aria-hidden="true"></i>
                {{ getUserPhone() }}
              </div>
              <div class="contact-item">
                <i class="fas fa-map-marker-alt" aria-hidden="true"></i>
                {{ getUserLocation() }}
              </div>
            </div>
          </div>
          
          <div class="cv-stats">
            <div class="stat-item">
              <span class="stat-number">{{ cvData()?.experiences.length || 0 }}</span>
              <span class="stat-label">Experiencias</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ cvData()?.education.length || 0 }}</span>
              <span class="stat-label">Educación</span>
            </div>
          </div>
        </div>

        <!-- Experience Section -->
        <div *ngIf="cvData()?.experiences.length" class="cv-section">
          <h2 class="section-title">
            <i class="fas fa-briefcase" aria-hidden="true"></i>
            Experiencia Laboral
          </h2>
          
          <div class="experience-list">
            <div *ngFor="let experience of sortedExperiences()" 
                 class="experience-item">
              <div class="experience-header">
                <h3 class="position">{{ experience.position }}</h3>
                <div class="company">{{ experience.company }}</div>
                <div class="period">
                  {{ formatDate(experience.startDate) }} - 
                  {{ experience.endDate ? formatDate(experience.endDate) : 'Actual' }}
                </div>
              </div>
              
              <div *ngIf="experience.location" class="location">
                <i class="fas fa-map-marker-alt" aria-hidden="true"></i>
                {{ experience.location }}
              </div>
              
              <div *ngIf="experience.description" 
                   class="description"
                   [innerHTML]="formatDescription(experience.description)">
              </div>
            </div>
          </div>
        </div>

        <!-- Education Section -->
        <div *ngIf="cvData()?.education.length" class="cv-section">
          <h2 class="section-title">
            <i class="fas fa-graduation-cap" aria-hidden="true"></i>
            Educación y Formación
          </h2>
          
          <div class="education-list">
            <div *ngFor="let education of sortedEducation()" 
                 class="education-item">
              <div class="education-header">
                <h3 class="title">{{ education.title }}</h3>
                <div class="institution">{{ education.institution }}</div>
                <div class="period">
                  {{ formatDate(education.startDate) }} - 
                  {{ education.endDate ? formatDate(education.endDate) : 'En progreso' }}
                </div>
              </div>
              
              <div class="education-meta">
                <span class="type-badge" [class]="getEducationTypeClass(education.type)">
                  {{ getEducationTypeLabel(education.type) }}
                </span>
                <span class="status-badge" [class]="getEducationStatusClass(education.status)">
                  {{ getEducationStatusLabel(education.status) }}
                </span>
              </div>
              
              <div *ngIf="education.description" 
                   class="description"
                   [innerHTML]="formatDescription(education.description)">
              </div>
              
              <!-- Scientific Activities -->
              <div *ngIf="education.scientificActivities?.length" 
                   class="scientific-activities">
                <h4>Actividades Científicas</h4>
                <ul>
                  <li *ngFor="let activity of education.scientificActivities">
                    <strong>{{ activity.title }}</strong>
                    <span class="activity-role">({{ getActivityRoleLabel(activity.role) }})</span>
                    <div *ngIf="activity.description" class="activity-description">
                      {{ activity.description }}
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="cv-footer">
          <div class="generation-info">
            Generado el {{ formatDate(new Date()) }} mediante MPD Concursos
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!isLoading() && !cvData()" class="empty-state">
        <div class="empty-icon">
          <i class="fas fa-file-alt" aria-hidden="true"></i>
        </div>
        <h3>No hay información para mostrar</h3>
        <p>Agrega experiencias y educación para generar tu CV</p>
      </div>
    </div>
  `,
  styles: [`
    .cv-preview-container {
      max-width: 1000px;
      margin: 0 auto;
    }

    .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .header-content {
      flex: 1;
    }

    .preview-title {
      margin: 0 0 8px 0;
      font-size: 24px;
      font-weight: 700;
      color: #f9fafb;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .preview-description {
      margin: 0;
      color: #9ca3af;
      font-size: 14px;
    }

    .preview-actions {
      display: flex;
      gap: 12px;
    }

    .action-btn {
      padding: 10px 16px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .print-btn {
      background: rgba(59, 130, 246, 0.2);
      color: #3b82f6;
      border: 1px solid rgba(59, 130, 246, 0.3);
    }

    .print-btn:hover {
      background: rgba(59, 130, 246, 0.3);
      transform: translateY(-1px);
    }

    .export-btn {
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }

    .export-btn:hover {
      background: rgba(239, 68, 68, 0.3);
      transform: translateY(-1px);
    }

    .loading-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      gap: 16px;
      color: #9ca3af;
      text-align: center;
    }

    .loading-spinner {
      font-size: 24px;
      color: #3b82f6;
    }

    .empty-icon {
      font-size: 48px;
      color: #6b7280;
      margin-bottom: 8px;
    }

    .cv-preview-content {
      background: white;
      color: #1f2937;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      font-family: 'Georgia', serif;
      line-height: 1.6;
    }

    .cv-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e5e7eb;
    }

    .personal-info {
      flex: 1;
    }

    .full-name {
      margin: 0 0 12px 0;
      font-size: 32px;
      font-weight: 700;
      color: #111827;
    }

    .contact-info {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .contact-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: #6b7280;
    }

    .contact-item i {
      width: 16px;
      color: #9ca3af;
    }

    .cv-stats {
      display: flex;
      gap: 24px;
    }

    .stat-item {
      text-align: center;
    }

    .stat-number {
      display: block;
      font-size: 24px;
      font-weight: 700;
      color: #3b82f6;
    }

    .stat-label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .cv-section {
      margin-bottom: 32px;
    }

    .section-title {
      margin: 0 0 20px 0;
      font-size: 20px;
      font-weight: 700;
      color: #111827;
      display: flex;
      align-items: center;
      gap: 8px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e5e7eb;
    }

    .section-title i {
      color: #3b82f6;
    }

    .experience-list, .education-list {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .experience-item, .education-item {
      padding-left: 20px;
      border-left: 3px solid #e5e7eb;
      position: relative;
    }

    .experience-item::before, .education-item::before {
      content: '';
      position: absolute;
      left: -6px;
      top: 0;
      width: 9px;
      height: 9px;
      background: #3b82f6;
      border-radius: 50%;
    }

    .experience-header, .education-header {
      margin-bottom: 8px;
    }

    .position, .title {
      margin: 0 0 4px 0;
      font-size: 16px;
      font-weight: 600;
      color: #111827;
    }

    .company, .institution {
      font-size: 14px;
      color: #3b82f6;
      font-weight: 500;
      margin-bottom: 4px;
    }

    .period {
      font-size: 13px;
      color: #6b7280;
      font-style: italic;
    }

    .location {
      font-size: 13px;
      color: #6b7280;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .education-meta {
      display: flex;
      gap: 8px;
      margin-bottom: 8px;
    }

    .type-badge, .status-badge {
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .type-badge.university { background: #dbeafe; color: #1e40af; }
    .type-badge.technical { background: #fef3c7; color: #92400e; }
    .type-badge.certification { background: #e0e7ff; color: #5b21b6; }

    .status-badge.completed { background: #d1fae5; color: #065f46; }
    .status-badge.in-progress { background: #dbeafe; color: #1e40af; }

    .description {
      font-size: 14px;
      color: #374151;
      margin-bottom: 12px;
    }

    .scientific-activities {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #f3f4f6;
    }

    .scientific-activities h4 {
      margin: 0 0 8px 0;
      font-size: 14px;
      font-weight: 600;
      color: #111827;
    }

    .scientific-activities ul {
      margin: 0;
      padding-left: 16px;
    }

    .scientific-activities li {
      margin-bottom: 6px;
      font-size: 13px;
    }

    .activity-role {
      color: #6b7280;
      font-style: italic;
    }

    .activity-description {
      margin-top: 2px;
      color: #374151;
    }

    .cv-footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
    }

    .generation-info {
      font-size: 12px;
      color: #9ca3af;
    }

    @media print {
      .preview-header {
        display: none;
      }

      .cv-preview-content {
        box-shadow: none;
        padding: 20px;
      }

      .cv-header {
        page-break-after: avoid;
      }

      .cv-section {
        page-break-inside: avoid;
      }

      .experience-item, .education-item {
        page-break-inside: avoid;
      }
    }

    @media (max-width: 768px) {
      .preview-header {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }

      .cv-preview-content {
        padding: 24px;
      }

      .cv-header {
        flex-direction: column;
        gap: 20px;
      }

      .cv-stats {
        justify-content: center;
      }

      .full-name {
        font-size: 24px;
      }

      .contact-info {
        gap: 4px;
      }
    }
  `]
})
export class CvPreviewComponent implements OnInit, OnDestroy {
  
  private readonly cvStateService = inject(CvStateService);
  private readonly experienceService = inject(ExperienceCvService);
  private readonly educationService = inject(EducationCvService);

  // Signals for reactive state management
  private cvData = signal<CvData | null>(null);
  private isLoading = signal<boolean>(true);

  // Computed properties
  sortedExperiences = computed(() => {
    const data = this.cvData();
    if (!data?.experiences) return [];
    
    return [...data.experiences].sort((a, b) => 
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
  });

  sortedEducation = computed(() => {
    const data = this.cvData();
    if (!data?.education) return [];
    
    return [...data.education].sort((a, b) => 
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
  });

  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.loadCvData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCvData() {
    // Get current user ID (this would come from auth service)
    const userId = 'current-user'; // TODO: Get from auth service
    
    // Load both experiences and education
    combineLatest([
      this.experienceService.getByUserId(userId),
      this.educationService.getByUserId(userId)
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: ([experienceResult, educationResult]) => {
        const cvData: CvData = {
          userId,
          experiences: experienceResult.success ? experienceResult.data || [] : [],
          education: educationResult.success ? educationResult.data || [] : [],
          lastUpdated: new Date()
        };
        
        this.cvData.set(cvData);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('[CvPreview] Error loading CV data:', error);
        this.isLoading.set(false);
      }
    });
  }

  printPreview() {
    window.print();
  }

  exportToPdf() {
    // This would integrate with a PDF export service
    console.log('[CvPreview] Export to PDF functionality would be implemented here');
    // For now, just trigger print dialog
    this.printPreview();
  }

  formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long'
    }).format(d);
  }

  formatDescription(description: string): string {
    // Convert line breaks to HTML and apply basic formatting
    return description
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
  }

  getUserFullName(): string {
    // This would come from user profile service
    return 'Usuario de Prueba'; // TODO: Get from user service
  }

  getUserEmail(): string {
    // This would come from user profile service
    return 'usuario@ejemplo.com'; // TODO: Get from user service
  }

  getUserPhone(): string {
    // This would come from user profile service
    return '+54 11 1234-5678'; // TODO: Get from user service
  }

  getUserLocation(): string {
    // This would come from user profile service
    return 'Buenos Aires, Argentina'; // TODO: Get from user service
  }

  getEducationTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'UNIVERSITY_DEGREE': 'Universitario',
      'POSTGRADUATE': 'Posgrado',
      'MASTER_DEGREE': 'Maestría',
      'DOCTORATE': 'Doctorado',
      'TECHNICAL_EDUCATION': 'Técnico',
      'CERTIFICATION': 'Certificación',
      'COURSE': 'Curso'
    };
    return labels[type] || type;
  }

  getEducationTypeClass(type: string): string {
    if (['UNIVERSITY_DEGREE', 'POSTGRADUATE', 'MASTER_DEGREE', 'DOCTORATE'].includes(type)) {
      return 'university';
    }
    if (type === 'TECHNICAL_EDUCATION') {
      return 'technical';
    }
    return 'certification';
  }

  getEducationStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'COMPLETED': 'Completado',
      'IN_PROGRESS': 'En Progreso',
      'SUSPENDED': 'Suspendido',
      'ABANDONED': 'Abandonado'
    };
    return labels[status] || status;
  }

  getEducationStatusClass(status: string): string {
    switch (status) {
      case 'COMPLETED': return 'completed';
      case 'IN_PROGRESS': return 'in-progress';
      default: return '';
    }
  }

  getActivityRoleLabel(role: string): string {
    const labels: { [key: string]: string } = {
      'PRINCIPAL_INVESTIGATOR': 'Investigador Principal',
      'CO_INVESTIGATOR': 'Co-investigador',
      'RESEARCH_ASSISTANT': 'Asistente de Investigación',
      'AUTHOR': 'Autor',
      'CO_AUTHOR': 'Co-autor',
      'PRESENTER': 'Presentador',
      'PARTICIPANT': 'Participante'
    };
    return labels[role] || role;
  }
}

// Import environment
import { environment } from '../../../../../environments/environment';
