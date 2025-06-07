import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

/**
 * Interfaz para configuración de módulo
 */
export interface ModuleConfiguration {
  id: string;
  visible: boolean;
  order: number;
  collapsed: boolean;
  customName?: string;
  theme?: 'default' | 'dark' | 'light' | 'colorful';
}

/**
 * Interfaz para configuración del sidebar
 */
export interface SidebarConfiguration {
  modules: ModuleConfiguration[];
  theme: 'default' | 'dark' | 'light' | 'colorful';
  density: 'compact' | 'comfortable' | 'spacious';
  showIcons: boolean;
  showBadges: boolean;
  enableAnimations: boolean;
  autoCollapse: boolean;
  favoritesPinned: boolean;
}

/**
 * Interfaz para tema personalizado
 */
export interface CustomTheme {
  id: string;
  name: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  hoverColor: string;
}

/**
 * Servicio para personalización del sidebar administrativo
 */
@Injectable({
  providedIn: 'root'
})
export class SidebarCustomizationService {

  private readonly STORAGE_KEY = 'admin-sidebar-configuration';
  private readonly THEMES_STORAGE_KEY = 'admin-sidebar-custom-themes';

  // Estados internos
  private configurationSubject = new BehaviorSubject<SidebarConfiguration>(this.getDefaultConfiguration());
  private customThemesSubject = new BehaviorSubject<CustomTheme[]>(this.getDefaultThemes());
  private isDragModeSubject = new BehaviorSubject<boolean>(false);

  // Observables públicos
  public configuration$ = this.configurationSubject.asObservable();
  public customThemes$ = this.customThemesSubject.asObservable();
  public isDragMode$ = this.isDragModeSubject.asObservable();

  constructor() {
    this.loadConfiguration();
    this.loadCustomThemes();
  }

  /**
   * Obtiene la configuración por defecto
   */
  private getDefaultConfiguration(): SidebarConfiguration {
    return {
      modules: [
        { id: 'dashboard', visible: true, order: 0, collapsed: false },
        { id: 'concursos', visible: true, order: 1, collapsed: false },
        { id: 'inscripciones', visible: true, order: 2, collapsed: false },
        { id: 'usuarios', visible: true, order: 3, collapsed: false },
        { id: 'comunicaciones', visible: true, order: 4, collapsed: false },
        { id: 'reportes', visible: true, order: 5, collapsed: false },
        { id: 'configuracion', visible: true, order: 6, collapsed: false }
      ],
      theme: 'default',
      density: 'comfortable',
      showIcons: true,
      showBadges: true,
      enableAnimations: true,
      autoCollapse: false,
      favoritesPinned: true
    };
  }

  /**
   * Obtiene los temas por defecto
   */
  private getDefaultThemes(): CustomTheme[] {
    return [
      {
        id: 'default',
        name: 'Predeterminado',
        primaryColor: '#3b82f6',
        accentColor: '#10b981',
        backgroundColor: '#374151',
        textColor: '#f9fafb',
        borderColor: '#4b5563',
        hoverColor: '#4b5563'
      },
      {
        id: 'dark',
        name: 'Oscuro',
        primaryColor: '#1f2937',
        accentColor: '#6366f1',
        backgroundColor: '#111827',
        textColor: '#f3f4f6',
        borderColor: '#374151',
        hoverColor: '#374151'
      },
      {
        id: 'light',
        name: 'Claro',
        primaryColor: '#2563eb',
        accentColor: '#059669',
        backgroundColor: '#f8fafc',
        textColor: '#1f2937',
        borderColor: '#e5e7eb',
        hoverColor: '#f1f5f9'
      },
      {
        id: 'colorful',
        name: 'Colorido',
        primaryColor: '#7c3aed',
        accentColor: '#f59e0b',
        backgroundColor: '#1e1b4b',
        textColor: '#fbbf24',
        borderColor: '#3730a3',
        hoverColor: '#312e81'
      }
    ];
  }

  /**
   * Carga la configuración desde localStorage
   */
  private loadConfiguration(): void {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        const config = JSON.parse(saved);
        this.configurationSubject.next({ ...this.getDefaultConfiguration(), ...config });
      } catch (error) {
        console.error('Error al cargar configuración del sidebar:', error);
      }
    }
  }

  /**
   * Guarda la configuración en localStorage
   */
  private saveConfiguration(): void {
    const config = this.configurationSubject.value;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
  }

  /**
   * Carga los temas personalizados desde localStorage
   */
  private loadCustomThemes(): void {
    const saved = localStorage.getItem(this.THEMES_STORAGE_KEY);
    if (saved) {
      try {
        const themes = JSON.parse(saved);
        this.customThemesSubject.next([...this.getDefaultThemes(), ...themes]);
      } catch (error) {
        console.error('Error al cargar temas personalizados:', error);
      }
    }
  }

  /**
   * Guarda los temas personalizados en localStorage
   */
  private saveCustomThemes(): void {
    const themes = this.customThemesSubject.value;
    const customThemes = themes.filter(t => !['default', 'dark', 'light', 'colorful'].includes(t.id));
    localStorage.setItem(this.THEMES_STORAGE_KEY, JSON.stringify(customThemes));
  }

  /**
   * Actualiza la configuración
   */
  public updateConfiguration(updates: Partial<SidebarConfiguration>): void {
    const current = this.configurationSubject.value;
    const updated = { ...current, ...updates };
    this.configurationSubject.next(updated);
    this.saveConfiguration();
  }

  /**
   * Reordena los módulos después de un drag and drop
   */
  public reorderModules(event: CdkDragDrop<any[]>): void {
    const config = this.configurationSubject.value;
    const modules = [...config.modules];
    
    moveItemInArray(modules, event.previousIndex, event.currentIndex);
    
    // Actualizar el orden
    modules.forEach((module, index) => {
      module.order = index;
    });

    this.updateConfiguration({ modules });
  }

  /**
   * Cambia la visibilidad de un módulo
   */
  public toggleModuleVisibility(moduleId: string): void {
    const config = this.configurationSubject.value;
    const modules = config.modules.map(module => 
      module.id === moduleId 
        ? { ...module, visible: !module.visible }
        : module
    );
    this.updateConfiguration({ modules });
  }

  /**
   * Cambia el estado colapsado de un módulo
   */
  public toggleModuleCollapsed(moduleId: string): void {
    const config = this.configurationSubject.value;
    const modules = config.modules.map(module => 
      module.id === moduleId 
        ? { ...module, collapsed: !module.collapsed }
        : module
    );
    this.updateConfiguration({ modules });
  }

  /**
   * Establece un nombre personalizado para un módulo
   */
  public setModuleCustomName(moduleId: string, customName: string): void {
    const config = this.configurationSubject.value;
    const modules = config.modules.map(module => 
      module.id === moduleId 
        ? { ...module, customName }
        : module
    );
    this.updateConfiguration({ modules });
  }

  /**
   * Activa/desactiva el modo de arrastrar
   */
  public setDragMode(enabled: boolean): void {
    this.isDragModeSubject.next(enabled);
  }

  /**
   * Cambia el tema del sidebar
   */
  public setTheme(themeId: string): void {
    this.updateConfiguration({ theme: themeId as any });
    this.applyTheme(themeId);
  }

  /**
   * Cambia la densidad del sidebar
   */
  public setDensity(density: 'compact' | 'comfortable' | 'spacious'): void {
    this.updateConfiguration({ density });
    this.applyDensity(density);
  }

  /**
   * Aplica un tema al sidebar
   */
  private applyTheme(themeId: string): void {
    const themes = this.customThemesSubject.value;
    const theme = themes.find(t => t.id === themeId);
    
    if (theme) {
      const root = document.documentElement;
      root.style.setProperty('--sidebar-primary-color', theme.primaryColor);
      root.style.setProperty('--sidebar-accent-color', theme.accentColor);
      root.style.setProperty('--sidebar-background-color', theme.backgroundColor);
      root.style.setProperty('--sidebar-text-color', theme.textColor);
      root.style.setProperty('--sidebar-border-color', theme.borderColor);
      root.style.setProperty('--sidebar-hover-color', theme.hoverColor);
    }
  }

  /**
   * Aplica la densidad al sidebar
   */
  private applyDensity(density: 'compact' | 'comfortable' | 'spacious'): void {
    const root = document.documentElement;
    
    switch (density) {
      case 'compact':
        root.style.setProperty('--sidebar-item-height', '32px');
        root.style.setProperty('--sidebar-padding', '4px');
        root.style.setProperty('--sidebar-font-size', '13px');
        break;
      case 'comfortable':
        root.style.setProperty('--sidebar-item-height', '40px');
        root.style.setProperty('--sidebar-padding', '8px');
        root.style.setProperty('--sidebar-font-size', '14px');
        break;
      case 'spacious':
        root.style.setProperty('--sidebar-item-height', '48px');
        root.style.setProperty('--sidebar-padding', '12px');
        root.style.setProperty('--sidebar-font-size', '15px');
        break;
    }
  }

  /**
   * Añade un tema personalizado
   */
  public addCustomTheme(theme: Omit<CustomTheme, 'id'>): void {
    const themes = this.customThemesSubject.value;
    const newTheme: CustomTheme = {
      ...theme,
      id: `custom-${Date.now()}`
    };
    
    this.customThemesSubject.next([...themes, newTheme]);
    this.saveCustomThemes();
  }

  /**
   * Elimina un tema personalizado
   */
  public removeCustomTheme(themeId: string): void {
    const themes = this.customThemesSubject.value;
    const filtered = themes.filter(t => t.id !== themeId);
    this.customThemesSubject.next(filtered);
    this.saveCustomThemes();
  }

  /**
   * Restaura la configuración por defecto
   */
  public resetToDefault(): void {
    const defaultConfig = this.getDefaultConfiguration();
    this.configurationSubject.next(defaultConfig);
    this.saveConfiguration();
    
    // Aplicar tema y densidad por defecto
    this.applyTheme(defaultConfig.theme);
    this.applyDensity(defaultConfig.density);
  }

  /**
   * Obtiene la configuración actual
   */
  public getCurrentConfiguration(): SidebarConfiguration {
    return this.configurationSubject.value;
  }

  /**
   * Obtiene la configuración de un módulo específico
   */
  public getModuleConfiguration(moduleId: string): ModuleConfiguration | undefined {
    const config = this.configurationSubject.value;
    return config.modules.find(m => m.id === moduleId);
  }

  /**
   * Exporta la configuración actual
   */
  public exportConfiguration(): string {
    const config = this.configurationSubject.value;
    const themes = this.customThemesSubject.value.filter(t => 
      !['default', 'dark', 'light', 'colorful'].includes(t.id)
    );
    
    return JSON.stringify({
      configuration: config,
      customThemes: themes,
      exportDate: new Date().toISOString(),
      version: '1.0'
    }, null, 2);
  }

  /**
   * Importa una configuración
   */
  public importConfiguration(configJson: string): boolean {
    try {
      const imported = JSON.parse(configJson);
      
      if (imported.configuration) {
        this.configurationSubject.next(imported.configuration);
        this.saveConfiguration();
      }
      
      if (imported.customThemes) {
        const currentThemes = this.getDefaultThemes();
        this.customThemesSubject.next([...currentThemes, ...imported.customThemes]);
        this.saveCustomThemes();
      }
      
      return true;
    } catch (error) {
      console.error('Error al importar configuración:', error);
      return false;
    }
  }
}
