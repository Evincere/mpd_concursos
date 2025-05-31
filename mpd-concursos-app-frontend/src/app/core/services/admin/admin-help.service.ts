import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { map } from 'rxjs/operators';

/**
 * Interfaz para los artículos de ayuda
 */
export interface HelpArticle {
  id: string;
  title: string;
  content: string;
  summary: string;
  category: string;
  subcategory?: string;
  tags: string[];
  level: 'basic' | 'intermediate' | 'advanced';
  relatedArticles?: string[];
  lastUpdated: string;
  author?: string;
  views?: number;
  rating?: number;
  videoUrl?: string;
  imageUrls?: string[];
}

/**
 * Interfaz para las categorías de ayuda
 */
export interface HelpCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  subcategories?: HelpSubcategory[];
  articleCount?: number;
}

/**
 * Interfaz para las subcategorías de ayuda
 */
export interface HelpSubcategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  articleCount?: number;
}

/**
 * Interfaz para los tutoriales guiados
 */
export interface GuidedTutorial {
  id: string;
  title: string;
  description: string;
  steps: TutorialStep[];
  estimatedTime: number; // En minutos
  level: 'basic' | 'intermediate' | 'advanced';
  category: string;
  tags: string[];
  lastUpdated: string;
}

/**
 * Interfaz para los pasos de un tutorial
 */
export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  selector?: string; // Selector CSS para resaltar elementos en la interfaz
  action?: string; // Acción a realizar (click, input, etc.)
  position?: 'top' | 'bottom' | 'left' | 'right'; // Posición del tooltip
}

/**
 * Interfaz para los filtros de búsqueda
 */
export interface HelpSearchFilter {
  query?: string;
  category?: string;
  subcategory?: string;
  tags?: string[];
  level?: 'basic' | 'intermediate' | 'advanced';
  page?: number;
  pageSize?: number;
}

/**
 * Interfaz para los resultados de búsqueda
 */
export interface HelpSearchResult {
  articles: HelpArticle[];
  tutorials: GuidedTutorial[];
  totalResults: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Interfaz para el feedback de ayuda
 */
export interface HelpFeedback {
  articleId: string;
  userId: string;
  rating: number;
  comment?: string;
  helpful: boolean;
  timestamp: string;
}

/**
 * Servicio para gestionar la ayuda y documentación para administradores
 */
@Injectable({
  providedIn: 'root'
})
export class AdminHelpService {
  private apiUrl = `${environment.apiUrl}/admin/help`;

  // Categorías de ayuda
  private categoriesSubject = new BehaviorSubject<HelpCategory[]>([]);

  // Artículo actualmente visualizado
  private currentArticleSubject = new BehaviorSubject<HelpArticle | null>(null);

  // Tutorial actualmente en progreso
  private activeTutorialSubject = new BehaviorSubject<GuidedTutorial | null>(null);
  private currentStepSubject = new BehaviorSubject<number>(0);

  constructor(private http: HttpClient) {
    // Cargar categorías al inicializar el servicio
    this.loadCategories();
  }

  /**
   * Obtiene todas las categorías de ayuda
   */
  getCategories(): Observable<HelpCategory[]> {
    return this.categoriesSubject.asObservable();
  }

  /**
   * Obtiene un artículo de ayuda por su ID
   * @param id ID del artículo
   */
  getArticle(id: string): Observable<HelpArticle> {
    // En una implementación real, esto sería una llamada a la API
    // return this.http.get<HelpArticle>(`${this.apiUrl}/articles/${id}`).pipe(
    //   map(article => {
    //     this.currentArticleSubject.next(article);
    //     return article;
    //   }),
    //   catchError(error => {
    //     console.error('Error fetching help article:', error);
    //     return of(null);
    //   })
    // );

    // Implementación mock para desarrollo
    const article = this.getMockArticle(id);
    this.currentArticleSubject.next(article);
    return of(article);
  }

  /**
   * Obtiene artículos de ayuda por categoría
   * @param categoryId ID de la categoría
   */
  getArticlesByCategory(categoryId: string): Observable<HelpArticle[]> {
    // En una implementación real, esto sería una llamada a la API
    // return this.http.get<HelpArticle[]>(`${this.apiUrl}/categories/${categoryId}/articles`).pipe(
    //   catchError(error => {
    //     console.error('Error fetching articles by category:', error);
    //     return of([]);
    //   })
    // );

    // Implementación mock para desarrollo
    return of(this.getMockArticles().filter(article => article.category === categoryId));
  }

  /**
   * Busca artículos de ayuda
   * @param filter Filtros de búsqueda
   */
  searchHelp(filter: HelpSearchFilter): Observable<HelpSearchResult> {
    // En una implementación real, esto sería una llamada a la API
    // return this.http.post<HelpSearchResult>(`${this.apiUrl}/search`, filter).pipe(
    //   catchError(error => {
    //     console.error('Error searching help:', error);
    //     return of({
    //       articles: [],
    //       tutorials: [],
    //       totalResults: 0,
    //       page: 0,
    //       pageSize: 10,
    //       totalPages: 0
    //     });
    //   })
    // );

    // Implementación mock para desarrollo
    const allArticles = this.getMockArticles();
    const allTutorials = this.getMockTutorials();

    // Filtrar artículos
    let filteredArticles = [...allArticles];
    let filteredTutorials = [...allTutorials];

    if (filter.query) {
      const query = filter.query.toLowerCase();
      filteredArticles = filteredArticles.filter(article =>
        article.title.toLowerCase().includes(query) ||
        article.content.toLowerCase().includes(query) ||
        article.summary.toLowerCase().includes(query) ||
        article.tags.some(tag => tag.toLowerCase().includes(query))
      );

      filteredTutorials = filteredTutorials.filter(tutorial =>
        tutorial.title.toLowerCase().includes(query) ||
        tutorial.description.toLowerCase().includes(query) ||
        tutorial.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (filter.category) {
      filteredArticles = filteredArticles.filter(article => article.category === filter.category);
      filteredTutorials = filteredTutorials.filter(tutorial => tutorial.category === filter.category);
    }

    if (filter.subcategory) {
      filteredArticles = filteredArticles.filter(article => article.subcategory === filter.subcategory);
    }

    if (filter.level) {
      filteredArticles = filteredArticles.filter(article => article.level === filter.level);
      filteredTutorials = filteredTutorials.filter(tutorial => tutorial.level === filter.level);
    }

    if (filter.tags && filter.tags.length > 0) {
      filteredArticles = filteredArticles.filter(article =>
        filter.tags!.some(tag => article.tags.includes(tag))
      );

      filteredTutorials = filteredTutorials.filter(tutorial =>
        filter.tags!.some(tag => tutorial.tags.includes(tag))
      );
    }

    // Paginación
    const page = filter.page || 0;
    const pageSize = filter.pageSize || 10;
    const start = page * pageSize;
    const end = start + pageSize;

    const paginatedArticles = filteredArticles.slice(start, end);
    const paginatedTutorials = filteredTutorials.slice(start, end);

    return of({
      articles: paginatedArticles,
      tutorials: paginatedTutorials,
      totalResults: filteredArticles.length + filteredTutorials.length,
      page,
      pageSize,
      totalPages: Math.ceil((filteredArticles.length + filteredTutorials.length) / pageSize)
    });
  }

  /**
   * Obtiene un tutorial guiado por su ID
   * @param id ID del tutorial
   */
  getTutorial(id: string): Observable<GuidedTutorial> {
    // En una implementación real, esto sería una llamada a la API
    // return this.http.get<GuidedTutorial>(`${this.apiUrl}/tutorials/${id}`).pipe(
    //   catchError(error => {
    //     console.error('Error fetching tutorial:', error);
    //     return of(null);
    //   })
    // );

    // Implementación mock para desarrollo
    const tutorial = this.getMockTutorials().find(t => t.id === id);
    if (tutorial) {
      return of(tutorial);
    } else {
      console.error(`Tutorial with ID "${id}" not found`);
      return of(this.getMockTutorials()[0]);
    }
  }

  /**
   * Inicia un tutorial guiado
   * @param tutorialId ID del tutorial
   */
  startTutorial(tutorialId: string): Observable<boolean> {
    return this.getTutorial(tutorialId).pipe(
      map(tutorial => {
        if (tutorial) {
          this.activeTutorialSubject.next(tutorial);
          this.currentStepSubject.next(0);
          return true;
        } else {
          return false;
        }
      })
    );
  }

  /**
   * Avanza al siguiente paso del tutorial
   */
  nextStep(): void {
    const tutorial = this.activeTutorialSubject.value;
    const currentStep = this.currentStepSubject.value;

    if (tutorial && currentStep < tutorial.steps.length - 1) {
      this.currentStepSubject.next(currentStep + 1);
    } else if (tutorial && currentStep === tutorial.steps.length - 1) {
      // Finalizar tutorial
      this.endTutorial();
    }
  }

  /**
   * Retrocede al paso anterior del tutorial
   */
  previousStep(): void {
    const currentStep = this.currentStepSubject.value;

    if (currentStep > 0) {
      this.currentStepSubject.next(currentStep - 1);
    }
  }

  /**
   * Finaliza el tutorial actual
   */
  endTutorial(): void {
    this.activeTutorialSubject.next(null);
    this.currentStepSubject.next(0);
  }

  /**
   * Obtiene el tutorial actualmente en progreso
   */
  getActiveTutorial(): Observable<GuidedTutorial | null> {
    return this.activeTutorialSubject.asObservable();
  }

  /**
   * Obtiene el paso actual del tutorial
   */
  getCurrentStep(): Observable<number> {
    return this.currentStepSubject.asObservable();
  }

  /**
   * Envía feedback sobre un artículo de ayuda
   * @param feedback Feedback a enviar
   */
  sendFeedback(feedback: HelpFeedback): Observable<boolean> {
    // En una implementación real, esto sería una llamada a la API
    // return this.http.post<Record<string, unknown>>(`${this.apiUrl}/feedback`, feedback).pipe(
    //   map(() => true),
    //   catchError(error => {
    //     console.error('Error sending feedback:', error);
    //     return of(false);
    //   })
    // );

    // Implementación mock para desarrollo
    console.log('Feedback enviado:', feedback);
    return of(true);
  }

  /**
   * Carga las categorías de ayuda
   */
  private loadCategories(): void {
    // En una implementación real, esto sería una llamada a la API
    // this.http.get<HelpCategory[]>(`${this.apiUrl}/categories`).pipe(
    //   catchError(error => {
    //     console.error('Error loading help categories:', error);
    //     return of([]);
    //   })
    // ).subscribe(categories => {
    //   this.categoriesSubject.next(categories);
    // });

    // Implementación mock para desarrollo
    this.categoriesSubject.next(this.getMockCategories());
  }

  /**
   * Obtiene categorías mock para desarrollo
   */
  private getMockCategories(): HelpCategory[] {
    return [
      {
        id: 'general',
        name: 'General',
        description: 'Información general sobre el sistema',
        icon: 'info-circle',
        subcategories: [
          {
            id: 'getting-started',
            name: 'Primeros pasos',
            description: 'Guías para comenzar a usar el sistema',
            icon: 'play-circle'
          },
          {
            id: 'faq',
            name: 'Preguntas frecuentes',
            description: 'Respuestas a preguntas comunes',
            icon: 'question-circle'
          }
        ]
      },
      {
        id: 'users',
        name: 'Usuarios',
        description: 'Gestión de usuarios y permisos',
        icon: 'users',
        subcategories: [
          {
            id: 'user-management',
            name: 'Gestión de usuarios',
            description: 'Crear, editar y eliminar usuarios',
            icon: 'user-cog'
          },
          {
            id: 'roles',
            name: 'Roles y permisos',
            description: 'Configuración de roles y permisos',
            icon: 'user-shield'
          }
        ]
      },
      {
        id: 'contests',
        name: 'Concursos',
        description: 'Gestión de concursos y postulaciones',
        icon: 'trophy',
        subcategories: [
          {
            id: 'contest-creation',
            name: 'Creación de concursos',
            description: 'Crear y configurar nuevos concursos',
            icon: 'plus-circle'
          },
          {
            id: 'applications',
            name: 'Postulaciones',
            description: 'Gestión de postulaciones a concursos',
            icon: 'clipboard-list'
          }
        ]
      },
      {
        id: 'exams',
        name: 'Exámenes',
        description: 'Gestión de exámenes y evaluaciones',
        icon: 'file-alt',
        subcategories: [
          {
            id: 'exam-creation',
            name: 'Creación de exámenes',
            description: 'Crear y configurar nuevos exámenes',
            icon: 'plus-circle'
          },
          {
            id: 'grading',
            name: 'Calificaciones',
            description: 'Gestión de calificaciones de exámenes',
            icon: 'star'
          }
        ]
      },
      {
        id: 'communications',
        name: 'Comunicaciones',
        description: 'Gestión de comunicaciones y notificaciones',
        icon: 'envelope',
        subcategories: [
          {
            id: 'mass-notifications',
            name: 'Notificaciones masivas',
            description: 'Envío de notificaciones a múltiples usuarios',
            icon: 'bullhorn'
          },
          {
            id: 'templates',
            name: 'Plantillas',
            description: 'Gestión de plantillas de comunicación',
            icon: 'file-code'
          }
        ]
      },
      {
        id: 'configuration',
        name: 'Configuración',
        description: 'Configuración del sistema',
        icon: 'cogs',
        subcategories: [
          {
            id: 'system-settings',
            name: 'Configuración general',
            description: 'Configuración general del sistema',
            icon: 'sliders-h'
          },
          {
            id: 'integrations',
            name: 'Integraciones',
            description: 'Configuración de integraciones con servicios externos',
            icon: 'plug'
          }
        ]
      }
    ];
  }

  /**
   * Obtiene un artículo mock para desarrollo
   */
  private getMockArticle(id: string): HelpArticle {
    const articles = this.getMockArticles();
    const article = articles.find(a => a.id === id);

    if (article) {
      return article;
    } else {
      console.error(`Article with ID "${id}" not found`);
      return articles[0];
    }
  }

  /**
   * Obtiene artículos mock para desarrollo
   */
  private getMockArticles(): HelpArticle[] {
    return [
      {
        id: 'admin-dashboard-overview',
        title: 'Panel de Administración: Visión General',
        summary: 'Introducción al panel de administración y sus funcionalidades principales',
        content: '# Panel de Administración\n\nEl Panel de Administración es el centro de control para gestionar todos los aspectos del sistema de concursos.\n\n## Secciones Principales\n\n### Dashboard\nMuestra estadísticas y métricas clave sobre usuarios, concursos, postulaciones y exámenes.\n\n### Usuarios\nPermite gestionar usuarios, roles y permisos.\n\n### Concursos\nGestión completa de concursos, desde la creación hasta la publicación y seguimiento.\n\n### Exámenes\nCreación y gestión de exámenes, preguntas y calificaciones.\n\n### Comunicaciones\nEnvío de notificaciones masivas y gestión de plantillas de comunicación.\n\n### Configuración\nConfiguración general del sistema, integraciones y copias de seguridad.',
        category: 'general',
        subcategory: 'getting-started',
        tags: ['dashboard', 'administración', 'introducción'],
        level: 'basic',
        lastUpdated: '2023-05-15',
        relatedArticles: ['user-management-basics', 'contest-creation-guide']
      },
      {
        id: 'user-management-basics',
        title: 'Gestión de Usuarios: Conceptos Básicos',
        summary: 'Aprenda a gestionar usuarios, crear cuentas y asignar roles',
        content: '# Gestión de Usuarios\n\nLa gestión de usuarios le permite crear, editar y eliminar cuentas de usuario, así como asignar roles y permisos.\n\n## Crear un Nuevo Usuario\n\n1. Vaya a la sección "Usuarios" en el panel de administración\n2. Haga clic en el botón "Nuevo Usuario"\n3. Complete el formulario con los datos del usuario\n4. Asigne uno o más roles al usuario\n5. Haga clic en "Guardar"\n\n## Editar un Usuario Existente\n\n1. Vaya a la sección "Usuarios" en el panel de administración\n2. Busque el usuario que desea editar\n3. Haga clic en el botón "Editar"\n4. Modifique los datos necesarios\n5. Haga clic en "Guardar"\n\n## Eliminar un Usuario\n\n1. Vaya a la sección "Usuarios" en el panel de administración\n2. Busque el usuario que desea eliminar\n3. Haga clic en el botón "Eliminar"\n4. Confirme la acción\n\n## Asignar Roles\n\nLos roles determinan qué acciones puede realizar un usuario en el sistema. Para asignar roles:\n\n1. Edite el usuario\n2. En la sección "Roles", seleccione los roles deseados\n3. Haga clic en "Guardar"',
        category: 'users',
        subcategory: 'user-management',
        tags: ['usuarios', 'roles', 'permisos'],
        level: 'basic',
        lastUpdated: '2023-05-20',
        relatedArticles: ['roles-permissions-guide', 'admin-dashboard-overview']
      },
      {
        id: 'contest-creation-guide',
        title: 'Guía para Crear Concursos',
        summary: 'Aprenda a crear y configurar nuevos concursos en el sistema',
        content: '# Creación de Concursos\n\nEsta guía le mostrará cómo crear y configurar nuevos concursos en el sistema.\n\n## Pasos para Crear un Concurso\n\n1. Vaya a la sección "Concursos" en el panel de administración\n2. Haga clic en el botón "Nuevo Concurso"\n3. Complete la información general del concurso:\n   - Título\n   - Descripción\n   - Fechas de inicio y fin\n   - Requisitos\n4. Configure las etapas del concurso\n5. Defina los documentos requeridos\n6. Establezca los criterios de evaluación\n7. Haga clic en "Guardar"\n\n## Configuración de Etapas\n\nLas etapas definen el flujo del concurso. Para cada etapa, debe configurar:\n\n- Nombre\n- Descripción\n- Fechas de inicio y fin\n- Acciones disponibles\n\n## Publicación del Concurso\n\nUna vez configurado el concurso, puede publicarlo para que esté disponible para los usuarios:\n\n1. Vaya a la lista de concursos\n2. Busque el concurso que desea publicar\n3. Haga clic en el botón "Publicar"\n4. Confirme la acción',
        category: 'contests',
        subcategory: 'contest-creation',
        tags: ['concursos', 'creación', 'configuración'],
        level: 'intermediate',
        lastUpdated: '2023-06-10',
        relatedArticles: ['application-management', 'exam-creation-guide']
      }
    ];
  }

  /**
   * Obtiene tutoriales mock para desarrollo
   */
  private getMockTutorials(): GuidedTutorial[] {
    return [
      {
        id: 'create-user-tutorial',
        title: 'Crear un Nuevo Usuario',
        description: 'Aprenda a crear un nuevo usuario en el sistema',
        steps: [
          {
            id: 'step1',
            title: 'Acceder a la sección de Usuarios',
            description: 'Haga clic en "Usuarios" en el menú lateral',
            selector: '.sidebar-menu .users-link',
            action: 'click',
            position: 'right'
          },
          {
            id: 'step2',
            title: 'Iniciar creación de usuario',
            description: 'Haga clic en el botón "Nuevo Usuario"',
            selector: '.new-user-button',
            action: 'click',
            position: 'bottom'
          },
          {
            id: 'step3',
            title: 'Completar información básica',
            description: 'Complete los campos de información básica del usuario',
            selector: '.user-form .basic-info',
            position: 'right'
          },
          {
            id: 'step4',
            title: 'Asignar roles',
            description: 'Seleccione los roles que desea asignar al usuario',
            selector: '.user-form .roles-section',
            position: 'right'
          },
          {
            id: 'step5',
            title: 'Guardar usuario',
            description: 'Haga clic en el botón "Guardar" para crear el usuario',
            selector: '.user-form .save-button',
            action: 'click',
            position: 'top'
          }
        ],
        estimatedTime: 5,
        level: 'basic',
        category: 'users',
        tags: ['usuarios', 'creación', 'roles'],
        lastUpdated: '2023-05-25'
      },
      {
        id: 'create-contest-tutorial',
        title: 'Crear un Nuevo Concurso',
        description: 'Aprenda a crear y configurar un nuevo concurso',
        steps: [
          {
            id: 'step1',
            title: 'Acceder a la sección de Concursos',
            description: 'Haga clic en "Concursos" en el menú lateral',
            selector: '.sidebar-menu .contests-link',
            action: 'click',
            position: 'right'
          },
          {
            id: 'step2',
            title: 'Iniciar creación de concurso',
            description: 'Haga clic en el botón "Nuevo Concurso"',
            selector: '.new-contest-button',
            action: 'click',
            position: 'bottom'
          },
          {
            id: 'step3',
            title: 'Completar información general',
            description: 'Complete los campos de información general del concurso',
            selector: '.contest-form .general-info',
            position: 'right'
          },
          {
            id: 'step4',
            title: 'Configurar etapas',
            description: 'Configure las etapas del concurso',
            selector: '.contest-form .stages-section',
            position: 'right'
          },
          {
            id: 'step5',
            title: 'Definir requisitos',
            description: 'Defina los requisitos para participar en el concurso',
            selector: '.contest-form .requirements-section',
            position: 'right'
          },
          {
            id: 'step6',
            title: 'Guardar concurso',
            description: 'Haga clic en el botón "Guardar" para crear el concurso',
            selector: '.contest-form .save-button',
            action: 'click',
            position: 'top'
          }
        ],
        estimatedTime: 10,
        level: 'intermediate',
        category: 'contests',
        tags: ['concursos', 'creación', 'configuración'],
        lastUpdated: '2023-06-15'
      }
    ];
  }
}
