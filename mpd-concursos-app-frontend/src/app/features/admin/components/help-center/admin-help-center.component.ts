import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { 
  AdminHelpService, 
  HelpCategory, 
  HelpArticle, 
  GuidedTutorial,
  HelpSearchFilter,
  HelpSearchResult
} from '@core/services/admin/admin-help.service';
import { KnowledgeBaseComponent } from './components/knowledge-base/knowledge-base.component';
import { ArticleViewerComponent } from './components/article-viewer/article-viewer.component';
import { GuidedTutorialComponent } from './components/guided-tutorial/guided-tutorial.component';
import { HelpFeedbackComponent } from './components/help-feedback/help-feedback.component';

@Component({
  selector: 'app-admin-help-center',
  templateUrl: './admin-help-center.component.html',
  styleUrls: ['./admin-help-center.component.scss'],
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
    MatTabsModule,
    MatExpansionModule,
    MatChipsModule,
    MatBadgeModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    RouterModule,
    KnowledgeBaseComponent,
    ArticleViewerComponent,
    GuidedTutorialComponent,
    HelpFeedbackComponent
  ]
})
export class AdminHelpCenterComponent implements OnInit, OnDestroy {
  // Estado de la UI
  isLoading = false;
  activeTab = 0;
  
  // Datos
  categories: HelpCategory[] = [];
  popularArticles: HelpArticle[] = [];
  recentArticles: HelpArticle[] = [];
  recommendedTutorials: GuidedTutorial[] = [];
  
  // Búsqueda
  searchForm: FormGroup;
  searchResults: HelpSearchResult | null = null;
  
  // Artículo o tutorial activo
  activeArticle: HelpArticle | null = null;
  activeTutorial: GuidedTutorial | null = null;
  
  // Para limpieza de suscripciones
  private destroy$ = new Subject<void>();
  
  constructor(
    private fb: FormBuilder,
    private adminHelpService: AdminHelpService,
    private snackBar: MatSnackBar
  ) {
    this.searchForm = this.fb.group({
      query: [''],
      category: [''],
      level: ['']
    });
  }
  
  ngOnInit(): void {
    this.loadInitialData();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * Carga los datos iniciales
   */
  loadInitialData(): void {
    this.isLoading = true;
    
    // Cargar categorías
    this.adminHelpService.getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => {
          this.categories = categories;
          this.isLoading = false;
          
          // Cargar artículos populares y recientes
          this.loadPopularArticles();
          this.loadRecentArticles();
          this.loadRecommendedTutorials();
        },
        error: (error) => {
          console.error('Error cargando categorías:', error);
          this.snackBar.open('Error al cargar las categorías', 'Cerrar', { duration: 3000 });
          this.isLoading = false;
        }
      });
  }
  
  /**
   * Carga los artículos populares
   */
  loadPopularArticles(): void {
    // En una implementación real, esto cargaría los artículos más populares
    // Por ahora, usamos los primeros artículos de la categoría 'general'
    this.adminHelpService.getArticlesByCategory('general')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (articles) => {
          this.popularArticles = articles.slice(0, 3);
        },
        error: (error) => {
          console.error('Error cargando artículos populares:', error);
        }
      });
  }
  
  /**
   * Carga los artículos recientes
   */
  loadRecentArticles(): void {
    // En una implementación real, esto cargaría los artículos más recientes
    // Por ahora, usamos los primeros artículos de la categoría 'users'
    this.adminHelpService.getArticlesByCategory('users')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (articles) => {
          this.recentArticles = articles.slice(0, 3);
        },
        error: (error) => {
          console.error('Error cargando artículos recientes:', error);
        }
      });
  }
  
  /**
   * Carga los tutoriales recomendados
   */
  loadRecommendedTutorials(): void {
    // En una implementación real, esto cargaría los tutoriales recomendados
    // Por ahora, usamos el primer tutorial
    this.adminHelpService.getTutorial('create-user-tutorial')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tutorial) => {
          this.recommendedTutorials = [tutorial];
        },
        error: (error) => {
          console.error('Error cargando tutoriales recomendados:', error);
        }
      });
  }
  
  /**
   * Realiza una búsqueda
   */
  search(): void {
    if (!this.searchForm.value.query) {
      this.searchResults = null;
      return;
    }
    
    this.isLoading = true;
    
    const filter: HelpSearchFilter = {
      query: this.searchForm.value.query,
      category: this.searchForm.value.category || undefined,
      level: this.searchForm.value.level || undefined
    };
    
    this.adminHelpService.searchHelp(filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results) => {
          this.searchResults = results;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error realizando búsqueda:', error);
          this.snackBar.open('Error al realizar la búsqueda', 'Cerrar', { duration: 3000 });
          this.isLoading = false;
        }
      });
  }
  
  /**
   * Limpia los resultados de búsqueda
   */
  clearSearch(): void {
    this.searchForm.reset({
      query: '',
      category: '',
      level: ''
    });
    this.searchResults = null;
  }
  
  /**
   * Abre un artículo
   * @param articleId ID del artículo
   */
  openArticle(articleId: string): void {
    this.isLoading = true;
    this.activeArticle = null;
    this.activeTutorial = null;
    
    this.adminHelpService.getArticle(articleId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (article) => {
          this.activeArticle = article;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error cargando artículo:', error);
          this.snackBar.open('Error al cargar el artículo', 'Cerrar', { duration: 3000 });
          this.isLoading = false;
        }
      });
  }
  
  /**
   * Inicia un tutorial guiado
   * @param tutorialId ID del tutorial
   */
  startTutorial(tutorialId: string): void {
    this.isLoading = true;
    this.activeArticle = null;
    this.activeTutorial = null;
    
    this.adminHelpService.startTutorial(tutorialId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (success) => {
          if (success) {
            this.adminHelpService.getActiveTutorial()
              .pipe(takeUntil(this.destroy$))
              .subscribe(tutorial => {
                this.activeTutorial = tutorial;
                this.isLoading = false;
              });
          } else {
            this.snackBar.open('Error al iniciar el tutorial', 'Cerrar', { duration: 3000 });
            this.isLoading = false;
          }
        },
        error: (error) => {
          console.error('Error iniciando tutorial:', error);
          this.snackBar.open('Error al iniciar el tutorial', 'Cerrar', { duration: 3000 });
          this.isLoading = false;
        }
      });
  }
  
  /**
   * Cierra el artículo o tutorial activo
   */
  closeActiveContent(): void {
    this.activeArticle = null;
    this.activeTutorial = null;
    
    if (this.activeTutorial) {
      this.adminHelpService.endTutorial();
    }
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
   * Obtiene el icono de una categoría
   * @param categoryId ID de la categoría
   * @returns Icono de la categoría
   */
  getCategoryIcon(categoryId: string): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.icon : 'help-circle';
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
}
