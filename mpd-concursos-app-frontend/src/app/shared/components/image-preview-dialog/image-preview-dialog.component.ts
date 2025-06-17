import { Component, Inject, ViewChild, ElementRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ImageCompressionService, CompressionResult } from '../../services/image-compression.service';

/**
 * Datos para el diálogo de preview de imagen
 */
export interface ImagePreviewData {
  file: File;
  title?: string;
  showCrop?: boolean;
  showCompression?: boolean;
  compressionOptions?: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  };
}

/**
 * Resultado del diálogo de preview
 */
export interface ImagePreviewResult {
  file: File;
  preview: string;
  compressionResult?: CompressionResult;
}

/**
 * Componente de diálogo para preview y edición de imágenes
 * 
 * Funcionalidades:
 * - Preview de imagen antes del upload
 * - Crop básico (centrado)
 * - Compresión automática
 * - Información de archivo
 * 
 * @author MPD Development Team
 * @version 1.0.0
 * @since 2025-06
 */
@Component({
  selector: 'app-image-preview-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatSliderModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="image-preview-dialog glass-dialog">
      
      <!-- Header -->
      <div class="dialog-header">
        <h2 class="dialog-title">{{ data.title || 'Vista Previa de Imagen' }}</h2>
        <button 
          mat-icon-button 
          class="close-button"
          (click)="onCancel()"
          aria-label="Cerrar">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      
      <!-- Content -->
      <div class="dialog-content">
        
        <!-- Image Preview -->
        <div class="image-preview-container">
          <div class="image-wrapper" [style.transform]="'scale(' + zoomLevel() + ')'">
            <img 
              #previewImage
              [src]="imagePreview()"
              [alt]="'Preview de ' + data.file.name"
              class="preview-image"
              (load)="onImageLoad()">
          </div>
          
          <!-- Loading Overlay -->
          <div *ngIf="isProcessing()" class="loading-overlay">
            <mat-spinner diameter="40"></mat-spinner>
            <span>Procesando imagen...</span>
          </div>
        </div>
        
        <!-- Controls -->
        <div class="controls-section" *ngIf="!isProcessing()">
          
          <!-- Zoom Control -->
          <div class="control-group">
            <label class="control-label">
              <mat-icon>zoom_in</mat-icon>
              Zoom
            </label>
            <mat-slider
              class="zoom-slider"
              [min]="0.5"
              [max]="2"
              [step]="0.1"
              [ngModel]="zoomLevel()"
              (ngModelChange)="onZoomChange($event)">
            </mat-slider>
            <span class="zoom-value">{{ (zoomLevel() * 100).toFixed(0) }}%</span>
          </div>
          
          <!-- Compression Quality (if enabled) -->
          <div class="control-group" *ngIf="data.showCompression">
            <label class="control-label">
              <mat-icon>compress</mat-icon>
              Calidad
            </label>
            <mat-slider
              class="quality-slider"
              [min]="0.1"
              [max]="1"
              [step]="0.1"
              [ngModel]="compressionQuality()"
              (ngModelChange)="onQualityChange($event)">
            </mat-slider>
            <span class="quality-value">{{ (compressionQuality() * 100).toFixed(0) }}%</span>
          </div>
        </div>
        
        <!-- File Info -->
        <div class="file-info" *ngIf="!isProcessing()">
          <div class="info-row">
            <span class="info-label">Archivo:</span>
            <span class="info-value">{{ data.file.name }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Tamaño original:</span>
            <span class="info-value">{{ formatFileSize(data.file.size) }}</span>
          </div>
          <div class="info-row" *ngIf="imageDimensions()">
            <span class="info-label">Dimensiones:</span>
            <span class="info-value">{{ imageDimensions()?.width }} × {{ imageDimensions()?.height }}px</span>
          </div>
          <div class="info-row" *ngIf="compressionResult()">
            <span class="info-label">Tamaño comprimido:</span>
            <span class="info-value">{{ formatFileSize(compressionResult()!.compressedSize) }}</span>
          </div>
          <div class="info-row" *ngIf="compressionResult()">
            <span class="info-label">Reducción:</span>
            <span class="info-value compression-ratio">{{ compressionResult()!.compressionRatio.toFixed(1) }}%</span>
          </div>
        </div>
      </div>
      
      <!-- Actions -->
      <div class="dialog-actions">
        <button 
          mat-button 
          class="glass-btn glass-btn-secondary"
          (click)="onCancel()"
          [disabled]="isProcessing()">
          Cancelar
        </button>
        
        <button 
          mat-raised-button 
          class="glass-btn glass-btn-primary"
          (click)="onConfirm()"
          [disabled]="isProcessing() || !imagePreview()">
          <mat-icon>check</mat-icon>
          Usar Imagen
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./image-preview-dialog.component.scss']
})
export class ImagePreviewDialogComponent {
  
  @ViewChild('previewImage') previewImageRef!: ElementRef<HTMLImageElement>;
  
  // === SIGNALS ===
  private _imagePreview = signal<string>('');
  private _isProcessing = signal(true);
  private _zoomLevel = signal(1);
  private _compressionQuality = signal(0.8);
  private _imageDimensions = signal<{ width: number; height: number } | null>(null);
  private _compressionResult = signal<CompressionResult | null>(null);

  ngOnInit() {
    // Initialize component
  }
  
  // === COMPUTED SIGNALS ===
  imagePreview = computed(() => this._imagePreview());
  isProcessing = computed(() => this._isProcessing());
  zoomLevel = computed(() => this._zoomLevel());
  compressionQuality = computed(() => this._compressionQuality());
  imageDimensions = computed(() => this._imageDimensions());
  compressionResult = computed(() => this._compressionResult());
  
  constructor(
    private dialogRef: MatDialogRef<ImagePreviewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ImagePreviewData,
    private imageCompressionService: ImageCompressionService
  ) {
    this.initializePreview();
  }
  
  /**
   * Initialize image preview
   */
  private async initializePreview(): Promise<void> {
    try {
      this._isProcessing.set(true);
      
      // Generate preview
      const preview = await this.imageCompressionService.generatePreview(this.data.file, 400);
      this._imagePreview.set(preview);
      
      // Get dimensions
      const dimensions = await this.imageCompressionService.getImageDimensions(this.data.file);
      this._imageDimensions.set(dimensions);
      
      // Apply compression if enabled
      if (this.data.showCompression) {
        await this.applyCompression();
      }
      
    } catch (error) {
      console.error('Error initializing preview:', error);
    } finally {
      this._isProcessing.set(false);
    }
  }
  
  /**
   * Apply compression with current settings
   */
  private async applyCompression(): Promise<void> {
    try {
      const options = {
        maxWidth: this.data.compressionOptions?.maxWidth || 1024,
        maxHeight: this.data.compressionOptions?.maxHeight || 1024,
        quality: this._compressionQuality(),
        format: 'jpeg' as const
      };
      
      const result = await this.imageCompressionService.compressImage(this.data.file, options);
      this._compressionResult.set(result);
      
    } catch (error) {
      console.error('Error applying compression:', error);
    }
  }
  
  /**
   * Handle zoom level change
   */
  onZoomChange(value: number): void {
    this._zoomLevel.set(value);
  }

  /**
   * Handle compression quality change
   */
  async onQualityChange(value: number): Promise<void> {
    this._compressionQuality.set(value);

    if (this.data.showCompression) {
      this._isProcessing.set(true);
      await this.applyCompression();
      this._isProcessing.set(false);
    }
  }
  
  /**
   * Handle image load event
   */
  onImageLoad(): void {
    // Image loaded successfully
  }
  
  /**
   * Handle cancel action
   */
  onCancel(): void {
    this.dialogRef.close(null);
  }
  
  /**
   * Handle confirm action
   */
  onConfirm(): void {
    const result: ImagePreviewResult = {
      file: this._compressionResult()?.file || this.data.file,
      preview: this._imagePreview(),
      compressionResult: this._compressionResult() || undefined
    };
    
    this.dialogRef.close(result);
  }
  
  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    return this.imageCompressionService.formatFileSize(bytes);
  }
}
