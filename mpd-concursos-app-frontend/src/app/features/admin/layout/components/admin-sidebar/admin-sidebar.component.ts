import { Component, Input, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { Subject, BehaviorSubject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
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

// Componentes personalizados
import { CustomDividerComponent } from '@shared/components/custom-form/custom-divider/custom-divider.component';
import { TooltipDirective } from '@shared/directives/tooltip.directive';
import { AnimateDirective } from '@shared/directives/animate.directive';

/**
 * Interfaz para un módulo del sidebar
 */
interface SidebarModule {
  id: string;
  label: string;
  icon: string;
  expanded?: boolean;
  items: SidebarMenuItem[];
}

/**
 * Interfaz para un elemento del menú del sidebar
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
  tags?: string[]; // Para búsqueda
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
    AnimateDirective
  ],
  animations: [
    trigger('moduleAnimation', [
      state('expanded', style({ height: '*', opacity: 1 })),
      state('collapsed', style({ height: '0px', opacity: 0 })),
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

  // Módulos del sidebar
  modules: SidebarModule[] = [];

  // Favoritos
  favoriteItems: SidebarMenuItem[] = [];
  showFavorites = true;

  // Búsqueda
  searchQuery = '';
  searchResults: SidebarMenuItem[] = [];
  isSearching = false;
  private searchSubject = new BehaviorSubject<string>('');

  // Menú flotante para modo colapsado
  activeFloatingModule: SidebarModule | null = null;
  activeFloatingMenu: SidebarMenuItem | null = null;
  floatingMenuPosition = { top: 0, left: 0 };

  // Para limpieza de suscripciones
  private destroy$ = new Subject<void>();

  // Mantener la estructura antigua para compatibilidad durante la migración
  menuItems: SidebarMenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'tachometer-alt',
      route: '/admin/dashboard'
    },
    {
      id: 'users',
      label: 'Users',
      icon: 'users',
      route: '/admin/users',
      children: [
        {
          id: 'all-users',
          label: 'All Users',
          icon: 'user-friends',
          route: '/admin/users'
        },
        {
          id: 'active-users',
          label: 'Active',
          icon: 'user',
          route: '/admin/users/active'
        },
        {
          id: 'inactive-users',
          label: 'Inactive',
          icon: 'user-slash',
          route: '/admin/users/inactive'
        },
        {
          id: 'blocked-users',
          label: 'Blocked',
          icon: 'user-lock',
          route: '/admin/users/blocked'
        }
      ]
    },
    {
      id: 'roles',
      label: 'Roles',
      icon: 'user-shield',
      route: '/admin/roles',
      children: [
        {
          id: 'roles-todos',
          label: 'Todos',
          icon: 'list',
          route: '/admin/roles'
        },
        {
          id: 'roles-sistema',
          label: 'Sistema',
          icon: 'shield-alt',
          route: '/admin/roles/sistema'
        },
        {
          id: 'roles-personalizados',
          label: 'Personalizados',
          icon: 'user-tag',
          route: '/admin/roles/personalizados'
        }
      ]
    },
    {
      id: 'actividad',
      label: 'Actividad',
      icon: 'chart-line',
      route: '/admin/actividad',
      children: [
        {
          id: 'actividad-todos',
          label: 'Todos',
          icon: 'list',
          route: '/admin/actividad'
        },
        {
          id: 'actividad-login',
          label: 'Inicios de Sesión',
          icon: 'sign-in-alt',
          route: '/admin/actividad/login'
        },
        {
          id: 'actividad-usuarios',
          label: 'Usuarios',
          icon: 'users',
          route: '/admin/actividad/usuarios'
        },
        {
          id: 'actividad-concursos',
          label: 'Concursos',
          icon: 'gavel',
          route: '/admin/actividad/concursos'
        },
        {
          id: 'actividad-inscripciones',
          label: 'Inscripciones',
          icon: 'clipboard-list',
          route: '/admin/actividad/inscripciones'
        }
      ]
    },
    {
      id: 'perfiles',
      label: 'Perfiles',
      icon: 'user-circle',
      route: '/admin/perfiles',
      children: [
        {
          id: 'perfiles-todos',
          label: 'Todos',
          icon: 'list',
          route: '/admin/perfiles'
        },
        {
          id: 'perfiles-activos',
          label: 'Activos',
          icon: 'check-circle',
          route: '/admin/perfiles/activos'
        },
        {
          id: 'perfiles-inactivos',
          label: 'Inactivos',
          icon: 'times-circle',
          route: '/admin/perfiles/inactivos'
        },
        {
          id: 'perfiles-bloqueados',
          label: 'Bloqueados',
          icon: 'ban',
          route: '/admin/perfiles/bloqueados'
        },
        {
          id: 'perfiles-completos',
          label: 'Completos',
          icon: 'user-check',
          route: '/admin/perfiles/completos'
        },
        {
          id: 'perfiles-incompletos',
          label: 'Incompletos',
          icon: 'user-edit',
          route: '/admin/perfiles/incompletos'
        }
      ]
    },
    {
      id: 'concursos',
      label: 'Concursos',
      icon: 'gavel',
      route: '/admin/concursos',
      children: [
        {
          id: 'concursos-listado',
          label: 'Listado',
          icon: 'list',
          route: '/admin/concursos/listado'
        },
        {
          id: 'concursos-nuevo',
          label: 'Crear Nuevo',
          icon: 'plus-circle',
          route: '/admin/concursos/nuevo'
        },
        {
          id: 'concursos-calendario',
          label: 'Calendario',
          icon: 'calendar-alt',
          route: '/admin/concursos/calendario'
        },
        {
          id: 'concursos-fechas',
          label: 'Fechas Importantes',
          icon: 'calendar-check',
          route: '/admin/concursos/dashboard'
        }
      ]
    },
    {
      id: 'inscripciones',
      label: 'Inscripciones',
      icon: 'clipboard-check',
      route: '/admin/inscripciones',
      children: [
        {
          id: 'inscripciones-dashboard',
          label: 'Dashboard',
          icon: 'tachometer-alt',
          route: '/admin/inscripciones/dashboard'
        },
        {
          id: 'inscripciones-listado',
          label: 'Listado',
          icon: 'list',
          route: '/admin/inscripciones/listado'
        },
        {
          id: 'inscripciones-pendientes',
          label: 'Pendientes',
          icon: 'clock',
          route: '/admin/inscripciones/pendientes'
        },
        {
          id: 'inscripciones-aprobadas',
          label: 'Aprobadas',
          icon: 'check-circle',
          route: '/admin/inscripciones/aprobadas'
        },
        {
          id: 'inscripciones-rechazadas',
          label: 'Rechazadas',
          icon: 'times-circle',
          route: '/admin/inscripciones/rechazadas'
        },
        {
          id: 'inscripciones-documentos',
          label: 'Documentos',
          icon: 'file-alt',
          route: '/admin/inscripciones/documentos'
        },
        {
          id: 'inscripciones-seguimiento',
          label: 'Seguimiento',
          icon: 'search',
          route: '/admin/inscripciones/seguimiento'
        },
        {
          id: 'inscripciones-ciclo-vida',
          label: 'Ciclo de Vida',
          icon: 'sync',
          route: '/admin/inscripciones/ciclo-vida'
        }
      ]
    },
    {
      id: 'documentos',
      label: 'Documentos',
      icon: 'file-alt',
      route: '/admin/documentos'
    },
    {
      id: 'examenes',
      label: 'Exámenes',
      icon: 'clipboard-list',
      route: '/admin/examenes'
    },
    {
      id: 'preguntas',
      label: 'Preguntas',
      icon: 'question-circle',
      route: '/admin/preguntas'
    },
    {
      id: 'comunicaciones',
      label: 'Comunicaciones',
      icon: 'comments',
      route: '/admin/comunicaciones/mensajes'
    },
    {
      id: 'reportes',
      label: 'Reportes',
      icon: 'chart-bar',
      route: '/admin/reportes'
    },
    {
      id: 'configuracion',
      label: 'Configuración',
      icon: 'cog',
      route: '/admin/configuracion'
    },
    {
      id: 'ayuda',
      label: 'Ayuda',
      icon: 'question-circle',
      route: '/admin/ayuda',
      children: [
        {
          id: 'ayuda-centro',
          label: 'Centro de Ayuda',
          icon: 'info-circle',
          route: '/admin/ayuda'
        },
        {
          id: 'ayuda-conocimientos',
          label: 'Base de Conocimientos',
          icon: 'book',
          route: '/admin/ayuda/categoria/general'
        },
        {
          id: 'ayuda-tutoriales',
          label: 'Tutoriales',
          icon: 'graduation-cap',
          route: '/admin/ayuda/tutorial/create-user-tutorial'
        }
      ]
    }
  ];



  constructor(private authService: AuthService, 
              private concursosService: ConcursosService,
              private inscriptionService: InscriptionService) {
    // Configurar búsqueda con debounce
    this.searchSubject.pipe(
      takeUntil(this.destroy$),
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      this.performSearch(query);
    });
  }

  ngOnInit(): void {
    // Inicializar la estructura modular
    this.initModules();

    // Cargar estado guardado de módulos expandidos
    this.loadModulesState();

    // Cargar favoritos guardados
    this.loadFavorites();

    // Inicializar el estado expandido de los elementos con hijos (compatibilidad)
    this.menuItems.forEach(item => {
      if (item.children) {
        item.expanded = false;
      }
    });

    // --- ACTUALIZACIÓN DE BADGES DINÁMICOS ---
    // Concursos
    const concursosModulo = this.modules.find(m => m.id === 'concursos');
    if (concursosModulo) {
      const gestionConcursos = concursosModulo.items.find(i => i.id === 'concursos-listado');
      this.concursosService.getConcursos().subscribe(concursos => {
        if (gestionConcursos && gestionConcursos.badge) {
          gestionConcursos.badge.value = concursos.length;
        }
      });
    }

    // Inscripciones
    const inscripcionesModulo = this.modules.find(m => m.id === 'inscripciones');
    if (inscripcionesModulo) {
      const gestionInscripciones = inscripcionesModulo.items.find(i => i.id === 'inscripciones-listado');
      const pendientes = inscripcionesModulo.items.find(i => i.id === 'inscripciones-pendientes');
      const aprobadas = inscripcionesModulo.items.find(i => i.id === 'inscripciones-aprobadas');
      const rechazadas = inscripcionesModulo.items.find(i => i.id === 'inscripciones-rechazadas');
      const documentacion = inscripcionesModulo.items.find(i => i.id === 'inscripciones-documentacion');

      this.inscriptionService.inscriptions.subscribe((inscripciones: IInscription[]) => {
        if (gestionInscripciones && gestionInscripciones.badge) {
          gestionInscripciones.badge.value = inscripciones.length;
        }
        if (pendientes && pendientes.badge) {
          pendientes.badge.value = inscripciones.filter(i => i.state === 'PENDING').length;
        }
        if (aprobadas && aprobadas.badge) {
          aprobadas.badge.value = inscripciones.filter(i => i.state === 'APPROVED').length;
        }
        if (rechazadas && rechazadas.badge) {
          rechazadas.badge.value = inscripciones.filter(i => i.state === 'REJECTED').length;
        }
        if (documentacion && documentacion.badge) {
          // Ajusta este filtro si tienes un criterio específico para "documentación pendiente"
          documentacion.badge.value = inscripciones.filter(i => i.state === 'PENDING').length;
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.activeFloatingMenu = null;
    this.activeFloatingModule = null;
  }

  /**
   * Inicializa la estructura modular del sidebar
   */
  private initModules(): void {
    this.modules = [
      // Módulo 1: Dashboard
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

      // Módulo 2: Concursos
      {
        id: 'concursos',
        label: 'Módulo de Concursos',
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
            route: '/admin/concursos/fechas-importantes',
            tags: ['fechas', 'importantes', 'plazos']
          }
        ]
      },

      // Módulo 3: Inscripciones
      {
        id: 'inscripciones',
        label: 'Módulo de Inscripciones',
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

      // Módulo 4: Evaluaciones
      {
        id: 'evaluaciones',
        label: 'Módulo de Evaluaciones',
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

      // Módulo 5: Usuarios
      {
        id: 'usuarios',
        label: 'Módulo de Usuarios',
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

      // Módulo 6: Comunicaciones
      {
        id: 'comunicaciones',
        label: 'Comunicaciones Masivas',
        icon: 'comments',
        expanded: false,
        items: [
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
            id: 'estadisticas',
            label: 'Estadísticas',
            icon: 'chart-bar',
            route: '/admin/comunicaciones/estadisticas',
            tags: ['estadísticas', 'métricas', 'reportes']
          }
        ]
      },

      // Módulo 7: Reportes
      {
        id: 'reportes',
        label: 'Módulo de Reportes',
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

      // Módulo 8: Administración del Sistema
      {
        id: 'sistema',
        label: 'Administración del Sistema',
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
            id: 'monitoreo',
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

      // Módulo 9: Ayuda y Soporte
      {
        id: 'ayuda',
        label: 'Ayuda y Soporte',
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
  }

  /**
   * Alterna la expansión de un módulo
   */
  toggleModule(module: SidebarModule, event?: MouseEvent): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (this.collapsed) {
      // En modo colapsado, mostrar menú flotante
      if (event) {
        const target = event.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();

        this.floatingMenuPosition = {
          top: rect.top,
          left: rect.right + 10
        };

        this.activeFloatingModule = this.activeFloatingModule === module ? null : module;
      }
    } else {
      // En modo expandido, alternar estado
      module.expanded = !module.expanded;
      this.saveModulesState();
    }
  }

  /**
   * Alterna un ítem como favorito
   */
  toggleFavorite(item: SidebarMenuItem, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    item.isFavorite = !item.isFavorite;

    // Actualizar lista de favoritos
    if (item.isFavorite) {
      this.favoriteItems.push(item);
    } else {
      this.favoriteItems = this.favoriteItems.filter(fav => fav.id !== item.id);
    }

    // Guardar favoritos en localStorage
    this.saveFavorites();
  }

  /**
   * Maneja cambios en la búsqueda
   */
  onSearchChange(query: string): void {
    this.searchQuery = query;
    this.searchSubject.next(query);
    this.isSearching = query.length > 0;
  }

  /**
   * Realiza la búsqueda en todos los elementos del menú
   */
  private performSearch(query: string): void {
    if (!query || query.trim() === '') {
      this.searchResults = [];
      return;
    }

    query = query.toLowerCase().trim();

    // Buscar en todos los módulos y sus elementos
    const results: SidebarMenuItem[] = [];

    this.modules.forEach(module => {
      module.items.forEach(item => {
        // Buscar por etiqueta, tags o ruta
        if (
          item.label.toLowerCase().includes(query) ||
          (item.tags && item.tags.some(tag => tag.toLowerCase().includes(query))) ||
          item.route.toLowerCase().includes(query)
        ) {
          results.push(item);
        }

        // Buscar en elementos hijos
        if (item.children) {
          item.children.forEach(child => {
            if (
              child.label.toLowerCase().includes(query) ||
              (child.tags && child.tags.some(tag => tag.toLowerCase().includes(query))) ||
              child.route.toLowerCase().includes(query)
            ) {
              results.push(child);
            }
          });
        }
      });
    });

    // Ordenar resultados por relevancia (primero los que coinciden con la etiqueta)
    this.searchResults = results.sort((a, b) => {
      const aLabelMatch = a.label.toLowerCase().includes(query);
      const bLabelMatch = b.label.toLowerCase().includes(query);

      if (aLabelMatch && !bLabelMatch) return -1;
      if (!aLabelMatch && bLabelMatch) return 1;
      return 0;
    });
  }

  /**
   * Guarda el estado de expansión de los módulos en localStorage
   */
  private saveModulesState(): void {
    const moduleStates = this.modules.map(module => ({
      id: module.id,
      expanded: module.expanded
    }));

    localStorage.setItem('admin-sidebar-modules', JSON.stringify(moduleStates));
  }

  /**
   * Carga el estado de expansión de los módulos desde localStorage
   */
  private loadModulesState(): void {
    const savedState = localStorage.getItem('admin-sidebar-modules');

    if (savedState) {
      try {
        const moduleStates = JSON.parse(savedState);

        moduleStates.forEach((state: {id: string, expanded: boolean}) => {
          const module = this.modules.find(m => m.id === state.id);
          if (module) {
            module.expanded = state.expanded;
          }
        });
      } catch (error) {
        console.error('Error al cargar el estado de los módulos:', error);
      }
    }
  }

  /**
   * Guarda los favoritos en localStorage
   */
  private saveFavorites(): void {
    const favoriteIds = this.favoriteItems.map(item => item.id);
    localStorage.setItem('admin-sidebar-favorites', JSON.stringify(favoriteIds));
  }

  /**
   * Carga los favoritos desde localStorage
   */
  private loadFavorites(): void {
    const savedFavorites = localStorage.getItem('admin-sidebar-favorites');

    if (savedFavorites) {
      try {
        const favoriteIds = JSON.parse(savedFavorites);
        this.favoriteItems = [];

        // Buscar los elementos favoritos en todos los módulos
        this.modules.forEach(module => {
          module.items.forEach(item => {
            if (favoriteIds.includes(item.id)) {
              item.isFavorite = true;
              this.favoriteItems.push(item);
            }

            // Buscar en elementos hijos
            if (item.children) {
              item.children.forEach(child => {
                if (favoriteIds.includes(child.id)) {
                  child.isFavorite = true;
                  this.favoriteItems.push(child);
                }
              });
            }
          });
        });
      } catch (error) {
        console.error('Error al cargar favoritos:', error);
      }
    }
  }

  // Métodos de compatibilidad con la versión anterior
  toggleSubMenu(item: SidebarMenuItem, event?: MouseEvent): void {
    if (!item.children) {
      return;
    }

    if (this.collapsed) {
      if (event) {
        // Prevenir la navegación si tiene hijos
        event.preventDefault();
        event.stopPropagation();

        // Calcular la posición del menú flotante
        const target = event.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();

        this.floatingMenuPosition = {
          top: rect.top,
          left: rect.right + 10 // 10px de margen desde el sidebar
        };

        // Activar o desactivar el menú flotante
        if (this.activeFloatingMenu === item) {
          this.activeFloatingMenu = null;
        } else {
          this.activeFloatingMenu = item;
        }
      }
    } else {
      // Comportamiento normal cuando el sidebar está expandido
      item.expanded = !item.expanded;
      this.activeFloatingMenu = null;
    }
  }

  // Método para cerrar el menú flotante cuando se hace clic fuera
  closeFloatingMenu(): void {
    this.activeFloatingMenu = null;
    this.activeFloatingModule = null;
  }

  logout(): void {
    this.authService.logout();
  }

  // Cerrar el menú flotante cuando se hace clic fuera del documento
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Si hay un menú flotante activo y el clic no fue dentro del sidebar o del menú flotante
    if (this.activeFloatingMenu || this.activeFloatingModule) {
      const sidebarElement = document.querySelector('.sidebar');
      const floatingMenuElement = document.querySelector('.floating-menu');

      if (sidebarElement && floatingMenuElement) {
        const clickedInSidebar = sidebarElement.contains(event.target as Node);
        const clickedInFloatingMenu = floatingMenuElement.contains(event.target as Node);

        if (!clickedInSidebar && !clickedInFloatingMenu) {
          this.closeFloatingMenu();
        }
      }
    }
  }

  // Cerrar el menú flotante cuando se presiona la tecla Escape
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.activeFloatingMenu || this.activeFloatingModule) {
      this.closeFloatingMenu();
    }
  }
}
