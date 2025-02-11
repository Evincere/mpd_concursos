import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserProfileService } from '../../../../core/services/user/user-profile.service';

@Component({
  selector: 'app-profile-image-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="profile-image-upload">
      <input
        type="file"
        #fileInput
        (change)="onFileSelected($event)"
        accept="image/*"
        style="display: none"
      />
      <button
        class="upload-button"
        (click)="fileInput.click()"
      >
        Cambiar imagen de perfil
      </button>
    </div>
  `,
  styles: [`
    .profile-image-upload {
      display: flex;
      justify-content: center;
      margin: 1rem 0;
    }
    
    .upload-button {
      padding: 0.5rem 1rem;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    .upload-button:hover {
      background-color: #0056b3;
    }
  `]
})
export class ProfileImageUploadComponent {
  @Output() imageUploaded = new EventEmitter<string>();

  constructor(private userProfileService: UserProfileService) {}

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validar el tipo de archivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor, seleccione un archivo de imagen válido.');
        return;
      }

      // Validar el tamaño del archivo (máximo 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB en bytes
      if (file.size > maxSize) {
        alert('El archivo es demasiado grande. El tamaño máximo permitido es 5MB.');
        return;
      }

      this.userProfileService.uploadProfileImage(file).subscribe({
        next: (response) => {
          if (response && response.imageUrl) {
            this.imageUploaded.emit(response.imageUrl);
          }
        },
        error: (error) => {
          console.error('Error al cargar la imagen:', error);
          alert('Error al cargar la imagen. Por favor, intente nuevamente.');
        }
      });
    }
  }
}
