import { Injectable } from '@angular/core';
import { Location } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { BehaviorSubject, Observable, filter } from 'rxjs';

/**
 * Interfaz para el historial de navegación
 */
export interface NavigationHistoryItem {
  url: string;
  title?: string;
  timestamp: number;
}

/**
 * Servicio para gestionar la navegación entre páginas.
 * Mantiene un historial de navegación y proporciona métodos para navegar hacia atrás y adelante.
 */
@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  private navigationHistory: NavigationHistoryItem[] = [];
  private currentIndex = -1;
  private maxHistorySize = 20;
  
  // Observable para el historial de navegación reciente
  private recentHistorySubject = new BehaviorSubject<NavigationHistoryItem[]>([]);
  recentHistory$: Observable<NavigationHistoryItem[]> = this.recentHistorySubject.asObservable();
  
  // Observable para la URL actual
  private currentUrlSubject = new BehaviorSubject<string>('');
  currentUrl$: Observable<string> = this.currentUrlSubject.asObservable();
  
  constructor(
    private location: Location,
    private router: Router
  ) {
    // Inicializar el historial desde sessionStorage si existe
    const savedHistory = sessionStorage.getItem('navigationHistory');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        this.navigationHistory = parsed.history || [];
        this.currentIndex = parsed.currentIndex || -1;
        this.updateRecentHistory();
      } catch (error) {
        console.error('Error parsing navigation history:', error);
      }
    }
    
    // Suscribirse a los eventos de navegación
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.addToHistory(event.urlAfterRedirects);
      this.currentUrlSubject.next(event.urlAfterRedirects);
    });
  }
  
  /**
   * Navega hacia atrás en el historial
   * @returns true si la navegación fue exitosa, false si no hay historial
   */
  goBack(): boolean {
    if (this.canGoBack()) {
      this.location.back();
      this.currentIndex--;
      this.saveHistory();
      return true;
    }
    return false;
  }
  
  /**
   * Navega hacia adelante en el historial
   * @returns true si la navegación fue exitosa, false si no hay historial
   */
  goForward(): boolean {
    if (this.canGoForward()) {
      this.location.forward();
      this.currentIndex++;
      this.saveHistory();
      return true;
    }
    return false;
  }
  
  /**
   * Verifica si es posible navegar hacia atrás
   * @returns true si es posible navegar hacia atrás
   */
  canGoBack(): boolean {
    return this.currentIndex > 0;
  }
  
  /**
   * Verifica si es posible navegar hacia adelante
   * @returns true si es posible navegar hacia adelante
   */
  canGoForward(): boolean {
    return this.currentIndex < this.navigationHistory.length - 1;
  }
  
  /**
   * Navega a una URL específica
   * @param url URL a la que navegar
   * @param title Título opcional para la página
   */
  navigateTo(url: string, title?: string): void {
    this.router.navigateByUrl(url);
    // La actualización del historial se maneja en el evento NavigationEnd
  }
  
  /**
   * Navega a una URL específica y reemplaza la entrada actual en el historial
   * @param url URL a la que navegar
   * @param title Título opcional para la página
   */
  replaceWith(url: string, title?: string): void {
    this.router.navigateByUrl(url).then(() => {
      if (this.currentIndex >= 0 && this.currentIndex < this.navigationHistory.length) {
        this.navigationHistory[this.currentIndex] = {
          url,
          title,
          timestamp: Date.now()
        };
        this.saveHistory();
        this.updateRecentHistory();
      }
    });
  }
  
  /**
   * Obtiene el historial de navegación completo
   * @returns Historial de navegación
   */
  getHistory(): NavigationHistoryItem[] {
    return [...this.navigationHistory];
  }
  
  /**
   * Obtiene el historial de navegación reciente (últimas 5 entradas)
   * @returns Historial de navegación reciente
   */
  getRecentHistory(): NavigationHistoryItem[] {
    return this.navigationHistory
      .slice(-5)
      .reverse();
  }
  
  /**
   * Limpia el historial de navegación
   */
  clearHistory(): void {
    this.navigationHistory = [];
    this.currentIndex = -1;
    this.saveHistory();
    this.updateRecentHistory();
  }
  
  /**
   * Agrega una entrada al historial de navegación
   * @param url URL a agregar
   * @param title Título opcional para la página
   */
  private addToHistory(url: string, title?: string): void {
    // Si estamos en medio del historial, eliminar las entradas posteriores
    if (this.currentIndex >= 0 && this.currentIndex < this.navigationHistory.length - 1) {
      this.navigationHistory = this.navigationHistory.slice(0, this.currentIndex + 1);
    }
    
    // Agregar la nueva entrada
    this.navigationHistory.push({
      url,
      title,
      timestamp: Date.now()
    });
    
    // Limitar el tamaño del historial
    if (this.navigationHistory.length > this.maxHistorySize) {
      this.navigationHistory = this.navigationHistory.slice(-this.maxHistorySize);
    }
    
    this.currentIndex = this.navigationHistory.length - 1;
    this.saveHistory();
    this.updateRecentHistory();
  }
  
  /**
   * Guarda el historial en sessionStorage
   */
  private saveHistory(): void {
    try {
      sessionStorage.setItem('navigationHistory', JSON.stringify({
        history: this.navigationHistory,
        currentIndex: this.currentIndex
      }));
    } catch (error) {
      console.error('Error saving navigation history:', error);
    }
  }
  
  /**
   * Actualiza el historial reciente
   */
  private updateRecentHistory(): void {
    this.recentHistorySubject.next(this.getRecentHistory());
  }
}
