import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { 
  TemplateVariablesService, 
  TemplateVariable, 
  VariableCategory 
} from '@core/services/admin/template-variables.service';

@Component({
  selector: 'app-variable-selector',
  templateUrl: './variable-selector.component.html',
  styleUrls: ['./variable-selector.component.scss'],
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
    MatTooltipModule,
    MatDividerModule
  ]
})
export class VariableSelectorComponent implements OnInit, OnDestroy {
  @Output() variableSelected = new EventEmitter<string>();
  
  variables: TemplateVariable[] = [];
  categories: VariableCategory[] = [];
  filteredVariables: TemplateVariable[] = [];
  
  filterForm: FormGroup;
  
  private destroy$ = new Subject<void>();
  
  constructor(
    private fb: FormBuilder,
    private templateVariablesService: TemplateVariablesService
  ) {
    this.filterForm = this.fb.group({
      category: [''],
      search: ['']
    });
  }
  
  ngOnInit(): void {
    this.loadCategories();
    this.loadVariables();
    
    // Escuchar cambios en los filtros
    this.filterForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.applyFilters();
      });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * Carga las categorías de variables
   */
  loadCategories(): void {
    this.templateVariablesService.getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe(categories => {
        this.categories = categories;
      });
  }
  
  /**
   * Carga las variables de plantilla
   */
  loadVariables(): void {
    this.templateVariablesService.getVariables()
      .pipe(takeUntil(this.destroy$))
      .subscribe(variables => {
        this.variables = variables;
        this.applyFilters();
      });
  }
  
  /**
   * Aplica los filtros a las variables
   */
  applyFilters(): void {
    const { category, search } = this.filterForm.value;
    
    this.filteredVariables = this.variables.filter(variable => {
      // Filtrar por categoría
      if (category && variable.category !== category) {
        return false;
      }
      
      // Filtrar por búsqueda
      if (search) {
        const searchLower = search.toLowerCase();
        return (
          variable.name.toLowerCase().includes(searchLower) ||
          variable.description.toLowerCase().includes(searchLower) ||
          variable.placeholder.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });
  }
  
  /**
   * Selecciona una variable
   * @param variable Variable seleccionada
   */
  selectVariable(variable: TemplateVariable): void {
    this.variableSelected.emit(variable.placeholder);
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
   * Agrupa las variables por categoría
   * @returns Mapa de variables agrupadas por categoría
   */
  getVariablesByCategory(): Map<string, TemplateVariable[]> {
    const groupedVariables = new Map<string, TemplateVariable[]>();
    
    // Agrupar variables por categoría
    this.filteredVariables.forEach(variable => {
      if (!groupedVariables.has(variable.category)) {
        groupedVariables.set(variable.category, []);
      }
      
      groupedVariables.get(variable.category)?.push(variable);
    });
    
    return groupedVariables;
  }
}
