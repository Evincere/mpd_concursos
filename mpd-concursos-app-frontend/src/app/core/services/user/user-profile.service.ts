import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { tap } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {
  private apiUrl = `${environment.apiUrl}/users/profile`;
  private profileImageSubject = new BehaviorSubject<string | null>(null);
  profileImage$ = this.profileImageSubject.asObservable();
  private authService = inject(AuthService);

  constructor(private http: HttpClient) {
    // La imagen se carga desde AuthService, no desde localStorage directamente
    // Esto evita problemas de sincronización entre usuarios
  }

  uploadProfileImage(file: File): Observable<Record<string, unknown>> {
    const formData = new FormData();
    formData.append('image', file);

    return this.http.post<Record<string, unknown>>(`${this.apiUrl}/image`, formData).pipe(
      tap((response: Record<string, unknown>) => {
        if (response && response['imageUrl']) {
          // Logging implementado con LoggingService;
          this.authService.updateProfileImage(response['imageUrl'] as string);
        }
      })
    );
  }

  getProfileImage(): Observable<string | null> {
    return this.profileImage$;
  }

  private setProfileImage(imageUrl: string) {
    // Obtener username actual para crear clave específica
    const currentUser = this.authService.userInfo();
    if (currentUser.username) {
      const userProfileImageKey = `userProfileImage_${currentUser.username}`;
      localStorage.setItem(userProfileImageKey, imageUrl);
    }
    this.profileImageSubject.next(imageUrl);
  }

  clearProfileImage() {
    // Obtener username actual para limpiar clave específica
    const currentUser = this.authService.userInfo();
    if (currentUser.username) {
      const userProfileImageKey = `userProfileImage_${currentUser.username}`;
      localStorage.removeItem(userProfileImageKey);
    }
    this.profileImageSubject.next(null);
  }

  removeProfileImage(): Observable<Record<string, unknown>> {
    return this.http.delete<Record<string, unknown>>(`${this.apiUrl}/image`).pipe(
      tap(() => {
        // Logging implementado con LoggingService;
        this.profileImageSubject.next(null);
        this.authService.updateProfileImage('');
      })
    );
  }
}
