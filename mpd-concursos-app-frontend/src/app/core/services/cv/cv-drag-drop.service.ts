/**
 * Servicio de Drag & Drop del Sistema CV
 * 
 * @description Servicio para reordenar elementos del CV mediante arrastrar y soltar
 * @author Augment Agent
 * @date 2025-06-20
 * @version 2.0.0
 */

import { Injectable } from '@angular/core';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  WorkExperience,
  EducationEntry,
  CvEntryStatus
} from '@core/models/cv';
import { CvNotificationService } from './cv-notification.service';

/**
 * Evento de reordenamiento
 */
export interface ReorderEvent<T> {
  type: 'experience' | 'education';
  action: 'move' | 'transfer';
  item: T;
  previousIndex: number;
  currentIndex: number;
  previousContainer?: string;
  currentContainer?: string;
  timestamp: Date;
}

/**
 * Configuración de drag & drop
 */
export interface DragDropConfig {
  enableSorting: boolean;
  enableGrouping: boolean;
  enableCrossContainerTransfer: boolean;
  animationDuration: number;
  lockAxis?: 'x' | 'y';
  constrainPosition?: boolean;
  previewClass?: string;
  placeholderClass?: string;
}

/**
 * Contenedor de drag & drop
 */
export interface DragDropContainer<T> {
  id: string;
  name: string;
  items: T[];
  acceptedTypes: string[];
  maxItems?: number;
  isLocked: boolean;
  sortPredicate?: (index: number, item: T) => boolean;
}

/**
 * Estado del drag & drop
 */
export interface DragDropState {
  isDragging: boolean;
  draggedItem: any | null;
  draggedFromContainer: string | null;
  hoveredContainer: string | null;
  previewPosition: { x: number; y: number } | null;
}

@Injectable({
  providedIn: 'root'
})
export class CvDragDropService {

  // ===== CONFIGURACIÓN POR DEFECTO =====
  private readonly defaultConfig: DragDropConfig = {
    enableSorting: true,
    enableGrouping: true,
    enableCrossContainerTransfer: false,
    animationDuration: 300,
    constrainPosition: true,
    previewClass: 'cv-drag-preview',
    placeholderClass: 'cv-drag-placeholder'
  };

  // ===== ESTADO REACTIVO =====
  private readonly configSubject = new BehaviorSubject<DragDropConfig>(this.defaultConfig);
  private readonly stateSubject = new BehaviorSubject<DragDropState>({
    isDragging: false,
    draggedItem: null,
    draggedFromContainer: null,
    hoveredContainer: null,
    previewPosition: null
  });

  private readonly experienceOrderSubject = new BehaviorSubject<string[]>([]);
  private readonly educationOrderSubject = new BehaviorSubject<string[]>([]);
  private readonly reorderEventsSubject = new BehaviorSubject<ReorderEvent<any>[]>([]);

  // ===== OBSERVABLES PÚBLICOS =====
  public readonly config$ = this.configSubject.asObservable();
  public readonly state$ = this.stateSubject.asObservable();
  public readonly experienceOrder$ = this.experienceOrderSubject.asObservable();
  public readonly educationOrder$ = this.educationOrderSubject.asObservable();
  public readonly reorderEvents$ = this.reorderEventsSubject.asObservable();

  constructor(private readonly notificationService: CvNotificationService) {}

  // ===== MÉTODOS PRINCIPALES =====

  /**
   * Maneja el evento de drop para experiencias
   */
  handleExperienceDrop(
    event: CdkDragDrop<WorkExperience[]>,
    experiences: WorkExperience[]
  ): WorkExperience[] {
    const updatedExperiences = [...experiences];

    if (event.previousContainer === event.container) {
      // Reordenar dentro del mismo contenedor
      moveItemInArray(updatedExperiences, event.previousIndex, event.currentIndex);
    } else {
      // Transferir entre contenedores (si está habilitado)
      if (this.configSubject.value.enableCrossContainerTransfer) {
        transferArrayItem(
          event.previousContainer.data,
          event.container.data,
          event.previousIndex,
          event.currentIndex
        );
      }
    }

    // Actualizar orden y registrar evento
    this.updateExperienceOrder(updatedExperiences);
    this.recordReorderEvent('experience', event, updatedExperiences[event.currentIndex]);

    // Notificar cambio
    this.notificationService.showInfo('Orden de experiencias actualizado');

    return updatedExperiences;
  }

  /**
   * Maneja el evento de drop para educación
   */
  handleEducationDrop(
    event: CdkDragDrop<EducationEntry[]>,
    education: EducationEntry[]
  ): EducationEntry[] {
    const updatedEducation = [...education];

    if (event.previousContainer === event.container) {
      // Reordenar dentro del mismo contenedor
      moveItemInArray(updatedEducation, event.previousIndex, event.currentIndex);
    } else {
      // Transferir entre contenedores (si está habilitado)
      if (this.configSubject.value.enableCrossContainerTransfer) {
        transferArrayItem(
          event.previousContainer.data,
          event.container.data,
          event.previousIndex,
          event.currentIndex
        );
      }
    }

    // Actualizar orden y registrar evento
    this.updateEducationOrder(updatedEducation);
    this.recordReorderEvent('education', event, updatedEducation[event.currentIndex]);

    // Notificar cambio
    this.notificationService.showInfo('Orden de educación actualizado');

    return updatedEducation;
  }

  /**
   * Inicia el arrastre
   */
  startDrag(item: any, containerId: string): void {
    this.updateState({
      isDragging: true,
      draggedItem: item,
      draggedFromContainer: containerId,
      hoveredContainer: null,
      previewPosition: null
    });
  }

  /**
   * Finaliza el arrastre
   */
  endDrag(): void {
    this.updateState({
      isDragging: false,
      draggedItem: null,
      draggedFromContainer: null,
      hoveredContainer: null,
      previewPosition: null
    });
  }

  /**
   * Actualiza la posición del hover
   */
  updateHover(containerId: string | null): void {
    const currentState = this.stateSubject.value;
    if (currentState.hoveredContainer !== containerId) {
      this.updateState({
        ...currentState,
        hoveredContainer: containerId
      });
    }
  }

  /**
   * Actualiza la posición del preview
   */
  updatePreviewPosition(position: { x: number; y: number }): void {
    const currentState = this.stateSubject.value;
    this.updateState({
      ...currentState,
      previewPosition: position
    });
  }

  /**
   * Verifica si se puede soltar en un contenedor
   */
  canDrop(
    item: any,
    targetContainer: DragDropContainer<any>,
    targetIndex: number
  ): boolean {
    // Verificar si el contenedor está bloqueado
    if (targetContainer.isLocked) {
      return false;
    }

    // Verificar límite máximo de elementos
    if (targetContainer.maxItems && targetContainer.items.length >= targetContainer.maxItems) {
      return false;
    }

    // Verificar tipos aceptados
    const itemType = this.getItemType(item);
    if (!targetContainer.acceptedTypes.includes(itemType)) {
      return false;
    }

    // Verificar predicado de ordenamiento personalizado
    if (targetContainer.sortPredicate) {
      return targetContainer.sortPredicate(targetIndex, item);
    }

    return true;
  }

  /**
   * Obtiene el predicado de ordenamiento para experiencias
   */
  getExperienceSortPredicate(): (index: number, item: WorkExperience) => boolean {
    return (index: number, item: WorkExperience) => {
      // Permitir reordenamiento solo si el elemento está activo
      return item.status === CvEntryStatus.ACTIVE;
    };
  }

  /**
   * Obtiene el predicado de ordenamiento para educación
   */
  getEducationSortPredicate(): (index: number, item: EducationEntry) => boolean {
    return (index: number, item: EducationEntry) => {
      // Permitir reordenamiento solo si el elemento está activo
      return item.status === 'COMPLETED' || item.status === 'IN_PROGRESS';
    };
  }

  /**
   * Aplica orden personalizado a experiencias
   */
  applyExperienceOrder(experiences: WorkExperience[], order: string[]): WorkExperience[] {
    if (order.length === 0) return experiences;

    const ordered: WorkExperience[] = [];
    const unordered: WorkExperience[] = [];

    // Separar elementos ordenados y no ordenados
    experiences.forEach(exp => {
      const orderIndex = order.findIndex(id => id === exp.id);
      if (orderIndex !== -1) {
        ordered[orderIndex] = exp;
      } else {
        unordered.push(exp);
      }
    });

    // Combinar elementos ordenados (sin huecos) con no ordenados
    return [...ordered.filter(Boolean), ...unordered];
  }

  /**
   * Aplica orden personalizado a educación
   */
  applyEducationOrder(education: EducationEntry[], order: string[]): EducationEntry[] {
    if (order.length === 0) return education;

    const ordered: EducationEntry[] = [];
    const unordered: EducationEntry[] = [];

    // Separar elementos ordenados y no ordenados
    education.forEach(edu => {
      const orderIndex = order.findIndex(id => id === edu.id);
      if (orderIndex !== -1) {
        ordered[orderIndex] = edu;
      } else {
        unordered.push(edu);
      }
    });

    // Combinar elementos ordenados (sin huecos) con no ordenados
    return [...ordered.filter(Boolean), ...unordered];
  }

  /**
   * Resetea el orden personalizado
   */
  resetOrder(type: 'experience' | 'education' | 'all'): void {
    if (type === 'experience' || type === 'all') {
      this.experienceOrderSubject.next([]);
    }
    if (type === 'education' || type === 'all') {
      this.educationOrderSubject.next([]);
    }

    this.notificationService.showInfo('Orden resetado a valores por defecto');
  }

  /**
   * Actualiza la configuración
   */
  updateConfig(config: Partial<DragDropConfig>): void {
    const currentConfig = this.configSubject.value;
    const newConfig = { ...currentConfig, ...config };
    this.configSubject.next(newConfig);
  }

  /**
   * Obtiene el historial de reordenamientos
   */
  getReorderHistory(): ReorderEvent<any>[] {
    return this.reorderEventsSubject.value;
  }

  /**
   * Limpia el historial de reordenamientos
   */
  clearReorderHistory(): void {
    this.reorderEventsSubject.next([]);
  }

  /**
   * Deshace el último reordenamiento
   */
  undoLastReorder(): boolean {
    const events = this.reorderEventsSubject.value;
    if (events.length === 0) return false;

    const lastEvent = events[events.length - 1];

    // TODO: Implementar lógica de deshacer
    // Esto requeriría mantener el estado anterior y aplicarlo

    this.notificationService.showInfo('Función de deshacer en desarrollo');
    return true;
  }

  /**
   * Configura animaciones CSS para drag & drop
   */
  setupDragAnimations(element: HTMLElement): void {
    const config = this.configSubject.value;
    const duration = config.animationDuration;

    element.style.transition = `all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
    element.style.transform = 'scale(1.02) rotate(2deg)';
    element.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
    element.style.zIndex = '1000';
    element.style.opacity = '0.9';

    // Agregar clase de preview si está configurada
    if (config.previewClass) {
      element.classList.add(config.previewClass);
    }
  }

  /**
   * Limpia animaciones CSS
   */
  cleanupDragAnimations(element: HTMLElement): void {
    const config = this.configSubject.value;

    element.style.transition = '';
    element.style.transform = '';
    element.style.boxShadow = '';
    element.style.zIndex = '';
    element.style.opacity = '';

    // Remover clase de preview
    if (config.previewClass) {
      element.classList.remove(config.previewClass);
    }
  }

  /**
   * Configura zona de drop con feedback visual
   */
  setupDropZone(element: HTMLElement, isValid: boolean): void {
    element.classList.remove('drag-over-valid', 'drag-over-invalid');
    element.classList.add(isValid ? 'drag-over-valid' : 'drag-over-invalid');

    if (isValid) {
      element.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
      element.style.borderColor = '#4CAF50';
    } else {
      element.style.backgroundColor = 'rgba(244, 67, 54, 0.1)';
      element.style.borderColor = '#F44336';
    }
  }

  /**
   * Limpia zona de drop
   */
  cleanupDropZone(element: HTMLElement): void {
    element.classList.remove('drag-over-valid', 'drag-over-invalid');
    element.style.backgroundColor = '';
    element.style.borderColor = '';
  }

  /**
   * Trigger feedback háptico
   */
  triggerHapticFeedback(type: 'start' | 'success' | 'error'): void {
    if ('vibrate' in navigator) {
      switch (type) {
        case 'start':
          navigator.vibrate(50);
          break;
        case 'success':
          navigator.vibrate([50, 50, 50]);
          break;
        case 'error':
          navigator.vibrate([100, 50, 100]);
          break;
      }
    }
  }

  // ===== MÉTODOS PRIVADOS =====

  /**
   * Actualiza el estado del drag & drop
   */
  private updateState(newState: Partial<DragDropState>): void {
    const currentState = this.stateSubject.value;
    this.stateSubject.next({ ...currentState, ...newState });
  }

  /**
   * Actualiza el orden de experiencias
   */
  private updateExperienceOrder(experiences: WorkExperience[]): void {
    const order = experiences.map(exp => exp.id).filter(Boolean) as string[];
    this.experienceOrderSubject.next(order);
  }

  /**
   * Actualiza el orden de educación
   */
  private updateEducationOrder(education: EducationEntry[]): void {
    const order = education.map(edu => edu.id).filter(Boolean) as string[];
    this.educationOrderSubject.next(order);
  }

  /**
   * Registra un evento de reordenamiento
   */
  private recordReorderEvent<T>(
    type: 'experience' | 'education',
    event: CdkDragDrop<T[]>,
    item: T
  ): void {
    const reorderEvent: ReorderEvent<T> = {
      type,
      action: event.previousContainer === event.container ? 'move' : 'transfer',
      item,
      previousIndex: event.previousIndex,
      currentIndex: event.currentIndex,
      previousContainer: event.previousContainer.id,
      currentContainer: event.container.id,
      timestamp: new Date()
    };

    const currentEvents = this.reorderEventsSubject.value;
    const updatedEvents = [...currentEvents, reorderEvent];
    
    // Mantener solo los últimos 50 eventos
    if (updatedEvents.length > 50) {
      updatedEvents.splice(0, updatedEvents.length - 50);
    }

    this.reorderEventsSubject.next(updatedEvents);
  }

  /**
   * Obtiene el tipo de un elemento
   */
  private getItemType(item: any): string {
    if (item.position && item.company) {
      return 'experience';
    }
    if (item.title && item.institution) {
      return 'education';
    }
    return 'unknown';
  }
}
