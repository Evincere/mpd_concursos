/**
 * EstadoPerfilWidgetComponent
 * ✅ LIMPIEZA: Estilos y template extraídos a archivos separados
 */

import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { SimpleDashboardData, ProfileCompletionDetails, DocumentStatus } from '@shared/interfaces/dashboard/dashboard-widgets.interface';

@Component({
  selector: 'app-estado-perfil-widget',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ height: '0', opacity: '0', overflow: 'hidden' }),
        animate('300ms ease-in-out', style({ height: '*', opacity: '1' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in-out', style({ height: '0', opacity: '0' }))
      ])
    ])
  ],
  template: `
    <div class="widget-container" *ngIf="dashboardData">
      <div class="widget-header">
        <div class="header-content">
          <i class="fas fa-user-circle widget-icon"></i>
          <h3>Estado del Perfil</h3>
        </div>
        <div class="completion-badge" [class]="getCompletionClass()">
          {{ getGlobalPercentage() }}%
        </div>
      </div>

      <div class="widget-body">
        <!-- Barra de progreso principal -->
        <div class="progress-container">
          <div class="progress-bar">
            <div
              class="progress-fill"
              [style.width.%]="getGlobalPercentage()"
              [class]="getProgressClass()">
            </div>
          </div>
        </div>

        <!-- Resumen de progreso por categorías -->
        <div class="progress-summary" *ngIf="dashboardData.profileDetails">
          <div class="summary-item">
            <span class="summary-label">📋 Datos Personales:</span>
            <span class="summary-value">{{ dashboardData.profileDetails.personalDataPercentage }}%</span>
          </div>
          <div class="summary-divider">|</div>
          <div class="summary-item">
            <span class="summary-label">📄 Documentos:</span>
            <span class="summary-value">{{ getDocumentationPercentage() }}%</span>
          </div>
        </div>

        <!-- Botón para expandir/contraer detalles -->
        <button class="expand-button" (click)="toggleExpanded()" *ngIf="dashboardData.profileDetails">
          <i class="fas" [class.fa-chevron-down]="!isExpanded" [class.fa-chevron-up]="isExpanded"></i>
          {{ isExpanded ? 'Ocultar Detalles' : 'Ver Detalles' }}
        </button>

        <!-- Sección expandible con detalles -->
        <div class="details-section" *ngIf="isExpanded && dashboardData.profileDetails" [@slideInOut]>
          <!-- Documentación Requerida -->
          <div class="documents-section">
            <h4 class="section-title">
              <i class="fas fa-file-medical"></i>
              Documentación Requerida ({{ getRequiredCompletedCount() }}/{{ getRequiredTotalCount() }})
            </h4>
            <div class="documents-list">
              <div
                class="document-item"
                *ngFor="let doc of dashboardData.profileDetails.requiredDocuments"
                [class]="getDocumentClass(doc.status)">
                <i class="fas" [class]="getDocumentIcon(doc.status)"></i>
                <span class="document-name">{{ doc.name }}</span>
                <!-- ✅ CORREGIDO: Eliminado información de vencimiento falsa -->
                <!-- Los documentos no tienen vencimiento inherente, solo plazos de inscripción -->
              </div>
            </div>
          </div>

          <!-- Documentación Opcional -->
          <div class="documents-section" *ngIf="dashboardData.profileDetails.optionalDocuments.length > 0">
            <h4 class="section-title">
              <i class="fas fa-file-plus"></i>
              Documentación Opcional ({{ getOptionalCompletedCount() }}/{{ getOptionalTotalCount() }})
            </h4>
            <div class="documents-list">
              <div
                class="document-item"
                *ngFor="let doc of dashboardData.profileDetails.optionalDocuments"
                [class]="getDocumentClass(doc.status)">
                <i class="fas" [class]="getDocumentIcon(doc.status)"></i>
                <span class="document-name">{{ doc.name }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Mensaje de estado -->
        <div class="status-message">
          <p [class]="getMessageClass()">
            {{ getStatusMessage() }}
          </p>
        </div>

        <!-- Botones de acción -->
        <div class="action-buttons">
          <button
            class="action-button primary"
            (click)="navigateToProfile()"
            [class]="getButtonClass()">
            <i class="fas fa-edit"></i>
            {{ getActionText() }}
          </button>
          <button
            class="action-button secondary"
            (click)="navigateToDocuments()"
            *ngIf="hasDocumentsPending()">
            <i class="fas fa-file-upload"></i>
            Gestionar Documentos
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./estado-perfil-widget.component.scss']
})
export class EstadoPerfilWidgetComponent implements OnInit, OnChanges {
  @Input() dashboardData: SimpleDashboardData | null = null;

  isExpanded = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.logWidgetData('ngOnInit');
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dashboardData']) {
      this.logWidgetData('ngOnChanges');
    }
  }

  private logWidgetData(source: string): void {
    console.log(`🔍 [EstadoPerfilWidget] ${source} - Dashboard data:`, this.dashboardData);
    console.log(`🔍 [EstadoPerfilWidget] ${source} - Profile details:`, this.dashboardData?.profileDetails);
    console.log(`🔍 [EstadoPerfilWidget] ${source} - Global percentage:`, this.getGlobalPercentage());
    console.log(`🔍 [EstadoPerfilWidget] ${source} - Has profile details:`, !!this.dashboardData?.profileDetails);
  }

  // ===== MÉTODOS DE EXPANSIÓN =====

  toggleExpanded(): void {
    this.isExpanded = !this.isExpanded;
  }

  // ===== MÉTODOS DE CÁLCULO DE PORCENTAJES =====

  getGlobalPercentage(): number {
    if (!this.dashboardData?.profileDetails) {
      return this.dashboardData?.profileCompletion || 0;
    }
    return this.dashboardData.profileDetails.globalPercentage;
  }

  getDocumentationPercentage(): number {
    if (!this.dashboardData?.profileDetails) return 0;

    const required = this.dashboardData.profileDetails.requiredDocumentsPercentage;
    const optional = this.dashboardData.profileDetails.optionalDocumentsPercentage;

    // Ponderar: documentos requeridos tienen más peso
    return Math.round((required * 0.7) + (optional * 0.3));
  }

  getCompletionClass(): string {
    const completion = this.getGlobalPercentage();
    if (completion >= 80) return 'high';
    if (completion >= 50) return 'medium';
    return 'low';
  }

  // ===== MÉTODOS DE DOCUMENTOS =====

  getRequiredCompletedCount(): number {
    if (!this.dashboardData?.profileDetails) return 0;
    return this.dashboardData.profileDetails.requiredDocuments.filter(doc => doc.status === 'completed').length;
  }

  getRequiredTotalCount(): number {
    if (!this.dashboardData?.profileDetails) return 0;
    return this.dashboardData.profileDetails.requiredDocuments.length;
  }

  getOptionalCompletedCount(): number {
    if (!this.dashboardData?.profileDetails) return 0;
    return this.dashboardData.profileDetails.optionalDocuments.filter(doc => doc.status === 'completed').length;
  }

  getOptionalTotalCount(): number {
    if (!this.dashboardData?.profileDetails) return 0;
    return this.dashboardData.profileDetails.optionalDocuments.length;
  }

  getDocumentClass(status: string): string {
    switch (status) {
      case 'completed': return 'document-completed';
      case 'pending': return 'document-pending';
      case 'rejected': return 'document-rejected';
      case 'missing': return 'document-missing';
      default: return 'document-missing';
    }
  }

  getDocumentIcon(status: string): string {
    switch (status) {
      case 'completed': return 'fa-check-circle';
      case 'pending': return 'fa-clock';
      case 'rejected': return 'fa-times-circle';
      case 'missing': return 'fa-exclamation-triangle';
      default: return 'fa-exclamation-triangle';
    }
  }

  hasDocumentsPending(): boolean {
    if (!this.dashboardData?.profileDetails) return false;

    const allDocs = [
      ...this.dashboardData.profileDetails.requiredDocuments,
      ...this.dashboardData.profileDetails.optionalDocuments
    ];

    return allDocs.some(doc => doc.status === 'missing' || doc.status === 'rejected');
  }

  // ===== MÉTODOS DE ESTILO =====

  getProgressClass(): string {
    return this.getCompletionClass();
  }

  getMessageClass(): string {
    const baseClass = this.getCompletionClass();
    if (baseClass === 'high') return 'success';
    if (baseClass === 'medium') return 'warning';
    return 'error';
  }

  getButtonClass(): string {
    const completion = this.getGlobalPercentage();
    return completion >= 80 ? 'complete' : 'incomplete';
  }

  // ===== MÉTODOS DE MENSAJE Y NAVEGACIÓN =====

  getStatusMessage(): string {
    if (!this.dashboardData) return 'Cargando información del perfil...';

    const completion = this.getGlobalPercentage();
    const details = this.dashboardData.profileDetails;

    if (completion >= 80) {
      return 'Tu perfil está completo y listo para postulaciones.';
    } else if (completion >= 50) {
      if (details) {
        const missingRequired = details.requiredDocuments.filter(doc => doc.status !== 'completed').length;
        if (missingRequired > 0) {
          return `Faltan ${missingRequired} documento${missingRequired !== 1 ? 's' : ''} requerido${missingRequired !== 1 ? 's' : ''}.`;
        }
      }
      return 'Tu perfil está parcialmente completo. Completa la información restante.';
    } else {
      return 'Tu perfil necesita más información para poder postularte.';
    }
  }

  getActionText(): string {
    const completion = this.getGlobalPercentage();
    return completion >= 80 ? 'Ver Perfil' : 'Completar Perfil';
  }

  navigateToProfile(): void {
    this.router.navigate(['/dashboard/perfil']);
  }

  navigateToDocuments(): void {
    this.router.navigate(['/dashboard/perfil'], { queryParams: { activeTab: 'docs' } });
  }
}
