import { provideAnimations } from '@angular/platform-browser/animations';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog';
import { ErrorDialogComponent } from '@shared/components/error-dialog/error-dialog.component';

// Configuración de proveedores de Material
export const materialProviders = [
    provideAnimations(),
    {
        provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
        useValue: {
            appearance: 'outline'
        }
    },
    {
        provide: MAT_DIALOG_DEFAULT_OPTIONS,
        useValue: {
            hasBackdrop: true,
            panelClass: 'mat-dialog-container'
        }
    }
];

// Componentes de diálogo que deben estar disponibles globalmente
export const dialogComponents = [
    ErrorDialogComponent
];