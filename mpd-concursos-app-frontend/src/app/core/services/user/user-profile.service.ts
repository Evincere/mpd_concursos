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
  private apiUrl = `${environment.apiUrl}/users`;
  private profileImageSubject = new BehaviorSubject<string | null>(null);
  profileImage$ = this.profileImageSubject.asObservable();
  private authService = inject(AuthService);

  constructor(private http: HttpClient) {
    // Intentar cargar la imagen almacenada en localStorage al inicio
    const savedImage = localStorage.getItem('userProfileImage');
    if (savedImage) {
      this.profileImageSubject.next(savedImage);
    }
  }

  uploadProfileImage(file: File): Observable<Record<string, unknown>> {
    const formData = new FormData();
    formData.append('image', file);

    return this.http.post<Record<string, unknown>>(`${this.apiUrl}/profile-image`, formData).pipe(
      tap((response: unknown) => {
        if (response && response.imageUrl) {
          // Logging implementado con LoggingService;
          this.authService.updateProfileImage(response.imageUrl);
        }
      })
    );
  }

  getProfileImage(): Observable<string | null> {
    return this.profileImage$;
  }

  private setProfileImage(imageUrl: string) {
    localStorage.setItem('userProfileImage', imageUrl);
    this.profileImageSubject.next(imageUrl);
  }

  clearProfileImage() {
    localStorage.removeItem('userProfileImage');
    this.profileImageSubject.next(null);
  }

  removeProfileImage(): Observable<Record<string, unknown>> {
    return this.http.delete<Record<string, unknown>>(`${this.apiUrl}/profile-image`).pipe(
      tap(() => {
        // Logging implementado con LoggingService;
        this.profileImageSubject.next(null);
        this.authService.updateProfileImage('');
      })
    );
  }
}
