/**
 * Componente para gestión de preferencias del CV
 * 
 * @description Permite al usuario configurar sus preferencias de búsqueda, visualización y exportación
 * @author Augment Agent
 * @date 2025-06-21
 * @version 1.0.0
 */

import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';

import { CvPreferencesService, CvPreferences, SavedFilter } from '@core/services/cv/cv-preferences.service';
import { CvSearchService } from '@core/services/cv/cv-search.service';
import { CvNotificationService } from '@core/services/cv/cv-notification.service';

@Component({
  selector: 'app-cv-preferences',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="cv-preferences">
      <div class="preferences-header">
        <h2>
          <i class="material-icons">settings</i>
          Preferencias del CV
        </h2>
        <p>Configura tus preferencias para una mejor experiencia</p>
      </div>

      <div class="preferences-content">
        <!-- Pestañas de navegación -->
        <div class="preferences-tabs">
          <button 
            *ngFor="let tab of tabs" 
            class="tab-button"
            [class.active]="activeTab() === tab.id"
            (click)="setActiveTab(tab.id)">
            <i class="material-icons">{{ tab.icon }}</i>
            {{ tab.label }}
          </button>
        </div>

        <!-- Contenido de las pestañas -->
        <div class="tab-content">
          
          <!-- Pestaña de Búsqueda -->
          <div *ngIf="activeTab() === 'search'" class="tab-panel">
            <h3>Preferencias de Búsqueda</h3>
            
            <form [formGroup]="searchForm" class="preferences-form">
              <div class="form-section">
                <h4>Configuración por Defecto</h4>
                
                <div class="form-row">
                  <div class="form-field">
                    <label>Ordenar por</label>
                    <select formControlName="defaultSortBy">
                      <option value="date">Fecha</option>
                      <option value="relevance">Relevancia</option>
                      <option value="alphabetical">Alfabético</option>
                      <option value="duration">Duración</option>
                    </select>
                  </div>
                  
                  <div class="form-field">
                    <label>Orden</label>
                    <select formControlName="defaultSortOrder">
                      <option value="desc">Descendente</option>
                      <option value="asc">Ascendente</option>
                    </select>
                  </div>
                </div>
                
                <div class="form-row">
                  <div class="form-field checkbox-field">
                    <label>
                      <input type="checkbox" formControlName="enableFuzzySearch">
                      Habilitar búsqueda difusa
                    </label>
                    <small>Encuentra resultados similares aunque no coincidan exactamente</small>
                  </div>
                  
                  <div class="form-field checkbox-field">
                    <label>
                      <input type="checkbox" formControlName="enableAutoComplete">
                      Habilitar autocompletado
                    </label>
                    <small>Muestra sugerencias mientras escribes</small>
                  </div>
                </div>
              </div>
              
              <div class="form-section">
                <h4>Historial de Búsquedas</h4>
                
                <div class="form-row">
                  <div class="form-field checkbox-field">
                    <label>
                      <input type="checkbox" formControlName="saveSearchHistory">
                      Guardar historial de búsquedas
                    </label>
                    <small>Mantiene un registro de tus búsquedas recientes</small>
                  </div>
                  
                  <div class="form-field">
                    <label>Máximo de elementos en historial</label>
                    <input type="number" formControlName="maxSearchHistoryItems" min="10" max="100">
                  </div>
                </div>
              </div>
            </form>
          </div>

          <!-- Pestaña de Visualización -->
          <div *ngIf="activeTab() === 'display'" class="tab-panel">
            <h3>Preferencias de Visualización</h3>
            
            <form [formGroup]="displayForm" class="preferences-form">
              <div class="form-section">
                <h4>Vista por Defecto</h4>
                
                <div class="form-row">
                  <div class="form-field">
                    <label>Elementos por página</label>
                    <select formControlName="itemsPerPage">
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                    </select>
                  </div>
                  
                  <div class="form-field">
                    <label>Vista por defecto</label>
                    <select formControlName="defaultView">
                      <option value="list">Lista</option>
                      <option value="grid">Cuadrícula</option>
                      <option value="timeline">Línea de tiempo</option>
                    </select>
                  </div>
                </div>
                
                <div class="form-row">
                  <div class="form-field checkbox-field">
                    <label>
                      <input type="checkbox" formControlName="showThumbnails">
                      Mostrar miniaturas
                    </label>
                  </div>
                  
                  <div class="form-field checkbox-field">
                    <label>
                      <input type="checkbox" formControlName="compactView">
                      Vista compacta
                    </label>
                  </div>
                  
                  <div class="form-field checkbox-field">
                    <label>
                      <input type="checkbox" formControlName="showFacets">
                      Mostrar filtros laterales
                    </label>
                  </div>
                  
                  <div class="form-field checkbox-field">
                    <label>
                      <input type="checkbox" formControlName="enableAnimations">
                      Habilitar animaciones
                    </label>
                  </div>
                </div>
              </div>
            </form>
          </div>

          <!-- Pestaña de Filtros Guardados -->
          <div *ngIf="activeTab() === 'filters'" class="tab-panel">
            <h3>Filtros Guardados</h3>
            
            <div class="saved-filters-section">
              <div class="filters-header">
                <p>Gestiona tus filtros de búsqueda guardados</p>
                <button class="btn-primary" (click)="openSaveCurrentFilterDialog()">
                  <i class="material-icons">add</i>
                  Guardar Filtro Actual
                </button>
              </div>
              
              <div class="filters-list">
                <div *ngFor="let filter of savedFilters()" class="filter-item">
                  <div class="filter-info">
                    <h4>{{ filter.name }}</h4>
                    <p *ngIf="filter.description">{{ filter.description }}</p>
                    <div class="filter-meta">
                      <span>Creado: {{ filter.createdAt | date:'short' }}</span>
                      <span *ngIf="filter.lastUsed">Último uso: {{ filter.lastUsed | date:'short' }}</span>
                      <span>Usado {{ filter.useCount }} veces</span>
                    </div>
                  </div>
                  
                  <div class="filter-actions">
                    <button class="btn-secondary" (click)="loadFilter(filter.id)">
                      <i class="material-icons">search</i>
                      Aplicar
                    </button>
                    <button class="btn-danger" (click)="deleteFilter(filter.id)">
                      <i class="material-icons">delete</i>
                      Eliminar
                    </button>
                  </div>
                </div>
                
                <div *ngIf="savedFilters().length === 0" class="empty-state">
                  <i class="material-icons">filter_list</i>
                  <p>No tienes filtros guardados</p>
                  <small>Configura tus filtros de búsqueda y guárdalos para uso futuro</small>
                </div>
              </div>
            </div>
          </div>

          <!-- Pestaña de Exportación -->
          <div *ngIf="activeTab() === 'export'" class="tab-panel">
            <h3>Preferencias de Exportación</h3>
            
            <form [formGroup]="exportForm" class="preferences-form">
              <div class="form-section">
                <h4>Configuración por Defecto</h4>
                
                <div class="form-row">
                  <div class="form-field">
                    <label>Formato por defecto</label>
                    <select formControlName="defaultFormat">
                      <option value="pdf">PDF</option>
                      <option value="docx">Word (DOCX)</option>
                      <option value="html">HTML</option>
                    </select>
                  </div>
                  
                  <div class="form-field">
                    <label>Estilo de plantilla</label>
                    <select formControlName="templateStyle">
                      <option value="modern">Moderno</option>
                      <option value="classic">Clásico</option>
                      <option value="minimal">Minimalista</option>
                      <option value="creative">Creativo</option>
                    </select>
                  </div>
                </div>
                
                <div class="form-row">
                  <div class="form-field">
                    <label>Tamaño de papel</label>
                    <select formControlName="paperSize">
                      <option value="A4">A4</option>
                      <option value="Letter">Carta</option>
                    </select>
                  </div>
                  
                  <div class="form-field">
                    <label>Márgenes</label>
                    <select formControlName="margins">
                      <option value="normal">Normal</option>
                      <option value="narrow">Estrecho</option>
                      <option value="wide">Amplio</option>
                    </select>
                  </div>
                </div>
                
                <div class="form-row">
                  <div class="form-field checkbox-field">
                    <label>
                      <input type="checkbox" formControlName="includePhotos">
                      Incluir fotos
                    </label>
                  </div>
                  
                  <div class="form-field checkbox-field">
                    <label>
                      <input type="checkbox" formControlName="includeReferences">
                      Incluir referencias
                    </label>
                  </div>
                </div>
              </div>
            </form>
          </div>

          <!-- Pestaña de Privacidad -->
          <div *ngIf="activeTab() === 'privacy'" class="tab-panel">
            <h3>Configuración de Privacidad</h3>
            
            <form [formGroup]="privacyForm" class="preferences-form">
              <div class="form-section">
                <h4>Datos y Análisis</h4>
                
                <div class="form-row">
                  <div class="form-field checkbox-field">
                    <label>
                      <input type="checkbox" formControlName="shareUsageData">
                      Compartir datos de uso
                    </label>
                    <small>Ayuda a mejorar la aplicación compartiendo datos anónimos de uso</small>
                  </div>
                  
                  <div class="form-field checkbox-field">
                    <label>
                      <input type="checkbox" formControlName="enableAnalytics">
                      Habilitar análisis
                    </label>
                    <small>Permite el seguimiento de métricas para mejorar la experiencia</small>
                  </div>
                </div>
                
                <div class="form-row">
                  <div class="form-field checkbox-field">
                    <label>
                      <input type="checkbox" formControlName="autoSaveEnabled">
                      Guardado automático
                    </label>
                    <small>Guarda automáticamente los cambios en las preferencias</small>
                  </div>
                  
                  <div class="form-field">
                    <label>Intervalo de guardado automático (minutos)</label>
                    <input type="number" formControlName="autoSaveInterval" min="1" max="60">
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Acciones globales -->
      <div class="preferences-actions">
        <button class="btn-secondary" (click)="exportPreferences()">
          <i class="material-icons">download</i>
          Exportar Preferencias
        </button>
        
        <button class="btn-secondary" (click)="importPreferences()">
          <i class="material-icons">upload</i>
          Importar Preferencias
        </button>
        
        <button class="btn-danger" (click)="resetToDefaults()">
          <i class="material-icons">restore</i>
          Restaurar Valores por Defecto
        </button>
        
        <button class="btn-primary" (click)="saveAllPreferences()">
          <i class="material-icons">save</i>
          Guardar Cambios
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./cv-preferences.component.scss']
})
export class CvPreferencesComponent {
  // ===== SERVICIOS INYECTADOS =====
  private readonly fb = inject(FormBuilder);
  private readonly preferencesService = inject(CvPreferencesService);
  private readonly searchService = inject(CvSearchService);
  private readonly notificationService = inject(CvNotificationService);

  // ===== ESTADO DEL COMPONENTE =====
  public readonly activeTab = signal<string>('search');
  public readonly savedFilters = computed(() => this.preferencesService.savedFilters());

  // ===== CONFIGURACIÓN DE PESTAÑAS =====
  public readonly tabs = [
    { id: 'search', label: 'Búsqueda', icon: 'search' },
    { id: 'display', label: 'Visualización', icon: 'visibility' },
    { id: 'filters', label: 'Filtros Guardados', icon: 'filter_list' },
    { id: 'export', label: 'Exportación', icon: 'download' },
    { id: 'privacy', label: 'Privacidad', icon: 'security' }
  ];

  // ===== FORMULARIOS =====
  public readonly searchForm: FormGroup;
  public readonly displayForm: FormGroup;
  public readonly exportForm: FormGroup;
  public readonly privacyForm: FormGroup;

  constructor() {
    const preferences = this.preferencesService.preferences();

    // Inicializar formularios con valores actuales
    this.searchForm = this.fb.group({
      defaultSortBy: [preferences.searchPreferences.defaultSortBy],
      defaultSortOrder: [preferences.searchPreferences.defaultSortOrder],
      enableFuzzySearch: [preferences.searchPreferences.enableFuzzySearch],
      enableAutoComplete: [preferences.searchPreferences.enableAutoComplete],
      saveSearchHistory: [preferences.searchPreferences.saveSearchHistory],
      maxSearchHistoryItems: [preferences.searchPreferences.maxSearchHistoryItems]
    });

    this.displayForm = this.fb.group({
      itemsPerPage: [preferences.displayPreferences.itemsPerPage],
      showThumbnails: [preferences.displayPreferences.showThumbnails],
      compactView: [preferences.displayPreferences.compactView],
      showFacets: [preferences.displayPreferences.showFacets],
      defaultView: [preferences.displayPreferences.defaultView],
      enableAnimations: [preferences.displayPreferences.enableAnimations]
    });

    this.exportForm = this.fb.group({
      defaultFormat: [preferences.exportPreferences.defaultFormat],
      includePhotos: [preferences.exportPreferences.includePhotos],
      includeReferences: [preferences.exportPreferences.includeReferences],
      templateStyle: [preferences.exportPreferences.templateStyle],
      paperSize: [preferences.exportPreferences.paperSize],
      margins: [preferences.exportPreferences.margins]
    });

    this.privacyForm = this.fb.group({
      shareUsageData: [preferences.privacySettings.shareUsageData],
      enableAnalytics: [preferences.privacySettings.enableAnalytics],
      autoSaveEnabled: [preferences.privacySettings.autoSaveEnabled],
      autoSaveInterval: [preferences.privacySettings.autoSaveInterval]
    });

    // Configurar auto-guardado
    this.setupAutoSave();
  }

  // ===== MÉTODOS PÚBLICOS =====

  /**
   * Cambia la pestaña activa
   */
  setActiveTab(tabId: string): void {
    this.activeTab.set(tabId);
  }

  /**
   * Guarda todas las preferencias
   */
  saveAllPreferences(): void {
    this.preferencesService.updateSearchPreferences(this.searchForm.value);
    this.preferencesService.updateDisplayPreferences(this.displayForm.value);
    this.preferencesService.updateExportPreferences(this.exportForm.value);
    this.preferencesService.updateNotificationPreferences(this.privacyForm.value);

    this.notificationService.showSuccess('Preferencias guardadas correctamente');
  }

  /**
   * Carga un filtro guardado
   */
  loadFilter(filterId: string): void {
    this.searchService.loadSavedFilter(filterId);
    this.notificationService.showSuccess('Filtro aplicado correctamente');
  }

  /**
   * Elimina un filtro guardado
   */
  deleteFilter(filterId: string): void {
    if (confirm('¿Estás seguro de que quieres eliminar este filtro?')) {
      this.preferencesService.deleteFilter(filterId);
      this.notificationService.showSuccess('Filtro eliminado correctamente');
    }
  }

  /**
   * Abre el diálogo para guardar el filtro actual
   */
  openSaveCurrentFilterDialog(): void {
    const name = prompt('Nombre del filtro:');
    if (name) {
      const description = prompt('Descripción (opcional):');
      this.searchService.saveCurrentFiltersAsPreset(name, description || undefined);
      this.notificationService.showSuccess('Filtro guardado correctamente');
    }
  }

  /**
   * Exporta las preferencias
   */
  exportPreferences(): void {
    const data = this.preferencesService.exportPreferencesToJson();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cv-preferences.json';
    a.click();
    
    URL.revokeObjectURL(url);
    this.notificationService.showSuccess('Preferencias exportadas correctamente');
  }

  /**
   * Importa preferencias
   */
  importPreferences(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          const success = this.preferencesService.importPreferences(e.target.result);
          if (success) {
            this.notificationService.showSuccess('Preferencias importadas correctamente');
            // Recargar formularios con nuevos valores
            this.reloadForms();
          } else {
            this.notificationService.showError('Error al importar preferencias');
          }
        };
        reader.readAsText(file);
      }
    };
    
    input.click();
  }

  /**
   * Restaura valores por defecto
   */
  resetToDefaults(): void {
    if (confirm('¿Estás seguro de que quieres restaurar todas las preferencias a los valores por defecto?')) {
      this.preferencesService.resetToDefaults();
      this.reloadForms();
      this.notificationService.showSuccess('Preferencias restauradas a valores por defecto');
    }
  }

  // ===== MÉTODOS PRIVADOS =====

  /**
   * Configura el auto-guardado de formularios
   */
  private setupAutoSave(): void {
    // Auto-guardar cuando cambian los formularios
    this.searchForm.valueChanges.subscribe(() => {
      if (this.privacyForm.get('autoSaveEnabled')?.value) {
        this.preferencesService.updateSearchPreferences(this.searchForm.value);
      }
    });

    this.displayForm.valueChanges.subscribe(() => {
      if (this.privacyForm.get('autoSaveEnabled')?.value) {
        this.preferencesService.updateDisplayPreferences(this.displayForm.value);
      }
    });

    this.exportForm.valueChanges.subscribe(() => {
      if (this.privacyForm.get('autoSaveEnabled')?.value) {
        this.preferencesService.updateExportPreferences(this.exportForm.value);
      }
    });

    this.privacyForm.valueChanges.subscribe(() => {
      this.preferencesService.updateNotificationPreferences(this.privacyForm.value);
    });
  }

  /**
   * Recarga los formularios con los valores actuales
   */
  private reloadForms(): void {
    const preferences = this.preferencesService.preferences();
    
    this.searchForm.patchValue(preferences.searchPreferences);
    this.displayForm.patchValue(preferences.displayPreferences);
    this.exportForm.patchValue(preferences.exportPreferences);
    this.privacyForm.patchValue(preferences.privacySettings);
  }
}
