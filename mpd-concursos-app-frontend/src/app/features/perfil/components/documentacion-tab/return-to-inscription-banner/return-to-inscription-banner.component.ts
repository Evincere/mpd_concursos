import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router, ActivatedRoute } from '@angular/router';
import { InscriptionStateService } from '@core/services/inscripcion/inscription-state.service';
import { InscriptionService } from '@core/services/inscripcion/inscription.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { InscripcionState } from '@core/models/inscripcion/inscripcion-state.enum';
import { IInscription } from '@shared/interfaces/inscripcion/inscription.interface';

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
        <div class="message">
          <h4>Inscripción en progreso</h4>
          <p>Está completando documentación para su inscripción. Cuando termine, haga clic en el botón para volver al proceso.</p>
        </div>
      </div>
      <button mat-raised-button (click)="returnToInscription()">
        <mat-icon>arrow_forward</mat-icon>
        Volver a la inscripción
      </button>
    </div>
  `,
  styles: [`
    .return-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(30, 30, 30, 0.7); /* Fondo oscuro semi-transparente */
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(63, 81, 181, 0.2); /* Borde sutil con color primario */
      border-left: 4px solid #3f51b5;
      padding: 16px 20px;
      margin-bottom: 20px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      color: rgba(255, 255, 255, 0.87); /* Texto blanco con ligera transparencia */
    }

    .banner-content {
      display: flex;
      align-items: center;
      gap: 16px;
      font-weight: 400;
      line-height: 1.5;
    }

    .message {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .message h4 {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
      color: #fff;
    }

    .message p {
      margin: 0;
      font-size: 14px;
      color: rgba(255, 255, 255, 0.8);
    }

    mat-icon {
      color: #3f51b5; /* Color primario para el icono */
      font-size: 24px;
      height: 24px;
      width: 24px;
      filter: drop-shadow(0 0 5px rgba(63, 81, 181, 0.5)); /* Efecto de brillo */
    }

    button {
      white-space: nowrap;
      background: linear-gradient(135deg, #3f51b5 0%, #303f9f 100%) !important; /* Gradiente elegante */
      color: white !important;
      font-weight: 500;
      padding: 8px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(63, 81, 181, 0.3);
      transition: all 0.3s ease;
      border: none;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    button mat-icon {
      font-size: 18px;
      height: 18px;
      width: 18px;
      color: white;
      filter: none;
      margin-right: 4px;
    }

    button:hover {
      background: linear-gradient(135deg, #3949ab 0%, #283593 100%) !important;
      box-shadow: 0 6px 16px rgba(63, 81, 181, 0.4);
      transform: translateY(-2px);
    }

    button:active {
      transform: translateY(1px);
      box-shadow: 0 2px 8px rgba(63, 81, 181, 0.3);
    }

    @media (max-width: 768px) {
      .return-banner {
        flex-direction: column;
        gap: 20px;
        padding: 20px;
      }

      .banner-content {
        text-align: center;
        width: 100%;
        flex-direction: column;
        align-items: center;
      }

      .message {
        text-align: center;
        align-items: center;
      }

      button {
        width: 100%;
        padding: 12px 20px;
        justify-content: center;
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
    console.log('[ReturnToInscriptionBanner] Inicializando componente');

    // Verificar si venimos de la inscripción por parámetro de consulta
    this.queryParamSubscription = this.route.queryParams.subscribe(params => {
      if (params['fromInscription'] === 'true') {
        console.log('[ReturnToInscriptionBanner] Parámetro fromInscription detectado');
        this.showBanner = true;
      }
    });

    // También verificar si hay una inscripción guardada
    const inscriptionId = this.inscriptionStateService.getRedirectFromInscription();

    if (inscriptionId) {
      console.log('[ReturnToInscriptionBanner] ID de inscripción encontrado:', inscriptionId);

      // Verificar si la inscripción está realmente en proceso
      this.inscriptionService.inscriptions.subscribe(inscripciones => {
        const inscripcionActual = inscripciones.find(ins => ins.id === inscriptionId);

        if (inscripcionActual) {
          console.log('[ReturnToInscriptionBanner] Estado de la inscripción:', inscripcionActual.state);

          // Solo mostrar el banner si la inscripción está en estado PENDING
          if (inscripcionActual.state === InscripcionState.PENDING) {
            this.showBanner = true;
          } else {
            console.log('[ReturnToInscriptionBanner] La inscripción no está en proceso, no se muestra el banner');
            // Limpiar la marca de redirección si la inscripción ya no está en proceso
            this.inscriptionStateService.clearRedirectFromInscription();
            this.showBanner = false;
          }
        } else {
          // Verificar en el localStorage como respaldo
          const formState = this.inscriptionService.getFormState(inscriptionId);
          if (formState && formState.currentStep < 3) {
            this.showBanner = true;
          } else {
            console.log('[ReturnToInscriptionBanner] No se encontró información de la inscripción o ya está completa');
            this.inscriptionStateService.clearRedirectFromInscription();
            this.showBanner = false;
          }
        }
      });
    }
  }

  ngOnDestroy(): void {
    if (this.queryParamSubscription) {
      this.queryParamSubscription.unsubscribe();
    }
  }

  returnToInscription(): void {
    // Deshabilitar el botón inmediatamente para evitar doble clic
    this.showBanner = false;

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

    // Obtener las inscripciones actuales
    let inscripciones: IInscription[] = [];
    this.inscriptionService.inscriptions.subscribe((inscripcionesList: IInscription[]) => {
      inscripciones = [...inscripcionesList];
    }).unsubscribe();

    const inscripcionActual = inscripciones.find((ins: IInscription) => ins.id === inscriptionId);

    if (inscripcionActual) {
      console.log('[ReturnToInscriptionBanner] Inscripción encontrada:', inscripcionActual);

      // Verificar si la inscripción ya está completada
      if (inscripcionActual.state === InscripcionState.CONFIRMADA || inscripcionActual.state === InscripcionState.INSCRIPTO) {
        console.log('[ReturnToInscriptionBanner] La inscripción ya está completada');
        this.inscriptionStateService.clearRedirectFromInscription();
        this.router.navigate(['/dashboard/mis-postulaciones']);
        this.snackBar.open('La inscripción ya ha sido completada. Puede verla en sus postulaciones.', 'Cerrar', {
          duration: 3000
        });
        return;
      }

      // Si la inscripción está en proceso, continuar con ella
      if (inscripcionActual.contestId) {
        console.log('[ReturnToInscriptionBanner] Redirigiendo a concurso:', inscripcionActual.contestId);

        // Guardar el ID de inscripción en el servicio para que el componente de inscripción lo detecte
        // Usar el objeto inscripcionActual que ya tiene todos los campos necesarios
        this.inscriptionStateService.saveInProgressInscription(inscripcionActual);

        // Limpiar la marca de redirección para evitar ciclos
        this.inscriptionStateService.clearRedirectFromInscription();

        // Navegar al concurso con parámetros especiales
        this.router.navigate(['/dashboard/concursos', inscripcionActual.contestId], {
          queryParams: {
            continueInscription: 'true',
            inscriptionId: inscriptionId,
            openDialog: 'true',
            forceOpen: 'true',
            timestamp: new Date().getTime()
          }
        });

        this.snackBar.open('Retomando el proceso de inscripción...', 'Cerrar', {
          duration: 3000
        });
        return;
      }
    }

    // Si no encontramos la inscripción en el servicio, intentar obtener el estado del formulario
    const formState = this.inscriptionService.getFormState(inscriptionId);

    if (formState && formState.contestId) {
      console.log('[ReturnToInscriptionBanner] Estado encontrado en localStorage:', formState);

      // Limpiar la marca de redirección para evitar ciclos
      this.inscriptionStateService.clearRedirectFromInscription();

      // Navegar al concurso con parámetros especiales
      this.router.navigate(['/dashboard/concursos', formState.contestId], {
        queryParams: {
          continueInscription: 'true',
          inscriptionId: inscriptionId,
          openDialog: 'true',
          forceOpen: 'true',
          timestamp: new Date().getTime()
        }
      });

      this.snackBar.open('Retomando el proceso de inscripción...', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    // Último intento: obtener la inscripción desde el método antiguo
    const inscription = this.inscriptionStateService.getInProgressInscription();

    if (inscription && inscription.contestId) {
      console.log('[ReturnToInscriptionBanner] Inscripción encontrada en localStorage:', inscription);

      // Limpiar la marca de redirección para evitar ciclos
      this.inscriptionStateService.clearRedirectFromInscription();

      // Navegar al concurso con parámetros especiales
      this.router.navigate(['/dashboard/concursos', inscription.contestId], {
        queryParams: {
          continueInscription: 'true',
          inscriptionId: inscriptionId,
          openDialog: 'true',
          forceOpen: 'true',
          timestamp: new Date().getTime()
        }
      });

      this.snackBar.open('Retomando el proceso de inscripción...', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    // Si llegamos aquí, no pudimos encontrar información suficiente
    console.log('[ReturnToInscriptionBanner] No se pudo encontrar información de la inscripción');

    // Limpiar cualquier estado parcial para evitar problemas futuros
    this.inscriptionStateService.clearRedirectFromInscription();
    if (inscriptionId) {
      this.inscriptionService.clearFormState(inscriptionId);
    }

    this.router.navigate(['/dashboard/concursos']);
    this.snackBar.open('No se pudo recuperar la información de la inscripción. Por favor, inicie el proceso nuevamente.', 'Cerrar', {
      duration: 5000
    });
  }
}
