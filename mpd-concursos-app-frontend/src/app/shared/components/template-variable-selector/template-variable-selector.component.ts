import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { 
  TemplateVariablesService, 
  DynamicVariable, 
  VariableContext 
} from '@core/services/messaging/template-variables.service';

/**
 * Modo de selección de variables
 */
type SelectionMode = 'single' | 'multiple';

/**
 * Vista del selector
 */
type SelectorView = 'grid' | 'list' | 'tree';

/**
 * Componente selector de variables dinámicas
 */
@Component({
  selector: 'app-template-variable-selector',
  templateUrl: './template-variable-selector.component.html',
  styleUrls: ['./template-variable-selector.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class TemplateVariableSelectorComponent implements OnInit {

  @Input() isOpen = false;
  @Input() mode: SelectionMode = 'single';
  @Input() view: SelectorView = 'grid';
  @Input() allowedContexts: VariableContext[] = [];
  @Input() selectedVariables: string[] = [];
  @Input() targetTextarea?: HTMLTextAreaElement;
  @Input() insertAtCursor = true;

  @Output() openChanged = new EventEmitter<boolean>();
  @Output() variableSelected = new EventEmitter<DynamicVariable>();
  @Output() variablesSelected = new EventEmitter<DynamicVariable[]>();
  @Output() variableInserted = new EventEmitter<{ variable: DynamicVariable; position: number }>();

  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  // Estados del componente
  allVariables: DynamicVariable[] = [];
  filteredVariables: DynamicVariable[] = [];
  groupedVariables: { [context: string]: DynamicVariable[] } = {};
  
  // Filtros y búsqueda
  searchTerm = '';
  selectedContext: VariableContext | 'all' = 'all';
  showOnlyActive = true;

  // Estados de UI
  loading = false;
  selectedVariableKeys: Set<string> = new Set();

  // Configuración
  contexts: Array<{ value: VariableContext | 'all'; label: string; icon: string }> = [
    { value: 'all', label: 'Todas', icon: 'fas fa-globe' },
    { value: 'user', label: 'Usuario', icon: 'fas fa-user' },
    { value: 'contest', label: 'Concurso', icon: 'fas fa-trophy' },
    { value: 'inscription', label: 'Inscripción', icon: 'fas fa-file-signature' },
    { value: 'exam', label: 'Examen', icon: 'fas fa-clipboard-check' },
    { value: 'document', label: 'Documento', icon: 'fas fa-file-alt' },
    { value: 'system', label: 'Sistema', icon: 'fas fa-cog' },
    { value: 'custom', label: 'Personalizado', icon: 'fas fa-edit' }
  ];

  views: Array<{ value: SelectorView; label: string; icon: string }> = [
    { value: 'grid', label: 'Cuadrícula', icon: 'fas fa-th' },
    { value: 'list', label: 'Lista', icon: 'fas fa-list' },
    { value: 'tree', label: 'Árbol', icon: 'fas fa-sitemap' }
  ];

  constructor(
    private templateVariablesService: TemplateVariablesService
  ) {}

  ngOnInit(): void {
    this.loadVariables();
    this.initializeSelectedVariables();
  }

  /**
   * Carga las variables disponibles
   */
  private loadVariables(): void {
    this.loading = true;
    this.allVariables = this.templateVariablesService.getAvailableVariables();
    this.applyFilters();
    this.groupVariablesByContext();
    this.loading = false;
  }

  /**
   * Inicializa variables seleccionadas
   */
  private initializeSelectedVariables(): void {
    this.selectedVariableKeys = new Set(this.selectedVariables);
  }

  /**
   * Aplica filtros a las variables
   */
  private applyFilters(): void {
    let filtered = [...this.allVariables];

    // Filtrar por contextos permitidos
    if (this.allowedContexts.length > 0) {
      filtered = filtered.filter(variable => 
        this.allowedContexts.includes(variable.context)
      );
    }

    // Filtrar por contexto seleccionado
    if (this.selectedContext !== 'all') {
      filtered = filtered.filter(variable => 
        variable.context === this.selectedContext
      );
    }

    // Filtrar por estado activo
    if (this.showOnlyActive) {
      filtered = filtered.filter(variable => variable.isActive);
    }

    // Filtrar por término de búsqueda
    if (this.searchTerm) {
      const searchResults = this.templateVariablesService.searchVariables(this.searchTerm);
      const searchKeys = new Set(searchResults.map(v => v.key));
      filtered = filtered.filter(variable => searchKeys.has(variable.key));
    }

    this.filteredVariables = filtered;
  }

  /**
   * Agrupa variables por contexto
   */
  private groupVariablesByContext(): void {
    this.groupedVariables = {};
    
    this.filteredVariables.forEach(variable => {
      if (!this.groupedVariables[variable.context]) {
        this.groupedVariables[variable.context] = [];
      }
      this.groupedVariables[variable.context].push(variable);
    });
  }

  /**
   * Actualiza búsqueda
   */
  onSearchChange(event: Event | string): void {
    let term: string;
    if (typeof event === 'string') {
      term = event;
    } else {
      const target = event.target as HTMLInputElement;
      term = target?.value || '';
    }

    this.searchTerm = term;
    this.applyFilters();
    this.groupVariablesByContext();
  }

  /**
   * Cambia contexto seleccionado
   */
  onContextChange(context: VariableContext | 'all'): void {
    this.selectedContext = context;
    this.applyFilters();
    this.groupVariablesByContext();
  }

  /**
   * Cambia vista del selector
   */
  onViewChange(view: SelectorView): void {
    this.view = view;
  }

  /**
   * Alterna filtro de activos
   */
  toggleActiveFilter(): void {
    this.showOnlyActive = !this.showOnlyActive;
    this.applyFilters();
    this.groupVariablesByContext();
  }

  /**
   * Selecciona una variable
   */
  selectVariable(variable: DynamicVariable, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    if (this.mode === 'single') {
      this.selectedVariableKeys.clear();
      this.selectedVariableKeys.add(variable.key);
      this.variableSelected.emit(variable);
      
      // Insertar en textarea si está configurado
      if (this.insertAtCursor && this.targetTextarea) {
        this.insertVariableInTextarea(variable);
      }
      
      // Cerrar selector en modo single
      this.close();
    } else {
      // Modo múltiple
      if (this.selectedVariableKeys.has(variable.key)) {
        this.selectedVariableKeys.delete(variable.key);
      } else {
        this.selectedVariableKeys.add(variable.key);
      }
      
      const selectedVars = this.allVariables.filter(v => 
        this.selectedVariableKeys.has(v.key)
      );
      this.variablesSelected.emit(selectedVars);
    }
  }

  /**
   * Inserta variable en textarea
   */
  private insertVariableInTextarea(variable: DynamicVariable): void {
    if (!this.targetTextarea) return;

    const textarea = this.targetTextarea;
    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const textBefore = textarea.value.substring(0, startPos);
    const textAfter = textarea.value.substring(endPos);
    const variableText = `{{${variable.key}}}`;

    // Insertar variable
    textarea.value = textBefore + variableText + textAfter;
    
    // Posicionar cursor después de la variable
    const newCursorPos = startPos + variableText.length;
    textarea.setSelectionRange(newCursorPos, newCursorPos);
    
    // Disparar evento de cambio
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    
    // Emitir evento de inserción
    this.variableInserted.emit({
      variable,
      position: startPos
    });
  }

  /**
   * Verifica si una variable está seleccionada
   */
  isVariableSelected(variable: DynamicVariable): boolean {
    return this.selectedVariableKeys.has(variable.key);
  }

  /**
   * Obtiene ícono de contexto
   */
  getContextIcon(context: VariableContext | string): string {
    const contextConfig = this.contexts.find(c => c.value === context);
    return contextConfig?.icon || 'fas fa-question';
  }

  /**
   * Obtiene label de contexto
   */
  getContextLabel(context: VariableContext | string): string {
    const contextConfig = this.contexts.find(c => c.value === context);
    return contextConfig?.label || context;
  }

  /**
   * Obtiene color de tipo de variable
   */
  getVariableTypeColor(type: string): string {
    const colors = {
      text: '#3b82f6',
      number: '#10b981',
      date: '#f59e0b',
      boolean: '#8b5cf6',
      email: '#ef4444',
      url: '#06b6d4',
      object: '#6b7280',
      array: '#84cc16'
    };
    return colors[type as keyof typeof colors] || '#6b7280';
  }

  /**
   * Obtiene ícono de tipo de variable
   */
  getVariableTypeIcon(type: string): string {
    const icons = {
      text: 'fas fa-font',
      number: 'fas fa-hashtag',
      date: 'fas fa-calendar',
      boolean: 'fas fa-toggle-on',
      email: 'fas fa-envelope',
      url: 'fas fa-link',
      object: 'fas fa-cube',
      array: 'fas fa-list'
    };
    return icons[type as keyof typeof icons] || 'fas fa-question';
  }

  /**
   * Copia variable al portapapeles
   */
  async copyVariable(variable: DynamicVariable, event: Event): Promise<void> {
    event.stopPropagation();
    
    try {
      await navigator.clipboard.writeText(`{{${variable.key}}}`);
      // Mostrar feedback visual (implementar toast o similar)
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  }

  /**
   * Obtiene ejemplo formateado de variable
   */
  getFormattedExample(variable: DynamicVariable): string {
    if (!variable.examples || variable.examples.length === 0) {
      return 'Sin ejemplo';
    }
    return variable.examples[0];
  }

  /**
   * Limpia búsqueda
   */
  clearSearch(): void {
    this.searchTerm = '';
    this.onSearchChange('');
    
    if (this.searchInput) {
      this.searchInput.nativeElement.focus();
    }
  }

  /**
   * Selecciona todas las variables filtradas
   */
  selectAllFiltered(): void {
    if (this.mode !== 'multiple') return;

    this.filteredVariables.forEach(variable => {
      this.selectedVariableKeys.add(variable.key);
    });

    const selectedVars = this.allVariables.filter(v => 
      this.selectedVariableKeys.has(v.key)
    );
    this.variablesSelected.emit(selectedVars);
  }

  /**
   * Deselecciona todas las variables
   */
  clearSelection(): void {
    this.selectedVariableKeys.clear();
    
    if (this.mode === 'multiple') {
      this.variablesSelected.emit([]);
    }
  }

  /**
   * Abre el selector
   */
  open(): void {
    this.isOpen = true;
    this.openChanged.emit(true);
    
    // Focus en búsqueda cuando se abre
    setTimeout(() => {
      if (this.searchInput) {
        this.searchInput.nativeElement.focus();
      }
    }, 100);
  }

  /**
   * Cierra el selector
   */
  close(): void {
    this.isOpen = false;
    this.openChanged.emit(false);
  }

  /**
   * Alterna el selector
   */
  toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Obtiene clases CSS del componente
   */
  getComponentClass(): string {
    const classes = [
      'template-variable-selector',
      `mode-${this.mode}`,
      `view-${this.view}`,
      this.isOpen ? 'open' : 'closed'
    ];
    
    return classes.join(' ');
  }

  /**
   * Obtiene número de variables seleccionadas
   */
  getSelectedCount(): number {
    return this.selectedVariableKeys.size;
  }

  /**
   * Obtiene número de variables filtradas
   */
  getFilteredCount(): number {
    return this.filteredVariables.length;
  }

  /**
   * Verifica si hay variables disponibles
   */
  hasVariables(): boolean {
    return this.filteredVariables.length > 0;
  }

  /**
   * Obtiene contextos disponibles
   */
  getAvailableContexts(): Array<{ value: VariableContext | 'all'; label: string; icon: string; count: number }> {
    return this.contexts.map(context => ({
      ...context,
      count: context.value === 'all' 
        ? this.allVariables.length 
        : this.allVariables.filter(v => v.context === context.value).length
    })).filter(context => 
      context.count > 0 || context.value === 'all'
    );
  }

  /**
   * Obtiene keys de contextos agrupados ordenados
   */
  getGroupedContextKeys(): string[] {
    return Object.keys(this.groupedVariables).sort((a, b) => {
      const order = ['user', 'contest', 'inscription', 'exam', 'document', 'system', 'custom'];
      return order.indexOf(a) - order.indexOf(b);
    });
  }
}
