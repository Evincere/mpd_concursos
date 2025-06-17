import { Injectable } from '@angular/core';

/**
 * Configuración para compresión de imágenes
 */
export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  maintainAspectRatio?: boolean;
}

/**
 * Resultado de la compresión de imagen
 */
export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  dimensions: {
    width: number;
    height: number;
  };
}

/**
 * Servicio para compresión y optimización de imágenes
 * 
 * Proporciona funcionalidades para:
 * - Compresión de imágenes manteniendo calidad
 * - Redimensionamiento automático
 * - Conversión de formatos
 * - Optimización para web
 * 
 * @author MPD Development Team
 * @version 1.0.0
 * @since 2025-06
 */
@Injectable({
  providedIn: 'root'
})
export class ImageCompressionService {

  private readonly DEFAULT_OPTIONS: Required<ImageCompressionOptions> = {
    maxWidth: 1024,
    maxHeight: 1024,
    quality: 0.8,
    format: 'jpeg',
    maintainAspectRatio: true
  };

  /**
   * Comprime una imagen según las opciones especificadas
   * 
   * @param file Archivo de imagen a comprimir
   * @param options Opciones de compresión
   * @returns Promise con el resultado de la compresión
   */
  async compressImage(
    file: File, 
    options: ImageCompressionOptions = {}
  ): Promise<CompressionResult> {
    
    const config = { ...this.DEFAULT_OPTIONS, ...options };
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('No se pudo obtener el contexto del canvas'));
        return;
      }
      
      img.onload = () => {
        try {
          // Calcular nuevas dimensiones
          const { width, height } = this.calculateDimensions(
            img.width, 
            img.height, 
            config.maxWidth, 
            config.maxHeight, 
            config.maintainAspectRatio
          );
          
          // Configurar canvas
          canvas.width = width;
          canvas.height = height;
          
          // Dibujar imagen redimensionada
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convertir a blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Error al generar la imagen comprimida'));
                return;
              }
              
              // Crear nuevo archivo
              const compressedFile = new File(
                [blob], 
                this.generateFileName(file.name, config.format),
                { type: `image/${config.format}` }
              );
              
              // Calcular estadísticas
              const compressionRatio = ((file.size - blob.size) / file.size) * 100;
              
              const result: CompressionResult = {
                file: compressedFile,
                originalSize: file.size,
                compressedSize: blob.size,
                compressionRatio: Math.max(0, compressionRatio),
                dimensions: { width, height }
              };
              
              resolve(result);
            },
            `image/${config.format}`,
            config.quality
          );
          
        } catch (error) {
          reject(new Error(`Error al procesar la imagen: ${error}`));
        }
      };
      
      img.onerror = () => {
        reject(new Error('Error al cargar la imagen'));
      };
      
      // Cargar imagen
      img.src = URL.createObjectURL(file);
    });
  }
  
  /**
   * Genera un preview de la imagen como Data URL
   * 
   * @param file Archivo de imagen
   * @param maxSize Tamaño máximo para el preview
   * @returns Promise con el Data URL
   */
  async generatePreview(file: File, maxSize = 200): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('No se pudo obtener el contexto del canvas'));
        return;
      }
      
      img.onload = () => {
        const { width, height } = this.calculateDimensions(
          img.width, 
          img.height, 
          maxSize, 
          maxSize, 
          true
        );
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      
      img.onerror = () => {
        reject(new Error('Error al cargar la imagen para preview'));
      };
      
      img.src = URL.createObjectURL(file);
    });
  }
  
  /**
   * Valida si un archivo es una imagen válida
   * 
   * @param file Archivo a validar
   * @returns Promise que resuelve con true si es válida
   */
  async validateImage(file: File): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      
      img.onload = () => {
        resolve(img.width > 0 && img.height > 0);
      };
      
      img.onerror = () => {
        resolve(false);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }
  
  /**
   * Obtiene las dimensiones de una imagen
   * 
   * @param file Archivo de imagen
   * @returns Promise con las dimensiones
   */
  async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      
      img.onerror = () => {
        reject(new Error('Error al obtener dimensiones de la imagen'));
      };
      
      img.src = URL.createObjectURL(file);
    });
  }
  
  /**
   * Calcula las nuevas dimensiones manteniendo proporción
   */
  private calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number,
    maintainAspectRatio: boolean
  ): { width: number; height: number } {
    
    if (!maintainAspectRatio) {
      return { width: maxWidth, height: maxHeight };
    }
    
    const aspectRatio = originalWidth / originalHeight;
    
    let width = originalWidth;
    let height = originalHeight;
    
    // Redimensionar si excede los límites
    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspectRatio;
    }
    
    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }
    
    return { 
      width: Math.round(width), 
      height: Math.round(height) 
    };
  }
  
  /**
   * Genera un nombre de archivo con la nueva extensión
   */
  private generateFileName(originalName: string, format: string): string {
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    return `${nameWithoutExt}.${format}`;
  }
  
  /**
   * Formatea el tamaño de archivo en formato legible
   * 
   * @param bytes Tamaño en bytes
   * @returns Tamaño formateado
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
