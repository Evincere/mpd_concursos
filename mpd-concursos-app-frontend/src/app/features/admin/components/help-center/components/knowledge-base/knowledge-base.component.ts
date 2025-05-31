import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AdminHelpService, HelpCategory, HelpArticle } from  '@core/services/admin/admin-help.service';

@Component({
  selector: 'app-knowledge-base',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatExpansionModule,
    MatChipsModule,
    MatDividerModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="knowledge-base">
      <h2>Base de Conocimientos</h2>
      <p class="section-description">
        Explore nuestra base de conocimientos para encontrar información detallada sobre todas las funcionalidades del sistema.
      </p>

      <div class="filter-section">
        <form [formGroup]="filterForm" class="filter-form">
          <mat-form-field appearance="outline" class="category-filter">
            <mat-label>Categoría</mat-label>
            <mat-select formControlName="category" (selectionChange)="filterArticles()">
              <mat-option value="">Todas</mat-option>
              <mat-option *ngFor="let category of categories" [value]="category.id">
                {{category.name}}
              </mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="subcategory-filter" *ngIf="selectedCategory && selectedCategory.subcategories?.length">
            <mat-label>Subcategoría</mat-label>
            <mat-select formControlName="subcategory" (selectionChange)="filterArticles()">
              <mat-option value="">Todas</mat-option>
              <mat-option *ngFor="let subcategory of selectedCategory.subcategories" [value]="subcategory.id">
                {{subcategory.name}}
              </mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="level-filter">
            <mat-label>Nivel</mat-label>
            <mat-select formControlName="level" (selectionChange)="filterArticles()">
              <mat-option value="">Todos</mat-option>
              <mat-option value="basic">Básico</mat-option>
              <mat-option value="intermediate">Intermedio</mat-option>
              <mat-option value="advanced">Avanzado</mat-option>
            </mat-select>
          </mat-form-field>
        </form>
      </div>

      <div *ngIf="isLoading" class="loading-container">
        <mat-spinner diameter="40"></mat-spinner>
        <span>Cargando artículos...</span>
      </div>

      <div *ngIf="!isLoading && filteredArticles.length === 0" class="no-articles">
        <mat-icon>search_off</mat-icon>
        <p>No se encontraron artículos con los filtros seleccionados</p>
        <button mat-stroked-button color="primary" (click)="resetFilters()">Limpiar filtros</button>
      </div>

      <div *ngIf="!isLoading && filteredArticles.length > 0" class="articles-container">
        <mat-accordion>
          <mat-expansion-panel *ngFor="let article of filteredArticles">
            <mat-expansion-panel-header>
              <mat-panel-title>
                {{article.title}}
              </mat-panel-title>
              <mat-panel-description>
                <div class="article-meta">
                  <span class="article-category">{{getCategoryName(article.category)}}</span>
                  <span class="article-level" [ngClass]="getLevelClass(article.level)">
                    {{getLevelName(article.level)}}
                  </span>
                </div>
              </mat-panel-description>
            </mat-expansion-panel-header>

            <div class="article-summary">
              {{article.summary}}
            </div>

            <div class="article-tags">
              <mat-chip *ngFor="let tag of article.tags">{{tag}}</mat-chip>
            </div>

            <mat-action-row>
              <button mat-button color="primary" (click)="viewArticle(article.id)">
                <mat-icon>visibility</mat-icon>
                Ver artículo completo
              </button>
            </mat-action-row>
          </mat-expansion-panel>
        </mat-accordion>
      </div>
    </div>
  `,
  styles: [`
    .knowledge-base {
      display: flex;
      flex-direction: column;
    }

    h2 {
      font-size: var(--font-size-lg);
      font-weight: 500;
      margin: 0 0 0.5rem;
      color: var(--color-text-primary);
    }

    .section-description {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      margin: 0 0 1.5rem;
    }

    .filter-section {
      margin-bottom: 1.5rem;
    }

    .filter-form {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;

      .category-filter,
      .subcategory-filter,
      .level-filter {
        flex: 1;
        min-width: 200px;
      }
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem;

      span {
        margin-top: 1rem;
        color: var(--color-text-secondary);
      }
    }

    .no-articles {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 3rem;

      mat-icon {
        font-size: 48px;
        color: var(--color-text-secondary);
        margin-bottom: 1rem;
      }

      p {
        color: var(--color-text-secondary);
        margin-bottom: 1.5rem;
      }
    }

    .articles-container {
      mat-expansion-panel {
        margin-bottom: 1rem;
      }
    }

    .article-meta {
      display: flex;
      align-items: center;
      gap: 1rem;

      .article-category {
        color: var(--color-text-secondary);
        font-size: var(--font-size-xs);
      }

      .article-level {
        padding: 0.25rem 0.5rem;
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

    .article-summary {
      margin-bottom: 1rem;
      color: var(--color-text-secondary);
    }

    .article-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
  `]
})
export class KnowledgeBaseComponent implements OnInit, OnDestroy {
  @Input() categories: HelpCategory[] = [];
  @Output() articleSelected = new EventEmitter<string>();

  filterForm: FormGroup;
  isLoading = false;

  articles: HelpArticle[] = [];
  filteredArticles: HelpArticle[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private adminHelpService: AdminHelpService
  ) {
    this.filterForm = this.fb.group({
      category: [''],
      subcategory: [''],
      level: ['']
    });
  }

  ngOnInit(): void {
    this.loadArticles();

    // Escuchar cambios en la categoría para actualizar las subcategorías disponibles
    this.filterForm.get('category')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.filterForm.get('subcategory')?.setValue('');
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga los artículos
   */
  loadArticles(): void {
    this.isLoading = true;

    // En una implementación real, esto cargaría todos los artículos o los artículos de la categoría seleccionada
    // Por ahora, cargamos los artículos de la categoría 'general' si no hay categoría seleccionada
    const categoryId = this.filterForm.get('category')?.value || 'general';

    this.adminHelpService.getArticlesByCategory(categoryId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (articles) => {
          this.articles = articles;
          this.filterArticles();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error cargando artículos:', error);
          this.isLoading = false;
        }
      });
  }

  /**
   * Filtra los artículos según los criterios seleccionados
   */
  filterArticles(): void {
    const category = this.filterForm.get('category')?.value;
    const subcategory = this.filterForm.get('subcategory')?.value;
    const level = this.filterForm.get('level')?.value;

    // Si cambia la categoría, cargar nuevos artículos
    if (category !== this.previousCategory) {
      this.previousCategory = category;
      this.loadArticles();
      return;
    }

    // Filtrar artículos existentes
    this.filteredArticles = this.articles.filter(article => {
      if (subcategory && article.subcategory !== subcategory) {
        return false;
      }

      if (level && article.level !== level) {
        return false;
      }

      return true;
    });
  }

  /**
   * Restablece los filtros
   */
  resetFilters(): void {
    this.filterForm.reset({
      category: '',
      subcategory: '',
      level: ''
    });

    this.previousCategory = '';
    this.loadArticles();
  }

  /**
   * Emite el evento para ver un artículo
   * @param articleId ID del artículo
   */
  viewArticle(articleId: string): void {
    this.articleSelected.emit(articleId);
  }

  /**
   * Obtiene el nombre de una categoría
   * @param categoryId ID de la categoría
   * @returns Nombre de la categoría
   */
  getCategoryName(categoryId: string): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.name : categoryId;
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
   * Obtiene la categoría seleccionada
   */
  get selectedCategory(): HelpCategory | undefined {
    const categoryId = this.filterForm.get('category')?.value;
    return this.categories.find(c => c.id === categoryId);
  }

  // Categoría anterior para detectar cambios
  private previousCategory = '';
}
