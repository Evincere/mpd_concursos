import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AdminHelpService, HelpCategory, HelpArticle } from  '@core/services/admin/admin-help.service';

@Component({
  selector: 'app-knowledge-base',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './knowledge-base.component.html',
  styleUrls: ['./knowledge-base.component.scss']
})
export class KnowledgeBaseComponent implements OnInit, OnDestroy {
  @Input() categories: HelpCategory[] = [];
  @Output() articleSelected = new EventEmitter<string>();

  filterForm: FormGroup;
  isLoading = false;

  articles: HelpArticle[] = [];
  filteredArticles: HelpArticle[] = [];
  expandedArticles = new Set<string>();

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
   * Alterna la expansión de un artículo
   * @param articleId ID del artículo
   */
  toggleArticle(articleId: string): void {
    if (this.expandedArticles.has(articleId)) {
      this.expandedArticles.delete(articleId);
    } else {
      this.expandedArticles.add(articleId);
    }
  }

  /**
   * Verifica si un artículo está expandido
   * @param articleId ID del artículo
   * @returns true si está expandido
   */
  isArticleExpanded(articleId: string): boolean {
    return this.expandedArticles.has(articleId);
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
