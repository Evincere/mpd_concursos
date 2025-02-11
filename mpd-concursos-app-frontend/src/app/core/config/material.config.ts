import { provideAnimations } from '@angular/platform-browser/animations';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog';

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
