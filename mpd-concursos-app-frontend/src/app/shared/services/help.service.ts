import { Injectable, ComponentRef, ApplicationRef, ComponentFactoryResolver, Injector, EmbeddedViewRef } from '@angular/core';
import { ContextualHelpComponent } from '../components/contextual-help/contextual-help.component';
import { BehaviorSubject, Observable } from 'rxjs';

export interface HelpItem {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
}

@Injectable({
  providedIn: 'root'
})
export class HelpService {
  private helpItems: HelpItem[] = [];
  private helpRefs: ComponentRef<ContextualHelpComponent>[] = [];
  private helpVisibilitySubject = new BehaviorSubject<Record<string, boolean>>({});

  constructor(
    private appRef: ApplicationRef,
    private componentFactoryResolver: ComponentFactoryResolver,
    private injector: Injector
  ) {
    // Cargar ayudas predefinidas
    this.loadPredefinedHelp();
  }

  /**
   * Obtiene un elemento de ayuda por su ID
   * @param id ID del elemento de ayuda
   * @returns Elemento de ayuda o undefined si no existe
   */
  getHelpItem(id: string): HelpItem | undefined {
    return this.helpItems.find(item => item.id === id);
  }

  /**
   * Busca elementos de ayuda por texto
   * @param query Texto a buscar
   * @returns Lista de elementos de ayuda que coinciden con la búsqueda
   */
  searchHelp(query: string): HelpItem[] {
    const lowerQuery = query.toLowerCase();
    return this.helpItems.filter(item =>
      item.title.toLowerCase().includes(lowerQuery) ||
      item.content.toLowerCase().includes(lowerQuery) ||
      item.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Obtiene elementos de ayuda por categoría
   * @param category Categoría de los elementos de ayuda
   * @returns Lista de elementos de ayuda de la categoría especificada
   */
  getHelpByCategory(category: string): HelpItem[] {
    return this.helpItems.filter(item => item.category === category);
  }

  /**
   * Muestra una ayuda contextual en la posición especificada
   * @param helpId ID del elemento de ayuda a mostrar
   * @param targetElement Elemento al que se anclará la ayuda
   * @param position Posición de la ayuda respecto al elemento
   * @returns Referencia al componente creado
   */
  showHelp(
    helpId: string,
    targetElement: HTMLElement,
    position: 'top' | 'bottom' | 'left' | 'right' = 'bottom'
  ): ComponentRef<ContextualHelpComponent> | null {
    const helpItem = this.getHelpItem(helpId);
    if (!helpItem) {
      console.error(`Help item with ID "${helpId}" not found`);
      return null;
    }

    // Crear componente
    const componentRef = this.componentFactoryResolver
      .resolveComponentFactory(ContextualHelpComponent)
      .create(this.injector);

    // Configurar propiedades
    componentRef.instance.title = helpItem.title;
    componentRef.instance.content = helpItem.content;
    componentRef.instance.position = position;
    componentRef.instance.theme = 'info';
    componentRef.instance.showIcon = false;
    componentRef.instance.showFooter = true;
    componentRef.instance.showDismissButton = true;
    componentRef.instance.dismissButtonText = 'Cerrar';
    componentRef.instance.showActionButton = false;

    // Añadir al DOM
    this.appRef.attachView(componentRef.hostView);
    const domElem = (componentRef.hostView as EmbeddedViewRef<any>).rootNodes[0] as HTMLElement;

    // Posicionar junto al elemento objetivo
    this.positionHelpElement(domElem, targetElement, position);

    // Añadir al body
    document.body.appendChild(domElem);

    // Guardar referencia
    this.helpRefs.push(componentRef);

    // Actualizar estado de visibilidad
    const visibilityState = this.helpVisibilitySubject.value;
    visibilityState[helpId] = true;
    this.helpVisibilitySubject.next(visibilityState);

    return componentRef;
  }

  /**
   * Oculta una ayuda contextual
   * @param helpId ID del elemento de ayuda a ocultar
   */
  hideHelp(helpId: string): void {
    const index = this.helpRefs.findIndex(ref =>
      ref.instance.title === this.getHelpItem(helpId)?.title
    );

    if (index !== -1) {
      const componentRef = this.helpRefs[index];
      this.appRef.detachView(componentRef.hostView);
      componentRef.destroy();
      this.helpRefs.splice(index, 1);

      // Actualizar estado de visibilidad
      const visibilityState = this.helpVisibilitySubject.value;
      visibilityState[helpId] = false;
      this.helpVisibilitySubject.next(visibilityState);
    }
  }

  /**
   * Oculta todas las ayudas contextuales
   */
  hideAllHelp(): void {
    this.helpRefs.forEach(ref => {
      this.appRef.detachView(ref.hostView);
      ref.destroy();
    });

    this.helpRefs = [];

    // Actualizar estado de visibilidad
    const visibilityState: Record<string, boolean> = {};
    this.helpItems.forEach(item => {
      visibilityState[item.id] = false;
    });
    this.helpVisibilitySubject.next(visibilityState);
  }

  /**
   * Obtiene un observable que indica si una ayuda está visible
   * @param helpId ID del elemento de ayuda
   * @returns Observable que emite true si la ayuda está visible, false en caso contrario
   */
  isHelpVisible(helpId: string): Observable<boolean> {
    return new Observable(observer => {
      const subscription = this.helpVisibilitySubject.subscribe(state => {
        observer.next(state[helpId] || false);
      });

      return () => subscription.unsubscribe();
    });
  }

  /**
   * Añade un nuevo elemento de ayuda
   * @param helpItem Elemento de ayuda a añadir
   */
  addHelpItem(helpItem: HelpItem): void {
    // Comprobar si ya existe un elemento con el mismo ID
    const existingIndex = this.helpItems.findIndex(item => item.id === helpItem.id);

    if (existingIndex !== -1) {
      // Actualizar elemento existente
      this.helpItems[existingIndex] = helpItem;
    } else {
      // Añadir nuevo elemento
      this.helpItems.push(helpItem);
    }
  }

  /**
   * Elimina un elemento de ayuda
   * @param helpId ID del elemento de ayuda a eliminar
   */
  removeHelpItem(helpId: string): void {
    const index = this.helpItems.findIndex(item => item.id === helpId);

    if (index !== -1) {
      this.helpItems.splice(index, 1);
    }
  }

  /**
   * Posiciona un elemento de ayuda respecto a un elemento objetivo
   * @param helpElement Elemento de ayuda
   * @param targetElement Elemento objetivo
   * @param position Posición de la ayuda respecto al elemento objetivo
   */
  private positionHelpElement(
    helpElement: HTMLElement,
    targetElement: HTMLElement,
    position: 'top' | 'bottom' | 'left' | 'right'
  ): void {
    const targetRect = targetElement.getBoundingClientRect();

    helpElement.style.position = 'absolute';
    helpElement.style.zIndex = '1000';

    switch (position) {
      case 'top':
        helpElement.style.bottom = `${window.innerHeight - targetRect.top + 10}px`;
        helpElement.style.left = `${targetRect.left + targetRect.width / 2}px`;
        helpElement.style.transform = 'translateX(-50%)';
        break;
      case 'bottom':
        helpElement.style.top = `${targetRect.bottom + 10}px`;
        helpElement.style.left = `${targetRect.left + targetRect.width / 2}px`;
        helpElement.style.transform = 'translateX(-50%)';
        break;
      case 'left':
        helpElement.style.right = `${window.innerWidth - targetRect.left + 10}px`;
        helpElement.style.top = `${targetRect.top + targetRect.height / 2}px`;
        helpElement.style.transform = 'translateY(-50%)';
        break;
      case 'right':
        helpElement.style.left = `${targetRect.right + 10}px`;
        helpElement.style.top = `${targetRect.top + targetRect.height / 2}px`;
        helpElement.style.transform = 'translateY(-50%)';
        break;
    }
  }

  /**
   * Carga ayudas predefinidas
   */
  private loadPredefinedHelp(): void {
    const predefinedHelp: HelpItem[] = [
      {
        id: 'concursos-intro',
        title: 'Concursos',
        content: 'En esta sección podrás ver todos los concursos disponibles para postularte.\n\nPuedes filtrar los concursos por categoría, estado o fecha para encontrar más fácilmente el que te interesa.\n\nHaz clic en "Ver Detalles" para obtener más información sobre un concurso específico.',
        category: 'concursos',
        tags: ['concursos', 'postulación', 'filtros']
      },
      {
        id: 'inscripcion-proceso',
        title: 'Proceso de Inscripción',
        content: 'El proceso de inscripción consta de varios pasos:\n\n1. Completar tus datos personales\n2. Subir la documentación requerida\n3. Revisar y confirmar tu postulación\n\nPuedes guardar tu progreso en cualquier momento y continuar más tarde.',
        category: 'inscripcion',
        tags: ['inscripción', 'postulación', 'documentación']
      },
      {
        id: 'documentacion-requerida',
        title: 'Documentación Requerida',
        content: 'Para completar tu inscripción, necesitarás tener a mano los siguientes documentos:\n\n- DNI (frente y dorso)\n- Título universitario o certificado analítico\n- Curriculum Vitae actualizado\n- Certificados de antecedentes (si corresponde)\n\nTodos los documentos deben estar en formato PDF y tener un tamaño máximo de 5MB.',
        category: 'documentacion',
        tags: ['documentos', 'requisitos', 'PDF']
      },
      {
        id: 'examenes-info',
        title: 'Exámenes',
        content: 'Los exámenes son una parte fundamental del proceso de selección.\n\nEn esta sección podrás ver los exámenes programados, sus fechas y resultados.\n\nRecuerda que debes presentarte con 30 minutos de anticipación y llevar tu DNI.',
        category: 'examenes',
        tags: ['exámenes', 'evaluación', 'fechas']
      },
      {
        id: 'dashboard-ayuda',
        title: 'Panel de Control',
        content: 'El Panel de Control te muestra un resumen de tu actividad en la plataforma.\n\nAquí podrás ver:\n\n- Concursos a los que te has postulado\n- Estado de tus postulaciones\n- Próximos exámenes\n- Notificaciones importantes',
        category: 'dashboard',
        tags: ['panel', 'resumen', 'actividad']
      }
    ];

    predefinedHelp.forEach(item => this.addHelpItem(item));
  }
}
