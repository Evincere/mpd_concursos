import { Component, Input, OnInit, OnDestroy, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@core/services/auth/auth.service';
import { Subject, BehaviorSubject, combineLatest, timer } from 'rxjs'; // Import timer
import { takeUntil, debounceTime, distinctUntilChanged, tap, switchMap, map } from 'rxjs/operators'; // Import map, switchMap, tap
import {
  trigger,
  state,
  style,
  animate,
  transition,
  query,
  stagger
} from '@angular/animations';
import { ConcursosService } from '@core/services/concursos/concursos.service';
import { InscriptionService } from '@core/services/inscripcion/inscription.service';
import { IInscription } from '@shared/interfaces/inscripcion/inscription.interface';
import { AdminNotificationsService } from '@core/services/admin-notifications.service';
import { WebSocketNotificationsService } from '@core/services/websocket-notifications.service';
import { AlertPrioritizationService } from '@core/services/alert-prioritization.service';
import { SidebarCustomizationService } from '@core/services/sidebar-customization.service';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop'; // Import moveItemInArray

// Componentes personalizados
import { CustomDividerComponent } from '@shared/components/custom-form/custom-divider/custom-divider.component';
import { TooltipDirective } from '@shared/directives/tooltip.directive';
import { AnimateDirective } from '@shared/directives/animate.directive';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { LoggingService } from '@core/services/logging/logging.service'; // Import LoggingService

/**
 * Interface for a sidebar module
 */
interface SidebarModule {
  id: string;
  label: string;
  icon: string;
  expanded?: boolean;
  items: SidebarMenuItem[];
}

/**
 * Interface for a sidebar menu item
 */
interface SidebarMenuItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  badge?: {
    value: number | string;
    color: 'primary' | 'accent' | 'warn' | 'success' | 'info';
  };
  children?: SidebarMenuItem[];
  expanded?: boolean;
  isFavorite?: boolean;
  tags?: string[]; // For search
}

@Component({
  selector: 'app-admin-sidebar',
  templateUrl: './admin-sidebar.component.html',
  styleUrls: ['./admin-sidebar.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    CustomDividerComponent,
    TooltipDirective,
    AnimateDirective,
    DragDropModule
  ],
  animations: [
    trigger('moduleAnimation', [
      state('expanded', style({ height: '*', opacity: 1, visibility: 'visible' })),
      state('collapsed', style({ height: '0px', opacity: 0, visibility: 'hidden' })),
      transition('expanded <=> collapsed', animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
    trigger('listAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(-10px)' }),
          stagger('50ms', [
            animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('fadeAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class AdminSidebarComponent implements OnInit, OnDestroy {
  @Input() collapsed = false;
  @ViewChild('floatingMenuRef') floatingMenuRef?: ElementRef;

  // Sidebar Modules
  modules: SidebarModule[] = [];

  // Favorites
  favoriteItems: SidebarMenuItem[] = [];
  showFavorites = true;

  // Search
  searchQuery = '';
  searchResults: SidebarMenuItem[] = [];
  isSearching = false;
  private searchSubject = new BehaviorSubject<string>('');

  // Floating menu for collapsed mode
  activeFloatingModule: SidebarModule | null = null;
  activeFloatingMenu: SidebarMenuItem | null = null; // Used for sub-menus if needed in future
  floatingMenuPosition = { top: 0, left: 0 };

  // Customization and drag & drop
  isDragMode = false; // Toggles drag handles visibility
  isCustomizationMode = false; // Toggles the customization panel and drag mode
  showCustomizationPanel = false;

  // For cleaning up subscriptions
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private concursosService: ConcursosService,
    private inscriptionService: InscriptionService,
    private adminNotificationsService: AdminNotificationsService,
    private webSocketService: WebSocketNotificationsService,
    private alertPrioritizationService: AlertPrioritizationService,
    private sidebarCustomizationService: SidebarCustomizationService,
    private loggingService: LoggingService // Inject LoggingService
  ) {
    this.loggingService.debug('[AdminSidebar] Constructor: Initializing search subject.', undefined, 'AdminSidebar');
    // Configure search with debounce
    this.searchSubject.pipe(
      takeUntil(this.destroy$),
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      this.performSearch(query);
    });
  }

  ngOnInit(): void {
    this.loggingService.debug('[AdminSidebar] ngOnInit: Component initialized. Initializing modules and loading state.', undefined, 'AdminSidebar');
    // Initialize the modular structure
    this.initModules();

    // Load saved state of expanded modules and order
    this.loadModulesState();

    // Load saved favorites
    this.loadFavorites();

    // Setup dynamic badges with centralized service
    this.setupDynamicBadges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.activeFloatingMenu = null;
    this.activeFloatingModule = null;
    this.loggingService.debug('[AdminSidebar] ngOnDestroy: Component destroyed. Subscriptions cleaned.', undefined, 'AdminSidebar');
  }

  /**
   * Sets the searching state based on query length.
   */
  setIsSearching(): void {
    this.isSearching = this.searchQuery.length > 0;
    this.loggingService.debug(`[AdminSidebar] Search state set to: ${this.isSearching}`, undefined, 'AdminSidebar');
  }

  /**
   * Toggles the visibility of favorite items.
   */
  toggleShowFavorites(): void {
    this.showFavorites = !this.showFavorites;
    this.loggingService.debug(`[AdminSidebar] Show favorites toggled to: ${this.showFavorites}`, undefined, 'AdminSidebar');
  }

  /**
   * Sets the visibility of favorite items.
   */
  setShowFavorites(show?: boolean): void {
    this.showFavorites = show !== undefined ? show : !this.showFavorites;
    this.loggingService.debug(`[AdminSidebar] Show favorites set to: ${this.showFavorites}`, undefined, 'AdminSidebar');
  }

  /**
   * Toggles the expansion of a module or menu item with children.
   * @param item The SidebarModule or SidebarMenuItem to toggle.
   * @param event The mouse event (optional).
   */
  toggleExpanded(item: SidebarModule | SidebarMenuItem, event?: MouseEvent): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if ('items' in item) { // It's a SidebarModule
      if (this.collapsed) {
        this.loggingService.debug(`[AdminSidebar] Module clicked in collapsed mode: ${item.id}`, undefined, 'AdminSidebar');
        // In collapsed mode, show floating menu
        if (event) {
          const target = event.currentTarget as HTMLElement;
          const rect = target.getBoundingClientRect();

          // Position the floating menu to the right of the collapsed sidebar
          this.floatingMenuPosition = {
            top: rect.top,
            left: rect.right + 10
          };

          this.activeFloatingModule = this.activeFloatingModule === item ? null : item;
          this.loggingService.debug(`[AdminSidebar] Active floating module set to: ${this.activeFloatingModule?.id}`, undefined, 'AdminSidebar');
        }
      } else {
        // In expanded mode, toggle expansion state
        item.expanded = !item.expanded;
        this.saveModulesState(); // Save state when expanded changes
        this.loggingService.debug(`[AdminSidebar] Module expanded state toggled for: ${item.id} to ${item.expanded}`, undefined, 'AdminSidebar');
      }
    } else if ('children' in item) { // It's a SidebarMenuItem with children
      item.expanded = !item.expanded;
      this.loggingService.debug(`[AdminSidebar] Menu item expanded state toggled for: ${item.id} to ${item.expanded}`, undefined, 'AdminSidebar');
    }
  }

  /**
   * Clears the active floating module when mouse leaves the floating menu or sidebar.
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.activeFloatingModule && this.floatingMenuRef && !this.floatingMenuRef.nativeElement.contains(event.target) && !(event.target as HTMLElement).closest('.sidebar-module')) {
      this.activeFloatingModule = null;
      this.loggingService.debug('[AdminSidebar] Floating menu closed by outside click.', undefined, 'AdminSidebar');
    }
  }

  /**
   * Initializes the modular structure of the sidebar.
   * This is the source of truth for all menu items and their hierarchy.
   */
  private initModules(): void {
    this.modules = [
      // Module 1: Dashboard
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'tachometer-alt',
        expanded: true,
        items: [
          {
            id: 'main-dashboard',
            label: 'Panel Principal',
            icon: 'home',
            route: '/admin/dashboard',
            tags: ['inicio', 'resumen', 'estadísticas', 'general']
          }
        ]
      },

      // Module 2: Contests
      {
        id: 'concursos',
        label: 'Concursos',
        icon: 'gavel',
        expanded: false,
        items: [
          {
            id: 'concursos-dashboard',
            label: 'Dashboard de Concursos',
            icon: 'chart-line',
            route: '/admin/concursos/dashboard',
            tags: ['estadísticas', 'concursos', 'resumen']
          },
          {
            id: 'concursos-listado',
            label: 'Gestión de Concursos',
            icon: 'list',
            route: '/admin/concursos/listado',
            badge: {
              value: 0,
              color: 'info'
            },
            tags: ['listado', 'concursos', 'administrar']
          },
          {
            id: 'concursos-crear',
            label: 'Crear Nuevo',
            icon: 'plus-circle',
            route: '/admin/concursos/nuevo',
            tags: ['crear', 'nuevo', 'concurso']
          },
          {
            id: 'concursos-calendario',
            label: 'Calendario',
            icon: 'calendar-alt',
            route: '/admin/concursos/calendario',
            tags: ['fechas', 'calendario', 'programación']
          },
          {
            id: 'concursos-fechas',
            label: 'Fechas Importantes',
            icon: 'calendar-check',
            route: '/admin/concursos/fechas-importantes', // Corrected route
            tags: ['fechas', 'importantes', 'plazos']
          }
        ]
      },

      // Module 3: Inscriptions
      {
        id: 'inscripciones',
        label: 'Inscripciones',
        icon: 'clipboard-check',
        expanded: false,
        items: [
          {
            id: 'inscripciones-dashboard',
            label: 'Dashboard de Inscripciones',
            icon: 'chart-bar',
            route: '/admin/inscripciones/dashboard',
            tags: ['estadísticas', 'inscripciones', 'resumen']
          },
          {
            id: 'inscripciones-listado',
            label: 'Gestión de Inscripciones',
            icon: 'clipboard-list',
            route: '/admin/inscripciones/listado',
            badge: {
              value: 0,
              color: 'warn'
            },
            tags: ['listado', 'inscripciones', 'administrar']
          },
          {
            id: 'inscripciones-pendientes',
            label: 'Pendientes',
            icon: 'clock',
            route: '/admin/inscripciones/pendientes',
            badge: {
              value: 0,
              color: 'warn'
            },
            tags: ['pendientes', 'revisión', 'nuevas']
          },
          {
            id: 'inscripciones-aprobadas',
            label: 'Aprobadas',
            icon: 'check-circle',
            route: '/admin/inscripciones/aprobadas',
            badge: {
              value: 0,
              color: 'success'
            },
            tags: ['aprobadas', 'aceptadas', 'validadas']
          },
          {
            id: 'inscripciones-rechazadas',
            label: 'Rechazadas',
            icon: 'times-circle',
            route: '/admin/inscripciones/rechazadas',
            badge: {
              value: 0,
              color: 'warn'
            },
            tags: ['rechazadas', 'denegadas', 'canceladas']
          },
          {
            id: 'inscripciones-documentacion',
            label: 'Documentación',
            icon: 'file-alt',
            route: '/admin/inscripciones/documentos',
            badge: {
              value: 0,
              color: 'warn'
            },
            tags: ['documentos', 'archivos', 'validación']
          },
          {
            id: 'inscripciones-seguimiento',
            label: 'Seguimiento',
            icon: 'search',
            route: '/admin/inscripciones/seguimiento',
            tags: ['seguimiento', 'tracking', 'monitoreo']
          },
          {
            id: 'inscripciones-ciclo-vida',
            label: 'Ciclo de Vida',
            icon: 'sync',
            route: '/admin/inscripciones/ciclo-vida',
            tags: ['ciclo', 'vida', 'proceso']
          }
        ]
      },

      // Module 4: Evaluations
      {
        id: 'evaluaciones',
        label: 'Evaluaciones',
        icon: 'tasks',
        expanded: false,
        items: [
          {
            id: 'examenes',
            label: 'Exámenes',
            icon: 'clipboard-list',
            route: '/admin/examenes',
            tags: ['exámenes', 'pruebas', 'evaluaciones']
          },
          {
            id: 'preguntas',
            label: 'Banco de Preguntas',
            icon: 'question-circle',
            route: '/admin/preguntas',
            tags: ['preguntas', 'banco', 'cuestionario']
          },
          {
            id: 'calificaciones',
            label: 'Calificaciones',
            icon: 'star',
            route: '/admin/examenes/calificaciones',
            tags: ['calificaciones', 'notas', 'resultados']
          }
        ]
      },

      // Module 5: Users
      {
        id: 'usuarios',
        label: 'Usuarios',
        icon: 'users',
        expanded: false,
        items: [
          {
            id: 'usuarios-gestion',
            label: 'Gestión de Usuarios',
            icon: 'user-cog',
            route: '/admin/users',
            tags: ['usuarios', 'gestión', 'administrar']
          },
          {
            id: 'usuarios-activos',
            label: 'Usuarios Activos',
            icon: 'user',
            route: '/admin/users/active',
            tags: ['activos', 'habilitados']
          },
          {
            id: 'usuarios-inactivos',
            label: 'Usuarios Inactivos',
            icon: 'user-slash',
            route: '/admin/users/inactive',
            tags: ['inactivos', 'deshabilitados']
          },
          {
            id: 'usuarios-bloqueados',
            label: 'Usuarios Bloqueados',
            icon: 'user-lock',
            route: '/admin/users/blocked',
            tags: ['bloqueados', 'suspendidos']
          },
          {
            id: 'perfiles',
            label: 'Perfiles',
            icon: 'user-circle',
            route: '/admin/perfiles',
            tags: ['perfiles', 'información', 'personal']
          },
          {
            id: 'roles-permisos',
            label: 'Roles y Permisos',
            icon: 'user-shield',
            route: '/admin/roles',
            tags: ['roles', 'permisos', 'accesos']
          },
          {
            id: 'actividad-usuarios',
            label: 'Actividad',
            icon: 'chart-line',
            route: '/admin/actividad',
            tags: ['actividad', 'logs', 'auditoría']
          }
        ]
      },

      // Module 6: Communications
      {
        id: 'comunicaciones',
        label: 'Comunicaciones',
        icon: 'comments',
        expanded: false,
        items: [
          {
            id: 'comunicaciones-dashboard',
            label: 'Dashboard',
            icon: 'tachometer-alt',
            route: '/admin/comunicaciones/dashboard',
            tags: ['dashboard', 'resumen', 'métricas']
          },
          {
            id: 'enviar-mensajes',
            label: 'Enviar Mensajes',
            icon: 'paper-plane',
            route: '/admin/comunicaciones/mensajes',
            tags: ['enviar', 'mensajes', 'masivos', 'notificaciones']
          },
          {
            id: 'plantillas',
            label: 'Plantillas',
            icon: 'file-alt',
            route: '/admin/comunicaciones/plantillas',
            tags: ['plantillas', 'templates', 'modelos']
          },
          {
            id: 'historial',
            label: 'Historial',
            icon: 'history',
            route: '/admin/comunicaciones/historial',
            tags: ['historial', 'enviados', 'registro']
          },
          {
            id: 'notificaciones',
            label: 'Cola de Notificaciones',
            icon: 'bell',
            route: '/admin/comunicaciones/notificaciones',
            tags: ['notificaciones', 'cola', 'pendientes']
          },
          {
            id: 'triggers',
            label: 'Triggers Automáticos',
            icon: 'cogs',
            route: '/admin/comunicaciones/triggers',
            tags: ['triggers', 'automático', 'reglas']
          },
          {
            id: 'eventos',
            label: 'Eventos del Sistema',
            icon: 'calendar-alt',
            route: '/admin/comunicaciones/eventos',
            tags: ['eventos', 'sistema', 'log']
          },
          {
            id: 'monitoreo',
            label: 'Monitoreo',
            icon: 'chart-line',
            route: '/admin/comunicaciones/monitoreo',
            tags: ['monitoreo', 'rendimiento', 'métricas']
          },
          {
            id: 'estadisticas',
            label: 'Estadísticas',
            icon: 'chart-bar',
            route: '/admin/comunicaciones/estadisticas',
            tags: ['estadísticas', 'métricas', 'reportes']
          }
        ]
      },

      // Module 7: Reports
      {
        id: 'reportes',
        label: 'Reportes',
        icon: 'chart-bar',
        expanded: false,
        items: [
          {
            id: 'dashboard-analitico',
            label: 'Dashboard Analítico',
            icon: 'chart-line',
            route: '/admin/reportes/dashboard',
            tags: ['analítica', 'estadísticas', 'métricas']
          },
          {
            id: 'constructor-reportes',
            label: 'Constructor de Reportes',
            icon: 'tools',
            route: '/admin/reportes/constructor',
            tags: ['constructor', 'personalizado', 'reportes']
          },
          {
            id: 'reportes-predefinidos',
            label: 'Reportes Predefinidos',
            icon: 'file-alt',
            route: '/admin/reportes',
            tags: ['reportes', 'informes', 'predefinidos']
          }
        ]
      },

      // Module 8: System Administration
      {
        id: 'sistema',
        label: 'Sistema',
        icon: 'cogs',
        expanded: false,
        items: [
          {
            id: 'configuracion',
            label: 'Configuración',
            icon: 'cog',
            route: '/admin/configuracion',
            tags: ['configuración', 'ajustes', 'parámetros']
          },
          {
            id: 'monitoreo-sistema', // Changed ID to avoid conflict with 'comunicaciones-monitoreo'
            label: 'Monitoreo',
            icon: 'heartbeat',
            route: '/admin/sistema/monitoreo',
            tags: ['monitoreo', 'rendimiento', 'estado']
          },
          {
            id: 'auditoria',
            label: 'Auditoría',
            icon: 'shield-alt',
            route: '/admin/sistema/auditoria',
            tags: ['auditoría', 'seguridad', 'logs']
          },
          {
            id: 'backups',
            label: 'Copias de Seguridad',
            icon: 'database',
            route: '/admin/sistema/backups',
            tags: ['backups', 'respaldos', 'copias']
          }
        ]
      },

      // Module 9: Support System
      {
        id: 'soporte',
        label: 'Soporte',
        icon: 'headset',
        expanded: false,
        items: [
          {
            id: 'soporte-dashboard',
            label: 'Dashboard de Soporte',
            icon: 'chart-pie',
            route: '/admin/soporte/dashboard',
            tags: ['soporte', 'dashboard', 'tickets', 'estadísticas']
          },
          {
            id: 'tickets-gestion',
            label: 'Gestión de Tickets',
            icon: 'ticket-alt',
            route: '/admin/soporte/tickets',
            badge: {
              value: 0,
              color: 'warn'
            },
            tags: ['tickets', 'gestión', 'soporte']
          },
          {
            id: 'tickets-asignados',
            label: 'Mis Tickets Asignados',
            icon: 'user-check',
            route: '/admin/soporte/agent/assigned',
            badge: {
              value: 0,
              color: 'info'
            },
            tags: ['asignados', 'agente', 'mis tickets']
          },
          {
            id: 'soporte-configuracion',
            label: 'Configuración SLA',
            icon: 'clock',
            route: '/admin/soporte/configuration/sla',
            tags: ['sla', 'configuración', 'escalamiento']
          },
          {
            id: 'plantillas-respuesta',
            label: 'Plantillas de Respuesta',
            icon: 'comment-dots',
            route: '/admin/soporte/configuration/templates',
            tags: ['plantillas', 'respuestas', 'automatización']
          },
          {
            id: 'soporte-reportes',
            label: 'Reportes de Soporte',
            icon: 'chart-line',
            route: '/admin/soporte/reports/analytics',
            tags: ['reportes', 'análisis', 'métricas']
          }
        ]
      },

      // Module 10: Help and Documentation
      {
        id: 'ayuda',
        label: 'Ayuda',
        icon: 'question-circle',
        expanded: false,
        items: [
          {
            id: 'centro-ayuda',
            label: 'Centro de Ayuda',
            icon: 'info-circle',
            route: '/admin/ayuda',
            tags: ['ayuda', 'soporte', 'asistencia']
          },
          {
            id: 'base-conocimientos',
            label: 'Base de Conocimientos',
            icon: 'book',
            route: '/admin/ayuda/categoria/general',
            tags: ['conocimientos', 'documentación', 'guías']
          },
          {
            id: 'tutoriales',
            label: 'Tutoriales',
            icon: 'graduation-cap',
            route: '/admin/ayuda/tutorial/create-user-tutorial',
            tags: ['tutoriales', 'guías', 'aprendizaje']
          }
        ]
      }
    ];
    this.loggingService.info('[AdminSidebar] Modules initialized.', undefined, 'AdminSidebar');
  }

  /**
   * Toggles a menu item as a favorite.
   * @param item The SidebarMenuItem to toggle.
   * @param event The mouse event.
   */
  toggleFavorite(item: SidebarMenuItem, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    item.isFavorite = !item.isFavorite;

    // Update favorites list
    if (item.isFavorite) {
      this.favoriteItems.push(item);
      this.loggingService.debug(`[AdminSidebar] Added to favorites: ${item.id}`, undefined, 'AdminSidebar');
    } else {
      this.favoriteItems = this.favoriteItems.filter(fav => fav.id !== item.id);
      this.loggingService.debug(`[AdminSidebar] Removed from favorites: ${item.id}`, undefined, 'AdminSidebar');
    }

    // Save favorites to localStorage
    this.saveFavorites();
  }

  /**
   * Handles search query changes.
   * @param query The search query string.
   */
  onSearchChange(query: string): void {
    this.searchQuery = query;
    this.searchSubject.next(query);
    this.isSearching = query.length > 0;
    this.loggingService.debug(`[AdminSidebar] Search query changed: "${query}"`, undefined, 'AdminSidebar');
  }

  /**
   * Performs the search on all menu items.
   * @param query The search query.
   */
  private performSearch(query: string): void {
    if (!query || query.trim() === '') {
      this.searchResults = [];
      this.loggingService.debug('[AdminSidebar] Search query is empty, clearing results.', undefined, 'AdminSidebar');
      return;
    }

    query = query.toLowerCase().trim();
    this.loggingService.info(`[AdminSidebar] Performing search for: "${query}"`, undefined, 'AdminSidebar');

    const results: SidebarMenuItem[] = [];

    this.modules.forEach(module => {
      module.items.forEach(item => {
        // Search by label, tags or route
        const match =
          item.label.toLowerCase().includes(query) ||
          (item.tags && item.tags.some(tag => tag.toLowerCase().includes(query))) ||
          item.route.toLowerCase().includes(query);

        if (match) {
          results.push(item);
        }

        // Search in children elements if any
        if (item.children) {
          item.children.forEach(child => {
            const childMatch =
              child.label.toLowerCase().includes(query) ||
              (child.tags && child.tags.some(tag => tag.toLowerCase().includes(query))) ||
              child.route.toLowerCase().includes(query);

            if (childMatch) {
              results.push(child);
            }
          });
        }
      });
    });

    // Sort results by relevance (label match first)
    this.searchResults = results.sort((a, b) => {
      const aLabelMatch = a.label.toLowerCase().includes(query);
      const bLabelMatch = b.label.toLowerCase().includes(query);

      if (aLabelMatch && !bLabelMatch) return -1;
      if (!aLabelMatch && bLabelMatch) return 1;
      return 0;
    });

    this.loggingService.debug(`[AdminSidebar] Search found ${this.searchResults.length} results.`, undefined, 'AdminSidebar');
  }

  /**
   * Saves the expansion state of modules to localStorage.
   */
  private saveModulesState(): void {
    const moduleStates = this.modules.map(module => ({
      id: module.id,
      expanded: module.expanded || false
    }));
    this.sidebarCustomizationService.saveModulesState(moduleStates);
    this.loggingService.debug('[AdminSidebar] Module expansion states saved.', undefined, 'AdminSidebar');

    const moduleOrder = this.modules.map(m => m.id);
    this.sidebarCustomizationService.saveModuleOrder(moduleOrder);
    this.loggingService.debug('[AdminSidebar] Module order saved.', undefined, 'AdminSidebar');
  }

  /**
   * Loads the expansion state of modules from localStorage.
   */
  private loadModulesState(): void {
    const savedStates = this.sidebarCustomizationService.loadModulesState();
    if (savedStates) {
      try {
        savedStates.forEach((state: { id: string, expanded: boolean }) => {
          const module = this.modules.find(m => m.id === state.id);
          if (module) {
            module.expanded = state.expanded;
          }
        });
        this.loggingService.debug('[AdminSidebar] Module expansion states loaded.', undefined, 'AdminSidebar');
      } catch (error) {
        this.loggingService.error('[AdminSidebar] Error loading module expansion states:', error, 'AdminSidebar');
      }
    }

    const savedOrder = this.sidebarCustomizationService.loadModuleOrder();
    if (savedOrder && savedOrder.length === this.modules.length) {
      // Reorder modules based on saved order
      const reorderedModules: SidebarModule[] = [];
      savedOrder.forEach(id => {
        const module = this.modules.find(m => m.id === id);
        if (module) {
          reorderedModules.push(module);
        }
      });
      // Ensure all modules are still present, even if some weren't in savedOrder
      const missingModules = this.modules.filter(m => !savedOrder.includes(m.id));
      this.modules = [...reorderedModules, ...missingModules];
      this.loggingService.debug('[AdminSidebar] Module order loaded and applied.', undefined, 'AdminSidebar');
    }
  }

  /**
   * Saves favorite items to localStorage.
   */
  private saveFavorites(): void {
    const favoriteIds = this.favoriteItems.map(item => item.id);
    this.sidebarCustomizationService.saveFavorites(favoriteIds);
    this.loggingService.debug('[AdminSidebar] Favorites saved.', undefined, 'AdminSidebar');
  }

  /**
   * Loads favorite items from localStorage and marks them in the `modules` structure.
   */
  private loadFavorites(): void {
    const savedFavoriteIds = this.sidebarCustomizationService.loadFavorites();
    if (savedFavoriteIds) {
      this.favoriteItems = []; // Clear existing favorites

      this.modules.forEach(module => {
        module.items.forEach(item => {
          if (savedFavoriteIds.includes(item.id)) {
            item.isFavorite = true;
            this.favoriteItems.push(item);
          }
          if (item.children) {
            item.children.forEach(child => {
              if (savedFavoriteIds.includes(child.id)) {
                child.isFavorite = true;
                this.favoriteItems.push(child);
              }
            });
          }
        });
      });
      this.loggingService.debug('[AdminSidebar] Favorites loaded and applied to menu items.', undefined, 'AdminSidebar');
    }
  }

  /**
   * Sets up dynamic badge updates by subscribing to relevant services.
   */
  private setupDynamicBadges(): void {
    this.loggingService.info('[AdminSidebar] Setting up dynamic badges.', undefined, 'AdminSidebar');

    // Concursos (Active Contests Count) - Comentado hasta que el método esté disponible
    // this.concursosService.activeContestsCount$.pipe(
    //   takeUntil(this.destroy$),
    //   tap(count => {
    //     this.updateBadge('concursos-listado', count as number, 'info');
    //     this.loggingService.debug(`[AdminSidebar] Updated active contests badge: ${count}`, undefined, 'AdminSidebar');
    //   })
    // ).subscribe();

    // Inscripciones (Pending, Approved, Rejected, Documentation)
    this.inscriptionService.inscriptions.pipe(
      takeUntil(this.destroy$),
      tap((inscriptions: any) => {
        const inscriptionsArray = Array.isArray(inscriptions) ? inscriptions : [];
        const pendingCount = inscriptionsArray.filter((i: any) => i.state === 'PENDING').length;
        const approvedCount = inscriptionsArray.filter((i: any) => i.state === 'APPROVED').length;
        const rejectedCount = inscriptionsArray.filter((i: any) => i.state === 'REJECTED').length;
        // Assuming 'documentation' badge reflects pending review for documentation
        const documentationPendingCount = inscriptionsArray.filter((i: any) => i.state === 'COMPLETED_PENDING_DOCS').length; // Example logic

        this.updateBadge('inscripciones-listado', inscriptionsArray.length, 'warn');
        this.updateBadge('inscripciones-pendientes', pendingCount, 'warn');
        this.updateBadge('inscripciones-aprobadas', approvedCount, 'success');
        this.updateBadge('inscripciones-rechazadas', rejectedCount, 'warn');
        this.updateBadge('inscripciones-documentacion', documentationPendingCount, 'warn');

        this.loggingService.debug(`[AdminSidebar] Updated inscription badges: Pending=${pendingCount}, Approved=${approvedCount}, Rejected=${rejectedCount}, DocsPending=${documentationPendingCount}`, undefined, 'AdminSidebar');
      })
    ).subscribe();

    // Admin Notifications (General count) - Comentado hasta que el método esté disponible
    // this.adminNotificationsService.getNotifications().pipe(
    //   takeUntil(this.destroy$),
    //   map((notifications: any) => notifications.filter((n: any) => !n.read).length), // Count unread notifications
    //   tap(count => {
    //     this.updateBadge('dashboard', count as number, 'primary'); // Example: badge on main dashboard
    //     this.loggingService.debug(`[AdminSidebar] Updated general notifications badge: ${count}`, undefined, 'AdminSidebar');
    //   })
    // ).subscribe();

    // Support Tickets (Total pending, Assigned to me) - Hypothetical service calls
    // You would integrate with your actual support ticket service here
    // Example:
    // this.supportTicketService.getPendingTicketsCount().pipe(
    //   takeUntil(this.destroy$),
    //   tap(count => this.updateBadge('tickets-gestion', count, 'warn'))
    // ).subscribe();

    // this.supportTicketService.getAssignedTicketsCount(this.authService.getCurrentUserId()).pipe(
    //   takeUntil(this.destroy$),
    //   tap(count => this.updateBadge('tickets-asignados', count, 'info'))
    // ).subscribe();

    // WebSocket Notifications (if specific counts are pushed) - Comentado hasta que el método esté disponible
    // this.webSocketService.getNotifications().pipe(
    //   takeUntil(this.destroy$),
    //   tap((notification: any) => {
    //     // Example: If WebSocket sends a notification for new pending inscription
    //     if (notification.type === 'NEW_INSCRIPTION_PENDING') {
    //       // Trigger a refresh of inscriptions to update count
    //       this.inscriptionService.refreshInscriptions().subscribe();
    //       this.loggingService.info('[AdminSidebar] WebSocket notification for new pending inscription received. Refreshing inscriptions.', undefined, 'AdminSidebar');
    //     }
    //     // You can add more logic here based on your WebSocket notification types
    //   })
    // ).subscribe();

    // Example of using AlertPrioritizationService - Usar el observable disponible
    this.alertPrioritizationService.highPriorityAlerts$.pipe(
      takeUntil(this.destroy$),
      tap((alerts: any) => {
        const alertsArray = Array.isArray(alerts) ? alerts : [];
        const count = alertsArray.length;
        // You might assign this to a specific high-priority alerts menu item or general dashboard
        this.updateBadge('main-dashboard', count, 'accent');
        this.loggingService.debug(`[AdminSidebar] Updated high priority alerts badge: ${count}`, undefined, 'AdminSidebar');
      })
    ).subscribe();

    // Initial fetch to populate badges immediately on load - Comentado hasta que los métodos estén disponibles
    // this.concursosService.refreshActiveContestsCount();
    this.inscriptionService.refreshInscriptions();
    // this.adminNotificationsService.refreshNotifications();
  }

  /**
   * Updates the badge value for a specific menu item.
   * @param itemId The ID of the menu item.
   * @param value The new badge value.
   * @param color The badge color.
   */
  private updateBadge(itemId: string, value: number | string, color: 'primary' | 'accent' | 'warn' | 'success' | 'info'): void {
    // Find the item within modules
    let found = false;
    for (const module of this.modules) {
      for (const item of module.items) {
        if (item.id === itemId) {
          if (!item.badge) {
            item.badge = { value: 0, color: 'primary' }; // Initialize if null
          }
          item.badge.value = value;
          item.badge.color = color;
          found = true;
          break;
        }
        if (item.children) {
          for (const child of item.children) {
            if (child.id === itemId) {
              if (!child.badge) {
                child.badge = { value: 0, color: 'primary' };
              }
              child.badge.value = value;
              child.badge.color = color;
              found = true;
              break;
            }
          }
        }
        if (found) break;
      }
      if (found) break;
    }

    // Also update in favoriteItems if present
    const favItem = this.favoriteItems.find(fav => fav.id === itemId);
    if (favItem) {
      if (!favItem.badge) {
        favItem.badge = { value: 0, color: 'primary' };
      }
      favItem.badge.value = value;
      favItem.badge.color = color;
    }
  }

  /**
   * Toggles the customization mode on/off.
   * This reveals drag handles and the customization panel.
   */
  toggleCustomizationMode(): void {
    this.isCustomizationMode = !this.isCustomizationMode;
    this.isDragMode = this.isCustomizationMode; // Drag mode is active when in customization mode
    this.showCustomizationPanel = this.isCustomizationMode;
    this.loggingService.info(`[AdminSidebar] Customization mode toggled to: ${this.isCustomizationMode}`, undefined, 'AdminSidebar');

    if (!this.isCustomizationMode) {
      // If exiting customization mode, save the current order
      this.saveModulesState();
    }
  }

  /**
   * Handles the drop event when reordering modules.
   * @param event The CdkDragDrop event.
   */
  drop(event: CdkDragDrop<SidebarModule[]>): void {
    this.loggingService.debug('[AdminSidebar] Drag & Drop event triggered.', event, 'AdminSidebar');
    // Ensure that the drop occurred within the same list
    if (event.previousContainer === event.container) {
      moveItemInArray(this.modules, event.previousIndex, event.currentIndex);
      this.saveModulesState(); // Save the new order
      this.loggingService.info('[AdminSidebar] Modules reordered successfully.', undefined, 'AdminSidebar');
    }
  }

  /**
   * Resets sidebar customization to default.
   */
  resetCustomization(): void {
    this.sidebarCustomizationService.clearAllCustomization();
    this.initModules(); // Re-initialize to default order and expansion
    this.loadModulesState(); // Load default (which is now just init)
    this.favoriteItems = []; // Clear favorites visually
    this.modules.forEach(module => module.items.forEach(item => item.isFavorite = false)); // Clear favorite flags on items
    this.loggingService.info('[AdminSidebar] Sidebar customization reset to default.', undefined, 'AdminSidebar');
  }

  // ===== MÉTODOS FALTANTES PARA EL TEMPLATE =====

  /**
   * Toggles drag mode for reordering modules.
   */
  toggleDragMode(): void {
    this.isDragMode = !this.isDragMode;
    this.loggingService.debug(`[AdminSidebar] Drag mode toggled to: ${this.isDragMode}`, undefined, 'AdminSidebar');
  }

  /**
   * Handles module drop event for reordering.
   * @param event The CdkDragDrop event.
   */
  onModuleDrop(event: CdkDragDrop<SidebarModule[]>): void {
    this.drop(event); // Reutilizar el método existente
  }

  /**
   * Toggles the expansion of a module.
   * @param module The module to toggle.
   * @param event The mouse event.
   */
  toggleModule(module: SidebarModule, event?: MouseEvent): void {
    this.toggleExpanded(module, event); // Reutilizar el método existente
  }

  /**
   * Sets the expanded state of an item.
   * @param item The item to expand/collapse.
   */
  setExpanded(item: SidebarMenuItem): void {
    item.expanded = !item.expanded;
    this.loggingService.debug(`[AdminSidebar] Item expanded state set for: ${item.id} to ${item.expanded}`, undefined, 'AdminSidebar');
  }

  /**
   * Menu items for the sidebar (computed property).
   */
  get menuItems(): SidebarMenuItem[] {
    // Retornar todos los items de todos los módulos aplanados
    return this.modules.reduce((items: SidebarMenuItem[], module) => {
      return items.concat(module.items);
    }, []);
  }

  /**
   * Toggles the expansion of a submenu.
   * @param item The menu item with submenu.
   * @param event The mouse event.
   */
  toggleSubMenu(item: SidebarMenuItem, event?: MouseEvent): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (item.children && item.children.length > 0) {
      item.expanded = !item.expanded;
      this.loggingService.debug(`[AdminSidebar] Submenu toggled for: ${item.id} to ${item.expanded}`, undefined, 'AdminSidebar');
    }
  }

  /**
   * Sets the active floating module.
   */
  setActiveFloatingModule(): void {
    // Este método puede ser usado para activar/desactivar el módulo flotante
    this.activeFloatingModule = null;
    this.loggingService.debug('[AdminSidebar] Active floating module cleared.', undefined, 'AdminSidebar');
  }

  /**
   * Closes the floating menu.
   */
  closeFloatingMenu(): void {
    this.activeFloatingModule = null;
    this.activeFloatingMenu = null;
    this.loggingService.debug('[AdminSidebar] Floating menu closed.', undefined, 'AdminSidebar');
  }

  /**
   * Changes the theme.
   * @param theme The new theme value.
   */
  changeTheme(theme: string): void {
    // Implementar cambio de tema
    this.loggingService.info(`[AdminSidebar] Theme changed to: ${theme}`, undefined, 'AdminSidebar');
    // Aquí se puede integrar con un servicio de temas
  }

  /**
   * Changes the density.
   * @param density The new density value.
   */
  changeDensity(density: string): void {
    // Implementar cambio de densidad
    this.loggingService.info(`[AdminSidebar] Density changed to: ${density}`, undefined, 'AdminSidebar');
    // Aquí se puede integrar con un servicio de configuración
  }

  /**
   * Exports the current configuration.
   */
  exportConfiguration(): void {
    const config = {
      modules: this.modules,
      favorites: this.favoriteItems,
      customization: {
        isDragMode: this.isDragMode,
        showFavorites: this.showFavorites
      }
    };

    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'sidebar-configuration.json';
    link.click();

    URL.revokeObjectURL(url);
    this.loggingService.info('[AdminSidebar] Configuration exported successfully.', undefined, 'AdminSidebar');
  }

  /**
   * Imports configuration from a file.
   * @param event The file input change event.
   */
  importConfiguration(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const config = JSON.parse(e.target?.result as string);

          if (config.modules) {
            this.modules = config.modules;
          }
          if (config.favorites) {
            this.favoriteItems = config.favorites;
          }
          if (config.customization) {
            this.isDragMode = config.customization.isDragMode || false;
            this.showFavorites = config.customization.showFavorites !== false;
          }

          this.saveModulesState();
          this.saveFavorites();
          this.loggingService.info('[AdminSidebar] Configuration imported successfully.', undefined, 'AdminSidebar');
        } catch (error) {
          this.loggingService.error('[AdminSidebar] Error importing configuration:', error, 'AdminSidebar');
        }
      };
      reader.readAsText(file);
    }

    // Reset the input
    input.value = '';
  }

  /**
   * Resets configuration to default.
   */
  resetToDefault(): void {
    this.resetCustomization(); // Reutilizar el método existente
  }

  /**
   * Logs out the current user.
   */
  logout(): void {
    this.authService.logout();
    this.loggingService.info('[AdminSidebar] User logged out.', undefined, 'AdminSidebar');
  }
}
