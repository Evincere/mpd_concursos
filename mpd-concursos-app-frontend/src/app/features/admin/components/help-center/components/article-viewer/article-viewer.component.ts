import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HelpArticle } from '@core/services/admin/admin-help.service';
import { HelpFeedbackComponent } from '../help-feedback/help-feedback.component';
import { MarkdownModule } from 'ngx-markdown';

@Component({
  selector: 'app-article-viewer',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HelpFeedbackComponent,
    MarkdownModule
  ],
  templateUrl: './article-viewer.component.html',
  styleUrls: ['./article-viewer.component.scss']
})
export class ArticleViewerComponent implements OnInit {
  @Input() article!: HelpArticle;

  constructor() {
    // Constructor vacío
  }

  ngOnInit(): void {
    // Verificar si el artículo está cargado correctamente
    if (this.article) {
      console.log('Artículo cargado:', this.article.title);
    } else {
      console.warn('No se ha proporcionado un artículo para visualizar');
    }
  }

  /**
   * Obtiene el nombre de un nivel
   * @param level Nivel
   * @returns Nombre del nivel
   */
  getLevelName(level: 'basic' | 'intermediate' | 'advanced'): string {
    switch (level) {
      case 'basic':
        return 'Básico';
      case 'intermediate':
        return 'Intermedio';
      case 'advanced':
        return 'Avanzado';
      default:
        return level;
    }
  }

  /**
   * Obtiene la clase CSS para un nivel
   * @param level Nivel
   * @returns Clase CSS
   */
  getLevelClass(level: 'basic' | 'intermediate' | 'advanced'): string {
    switch (level) {
      case 'basic':
        return 'level-basic';
      case 'intermediate':
        return 'level-intermediate';
      case 'advanced':
        return 'level-advanced';
      default:
        return '';
    }
  }

  /**
   * Formatea una fecha
   * @param date Fecha
   * @returns Fecha formateada
   */
  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }

  /**
   * Obtiene el título de un artículo relacionado
   * @param articleId ID del artículo
   * @returns Título del artículo
   */
  getRelatedArticleTitle(articleId: string): string {
    // En una implementación real, esto obtendría el título del artículo relacionado
    // Por ahora, devolvemos un título genérico
    return `Artículo relacionado (${articleId})`;
  }

  /**
   * Navega hacia atrás
   */
  goBack(): void {
    window.history.back();
  }

  /**
   * Imprime el artículo
   */
  printArticle(): void {
    window.print();
  }

  /**
   * Comparte el artículo
   */
  shareArticle(): void {
    if (navigator.share && this.article) {
      navigator.share({
        title: this.article.title,
        text: this.article.summary,
        url: window.location.href
      }).catch(err => {
        console.log('Error sharing:', err);
        this.fallbackShare();
      });
    } else {
      this.fallbackShare();
    }
  }

  /**
   * Método de respaldo para compartir
   */
  private fallbackShare(): void {
    if (navigator.clipboard && this.article) {
      const shareText = `${this.article.title}\n${this.article.summary}\n${window.location.href}`;
      navigator.clipboard.writeText(shareText).then(() => {
        // Aquí podrías mostrar una notificación de éxito
        console.log('URL copiada al portapapeles');
      }).catch(err => {
        console.error('Error copiando al portapapeles:', err);
      });
    }
  }
}
