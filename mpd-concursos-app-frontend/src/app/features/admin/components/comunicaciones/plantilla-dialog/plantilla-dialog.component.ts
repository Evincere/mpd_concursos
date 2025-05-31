import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

import { 
  MassNotificationsService, 
  NotificationTemplate 
} from '../../../../../core/services/admin/mass-notifications.service';
import { 
  NotificationType, 
  AcknowledgementLevel 
} from '../../../../../core/models/notification.model';

interface DialogData {
  template?: NotificationTemplate;
}

@Component({
  selector: 'app-plantilla-dialog',
  templateUrl: './plantilla-dialog.component.html',
  styleUrls: ['./plantilla-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ]
})
export class PlantillaDialogComponent implements OnInit {
  templateForm: FormGroup;
  isLoading = false;
  isEditMode = false;
  
  // Notification types and acknowledgement levels for dropdown
  notificationTypes = Object.values(NotificationType);
  acknowledgementLevels = Object.values(AcknowledgementLevel);

  constructor(
    private fb: FormBuilder,
    private massNotificationsService: MassNotificationsService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<PlantillaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.templateForm = this.fb.group({
      name: ['', [Validators.required]],
      subject: ['', [Validators.required]],
      content: ['', [Validators.required]],
      type: [NotificationType.SYSTEM, [Validators.required]],
      acknowledgementLevel: [AcknowledgementLevel.NONE, [Validators.required]]
    });
    
    this.isEditMode = !!data.template;
  }

  ngOnInit(): void {
    if (this.isEditMode && this.data.template) {
      this.templateForm.patchValue({
        name: this.data.template.name,
        subject: this.data.template.subject,
        content: this.data.template.content,
        type: this.data.template.type,
        acknowledgementLevel: this.data.template.acknowledgementLevel
      });
    }
  }

  onSubmit(): void {
    if (this.templateForm.invalid) {
      this.snackBar.open('Por favor complete todos los campos requeridos', 'Cerrar', { duration: 3000 });
      return;
    }

    this.isLoading = true;
    
    const formValue = this.templateForm.value;
    const template: Omit<NotificationTemplate, 'id'> = {
      name: formValue.name,
      subject: formValue.subject,
      content: formValue.content,
      type: formValue.type,
      acknowledgementLevel: formValue.acknowledgementLevel
    };

    // In a real app, we would call the API to create/update the template
    this.massNotificationsService.createTemplate(template)
      .subscribe({
        next: (result) => {
          this.isLoading = false;
          this.snackBar.open(
            this.isEditMode ? 'Plantilla actualizada correctamente' : 'Plantilla creada correctamente', 
            'Cerrar', 
            { duration: 3000 }
          );
          this.dialogRef.close(result);
        },
        error: (error) => {
          console.error('Error saving template:', error);
          this.isLoading = false;
          this.snackBar.open('Error al guardar la plantilla', 'Cerrar', { duration: 3000 });
        }
      });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
