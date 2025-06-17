import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

// Directives
import { LazyLoadImageDirective } from '@shared/directives/lazy-load-image.directive';

// Services
import { AuthService } from '@core/services/auth/auth.service';
import { UserProfileService } from '@core/services/user/user-profile.service';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-profile-image-manager',
  standalone: true,
  imports: [
    CommonModule,
    LazyLoadImageDirective,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="profile-image-manager">
      <div class="image-container" [class.loading]="isLoading">
        <img
          *ngIf="currentImage"
          appLazyLoadImage
          [src]="currentImage"
          [placeholder]="'assets/images/avatar-placeholder.png'"
          alt="Imagen de perfil"
          class="profile-image"
          [loadingClass]="'profile-image-loading'"
          [loadedClass]="'profile-image-loaded'"
          [errorClass]="'profile-image-error'">
        <div *ngIf="!currentImage" class="default-avatar">
          <mat-icon>person</mat-icon>
        </div>
        <div *ngIf="isLoading" class="loading-overlay">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      </div>
      
      <input
        type="file"
        #fileInput
        (change)="onFileSelected($event)"
        accept="image/*"
        style="display: none"
      >
      
      <div class="actions">
        <button mat-raised-button color="primary" (click)="fileInput.click()">
          <mat-icon>photo_camera</mat-icon>
          Cambiar foto
        </button>
        
        <button 
          mat-button 
          color="warn" 
          *ngIf="currentImage"
          (click)="removeImage()"
        >
          <mat-icon>delete</mat-icon>
          Eliminar
        </button>
      </div>
    </div>
  `,
  styles: [`
    .profile-image-manager {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
    }

    .image-container {
      position: relative;
      width: 150px;
      height: 150px;
      border-radius: 50%;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);

      &.loading {
        opacity: 0.7;
      }
    }

    .profile-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: all 0.3s ease;

      /* Lazy loading states */
      &.profile-image-loading {
        opacity: 0.6;
        filter: blur(2px);
        background: linear-gradient(90deg,
          rgba(224, 224, 224, 0.3) 25%,
          rgba(224, 224, 224, 0.5) 50%,
          rgba(224, 224, 224, 0.3) 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
      }

      &.profile-image-loaded {
        opacity: 1;
        filter: none;
        animation: fadeIn 0.3s ease-in;
      }

      &.profile-image-error {
        opacity: 0.5;
        filter: grayscale(100%);
        background: rgba(239, 68, 68, 0.1);
      }
    }

    .default-avatar {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #e0e0e0;

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: #757575;
      }
    }

    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(255,255,255,0.8);
    }

    .actions {
      display: flex;
      gap: 1rem;
      margin-top: 1rem;
    }

    /* Lazy loading animations */
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `]
})
export class ProfileImageManagerComponent implements OnInit {
  private authService = inject(AuthService);
  private userProfileService = inject(UserProfileService);

  currentImage: string | null = null;
  isLoading = false;

  ngOnInit() {
    this.authService.getUserInfo().subscribe(userInfo => {
      this.currentImage = userInfo.profileImage || null;
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      if (!file.type.startsWith('image/')) {
        alert('Por favor, seleccione un archivo de imagen válido.');
        return;
      }

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        alert('El archivo es demasiado grande. El tamaño máximo permitido es 5MB.');
        return;
      }

      this.isLoading = true;
      this.userProfileService.uploadProfileImage(file).subscribe({
        next: (response) => {
          if (response && (response as any).imageUrl) {
            this.currentImage = (response as any).imageUrl;
            this.authService.updateProfileImage((response as any).imageUrl);
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error al cargar la imagen:', error);
          alert('Error al cargar la imagen. Por favor, intente nuevamente.');
          this.isLoading = false;
        }
      });
    }
  }

  removeImage() {
    if (confirm('¿Está seguro que desea eliminar su foto de perfil?')) {
      this.isLoading = true;
      this.userProfileService.removeProfileImage().subscribe({
        next: () => {
          this.currentImage = null;
          this.authService.updateProfileImage('');
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error al eliminar la imagen:', error);
          alert('Error al eliminar la imagen. Por favor, intente nuevamente.');
          this.isLoading = false;
        }
      });
    }
  }
}
