import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { InscriptionService } from '@core/services/inscripcion/inscription.service';
import { ProfileService } from '@core/services/profile/profile.service';
import { Contest } from '@shared/interfaces/concurso/concurso.interface';
import { InscriptionStep } from '@shared/enums/inscription-step.enum';
import { DocumentosEmbebidosComponent } from '../../documentos-embebidos/documentos-embebidos.component';
import { CustomAddressAutocompleteComponent } from '@shared/components/custom-address-autocomplete/custom-address-autocomplete.component';
import { animate, style, transition, trigger } from '@angular/animations';
import { InscriptionFormService } from '../../services/inscription-form.service';
import { AddressData, Circunscripcion, InscriptionFormData, RequiredDocument } from '../../models/inscription-form.model';


@Component({
  selector: 'app-inscripcion-process',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    DocumentosEmbebidosComponent,
    CustomAddressAutocompleteComponent
  ],
  templateUrl: './inscripcion-process.component.html',
  styleUrl: './inscripcion-process.component.scss',
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms', style({ opacity: 1 })),
      ]),
      transition(':leave', [
        animate('200ms', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class InscripcionProcessComponent implements OnInit {
  // Pasos de inscripción
  steps = [
    { label: 'Términos' },
    { label: 'Circunscripción' },
    { label: 'Documentación' },
    { label: 'Confirmación' }
  ];

  // Formulario reactivo
  inscriptionForm: FormGroup;

  // Controles individuales para acceso directo en la plantilla
  get termsAcceptedControl(): FormControl {
    return this.inscriptionForm.get('termsAccepted') as FormControl;
  }

  get centroDeVidaControl(): FormControl {
    return this.inscriptionForm.get('centroDeVida') as FormControl;
  }

  get selectedCircunscripcionesControl(): FormControl {
    return this.inscriptionForm.get('selectedCircunscripciones') as FormControl;
  }

  get documentosCompletosControl(): FormControl {
    return this.inscriptionForm.get('documentosCompletos') as FormControl;
  }

  get confirmedPersonalDataControl(): FormControl {
    return this.inscriptionForm.get('confirmedPersonalData') as FormControl;
  }

  // Estado actual
  currentStep = 1;
  progressPercentage = 25;
  loading = false;
  inscriptionId: string | null = null;
  showValidationErrors = false;

  // Datos de la dirección seleccionada
  addressData: AddressData | null = null;

  // Datos para los formularios
  circunscripciones: Circunscripcion[] = [
    { value: 'primera', label: 'Primera Circunscripción Judicial' },
    { value: 'segunda', label: 'Segunda Circunscripción Judicial' },
    { value: 'tercera', label: 'Tercera Circunscripción Judicial' },
    { value: 'cuarta', label: 'Cuarta Circunscripción Judicial' }
  ];

  documentacionRequerida: RequiredDocument[] = [
    { title: 'DNI (Frente)', completed: false, tipoDocumentoId: 'dni-frente' },
    { title: 'DNI (Dorso)', completed: false, tipoDocumentoId: 'dni-dorso' },
    { title: 'Título Universitario', completed: false, tipoDocumentoId: 'titulo-universitario' },
    { title: 'Constancia de CUIL', completed: false, tipoDocumentoId: 'cuil' },
    { title: 'Certificado de Antecedentes Penales', completed: false, tipoDocumentoId: 'antecedentes-penales' },
    { title: 'Certificado de Ejercicio Profesional', completed: false, tipoDocumentoId: 'certificado-profesional' },
    { title: 'Certificado de Sanciones Disciplinarias', completed: false, tipoDocumentoId: 'certificado-sanciones' },
    { title: 'Certificado Ley Micaela', completed: false, tipoDocumentoId: 'certificado-ley-micaela' }
  ];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<InscripcionProcessComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      contest: Contest;
      inscriptionId?: string;
      continueInscription?: boolean;
    },
    private inscriptionService: InscriptionService,
    private inscriptionFormService: InscriptionFormService,
    private profileService: ProfileService,
    private snackBar: MatSnackBar
  ) {
    // Inicializar formulario reactivo
    this.inscriptionForm = this.fb.group({
      termsAccepted: [false, Validators.requiredTrue],
      centroDeVida: ['', Validators.required],
      selectedCircunscripciones: [[], [Validators.required, Validators.minLength(1)]],
      documentosCompletos: [false, Validators.requiredTrue],
      confirmedPersonalData: [false, Validators.requiredTrue]
    });
  }

  ngOnInit(): void {
    // Inicializar el porcentaje de progreso
    this.updateProgressPercentage();

    // Asignar el ID de inscripción si existe, independientemente de si es una continuación
    if (this.data.inscriptionId) {
      this.inscriptionId = this.data.inscriptionId;

      // Cargar el estado guardado solo si es una continuación
      if (this.data.continueInscription) {
        this.loadSavedState();
      }
    }
  }

  // Cargar estado guardado
  loadSavedState(): void {
    if (!this.inscriptionId) return;

    const loaded = this.inscriptionFormService.loadFormState(this.inscriptionId);
    if (loaded) {
      const state = this.inscriptionFormService.getCurrentFormState();
      if (state && state.formData) {
        this.currentStep = Number(state.currentStep) || 1;
        this.updateProgressPercentage();

        // Actualizar el formulario con los datos guardados
        this.inscriptionForm.patchValue({
          termsAccepted: state.formData.termsAccepted || false,
          centroDeVida: state.formData.centroDeVida || '',
          selectedCircunscripciones: state.formData.selectedCircunscripciones || [],
          documentosCompletos: state.formData.documentosCompletos || false,
          confirmedPersonalData: state.formData.confirmedPersonalData || false
        });
      }
    }
  }

  // Actualizar el porcentaje de progreso
  updateProgressPercentage(): void {
    const totalSteps = 4;
    this.progressPercentage = Math.round((this.currentStep / totalSteps) * 100);
  }

  // Navegación entre pasos
  goToStep(step: number): void {
    if (step < this.currentStep) {
      this.currentStep = step;
      this.updateProgressPercentage();
      this.saveCurrentState();
    }
  }

  nextStep(): void {
    if (this.currentStep < 4 && this.canProceed()) {
      this.currentStep++;
      this.updateProgressPercentage();
      this.saveCurrentState();
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.updateProgressPercentage();
    }
  }

  // Acciones específicas de cada paso
  acceptTerms(): void {
    this.inscriptionForm.patchValue({ termsAccepted: true });
    this.nextStep();
  }

  toggleCircunscripcion(value: string): void {
    const currentValues = [...this.inscriptionForm.get('selectedCircunscripciones')?.value || []];
    const index = currentValues.indexOf(value);

    if (index === -1) {
      currentValues.push(value);
    } else {
      currentValues.splice(index, 1);
    }

    this.inscriptionForm.patchValue({ selectedCircunscripciones: currentValues });
  }

  isCircunscripcionSelected(value: string): boolean {
    const currentValues = this.inscriptionForm.get('selectedCircunscripciones')?.value || [];
    return currentValues.includes(value);
  }

  getSelectedCircunscripciones(): Circunscripcion[] {
    const selectedValues = this.inscriptionForm.get('selectedCircunscripciones')?.value || [];
    return this.circunscripciones.filter(c => selectedValues.includes(c.value));
  }

  tieneDocumentosPendientes(): boolean {
    return this.documentacionRequerida.some(doc => !doc.completed);
  }

  irADocumentacion(): void {
    // Guardar el estado actual
    this.saveCurrentState();

    // Cerrar el diálogo
    this.dialogRef.close();

    // Navegar a la sección de documentación
    // Aquí iría la lógica de navegación
  }

  // Obtener el ID del concurso
  getContestId(): number {
    return typeof this.data.contest.id === 'string'
      ? parseInt(this.data.contest.id, 10)
      : this.data.contest.id;
  }

  // Manejar el evento de documentos completados
  onDocumentosCompletados(completados: boolean): void {
    console.log('[InscripcionProcess] Documentos completados:', completados);
    this.inscriptionForm.patchValue({ documentosCompletos: completados });
  }

  // Manejar el evento de dirección seleccionada
  onAddressSelected(addressData: AddressData): void {
    console.log('[InscripcionProcess] Dirección seleccionada:', addressData);
    this.addressData = addressData;
    this.inscriptionForm.patchValue({ centroDeVida: addressData.formattedAddress });
  }

  // Actualizar el perfil del usuario con el centro de vida
  actualizarPerfilConCentroDeVida(): void {
    const centroDeVida = this.centroDeVidaControl.value;
    if (centroDeVida) {
      this.profileService.updateUserProfile({ direccion: centroDeVida }).subscribe({
        next: () => {
          console.log('[InscripcionProcess] Centro de vida actualizado en el perfil');
        },
        error: (error: Error) => {
          console.error('[InscripcionProcess] Error al actualizar centro de vida en el perfil:', error);
        }
      });
    }
  }

  // Validación para avanzar
  canProceed(): boolean {
    this.showValidationErrors = true;

    switch (this.currentStep) {
      case 1:
        return this.termsAcceptedControl.value === true;
      case 2: {
        // Verificar que se haya ingresado el centro de vida y seleccionado al menos una circunscripción
        const centroDeVida = this.centroDeVidaControl.value;
        const circunscripciones = this.selectedCircunscripcionesControl.value || [];
        return !!centroDeVida && centroDeVida.trim() !== '' && circunscripciones.length > 0;
      }
      case 3:
        return this.documentosCompletosControl.value === true;
      default:
        return false;
    }
  }

  canFinish(): boolean {
    return this.confirmedPersonalDataControl.value === true &&
           !this.tieneDocumentosPendientes();
  }

  // Guardar estado
  saveCurrentState(): void {
    if (!this.inscriptionId) return;

    const formData: InscriptionFormData = {
      termsAccepted: this.termsAcceptedControl.value || false,
      centroDeVida: this.centroDeVidaControl.value || '',
      selectedCircunscripciones: this.selectedCircunscripcionesControl.value || [],
      documentosCompletos: this.documentosCompletosControl.value || false,
      confirmedPersonalData: this.confirmedPersonalDataControl.value || false
    };

    // Guardar en el servicio de estado
    this.inscriptionFormService.saveFormState(
      this.inscriptionId,
      typeof this.data.contest.id === 'string' ? parseInt(this.data.contest.id, 10) : this.data.contest.id,
      this.currentStep as unknown as InscriptionStep,
      formData,
      this.data.contest.title || this.data.contest.position
    );
  }

  // Finalizar inscripción
  finish(): void {
    if (!this.canFinish()) return;

    this.loading = true;

    // Actualizar el perfil del usuario con el centro de vida
    this.actualizarPerfilConCentroDeVida();

    // Actualizar la inscripción en el backend
    if (this.inscriptionId) {
      const formData: InscriptionFormData = {
        termsAccepted: this.termsAcceptedControl.value || false,
        centroDeVida: this.centroDeVidaControl.value || '',
        selectedCircunscripciones: this.selectedCircunscripcionesControl.value || [],
        documentosCompletos: this.documentosCompletosControl.value || false,
        confirmedPersonalData: this.confirmedPersonalDataControl.value || false
      };

      // Actualizar el paso de la inscripción
      this.inscriptionFormService.updateInscriptionStep(
        this.inscriptionId,
        InscriptionStep.COMPLETED,
        formData
      ).subscribe({
        next: () => {
          console.log('[InscripcionProcess] Paso de inscripción actualizado a COMPLETED');

          // Actualizar el estado de la inscripción a PENDIENTE
          this.inscriptionFormService.updateInscriptionStatus(this.inscriptionId!, 'PENDIENTE').subscribe({
            next: () => {
              console.log('[InscripcionProcess] Estado de inscripción actualizado a PENDIENTE');

              // Limpiar el estado local
              this.inscriptionService.clearFormState(this.inscriptionId!);
              this.inscriptionFormService.clearFormState(this.inscriptionId!);

              // Mostrar mensaje de éxito
              this.snackBar.open('Inscripción completada con éxito', 'Cerrar', {
                duration: 3000
              });

              // Cerrar el diálogo
              this.loading = false;
              this.dialogRef.close(true);
            },
            error: (error: Error) => {
              console.error('[InscripcionProcess] Error al actualizar estado de inscripción:', error);
              this.loading = false;
              this.dialogRef.close(true); // Cerrar de todas formas
            }
          });
        },
        error: (error: Error) => {
          console.error('[InscripcionProcess] Error al actualizar paso de inscripción:', error);
          this.loading = false;
          this.dialogRef.close(true); // Cerrar de todas formas
        }
      });
    }
  }

  // Cerrar el diálogo
  closeDialog(): void {
    // Si hay un ID de inscripción, marcar como interrumpida
    if (this.inscriptionId) {
      // Guardar el estado actual antes de cerrar
      this.saveCurrentState();

      // Marcar la inscripción como interrumpida
      this.inscriptionService.markAsInterrupted(this.inscriptionId).subscribe({
        next: () => {
          console.log('[InscripcionProcess] Inscripción marcada como interrumpida');
          this.dialogRef.close(false);
        },
        error: (error) => {
          console.error('[InscripcionProcess] Error al marcar inscripción como interrumpida:', error);
          this.dialogRef.close(false);
        }
      });
    } else {
      this.dialogRef.close(false);
    }
  }
}
