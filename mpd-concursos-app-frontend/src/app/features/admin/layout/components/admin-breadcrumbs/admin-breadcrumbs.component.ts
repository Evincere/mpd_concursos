import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, Subject, takeUntil } from 'rxjs';
import {
  trigger,
  transition,
  style,
  animate,
  query,
  stagger
} from '@angular/animations';
import { TooltipDirective } from '@shared/directives/tooltip.directive';

interface Breadcrumb {
  label: string;
  url: string;
  icon?: string;
}

@Component({
  selector: 'app-admin-breadcrumbs',
  templateUrl: './admin-breadcrumbs.component.html',
  styleUrls: ['./admin-breadcrumbs.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TooltipDirective
  ],
  animations: [
    // Animación de desvanecimiento para el contenedor
    trigger('fadeAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0 }))
      ])
    ]),

    // Animación de deslizamiento para cada elemento
    trigger('slideInAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('300ms {{delay}} ease-out',
          style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class AdminBreadcrumbsComponent implements OnInit, OnDestroy {
  breadcrumbs: Breadcrumb[] = [];
  private destroy$ = new Subject<void>();

  // Mapeo de rutas a etiquetas y íconos
  private routeLabels: Record<string, { label: string, icon?: string }> = {
    'admin': { label: 'Admin', icon: 'admin_panel_settings' },
    'dashboard': { label: 'Dashboard', icon: 'dashboard' },
    'users': { label: 'Users', icon: 'people' },
    'usuarios': { label: 'Users', icon: 'people' },
    'documentos': { label: 'Documentos', icon: 'description' },
    'examenes': { label: 'Exámenes', icon: 'assignment' },
    'preguntas': { label: 'Preguntas', icon: 'quiz' },
    'comunicaciones': { label: 'Comunicaciones', icon: 'message' },
    'reportes': { label: 'Reportes', icon: 'assessment' },
    'configuracion': { label: 'Configuración', icon: 'settings' },
    'concursos': { label: 'Concursos', icon: 'gavel' },
    'inscripciones': { label: 'Inscripciones', icon: 'how_to_reg' },
    'ayuda': { label: 'Ayuda', icon: 'help' },
    'listado': { label: 'Listado', icon: 'list' },
    'nuevo': { label: 'Nuevo', icon: 'add_circle' },
    'editar': { label: 'Editar', icon: 'edit' },
    'calendario': { label: 'Calendario', icon: 'calendar_today' },
    'pendientes': { label: 'Pendientes', icon: 'pending' },
    'aprobadas': { label: 'Aprobadas', icon: 'check_circle' },
    'rechazadas': { label: 'Rechazadas', icon: 'cancel' }
  };

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.breadcrumbs = this.createBreadcrumbs(this.activatedRoute.root);
    });

    // Inicializar breadcrumbs con la ruta actual
    this.breadcrumbs = this.createBreadcrumbs(this.activatedRoute.root);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createBreadcrumbs(route: ActivatedRoute, url = '', breadcrumbs: Breadcrumb[] = []): Breadcrumb[] {
    // Obtener la primera parte de la ruta
    const children = route.children;

    if (children.length === 0) {
      return breadcrumbs;
    }

    const child = children[0];
    const routeURL = child.snapshot.url.map(segment => segment.path).join('/');

    if (routeURL !== '') {
      url += `/${routeURL}`;

      // Dividir la URL en segmentos
      const segments = routeURL.split('/');

      // Crear breadcrumb para cada segmento
      segments.forEach(segment => {
        const info = this.routeLabels[segment] || { label: this.formatLabel(segment) };

        breadcrumbs.push({
          label: info.label,
          url: url,
          icon: info.icon
        });
      });
    }

    return this.createBreadcrumbs(child, url, breadcrumbs);
  }

  private formatLabel(label: string): string {
    // Convertir camelCase o snake_case a palabras separadas y capitalizar
    return label
      .replace(/([A-Z])/g, ' $1') // Insertar espacio antes de mayúsculas
      .replace(/_/g, ' ') // Reemplazar guiones bajos con espacios
      .replace(/^\w/, c => c.toUpperCase()); // Capitalizar primera letra
  }

  /**
   * Convierte iconos de Material a FontAwesome
   * @param materialIcon Nombre del icono de Material
   * @returns Nombre del icono equivalente en FontAwesome
   */
  getIconName(materialIcon: string): string {
    // Mapeo de iconos de Material a FontAwesome
    const iconMap: Record<string, string> = {
      'home': 'home',
      'admin_panel_settings': 'user-shield',
      'dashboard': 'tachometer-alt',
      'people': 'users',
      'description': 'file-alt',
      'assignment': 'clipboard',
      'quiz': 'question-circle',
      'message': 'comment-alt',
      'assessment': 'chart-bar',
      'settings': 'cog',
      'gavel': 'gavel',
      'how_to_reg': 'user-check',
      'help': 'question-circle',
      'list': 'list',
      'add_circle': 'plus-circle',
      'edit': 'edit',
      'calendar_today': 'calendar',
      'pending': 'clock',
      'check_circle': 'check-circle',
      'cancel': 'times-circle',
      'chevron_right': 'chevron-right'
    };

    return iconMap[materialIcon] || 'circle'; // Devuelve el icono mapeado o un círculo por defecto
  }
}
