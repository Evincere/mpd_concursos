import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AdminProfilesService, UserProfile } from '@core/services/admin/admin-profiles.service';

@Component({
  selector: 'app-profile-detail-dialog',
  templateUrl: './profile-detail-dialog.component.html',
  styleUrls: ['./profile-detail-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ]
})
export class ProfileDetailDialogComponent implements OnInit, OnDestroy {
  profile: UserProfile | null = null;
  isLoading = true;
  activeTab = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private profilesService: AdminProfilesService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<ProfileDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { profileId: string }
  ) { }

  ngOnInit(): void {
    this.loadProfileData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProfileData(): void {
    this.isLoading = true;

    this.profilesService.getProfileById(this.data.profileId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile) => {
          this.profile = profile;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error cargando perfil:', error);
          this.snackBar.open('Error al cargar los datos del perfil', 'Cerrar', { duration: 3000 });
          this.isLoading = false;
        }
      });
  }

  getFullName(): string {
    if (!this.profile) return '';
    return `${this.profile.lastName}, ${this.profile.firstName}`;
  }

  getInitials(): string {
    if (!this.profile) return '';
    return `${this.profile.firstName.charAt(0)}${this.profile.lastName.charAt(0)}`.toUpperCase();
  }

  getStatusClass(): string {
    if (!this.profile) return '';

    switch (this.profile.status) {
      case 'ACTIVE': return 'status-active';
      case 'INACTIVE': return 'status-inactive';
      case 'BLOCKED': return 'status-blocked';
      default: return '';
    }
  }

  getStatusText(): string {
    if (!this.profile) return '';

    switch (this.profile.status) {
      case 'ACTIVE': return 'Activo';
      case 'INACTIVE': return 'Inactivo';
      case 'BLOCKED': return 'Bloqueado';
      default: return this.profile.status;
    }
  }

  formatDate(date?: string): string {
    if (!date) return 'No especificado';
    return new Date(date).toLocaleDateString();
  }

  formatDateTime(date?: string): string {
    if (!date) return 'No especificado';
    return new Date(date).toLocaleString();
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

  getVerificationStatus(verified: boolean): string {
    return verified ? 'Verificado' : 'Pendiente de verificación';
  }

  getVerificationClass(verified: boolean): string {
    return verified ? 'verified' : 'pending';
  }

  getThemeText(theme?: string): string {
    if (!theme) return 'No especificado';

    switch (theme) {
      case 'light': return 'Claro';
      case 'dark': return 'Oscuro';
      case 'system': return 'Sistema';
      default: return theme;
    }
  }

  getLanguageText(language?: string): string {
    if (!language) return 'No especificado';

    switch (language) {
      case 'es': return 'Español';
      case 'en': return 'Inglés';
      default: return language;
    }
  }

  hasAddress(): boolean {
    return !!(this.profile?.address?.street);
  }

  hasCentroDeVida(): boolean {
    return !!(this.profile?.centroDeVida?.street);
  }

  getFormattedAddress(address?: unknown): string {
    if (!address) return 'No especificado';

    const addr = address as Record<string, unknown>;

    let parts = [];
    if (addr['street']) parts.push(addr['street']);
    if (addr['number']) parts.push(addr['number']);

    let addressLine = parts.join(' ');

    if (addr['floor'] && addr['apartment']) {
      addressLine += `, Piso ${addr['floor']}, Depto ${addr['apartment']}`;
    } else if (addr['floor']) {
      addressLine += `, Piso ${addr['floor']}`;
    } else if (addr['apartment']) {
      addressLine += `, Depto ${addr['apartment']}`;
    }

    parts = [];
    if (addr['city']) parts.push(addr['city']);
    if (addr['province']) parts.push(addr['province']);
    if (addr['postalCode']) parts.push(`(${addr['postalCode']})`);

    const cityLine = parts.join(', ');

    return addressLine + (cityLine ? `\n${cityLine}` : '');
  }

  openMap(address: unknown): void {
    if (!address) return;

    const addr = address as Record<string, unknown>;
    let query = '';

    if (addr['coordinates'] &&
        typeof addr['coordinates'] === 'object' &&
        (addr['coordinates'] as Record<string, unknown>)['lat'] &&
        (addr['coordinates'] as Record<string, unknown>)['lng']) {

      const coords = addr['coordinates'] as Record<string, unknown>;
      query = `${coords['lat']},${coords['lng']}`;
    } else {
      const parts = [];
      if (addr['street']) parts.push(addr['street']);
      if (addr['number']) parts.push(addr['number']);
      if (addr['city']) parts.push(addr['city']);
      if (addr['province']) parts.push(addr['province']);
      if (addr['country']) parts.push(addr['country']);

      query = parts.join(', ');
    }

    if (query) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank');
    }
  }

  openDocument(document: unknown): void {
    if (document && typeof document === 'object') {
      const doc = document as Record<string, unknown>;
      if (doc['url']) {
        window.open(doc['url'] as string, '_blank');
      }
    }
  }
}
