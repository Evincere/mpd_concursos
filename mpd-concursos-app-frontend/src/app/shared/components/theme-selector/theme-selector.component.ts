import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SidebarCustomizationService, CustomTheme } from '@core/services/sidebar-customization.service';

/**
 * Componente selector de temas para personalización del sidebar
 */
@Component({
  selector: 'app-theme-selector',
  templateUrl: './theme-selector.component.html',
  styleUrls: ['./theme-selector.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ThemeSelectorComponent implements OnInit, OnDestroy {
  
  @Input() currentTheme = 'default';
  @Input() showCustomThemes = true;
  @Input() allowCustomCreation = true;
  @Output() themeChanged = new EventEmitter<string>();
  @Output() customThemeCreated = new EventEmitter<CustomTheme>();

  // Estados
  availableThemes: CustomTheme[] = [];
  selectedTheme = 'default';
  showCreateTheme = false;
  isCreatingTheme = false;

  // Formulario para crear tema personalizado
  newTheme = {
    name: '',
    primaryColor: '#3b82f6',
    accentColor: '#10b981',
    backgroundColor: '#374151',
    textColor: '#f9fafb',
    borderColor: '#4b5563',
    hoverColor: '#4b5563'
  };

  // Temas predefinidos con preview
  predefinedThemes = [
    {
      id: 'default',
      name: 'Predeterminado',
      description: 'Tema glassmorphism azul',
      preview: {
        primary: '#3b82f6',
        accent: '#10b981',
        background: '#374151'
      }
    },
    {
      id: 'dark',
      name: 'Oscuro',
      description: 'Tema oscuro profesional',
      preview: {
        primary: '#1f2937',
        accent: '#6366f1',
        background: '#111827'
      }
    },
    {
      id: 'light',
      name: 'Claro',
      description: 'Tema claro y limpio',
      preview: {
        primary: '#2563eb',
        accent: '#059669',
        background: '#f8fafc'
      }
    },
    {
      id: 'colorful',
      name: 'Colorido',
      description: 'Tema vibrante y energético',
      preview: {
        primary: '#7c3aed',
        accent: '#f59e0b',
        background: '#1e1b4b'
      }
    }
  ];

  private destroy$ = new Subject<void>();

  constructor(private customizationService: SidebarCustomizationService) {}

  ngOnInit(): void {
    this.selectedTheme = this.currentTheme;
    this.loadAvailableThemes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga los temas disponibles
   */
  private loadAvailableThemes(): void {
    this.customizationService.customThemes$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(themes => {
      this.availableThemes = themes;
    });
  }

  /**
   * Cambia el tema seleccionado
   */
  onThemeChange(themeId: string): void {
    this.selectedTheme = themeId;
    this.themeChanged.emit(themeId);
  }

  /**
   * Obtiene el preview de un tema
   */
  getThemePreview(themeId: string): any {
    const predefined = this.predefinedThemes.find(t => t.id === themeId);
    if (predefined) {
      return predefined.preview;
    }

    const custom = this.availableThemes.find(t => t.id === themeId);
    if (custom) {
      return {
        primary: custom.primaryColor,
        accent: custom.accentColor,
        background: custom.backgroundColor
      };
    }

    return this.predefinedThemes[0].preview;
  }

  /**
   * Obtiene la descripción de un tema
   */
  getThemeDescription(themeId: string): string {
    const predefined = this.predefinedThemes.find(t => t.id === themeId);
    if (predefined) {
      return predefined.description;
    }

    const custom = this.availableThemes.find(t => t.id === themeId);
    if (custom) {
      return 'Tema personalizado';
    }

    return 'Tema desconocido';
  }

  /**
   * Muestra/oculta el formulario de crear tema
   */
  toggleCreateTheme(): void {
    this.showCreateTheme = !this.showCreateTheme;
    if (this.showCreateTheme) {
      this.resetNewTheme();
    }
  }

  /**
   * Resetea el formulario de nuevo tema
   */
  private resetNewTheme(): void {
    this.newTheme = {
      name: '',
      primaryColor: '#3b82f6',
      accentColor: '#10b981',
      backgroundColor: '#374151',
      textColor: '#f9fafb',
      borderColor: '#4b5563',
      hoverColor: '#4b5563'
    };
  }

  /**
   * Crea un nuevo tema personalizado
   */
  createCustomTheme(): void {
    if (!this.newTheme.name.trim()) {
      return;
    }

    this.isCreatingTheme = true;

    const customTheme: Omit<CustomTheme, 'id'> = {
      name: this.newTheme.name.trim(),
      primaryColor: this.newTheme.primaryColor,
      accentColor: this.newTheme.accentColor,
      backgroundColor: this.newTheme.backgroundColor,
      textColor: this.newTheme.textColor,
      borderColor: this.newTheme.borderColor,
      hoverColor: this.newTheme.hoverColor
    };

    this.customizationService.addCustomTheme(customTheme);
    this.customThemeCreated.emit(customTheme as CustomTheme);

    // Resetear formulario
    this.resetNewTheme();
    this.showCreateTheme = false;
    this.isCreatingTheme = false;
  }

  /**
   * Elimina un tema personalizado
   */
  deleteCustomTheme(themeId: string): void {
    if (confirm('¿Estás seguro de que quieres eliminar este tema personalizado?')) {
      this.customizationService.removeCustomTheme(themeId);
      
      // Si el tema eliminado era el seleccionado, cambiar al predeterminado
      if (this.selectedTheme === themeId) {
        this.onThemeChange('default');
      }
    }
  }

  /**
   * Verifica si un tema es personalizado
   */
  isCustomTheme(themeId: string): boolean {
    return !this.predefinedThemes.some(t => t.id === themeId);
  }

  /**
   * Obtiene los temas predefinidos
   */
  getPredefinedThemes(): any[] {
    return this.predefinedThemes;
  }

  /**
   * Obtiene los temas personalizados
   */
  getCustomThemes(): CustomTheme[] {
    return this.availableThemes.filter(theme => 
      !this.predefinedThemes.some(predefined => predefined.id === theme.id)
    );
  }

  /**
   * Valida el formulario de nuevo tema
   */
  isNewThemeValid(): boolean {
    return this.newTheme.name.trim().length > 0;
  }

  /**
   * Genera un color aleatorio para el preview
   */
  generateRandomColor(): string {
    const colors = [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
      '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * Aplica colores aleatorios al nuevo tema
   */
  randomizeColors(): void {
    this.newTheme.primaryColor = this.generateRandomColor();
    this.newTheme.accentColor = this.generateRandomColor();
    
    // Generar colores de fondo basados en el color primario
    const isDark = this.isColorDark(this.newTheme.primaryColor);
    if (isDark) {
      this.newTheme.backgroundColor = '#1f2937';
      this.newTheme.textColor = '#f9fafb';
      this.newTheme.borderColor = '#374151';
      this.newTheme.hoverColor = '#374151';
    } else {
      this.newTheme.backgroundColor = '#f8fafc';
      this.newTheme.textColor = '#1f2937';
      this.newTheme.borderColor = '#e5e7eb';
      this.newTheme.hoverColor = '#f1f5f9';
    }
  }

  /**
   * Determina si un color es oscuro
   */
  private isColorDark(color: string): boolean {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128;
  }

  /**
   * Copia un tema existente como base para uno nuevo
   */
  copyTheme(themeId: string): void {
    const theme = this.availableThemes.find(t => t.id === themeId);
    if (theme) {
      this.newTheme = {
        name: `${theme.name} (Copia)`,
        primaryColor: theme.primaryColor,
        accentColor: theme.accentColor,
        backgroundColor: theme.backgroundColor,
        textColor: theme.textColor,
        borderColor: theme.borderColor,
        hoverColor: theme.hoverColor
      };
      this.showCreateTheme = true;
    }
  }
}
