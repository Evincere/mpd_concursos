import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router, ActivatedRoute } from '@angular/router';
import { InscriptionStateService } from '@core/services/inscripcion/inscription-state.service';
import { InscriptionService } from '@core/services/inscripcion/inscription.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-return-to-inscription-banner',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule
  ],
  template: `
    <div *ngIf="showBanner" class="return-banner">
      <div class="banner-content">
        <mat-icon>assignment_return</mat-icon>
        <span>Está completando documentación para su inscripción. Cuando termine, haga clic en el botón para volver al proceso.</span>
      </div>
      <button mat-raised-button (click)="returnToInscription()">
        Volver a la inscripción
      </button>
    </div>
  `,
  styles: [`
    .return-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background-color: #1a237e; /* Fondo azul oscuro para mejor contraste */
      border-left: 4px solid #3f51b5;
      padding: 16px 20px;
      margin-bottom: 20px;
      border-radius: 4px;
      box-shadow: 0 3px 5px rgba(0,0,0,0.2);
      color: white; /* Texto blanco para mejor contraste */
    }

    .banner-content {
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 500; /* Texto semi-bold para mejor legibilidad */
    }

    mat-icon {
      color: #8c9eff; /* Color más claro para el icono */
      font-size: 24px;
      height: 24px;
      width: 24px;
    }

    button {
      white-space: nowrap;
      background-color: #4caf50 !important; /* Verde para el botón de acción */
      color: white !important;
      font-weight: 500;
      padding: 8px 16px;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      transition: background-color 0.3s, box-shadow 0.3s;
    }

    button:hover {
      background-color: #43a047 !important;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    }

    @media (max-width: 768px) {
      .return-banner {
        flex-direction: column;
        gap: 16px;
      }

      .banner-content {
        text-align: center;
        width: 100%;
      }

      button {
        width: 100%;
      }
    }
  `]
})
export class ReturnToInscriptionBannerComponent implements OnInit, OnDestroy {
  showBanner = false;
  private queryParamSubscription: Subscription | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private inscriptionStateService: InscriptionStateService,
    private inscriptionService: InscriptionService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Verificar si venimos de la inscripción por parámetro de consulta
    this.queryParamSubscription = this.route.queryParams.subscribe(params => {
      if (params['fromInscription'] === 'true') {
        this.showBanner = true;
      }
    });

    // También verificar si hay una inscripción guardada
    const inscriptionId = this.inscriptionStateService.getRedirectFromInscription();
    if (inscriptionId) {
      this.showBanner = true;
    }
  }

  ngOnDestroy(): void {
    if (this.queryParamSubscription) {
      this.queryParamSubscription.unsubscribe();
    }
  }

  returnToInscription(): void {
    // Obtener el ID de inscripción desde el servicio de estado
    const inscriptionId = this.inscriptionStateService.getRedirectFromInscription();

    console.log('[ReturnToInscriptionBanner] Intentando volver a la inscripción:', { inscriptionId });

    if (!inscriptionId) {
      // Si no hay ID de inscripción, simplemente redirigir a la página de concursos
      this.router.navigate(['/dashboard/concursos']);

      this.snackBar.open('No se encontró la inscripción en progreso. Redirigiendo a la página de concursos.', 'Cerrar', {
        duration: 5000
      });
      return;
    }

    // Intentar obtener el contestId directamente desde las inscripciones activas
    let contestId: number | null = null;

    // Suscribirse a las inscripciones para obtener el contestId
    this.inscriptionService.inscriptions.subscribe(inscripciones => {
      const inscripcionActual = inscripciones.find(ins => ins.id === inscriptionId);
      if (inscripcionActual) {
        contestId = inscripcionActual.contestId;
        console.log('[ReturnToInscriptionBanner] Inscripción encontrada en el servicio:', inscripcionActual);
      }
    }).unsubscribe(); // Desuscribirse inmediatamente

    if (contestId) {
      // Limpiar la marca de redirección
      this.inscriptionStateService.clearRedirectFromInscription();

      // Abrir directamente el diálogo de inscripción para el concurso
      this.router.navigate(['/dashboard/concursos', contestId], {
        queryParams: {
          continueInscription: 'true',
          inscriptionId: inscriptionId,
          openDialog: 'true' // Parámetro adicional para forzar la apertura del diálogo
        }
      });

      this.snackBar.open('Volviendo al proceso de inscripción...', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    // Intentar obtener el estado del formulario desde el servicio de inscripción
    const formState = this.inscriptionService.getFormState(inscriptionId);

    if (formState && formState.contestId) {
      console.log('[ReturnToInscriptionBanner] Estado encontrado en el servicio:', formState);

      // Limpiar la marca de redirección
      this.inscriptionStateService.clearRedirectFromInscription();

      // Redirigir al usuario a la página de detalle del concurso con parámetros para continuar
      this.router.navigate(['/dashboard/concursos', formState.contestId], {
        queryParams: {
          continueInscription: 'true',
          inscriptionId: inscriptionId,
          openDialog: 'true' // Parámetro adicional para forzar la apertura del diálogo
        }
      });

      this.snackBar.open('Volviendo al proceso de inscripción...', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    // Intentar obtener la inscripción desde el método antiguo
    const inscription = this.inscriptionStateService.getInProgressInscription();

    if (inscription && inscription.contestId) {
      console.log('[ReturnToInscriptionBanner] Inscripción encontrada en localStorage:', inscription);

      // Limpiar la marca de redirección
      this.inscriptionStateService.clearRedirectFromInscription();

      // Redirigir al usuario a la página de detalle del concurso
      this.router.navigate(['/dashboard/concursos', inscription.contestId], {
        queryParams: {
          continueInscription: 'true',
          inscriptionId: inscriptionId,
          openDialog: 'true' // Parámetro adicional para forzar la apertura del diálogo
        }
      });

      this.snackBar.open('Volviendo al proceso de inscripción...', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    // Si no encontramos información del concurso, intentar obtener el estado guardado
    const savedState = this.inscriptionStateService.getInscriptionState(inscriptionId);

    if (savedState && savedState.contestId) {
      console.log('[ReturnToInscriptionBanner] Estado encontrado en localStorage:', savedState);

      // Limpiar la marca de redirección
      this.inscriptionStateService.clearRedirectFromInscription();

      // Redirigir al usuario a la página de detalle del concurso
      this.router.navigate(['/dashboard/concursos', savedState.contestId], {
        queryParams: {
          continueInscription: 'true',
          inscriptionId: inscriptionId,
          openDialog: 'true' // Parámetro adicional para forzar la apertura del diálogo
        }
      });

      this.snackBar.open('Volviendo al proceso de inscripción...', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    // Si no encontramos ninguna información, simplemente navegar a concursos
    this.inscriptionStateService.clearRedirectFromInscription();
    this.router.navigate(['/dashboard/concursos']);

    this.snackBar.open('No se encontró información del concurso. Redirigiendo a la página de concursos.', 'Cerrar', {
      duration: 5000
    });
  }
}
