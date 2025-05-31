import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { 
  Notification, 
  AcknowledgementLevel, 
  SignatureType,
  SIGNATURE_TYPE_LABELS,
  requiresSignature 
} from '@core/models/notification.model';

export interface AcknowledgmentData {
  notificationId: string;
  signatureType: SignatureType;
  signatureValue: string;
  declaration?: string;
}

@Component({
  selector: 'app-notification-acknowledgment',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  template: `
    <div class="acknowledgment-container" *ngIf="notification && showAcknowledgment()">
      <div class="acknowledgment-header">
        <mat-icon class="acknowledgment-icon">security</mat-icon>
        <h4>{{ getAcknowledgmentTitle() }}</h4>
      </div>
      
      <p class="acknowledgment-description">
        {{ getAcknowledgmentDescription() }}
      </p>

      <form [formGroup]="acknowledgmentForm" (ngSubmit)="onSubmit()" class="acknowledgment-form">
        <!-- Signature Type Selection (for advanced signatures) -->
        <mat-form-field *ngIf="isAdvancedSignature()" appearance="outline" class="full-width">
          <mat-label>Tipo de firma</mat-label>
          <mat-select formControlName="signatureType" required>
            <mat-option *ngFor="let type of getAvailableSignatureTypes()" [value]="type">
              {{ getSignatureTypeLabel(type) }}
            </mat-option>
          </mat-select>
          <mat-error *ngIf="acknowledgmentForm.get('signatureType')?.hasError('required')">
            Debe seleccionar un tipo de firma
          </mat-error>
        </mat-form-field>

        <!-- Signature Value Input -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ getSignatureInputLabel() }}</mat-label>
          <input 
            matInput 
            formControlName="signatureValue"
            [type]="getSignatureInputType()"
            [placeholder]="getSignatureInputPlaceholder()"
            required>
          <mat-icon matSuffix>{{ getSignatureInputIcon() }}</mat-icon>
          <mat-error *ngIf="acknowledgmentForm.get('signatureValue')?.hasError('required')">
            Este campo es obligatorio
          </mat-error>
          <mat-error *ngIf="acknowledgmentForm.get('signatureValue')?.hasError('minlength')">
            {{ getSignatureMinLengthError() }}
          </mat-error>
        </mat-form-field>

        <!-- Declaration Checkbox (for declaration type) -->
        <div *ngIf="isDeclarationType()" class="declaration-section">
          <mat-checkbox formControlName="declaration" required>
            Declaro bajo juramento que he leído y entendido el contenido de esta notificación
          </mat-checkbox>
          <mat-error *ngIf="acknowledgmentForm.get('declaration')?.hasError('required')">
            Debe aceptar la declaración jurada
          </mat-error>
        </div>

        <!-- Action Buttons -->
        <div class="acknowledgment-actions">
          <button 
            mat-button 
            type="button" 
            (click)="onCancel()"
            [disabled]="isSubmitting">
            Cancelar
          </button>
          
          <button 
            mat-raised-button 
            color="primary" 
            type="submit"
            [disabled]="acknowledgmentForm.invalid || isSubmitting"
            class="acknowledge-button">
            <mat-spinner *ngIf="isSubmitting" diameter="20"></mat-spinner>
            <mat-icon *ngIf="!isSubmitting">verified</mat-icon>
            {{ isSubmitting ? 'Procesando...' : 'Acusar Recibo' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styleUrls: ['./notification-acknowledgment.component.scss']
})
export class NotificationAcknowledgmentComponent implements OnInit {
  @Input() notification!: Notification;
  @Input() isSubmitting = false;
  @Output() acknowledge = new EventEmitter<AcknowledgmentData>();
  @Output() cancel = new EventEmitter<void>();

  acknowledgmentForm!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    const signatureValidators = [Validators.required];
    
    // Add minimum length validation based on signature type
    if (this.notification.acknowledgementLevel === AcknowledgementLevel.SIGNATURE_BASIC) {
      signatureValidators.push(Validators.minLength(4));
    } else if (this.notification.acknowledgementLevel === AcknowledgementLevel.SIGNATURE_ADVANCED) {
      signatureValidators.push(Validators.minLength(6));
    }

    this.acknowledgmentForm = this.fb.group({
      signatureType: [this.getDefaultSignatureType(), this.isAdvancedSignature() ? [Validators.required] : []],
      signatureValue: ['', signatureValidators],
      declaration: [false, this.isDeclarationType() ? [Validators.requiredTrue] : []]
    });
  }

  showAcknowledgment(): boolean {
    return this.notification.acknowledgementLevel !== AcknowledgementLevel.NONE &&
           this.notification.status !== 'ACKNOWLEDGED';
  }

  isAdvancedSignature(): boolean {
    return this.notification.acknowledgementLevel === AcknowledgementLevel.SIGNATURE_ADVANCED;
  }

  isDeclarationType(): boolean {
    const signatureType = this.acknowledgmentForm?.get('signatureType')?.value;
    return signatureType === SignatureType.DECLARATION;
  }

  getDefaultSignatureType(): SignatureType | null {
    if (this.notification.acknowledgementLevel === AcknowledgementLevel.SIGNATURE_BASIC) {
      return SignatureType.PIN;
    }
    return null;
  }

  getAvailableSignatureTypes(): SignatureType[] {
    return [SignatureType.PIN, SignatureType.DIGITAL_CERT, SignatureType.DECLARATION];
  }

  getSignatureTypeLabel(type: SignatureType): string {
    return SIGNATURE_TYPE_LABELS[type];
  }

  getAcknowledgmentTitle(): string {
    switch (this.notification.acknowledgementLevel) {
      case AcknowledgementLevel.SIMPLE:
        return 'Acuse de Recibo Simple';
      case AcknowledgementLevel.SIGNATURE_BASIC:
        return 'Firma Básica Requerida';
      case AcknowledgementLevel.SIGNATURE_ADVANCED:
        return 'Firma Avanzada Requerida';
      default:
        return 'Acuse de Recibo';
    }
  }

  getAcknowledgmentDescription(): string {
    switch (this.notification.acknowledgementLevel) {
      case AcknowledgementLevel.SIMPLE:
        return 'Esta notificación requiere confirmación de lectura.';
      case AcknowledgementLevel.SIGNATURE_BASIC:
        return 'Esta notificación requiere firma básica para confirmar su recepción.';
      case AcknowledgementLevel.SIGNATURE_ADVANCED:
        return 'Esta notificación requiere firma digital avanzada para confirmar su recepción.';
      default:
        return 'Confirme la recepción de esta notificación.';
    }
  }

  getSignatureInputLabel(): string {
    const signatureType = this.acknowledgmentForm?.get('signatureType')?.value;
    switch (signatureType) {
      case SignatureType.PIN:
        return 'PIN de seguridad';
      case SignatureType.DIGITAL_CERT:
        return 'Certificado digital';
      case SignatureType.DECLARATION:
        return 'Declaración jurada';
      default:
        return 'Firma';
    }
  }

  getSignatureInputType(): string {
    const signatureType = this.acknowledgmentForm?.get('signatureType')?.value;
    return signatureType === SignatureType.PIN ? 'password' : 'text';
  }

  getSignatureInputPlaceholder(): string {
    const signatureType = this.acknowledgmentForm?.get('signatureType')?.value;
    switch (signatureType) {
      case SignatureType.PIN:
        return 'Ingrese su PIN de seguridad';
      case SignatureType.DIGITAL_CERT:
        return 'Seleccione su certificado digital';
      case SignatureType.DECLARATION:
        return 'Escriba su nombre completo';
      default:
        return 'Ingrese su firma';
    }
  }

  getSignatureInputIcon(): string {
    const signatureType = this.acknowledgmentForm?.get('signatureType')?.value;
    switch (signatureType) {
      case SignatureType.PIN:
        return 'lock';
      case SignatureType.DIGITAL_CERT:
        return 'certificate';
      case SignatureType.DECLARATION:
        return 'edit';
      default:
        return 'signature';
    }
  }

  getSignatureMinLengthError(): string {
    const signatureType = this.acknowledgmentForm?.get('signatureType')?.value;
    if (signatureType === SignatureType.PIN) {
      return 'El PIN debe tener al menos 4 caracteres';
    }
    return 'La firma debe tener al menos 6 caracteres';
  }

  onSubmit(): void {
    if (this.acknowledgmentForm.valid) {
      const formValue = this.acknowledgmentForm.value;
      const acknowledgmentData: AcknowledgmentData = {
        notificationId: this.notification.id,
        signatureType: formValue.signatureType || SignatureType.PIN,
        signatureValue: formValue.signatureValue,
        declaration: formValue.declaration ? 'true' : undefined
      };
      
      this.acknowledge.emit(acknowledgmentData);
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
