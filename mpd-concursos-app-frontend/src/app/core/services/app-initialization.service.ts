import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth/auth.service';
import { TokenService } from './auth/token.service';

@Injectable({
  providedIn: 'root'
})
export class AppInitializationService {

  constructor(
    private authService: AuthService,
    private tokenService: TokenService,
    private router: Router
  ) {}

  /**
   * Inicializa la aplicación verificando el estado de autenticación
   * y redirigiendo al usuario a la ruta apropiada
   */
  public initializeApp(): Promise<void> {
    return new Promise((resolve) => {
      console.log('[AppInitialization] 🚀 Inicializando aplicación...');
      
      try {
        // Verificar si hay un token válido en localStorage
        const token = this.tokenService.getToken();
        
        if (token) {
          console.log('[AppInitialization] 🔍 Token encontrado, verificando validez...');
          
          if (this.tokenService.validateToken(token)) {
            console.log('[AppInitialization] ✅ Token válido, usuario autenticado');
            
            // Cargar información del usuario
            this.loadUserInfo();
            console.log('[AppInitialization] ✅ Usuario autenticado, permitiendo navegación normal');
          } else {
            console.log('[AppInitialization] ❌ Token inválido, limpiando sesión...');
            this.tokenService.signOut();
          }
        } else {
          console.log('[AppInitialization] ❌ No hay token disponible');
          // No hacer nada, dejar que Angular maneje la redirección
        }
        
        resolve();
      } catch (error) {
        console.error('[AppInitialization] ❌ Error durante la inicialización:', error);
        this.tokenService.signOut();
        resolve();
      }
    });
  }

  /**
   * Carga la información del usuario desde el token
   */
  private loadUserInfo(): void {
    try {
      // El AuthService ya maneja la carga de información del usuario
      // Solo necesitamos asegurarnos de que se ejecute
      const userInfo = this.authService.userInfo();
      console.log('[AppInitialization] 👤 Información del usuario cargada:', userInfo);
    } catch (error) {
      console.error('[AppInitialization] ❌ Error cargando información del usuario:', error);
    }
  }

  /**
   * Limpia la sesión y redirige al login
   */
  private clearSessionAndRedirectToLogin(): void {
    this.tokenService.signOut();
    
    // Solo redirigir si no estamos ya en login
    const currentUrl = this.router.url;
    if (currentUrl !== '/login') {
      this.router.navigate(['/login']);
    }
  }

  /**
   * Verifica si el usuario debe ser redirigido a una ruta específica
   * basándose en el estado de la aplicación
   */
  public checkRouteRedirection(): void {
    const currentUrl = this.router.url;
    const isAuthenticated = this.authService.isAuthenticated();
    
    console.log(`[AppInitialization] 🔍 Verificando redirección - URL: ${currentUrl}, Autenticado: ${isAuthenticated}`);
    
    // Si el usuario está autenticado pero está en login, redirigir a dashboard
    if (isAuthenticated && currentUrl === '/login') {
      console.log('[AppInitialization] 🔄 Usuario autenticado en login, redirigiendo a dashboard...');
      this.router.navigate(['/dashboard']);
      return;
    }
    
    // Si el usuario no está autenticado y está en una ruta protegida, redirigir a login
    if (!isAuthenticated && currentUrl !== '/login' && currentUrl !== '/register') {
      console.log('[AppInitialization] 🔄 Usuario no autenticado en ruta protegida, redirigiendo a login...');
      this.router.navigate(['/login']);
      return;
    }
  }
}
