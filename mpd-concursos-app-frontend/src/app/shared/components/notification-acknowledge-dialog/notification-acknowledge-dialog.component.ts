import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import {
    Notification,
    SignatureType,
    AcknowledgementLevel,
    NotificationAcknowledgementRequest
} from '../../../core/models/notification.model';

@Component({
    selector: 'app-notification-acknowledge-dialog',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatSelectModule,
        MatIconModule
    ],
    template: `
        <h2 mat-dialog-title>Acuse de Recibo</h2>
        <mat-dialog-content>
            <div class="notification-details">
                <h3>{{ data.notification.subject }}</h3>
                <p>{{ data.notification.content }}</p>
            </div>

            <div class="signature-form">
                <mat-form-field appearance="fill" class="full-width">
                    <mat-label>Tipo de Firma</mat-label>
                    <mat-select [(ngModel)]="selectedSignatureType" required>
                        <mat-option *ngFor="let type of availableSignatureTypes" [value]="type">
                            {{ getSignatureTypeName(type) }}
                        </mat-option>
                    </mat-select>
                </mat-form-field>

                <mat-form-field appearance="fill" class="full-width" *ngIf="selectedSignatureType === SignatureType.PIN">
                    <mat-label>PIN</mat-label>
                    <input matInput type="password" [(ngModel)]="signatureValue" required>
                </mat-form-field>

                <mat-form-field appearance="fill" class="full-width" *ngIf="selectedSignatureType === SignatureType.DECLARATION">
                    <mat-label>Declaración Jurada</mat-label>
                    <textarea matInput [(ngModel)]="declaration" required rows="4"></textarea>
                </mat-form-field>

                <!-- Aquí se pueden agregar más campos según el tipo de firma -->
            </div>
        </mat-dialog-content>
        <mat-dialog-actions align="end">
            <button mat-button (click)="onCancel()">Cancelar</button>
            <button mat-raised-button color="primary" (click)="onConfirm()" [disabled]="!isValid()">
                Confirmar
            </button>
        </mat-dialog-actions>
    `,
    styles: [`
        .notification-details {
            margin-bottom: 20px;
            padding: 15px;
            background-color: #f5f5f5;
            border-radius: 4px;
        }

        .notification-details h3 {
            margin: 0 0 10px 0;
            color: rgba(0, 0, 0, 0.87);
        }

        .notification-details p {
            margin: 0;
            color: rgba(0, 0, 0, 0.6);
        }

        .signature-form {
            margin-top: 20px;
        }

        .full-width {
            width: 100%;
        }

        mat-dialog-actions {
            margin-top: 20px;
        }
    `]
})
export class NotificationAcknowledgeDialogComponent {
    SignatureType = SignatureType;
    selectedSignatureType: SignatureType | null = null;
    signatureValue: string = '';
    declaration: string = '';

    availableSignatureTypes: SignatureType[] = [];

    constructor(
        public dialogRef: MatDialogRef<NotificationAcknowledgeDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { notification: Notification }
    ) {
        this.initializeAvailableSignatureTypes();
    }

    private initializeAvailableSignatureTypes() {
        switch (this.data.notification.acknowledgementLevel) {
            case AcknowledgementLevel.SIGNATURE_BASIC:
                this.availableSignatureTypes = [SignatureType.PIN, SignatureType.DECLARATION];
                break;
            case AcknowledgementLevel.SIGNATURE_ADVANCED:
                this.availableSignatureTypes = [
                    SignatureType.PIN,
                    SignatureType.DIGITAL_CERT,
                    SignatureType.BIOMETRIC,
                    SignatureType.DECLARATION
                ];
                break;
            default:
                this.availableSignatureTypes = [SignatureType.PIN];
        }
    }

    getSignatureTypeName(type: SignatureType): string {
        switch (type) {
            case SignatureType.PIN:
                return 'PIN de Usuario';
            case SignatureType.DIGITAL_CERT:
                return 'Certificado Digital';
            case SignatureType.BIOMETRIC:
                return 'Firma Biométrica';
            case SignatureType.DECLARATION:
                return 'Declaración Jurada';
            default:
                return type;
        }
    }

    isValid(): boolean {
        if (!this.selectedSignatureType) return false;

        switch (this.selectedSignatureType) {
            case SignatureType.PIN:
                return this.signatureValue.length >= 4;
            case SignatureType.DECLARATION:
                return !!this.declaration && this.declaration.length >= 10;
            default:
                return !!this.signatureValue;
        }
    }

    onConfirm() {
        if (!this.selectedSignatureType || !this.isValid()) return;

        const request: NotificationAcknowledgementRequest = {
            notificationId: this.data.notification.id,
            signatureType: this.selectedSignatureType,
            signatureValue: this.signatureValue,
            declaration: this.selectedSignatureType === SignatureType.DECLARATION ? this.declaration : undefined,
            metadata: {
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent
            }
        };

        this.dialogRef.close(request);
    }

    onCancel() {
        this.dialogRef.close();
    }
}
