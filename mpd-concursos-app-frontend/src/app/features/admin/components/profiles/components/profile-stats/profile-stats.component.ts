import { Component, OnInit, Input, SimpleChanges, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ProfileStats } from '@core/services/admin/admin-profiles.service';

@Component({
  selector: 'app-profile-stats',
  templateUrl: './profile-stats.component.html',
  styleUrls: ['./profile-stats.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatDividerModule,
    MatTooltipModule
  ]
})
export class ProfileStatsComponent implements OnInit, OnChanges {
  @Input() stats: ProfileStats | null = null;
  
  completionPercentage = 0;
  documentTypes: { type: string, count: number, percentage: number }[] = [];
  professionalTitles: { title: string, count: number, percentage: number }[] = [];
  statusDistribution: { status: string, count: number, percentage: number }[] = [];

  

  ngOnInit(): void {
    this.processStats();
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['stats']) {
      this.processStats();
    }
  }
  
  processStats(): void {
    if (!this.stats) return;
    
    // Calcular porcentaje de perfiles completos
    this.completionPercentage = this.stats.totalProfiles > 0 ? 
      (this.stats.completeProfiles / this.stats.totalProfiles) * 100 : 0;
    
    // Procesar tipos de documentos
    this.documentTypes = Object.entries(this.stats.byDocumentType).map(([type, count]) => {
      const percentage = this.stats?.totalProfiles ? (count / this.stats.totalProfiles) * 100 : 0;
      return { type, count, percentage };
    });
    
    // Ordenar por cantidad (descendente)
    this.documentTypes.sort((a, b) => b.count - a.count);
    
    // Procesar títulos profesionales
    this.professionalTitles = Object.entries(this.stats.byProfessionalTitle).map(([title, count]) => {
      const percentage = this.stats?.totalProfiles ? (count / this.stats.totalProfiles) * 100 : 0;
      return { title, count, percentage };
    });
    
    // Ordenar por cantidad (descendente)
    this.professionalTitles.sort((a, b) => b.count - a.count);
    
    // Procesar distribución por estado
    this.statusDistribution = Object.entries(this.stats.byStatus).map(([status, count]) => {
      const percentage = this.stats?.totalProfiles ? (count / this.stats.totalProfiles) * 100 : 0;
      return { status, count, percentage };
    });
  }
  
  getDocumentTypeText(type: string): string {
    switch (type) {
      case 'DNI': return 'DNI';
      case 'TITULO': return 'Título Universitario';
      case 'CERTIFICADO_ANTECEDENTES': return 'Certificado de Antecedentes Penales';
      case 'CURRICULUM': return 'Curriculum Vitae';
      case 'MATRICULA': return 'Matrícula Profesional';
      default: return type;
    }
  }
  
  getDocumentIcon(type: string): string {
    switch (type) {
      case 'DNI': return 'badge';
      case 'TITULO': return 'school';
      case 'CERTIFICADO_ANTECEDENTES': return 'gavel';
      case 'CURRICULUM': return 'description';
      case 'MATRICULA': return 'card_membership';
      default: return 'insert_drive_file';
    }
  }
  
  getStatusText(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'Activo';
      case 'INACTIVE': return 'Inactivo';
      case 'BLOCKED': return 'Bloqueado';
      default: return status;
    }
  }
  
  getStatusClass(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'status-active';
      case 'INACTIVE': return 'status-inactive';
      case 'BLOCKED': return 'status-blocked';
      default: return '';
    }
  }
  
  getStatusIcon(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'check_circle';
      case 'INACTIVE': return 'cancel';
      case 'BLOCKED': return 'block';
      default: return 'help';
    }
  }
  
  formatPercentage(percentage: number): string {
    return percentage.toFixed(1) + '%';
  }
}
