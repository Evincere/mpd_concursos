import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup } from '@angular/forms';

// Modelos
import { UserProfile, ExperienciaData } from '@core/models/perfil.model';
import { Educacion } from '@core/models/educacion.model';

// Componentes
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { CustomCardComponent } from '@shared/components/custom-form/custom-card/custom-card.component';
import { CustomSpinnerComponent } from '@shared/components/custom-form/custom-spinner/custom-spinner.component';

@Component({
  selector: 'app-perfil-cv',
  templateUrl: './perfil-cv.component.html',
  styleUrls: ['./perfil-cv.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    CustomButtonComponent,
    CustomCardComponent,
    CustomSpinnerComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PerfilCvComponent {
  @Input() userProfile: UserProfile | null = null;
  @Input() experiencias: FormGroup[] = [];
  @Input() educacionList: Educacion[] = [];
  @Input() isLoading = false;

  @Output() addExperience = new EventEmitter<void>();
  @Output() addEducation = new EventEmitter<void>();
  @Output() deleteExperience = new EventEmitter<number>();
  @Output() deleteEducation = new EventEmitter<number>();

  onAddExperience(): void {
    this.addExperience.emit();
  }

  onAddEducation(): void {
    this.addEducation.emit();
  }

  onDeleteExperience(index: number): void {
    this.deleteExperience.emit(index);
  }

  onDeleteEducation(index: number): void {
    this.deleteEducation.emit(index);
  }
  formatDate(date: any): string {
    if (!date) return '';

    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return '';

      return dateObj.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long'
      });
    } catch {
      return '';
    }
  }
}
