import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';

@NgModule({
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        MatDialogModule,
        MatSnackBarModule,
        // ... otros módulos
    ],
    // ... resto de la configuración
})
export class AppModule { } 