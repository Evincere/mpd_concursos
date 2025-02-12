import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Notification, AcknowledgementLevel, SignatureType } from '../../../../core/models/notification.model';

export interface NotificationAcknowledgeDialogData {
    notification: Notification;
}

export interface AcknowledgementResult {
    signatureType: string;
    signatureValue: string;
    declaration?: boolean;
}

@Component({
    selector: 'app-notification-acknowledge-dialog',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatCheckboxModule
    ],
    templateUrl: './notification-acknowledge-dialog.component.html',
    styleUrls: ['./notification-acknowledge-dialog.component.scss']
})
export class NotificationAcknowledgeDialogComponent {
    pin: string = '';
    declaration: boolean = false;
    declarationText: string = '';

    constructor(
        public dialogRef: MatDialogRef<NotificationAcknowledgeDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: NotificationAcknowledgeDialogData
    ) {
        this.setDeclarationText();
    }

    private setDeclarationText() {
        if (this.data.notification.acknowledgementLevel === AcknowledgementLevel.SIGNATURE_ADVANCED) {
            this.declarationText = 'Declaro bajo juramento que he leído y comprendido completamente el contenido de esta notificación y asumo la responsabilidad legal correspondiente.';
        } else if (this.data.notification.acknowledgementLevel === AcknowledgementLevel.SIGNATURE_BASIC) {
            this.declarationText = 'Declaro que he leído y comprendido el contenido de esta notificación.';
        }
    }

    get requiresPin(): boolean {
        return this.data.notification.acknowledgementLevel === AcknowledgementLevel.SIMPLE;
    }

    get requiresDeclaration(): boolean {
        return this.data.notification.acknowledgementLevel === AcknowledgementLevel.SIGNATURE_BASIC ||
               this.data.notification.acknowledgementLevel === AcknowledgementLevel.SIGNATURE_ADVANCED;
    }

    get isValid(): boolean {
        if (this.requiresPin) {
            return this.pin.trim().length >= 4;
        }
        if (this.requiresDeclaration) {
            return this.declaration;
        }
        return false;
    }

    onCancel(): void {
        this.dialogRef.close();
    }

    onConfirm(): void {
        let result: AcknowledgementResult;

        if (this.requiresPin) {
            result = {
                signatureType: SignatureType.PIN,
                signatureValue: this.pin.trim()
            };
        } else {
            result = {
                signatureType: SignatureType.DECLARATION,
                signatureValue: this.declarationText,
                declaration: this.declaration
            };
        }

        this.dialogRef.close(result);
    }
}
