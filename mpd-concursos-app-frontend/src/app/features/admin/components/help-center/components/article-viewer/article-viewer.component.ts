import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { HelpArticle } from '@core/services/admin/admin-help.service';
import { HelpFeedbackComponent } from '../help-feedback/help-feedback.component';
import { MarkdownModule } from 'ngx-markdown';

@Component({
  selector: 'app-article-viewer',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatTooltipModule,
    RouterModule,
    HelpFeedbackComponent,
    MarkdownModule
  ],
  template: `
    <div class="article-viewer" *ngIf="article">
      <mat-card class="article-card">
        <mat-card-content>
          <div class="article-meta">
            <div class="article-category">
              <mat-chip color="primary" selected>{{article.category}}</mat-chip>
              <mat-chip *ngIf="article.subcategory" color="accent" selected>{{article.subcategory}}</mat-chip>
            </div>

            <div class="article-level" [ngClass]="getLevelClass(article.level)">
              {{getLevelName(article.level)}}
            </div>
          </div>

          <div class="article-content">
            <markdown [data]="article.content"></markdown>
          </div>

          <mat-divider></mat-divider>

          <div class="article-footer">
            <div class="article-tags">
              <span class="tags-label">Etiquetas:</span>
              <div class="tags-list">
                <mat-chip *ngFor="let tag of article.tags">{{tag}}</mat-chip>
              </div>
            </div>

            <div class="article-info">
              <div class="article-date">
                <mat-icon>update</mat-icon>
                <span>Actualizado: {{formatDate(article.lastUpdated)}}</span>
              </div>

              <div *ngIf="article.author" class="article-author">
                <mat-icon>person</mat-icon>
                <span>Autor: {{article.author}}</span>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Artículos relacionados -->
      <div *ngIf="article.relatedArticles && article.relatedArticles.length > 0" class="related-articles">
        <h3>Artículos relacionados</h3>
        <div class="related-list">
          <a *ngFor="let relatedId of article.relatedArticles"
             class="related-link"
             [routerLink]="['/dashboard/admin/help/article', relatedId]">
            <mat-icon>article</mat-icon>
            <span>{{getRelatedArticleTitle(relatedId)}}</span>
          </a>
        </div>
      </div>

      <!-- Feedback -->
      <app-help-feedback [articleId]="article.id"></app-help-feedback>
    </div>
  `,
  styles: [`
    .article-viewer {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .article-card {
      border-radius: var(--border-radius);
    }

    .article-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;

      .article-category {
        display: flex;
        gap: 0.5rem;
      }

      .article-level {
        padding: 0.25rem 0.75rem;
        border-radius: var(--border-radius-sm);
        font-size: var(--font-size-xs);
        font-weight: 500;

        &.level-basic {
          background-color: var(--color-success-light);
          color: var(--color-success);
        }

        &.level-intermediate {
          background-color: var(--color-info-light);
          color: var(--color-info);
        }

        &.level-advanced {
          background-color: var(--color-warn-light);
          color: var(--color-warn);
        }
      }
    }

    .article-content {
      margin-bottom: 2rem;

      ::ng-deep {
        h1 {
          font-size: 1.75rem;
          font-weight: 500;
          margin: 0 0 1.5rem;
          color: var(--color-text-primary);
        }

        h2 {
          font-size: 1.5rem;
          font-weight: 500;
          margin: 1.5rem 0 1rem;
          color: var(--color-text-primary);
        }

        h3 {
          font-size: 1.25rem;
          font-weight: 500;
          margin: 1.25rem 0 0.75rem;
          color: var(--color-text-primary);
        }

        p {
          margin: 0 0 1rem;
          line-height: 1.6;
        }

        ul, ol {
          margin: 0 0 1rem;
          padding-left: 1.5rem;

          li {
            margin-bottom: 0.5rem;
          }
        }

        code {
          background-color: var(--color-surface-light);
          padding: 0.2rem 0.4rem;
          border-radius: var(--border-radius-sm);
          font-family: monospace;
        }

        pre {
          background-color: var(--color-surface-light);
          padding: 1rem;
          border-radius: var(--border-radius-sm);
          overflow-x: auto;
          margin: 0 0 1rem;

          code {
            background-color: transparent;
            padding: 0;
          }
        }

        blockquote {
          border-left: 4px solid var(--color-primary);
          padding-left: 1rem;
          margin: 0 0 1rem;
          color: var(--color-text-secondary);
        }

        img {
          max-width: 100%;
          border-radius: var(--border-radius-sm);
          margin: 1rem 0;
        }

        a {
          color: var(--color-primary);
          text-decoration: none;

          &:hover {
            text-decoration: underline;
          }
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;

          th, td {
            padding: 0.75rem;
            border: 1px solid var(--color-border);
            text-align: left;
          }

          th {
            background-color: var(--color-surface-light);
            font-weight: 500;
          }

          tr:nth-child(even) {
            background-color: var(--color-surface-light);
          }
        }
      }
    }

    mat-divider {
      margin: 1rem 0;
    }

    .article-footer {
      display: flex;
      flex-direction: column;
      gap: 1rem;

      .article-tags {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.5rem;

        .tags-label {
          font-weight: 500;
          color: var(--color-text-secondary);
        }

        .tags-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
      }

      .article-info {
        display: flex;
        flex-wrap: wrap;
        gap: 1.5rem;
        color: var(--color-text-secondary);
        font-size: var(--font-size-sm);

        .article-date,
        .article-author {
          display: flex;
          align-items: center;

          mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
            margin-right: 0.25rem;
          }
        }
      }
    }

    .related-articles {
      h3 {
        font-size: var(--font-size-md);
        font-weight: 500;
        margin: 0 0 1rem;
        color: var(--color-text-primary);
      }

      .related-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;

        .related-link {
          display: flex;
          align-items: center;
          padding: 0.75rem;
          border-radius: var(--border-radius-sm);
          background-color: var(--color-surface-light);
          color: var(--color-text-primary);
          text-decoration: none;
          transition: background-color 0.2s ease;

          &:hover {
            background-color: var(--color-surface);
          }

          mat-icon {
            margin-right: 0.5rem;
            color: var(--color-primary);
          }
        }
      }
    }
  `]
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
}
