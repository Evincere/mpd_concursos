import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomButtonComponent } from '@shared/components/custom-button/custom-button.component';
import { Concurso } from '@shared/interfaces/concurso/concurso.interface';

@Component({
  selector: 'app-inscripcion-button',
  standalone: true,
  imports: [CommonModule, CustomButtonComponent],
  template: `
    <app-custom-button
      [label]="buttonText"
      [variant]="buttonVariant"
      [disabled]="isDisabled"
      [icon]="buttonIcon"
      (buttonClick)="handleClick()">
    </app-custom-button>
  `,
  styleUrls: ['./inscripcion-button.component.scss']
})
export class InscripcionButtonComponent {
  @Input() contest!: Concurso;
  @Input() concurso!: Concurso; // Alias para compatibilidad
  @Input() userPostulation: any = null;
  @Output() inscripcionClick = new EventEmitter<Concurso>();
  @Output() continuarClick = new EventEmitter<Concurso>();

  // Getter para usar el concurso correcto
  get currentContest(): Concurso {
    return this.contest || this.concurso;
  }

  get buttonText(): string {
    if (this.userPostulation) {
      if (this.userPostulation.status === 'COMPLETED_PENDING_DOCS') {
        return 'Continuar';
      }
      return 'Ver Postulación';
    }
    return 'Inscribirse';
  }

  get buttonVariant(): 'primary' | 'secondary' | 'success' | 'warning' | 'danger' {
    if (this.userPostulation) {
      if (this.userPostulation.status === 'COMPLETED_PENDING_DOCS') {
        return 'warning';
      }
      return 'secondary';
    }
    return 'primary';
  }

  get buttonIcon(): string {
    if (this.userPostulation) {
      if (this.userPostulation.status === 'COMPLETED_PENDING_DOCS') {
        return 'fas fa-play';
      }
      return 'fas fa-eye';
    }
    return 'fas fa-user-plus';
  }

  get isDisabled(): boolean {
    // Estados que permiten inscripciones
    const allowedStates = ['PUBLISHED', 'INSCRIPTION_OPEN', 'ACTIVE']; // ACTIVE legacy
    return !allowedStates.includes(this.currentContest.status);
  }

  handleClick(): void {
    if (this.userPostulation?.status === 'COMPLETED_PENDING_DOCS') {
      this.continuarClick.emit(this.currentContest);
    } else {
      this.inscripcionClick.emit(this.currentContest);
    }
  }
}