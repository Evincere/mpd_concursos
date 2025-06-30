import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';

import { UserProfileService } from '../../../core/services/user/user-profile.service';
import { AuthService } from '../../../core/services/auth/auth.service';
import { UnifiedNotificationService } from '../unified-notification/unified-notification.service';
import { ImagePreviewDialogComponent, ImagePreviewData, ImagePreviewResult } from '../image-preview-dialog/image-preview-dialog.component';
import { environment } from '../../../../environments/environment';

/**
 * Componente unificado para gestión de imágenes de perfil
 * 
 * Reemplaza todos los componentes anteriores de upload de imagen:
 * - ProfileImageUploadComponent
 * - ProfileImageManagerComponent  
 * - PerfilPersonalInfoComponent (funcionalidad de imagen)
 * 
 * Implementa glassmorphism design system y mejores prácticas UX
 * 
 * @author MPD Development Team
 * @version 2.0.0
 * @since 2025-06
 */
@Component({
  selector: 'app-profile-image-manager',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule
  ],
  template: `
    <div class="profile-image-manager glass-card">
      <!-- Preview Container -->
      <div class="image-preview-container" [class.loading]="isUploading()">
        
        <!-- Current Image or Placeholder -->
        <div class="image-wrapper">
          <img
            *ngIf="currentImageUrl() && !imageLoadError()"
            [src]="currentImageUrl()"
            [alt]="imageAlt"
            class="profile-image"
            (error)="onImageError()"
            (load)="onImageLoad()">

          <div *ngIf="!currentImageUrl() || imageLoadError()" class="image-placeholder">
            <i class="fas fa-user placeholder-icon"></i>
            <span class="placeholder-text">{{ imageLoadError() ? 'Error al cargar imagen' : 'Sin imagen' }}</span>
          </div>
          
          <!-- Loading Overlay -->
          <div *ngIf="isUploading()" class="loading-overlay">
            <i class="fas fa-spinner fa-spin loading-spinner"></i>
            <span class="loading-text">Subiendo imagen...</span>
          </div>
        </div>
        
        <!-- Action Buttons -->
        <div class="action-buttons">
          <button
            mat-raised-button
            class="glass-btn glass-btn-primary"
            (click)="triggerFileInput()"
            [disabled]="isUploading()"
            [attr.aria-label]="currentImageUrl() ? 'Cambiar imagen de perfil' : 'Subir imagen de perfil'">
            <i class="fas {{ currentImageUrl() ? 'fa-edit' : 'fa-camera' }}"></i>
            {{ currentImageUrl() ? 'Cambiar' : 'Subir' }}
          </button>
          
          <button
            *ngIf="currentImageUrl() && showRemoveButton"
            mat-raised-button
            class="glass-btn glass-btn-danger"
            (click)="removeImage()"
            [disabled]="isUploading()"
            aria-label="Eliminar imagen de perfil">
            <i class="fas fa-trash"></i>
            Eliminar
          </button>
        </div>
      </div>
      
      <!-- Hidden File Input -->
      <input
        #fileInput
        type="file"
        accept="image/*"
        (change)="onFileSelected($event)"
        style="display: none"
        aria-hidden="true">
      
      <!-- Upload Info -->
      <div class="upload-info" *ngIf="showUploadInfo">
        <div class="info-item">
          <i class="fas fa-info-circle info-icon"></i>
          <span>Formatos: JPG, PNG, GIF</span>
        </div>
        <div class="info-item">
          <i class="fas fa-hdd info-icon"></i>
          <span>Tamaño máximo: 5MB</span>
        </div>
        <div class="info-item">
          <i class="fas fa-expand-arrows-alt info-icon"></i>
          <span>Se redimensiona automáticamente a 256x256</span>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./profile-image-manager.component.scss']
})
export class ProfileImageManagerComponent {
  
  // === INPUTS ===
  @Input() initialImageUrl: string | null = null;
  @Input() showRemoveButton = true;
  @Input() showUploadInfo = true;
  @Input() imageAlt = 'Imagen de perfil';
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() enablePreview = false; // Temporalmente deshabilitado
  @Input() enableCompression = true;
  
  // === OUTPUTS ===
  @Output() imageUploaded = new EventEmitter<string>();
  @Output() imageRemoved = new EventEmitter<void>();
  @Output() uploadError = new EventEmitter<string>();
  
  // === VIEW CHILD ===
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  
  // === SERVICES ===
  private userProfileService = inject(UserProfileService);
  private authService = inject(AuthService);
  private notificationService = inject(UnifiedNotificationService);
  private dialog = inject(MatDialog);
  
  // === SIGNALS ===
  private _currentImageUrl = signal<string | null>(null);
  private _isUploading = signal(false);
  imageLoadError = signal(false);
  
  // === COMPUTED SIGNALS ===
  currentImageUrl = computed(() => {
    if (this.imageLoadError()) return null;
    const url = this._currentImageUrl() || this.initialImageUrl;
    return this.processImageUrl(url);
  });
  
  isUploading = computed(() => this._isUploading());
  
  // === LIFECYCLE ===
  ngOnInit() {
    this.initializeImage();
  }
  
  // === PUBLIC METHODS ===
  
  /**
   * Trigger file input click
   */
  triggerFileInput(): void {
    if (this.fileInput) {
      this.fileInput.nativeElement.click();
    }
  }
  
  /**
   * Handle file selection
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    // Validate file
    const validationError = this.validateFile(file);
    if (validationError) {
      this.handleError(validationError);
      this.resetFileInput();
      return;
    }

    // Show preview dialog if enabled, otherwise upload directly
    if (this.enablePreview) {
      this.showPreviewDialog(file);
    } else {
      this.uploadImage(file);
    }
  }
  
  /**
   * Remove current image
   */
  removeImage(): void {
    if (!this.currentImageUrl()) return;

    this._isUploading.set(true);

    this.userProfileService.removeProfileImage().subscribe({
      next: () => {
        // Forzar actualización inmediata del estado
        this._currentImageUrl.set(null);
        this.imageLoadError.set(false);
        this.authService.updateProfileImage('');

        // Limpiar caché del navegador forzando re-render
        this.clearImageCache();

        this.imageRemoved.emit();
        this.notificationService.success('Imagen de perfil eliminada exitosamente', 'Éxito');
        this._isUploading.set(false);
      },
      error: (error) => {
        const errorMessage = this.extractErrorMessage(error);
        this.handleError(errorMessage);
        this._isUploading.set(false);
      }
    });
  }
  
  /**
   * Handle image load error
   */
  onImageError(): void {
    this.imageLoadError.set(true);
  }

  /**
   * Handle image load success
   */
  onImageLoad(): void {
    this.imageLoadError.set(false);
  }
  
  // === PRIVATE METHODS ===

  /**
   * Procesa la URL de la imagen para manejar desarrollo vs producción
   */
  private processImageUrl(url: string | null): string | null {
    if (!url) return null;

    // Si ya es una URL completa, devolverla tal como está
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // En desarrollo, convertir URL relativa a absoluta para evitar problemas de proxy
    if (this.isDevelopment() && url.startsWith('/api/')) {
      return `http://localhost:8080${url}`;
    }

    // Si es una URL relativa, devolverla tal como está para que el proxy la maneje
    return url;
  }

  /**
   * Detecta si está en modo desarrollo
   */
  private isDevelopment(): boolean {
    return !environment.production && window.location.hostname === 'localhost';
  }

  /**
   * Show preview dialog for image editing
   */
  private showPreviewDialog(file: File): void {
    const dialogData: ImagePreviewData = {
      file,
      title: 'Vista Previa de Imagen de Perfil',
      showCrop: true,
      showCompression: this.enableCompression,
      compressionOptions: {
        maxWidth: 256,
        maxHeight: 256,
        quality: 0.8
      }
    };

    const dialogRef = this.dialog.open(ImagePreviewDialogComponent, {
      data: dialogData,
      maxWidth: '600px',
      width: '90vw',
      maxHeight: '80vh',
      autoFocus: false,
      disableClose: false,
      panelClass: ['glassmorphism-dialog', 'image-preview-dialog'],
      backdropClass: 'cdk-overlay-dark-backdrop'
    });

    dialogRef.afterClosed().subscribe((result: ImagePreviewResult | null) => {
      if (result) {
        this.uploadImage(result.file);
      }
      this.resetFileInput();
    });
  }

  private initializeImage(): void {
    // Siempre usar la imagen del AuthService para asegurar que es del usuario correcto
    const userInfo = this.authService.userInfo();
    if (userInfo.profileImage) {
      this._currentImageUrl.set(userInfo.profileImage);
    } else if (this.initialImageUrl) {
      this._currentImageUrl.set(this.initialImageUrl);
    } else {
      this._currentImageUrl.set(null);
    }
  }
  
  private validateFile(file: File): string | null {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return 'Por favor, seleccione un archivo de imagen válido (JPG, PNG, GIF)';
    }
    
    // Check file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return 'El archivo es demasiado grande. El tamaño máximo permitido es 5MB';
    }
    
    return null;
  }
  
  private uploadImage(file: File): void {
    this._isUploading.set(true);
    
    this.userProfileService.uploadProfileImage(file).subscribe({
      next: (response) => {
        if (response && (response as any).imageUrl) {
          const imageUrl = (response as any).imageUrl;
          this._currentImageUrl.set(imageUrl);
          this.authService.updateProfileImage(imageUrl);
          this.imageUploaded.emit(imageUrl);
          this.notificationService.success('Imagen de perfil actualizada exitosamente', 'Éxito');
        }
        this._isUploading.set(false);
        this.resetFileInput();
      },
      error: (error) => {
        const errorMessage = this.extractErrorMessage(error);
        this.handleError(errorMessage);
        this._isUploading.set(false);
        this.resetFileInput();
      }
    });
  }
  
  private extractErrorMessage(error: any): string {
    if (error?.error?.error) {
      return error.error.error;
    }
    if (error?.error?.message) {
      return error.error.message;
    }
    if (error?.message) {
      return error.message;
    }
    return 'Error al procesar la imagen. Por favor, intente nuevamente.';
  }
  
  private handleError(message: string): void {
    this.notificationService.error(message, 'Error');
    this.uploadError.emit(message);
  }
  
  private resetFileInput(): void {
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  /**
   * Clear image cache to force immediate UI update
   */
  private clearImageCache(): void {
    // Force Angular change detection
    setTimeout(() => {
      this._currentImageUrl.set(null);
    }, 0);
  }
}
