import { Injectable } from '@angular/core';
import { LoggingService } from '@core/services/logging/logging.service';
import { Router, NavigationEnd } from '@angular/router';
import { BehaviorSubject, Observable, filter } from 'rxjs';
import { AuthService } from '../auth/auth.service';

/**
 * Tipo de sección de la aplicación
 */
export enum AppSection {
  USER = 'user',
  ADMIN = 'admin'
}

/**
 * Servicio para gestionar la navegación entre secciones de la aplicación
 */
@Injectable({
  providedIn: 'root'
})
export class SectionNavigationService {
  private currentSectionSubject = new BehaviorSubject<AppSection>(AppSection.USER);

  /**
   * Observable que emite la sección actual de la aplicación
   */
  public currentSection$: Observable<AppSection> = this.currentSectionSubject.asObservable();

  constructor(
    
    private router: Router,
    private authService: AuthService
  ,
    private loggingService: LoggingService
  ) {
    // Detectar cambios en la ruta para actualizar la sección actual
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: unknown) => {
      const eventAny = event as { urlAfterRedirects?: string; url?: string };
      const url = eventAny.urlAfterRedirects || eventAny.url;
      if (url) {
        this.updateCurrentSection(url);
      }
    });
  }

  /**
   * Actualiza la sección actual basada en la URL
   */
  private updateCurrentSection(url: string): void {
    if (url.startsWith('/admin')) {
      this.currentSectionSubject.next(AppSection.ADMIN);
    } else {
      this.currentSectionSubject.next(AppSection.USER);
    }
  }

  /**
   * Navega a la sección de usuario
   */
  public navigateToUserSection(): void {
    this.router.navigate(['/dashboard']);
  }

  /**
   * Navega a la sección de administración
   */
  public navigateToAdminSection(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  /**
   * Retorna la sección actual
   */
  public getCurrentSection(): AppSection {
    return this.currentSectionSubject.value;
  }

  /**
   * Verifica si la sección actual es la de usuario
   */
  public isUserSection(): boolean {
    return this.getCurrentSection() === AppSection.USER;
  }

  /**
   * Verifica si la sección actual es la de administración
   */
  public isAdminSection(): boolean {
    return this.getCurrentSection() === AppSection.ADMIN;
  }

  /**
   * Verifica si el usuario puede acceder a la sección de administración
   */
  public canAccessAdminSection(): boolean {
    return this.authService.hasRole('ROLE_ADMIN');
  }
}
