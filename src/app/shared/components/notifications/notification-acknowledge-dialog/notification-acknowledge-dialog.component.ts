import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { Notification, SignatureType, AcknowledgementLevel } from '../../../../core/models/notification.model';

export interface NotificationAcknowledgeDialogData {
    notification: Notification;
}

@Component({
    selector: 'app-notification-acknowledge-dialog',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatSelectModule
    ],
    templateUrl: './notification-acknowledge-dialog.component.html',
    styleUrls: ['./notification-acknowledge-dialog.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class NotificationAcknowledgeDialogComponent implements OnInit {
    signature: string = '';
    signatureType: string = '';
    declaration: string = '';

    availableSignatureTypes: any[] = [];

    readonly SIGNATURE_TYPES = {
        [SignatureType.PIN]: { 
            value: SignatureType.PIN, 
            label: 'Firma con PIN', 
            description: 'Firma mediante PIN de usuario',
            available: true
        },
        [SignatureType.DIGITAL_CERT]: { 
            value: SignatureType.DIGITAL_CERT, 
            label: 'Certificado Digital', 
            description: 'Firma con certificado digital (próximamente)',
            available: false
        },
        [SignatureType.BIOMETRIC]: { 
            value: SignatureType.BIOMETRIC, 
            label: 'Firma Biométrica', 
            description: 'Firma manuscrita digital (próximamente)',
            available: false
        },
        [SignatureType.DECLARATION]: { 
            value: SignatureType.DECLARATION, 
            label: 'Declaración Jurada', 
            description: 'Declaración jurada con datos personales',
            available: true
        }
    };

    isSubmitting = false;

    constructor(
        public dialogRef: MatDialogRef<NotificationAcknowledgeDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: NotificationAcknowledgeDialogData
    ) {}

    ngOnInit() {
        console.log('Dialog initialized with data:', this.data);
        console.log('Acknowledge Level:', this.acknowledgeLevel);
        console.log('Initial signature type:', this.signatureType);
        this.setAvailableSignatureTypes();
        console.log('Available signature types:', this.availableSignatureTypes);
    }

    private setAvailableSignatureTypes() {
        console.log('Setting available types for level:', this.acknowledgeLevel);
        switch(this.acknowledgeLevel) {
            case AcknowledgementLevel.SIGNATURE_ADVANCED:
                this.availableSignatureTypes = [
                    this.SIGNATURE_TYPES[SignatureType.DIGITAL_CERT],
                    this.SIGNATURE_TYPES[SignatureType.BIOMETRIC],
                    this.SIGNATURE_TYPES[SignatureType.DECLARATION]
                ];
                break;
            case AcknowledgementLevel.SIGNATURE_BASIC:
                this.availableSignatureTypes = [
                    this.SIGNATURE_TYPES[SignatureType.PIN],
                    this.SIGNATURE_TYPES[SignatureType.DECLARATION]
                ];
                break;
            case AcknowledgementLevel.SIMPLE:
                this.availableSignatureTypes = [
                    this.SIGNATURE_TYPES[SignatureType.PIN]
                ];
                break;
            default:
                this.availableSignatureTypes = [];
        }
        console.log('Types set to:', this.availableSignatureTypes);
    }

    onCancel(): void {
        this.dialogRef.close();
    }

    onConfirm(): void {
        if (this.isValid && !this.isSubmitting) {
            this.isSubmitting = true;
            
            // Agregar logs para debug
            const result = {
                type: this.signatureType,
                value: this.signature,
                declaration: this.requiresDeclaration ? this.declaration : undefined
            };
            
            console.log('Sending acknowledgement:', result);
            
            setTimeout(() => {
                this.dialogRef.close(result);
            }, 300);
        }
    }

    get isValid(): boolean {
        if (!this.signatureType || !this.signature.trim()) {
            return false;
        }

        if (this.signatureType === SignatureType.DECLARATION) {
            return this.declaration && this.declaration.trim().length > 0;
        }

        return true;
    }

    get requiresDeclaration(): boolean {
        return this.signatureType === SignatureType.DECLARATION;
    }

    get acknowledgeLevel(): string {
        return this.data.notification.acknowledgeLevel || 'NONE';
    }

    get acknowledgeInstructions(): string {
        switch(this.acknowledgeLevel) {
            case AcknowledgementLevel.SIGNATURE_ADVANCED:
                return 'Esta notificación requiere un nivel avanzado de firma. Por favor, seleccione uno de los métodos disponibles para confirmar su identidad.';
            case AcknowledgementLevel.SIGNATURE_BASIC:
                return 'Esta notificación requiere una firma básica. Puede utilizar su PIN o realizar una declaración jurada.';
            case AcknowledgementLevel.SIMPLE:
                return 'Esta notificación requiere un acuse simple. Por favor, ingrese su PIN para confirmar la recepción.';
            default:
                return '';
        }
    }
} 