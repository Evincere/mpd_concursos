import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { GuidedTutorial, TutorialStep, AdminHelpService } from  '@core/services/admin/admin-help.service';

@Component({
  selector: 'app-guided-tutorial',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './guided-tutorial.component.html',
  styleUrls: ['./guided-tutorial.component.scss']
})
export class GuidedTutorialComponent implements OnInit, OnDestroy {
  @Input() tutorial!: GuidedTutorial;

  currentStep = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private adminHelpService: AdminHelpService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    // Suscribirse a los cambios en el paso actual
    this.adminHelpService.getCurrentStep()
      .pipe(takeUntil(this.destroy$))
      .subscribe((step: number) => {
        this.currentStep = step;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Avanza al siguiente paso
   */
  nextStep(): void {
    if (this.currentStep < this.tutorial.steps.length - 1) {
      this.adminHelpService.nextStep();
    } else {
      this.endTutorial();
    }
  }

  /**
   * Retrocede al paso anterior
   */
  previousStep(): void {
    this.adminHelpService.previousStep();
  }

  /**
   * Va a un paso específico
   * @param step Número de paso
   */
  goToStep(step: number): void {
    if (step >= 0 && step < this.tutorial.steps.length) {
      // Implementar lógica para ir a un paso específico
      // Por ahora, simplemente actualizamos el paso actual
      this.currentStep = step;
    }
  }

  /**
   * Finaliza el tutorial
   */
  endTutorial(): void {
    this.adminHelpService.endTutorial();
  }

  /**
   * Obtiene el nombre de un nivel
   * @param level Nivel
   * @returns Nombre del nivel
   */
  getLevelName(level: 'basic' | 'intermediate' | 'advanced'): string {
    switch (level) {
      case 'basic':
        return 'Básico';
      case 'intermediate':
        return 'Intermedio';
      case 'advanced':
        return 'Avanzado';
      default:
        return level;
    }
  }

  /**
   * Obtiene la clase CSS para un nivel
   * @param level Nivel
   * @returns Clase CSS
   */
  getLevelClass(level: 'basic' | 'intermediate' | 'advanced'): string {
    switch (level) {
      case 'basic':
        return 'level-basic';
      case 'intermediate':
        return 'level-intermediate';
      case 'advanced':
        return 'level-advanced';
      default:
        return '';
    }
  }

  /**
   * Obtiene el porcentaje de progreso
   */
  get progressPercentage(): number {
    return Math.round(((this.currentStep + 1) / this.tutorial.steps.length) * 100);
  }

  /**
   * Obtiene los datos del paso actual
   */
  get currentStepData(): TutorialStep | undefined {
    return this.tutorial.steps[this.currentStep];
  }

  /**
   * Obtiene una URL segura para un video
   * @param url URL del video
   * @returns URL segura
   */
  getSafeVideoUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  /**
   * Obtiene el texto descriptivo de una acción
   * @param action Acción a describir
   * @returns Texto descriptivo
   */
  getActionText(action: string): string {
    switch (action) {
      case 'click':
        return 'Hacer clic';
      case 'input':
        return 'Escribir texto';
      case 'hover':
        return 'Pasar el cursor por encima';
      case 'scroll':
        return 'Desplazarse';
      case 'select':
        return 'Seleccionar';
      case 'drag':
        return 'Arrastrar';
      case 'drop':
        return 'Soltar';
      default:
        return action;
    }
  }
}
