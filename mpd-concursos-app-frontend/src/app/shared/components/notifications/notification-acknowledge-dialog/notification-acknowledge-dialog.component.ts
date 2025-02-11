import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { Notification } from '../../../../core/models/notification.model';

export interface NotificationAcknowledgeDialogData {
    notification: Notification;
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
        MatIconModule
    ],
    templateUrl: './notification-acknowledge-dialog.component.html',
    styleUrls: ['./notification-acknowledge-dialog.component.scss']
})
export class NotificationAcknowledgeDialogComponent {
    signature: string = '';

    constructor(
        public dialogRef: MatDialogRef<NotificationAcknowledgeDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: NotificationAcknowledgeDialogData
    ) {}

    onCancel(): void {
        this.dialogRef.close();
    }

    onConfirm(): void {
        if (this.signature.trim()) {
            this.dialogRef.close(this.signature);
        }
    }

    get isValid(): boolean {
        return this.signature.trim().length > 0;
    }
}
