import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserProfileService } from '../../../../core/services/user/user-profile.service';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-profile-image-manager',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="profile-image-manager">
      <div class="image-container" [class.loading]="isLoading">
        <img *ngIf="currentImage" [src]="currentImage" alt="Imagen de perfil" class="profile-image">
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
  `]
})
export class ProfileImageManagerComponent implements OnInit {
  currentImage: string | null = null;
  isLoading = false;

  constructor(
    private userProfileService: UserProfileService,
    private authService: AuthService
  ) {}

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
          if (response && response.imageUrl) {
            this.currentImage = response.imageUrl;
            this.authService.updateProfileImage(response.imageUrl);
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
