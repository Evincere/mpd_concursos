import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Clipboard } from '@angular/cdk/clipboard';

export interface ErrorDialogData {
  title: string;
  message: string;
  adminEmail?: string;
  showAdminContact?: boolean;
  buttonText?: string;
}

@Component({
  selector: 'app-error-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="error-dialog-container">
      <div class="error-header">
        <div class="header-content">
          <mat-icon class="error-icon">error</mat-icon>
          <h2 mat-dialog-title>{{ data.title }}</h2>
        </div>
      </div>

      <mat-dialog-content>
        <div class="content-wrapper">
          <p class="error-message">{{ data.message }}</p>

          <div *ngIf="data.showAdminContact && data.adminEmail" class="admin-contact">
            <p class="contact-label">Contacte al administrador:</p>
            <div class="email-container" (click)="copyEmail()">
              <span class="admin-email">{{ data.adminEmail }}</span>
              <mat-icon class="copy-icon" [ngClass]="{'copied': emailCopied}">
                {{ emailCopied ? 'check_circle' : 'content_copy' }}
              </mat-icon>
              <span class="copy-tooltip" [ngClass]="{'visible': emailCopied}">
                {{ emailCopied ? '¡Copiado!' : 'Haga clic para copiar' }}
              </span>
            </div>
          </div>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button
          mat-raised-button
          color="warn"
          [mat-dialog-close]="true">
          {{ data.buttonText || 'CERRAR' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .error-dialog-container {
      padding: 0;
      border-radius: 16px;
      overflow: hidden;
      background: rgba(30, 30, 30, 0.7);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.1);
      max-height: 90vh;
      display: flex;
      flex-direction: column;
    }

    .error-header {
      background: linear-gradient(135deg, rgba(244, 67, 54, 0.8) 0%, rgba(211, 47, 47, 0.8) 100%);
      color: white;
      padding: 0;
      position: relative;
      overflow: hidden;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .header-content {
      display: flex;
      align-items: center;
      padding: 16px 24px;
      position: relative;
      z-index: 1;
    }

    .error-header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(45deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 100%);
      z-index: 0;
    }

    .error-icon {
      margin-right: 12px;
      font-size: 28px;
      height: 28px;
      width: 28px;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
    }

    mat-dialog-title {
      margin: 0;
      font-size: 20px;
      font-weight: 500;
      letter-spacing: 0.5px;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    mat-dialog-content {
      padding: 24px !important;
      margin: 0 !important;
      max-height: none !important;
      overflow-y: auto !important;
      display: block !important;
      flex: 1;
    }

    .content-wrapper {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .error-message {
      margin: 0;
      font-size: 15px;
      line-height: 1.5;
      color: rgba(255, 255, 255, 0.9);
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    .admin-contact {
      margin-top: 0;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: 24px;
    }

    .contact-label {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.7);
      margin-bottom: 12px;
    }

    .email-container {
      display: flex;
      align-items: center;
      background: rgba(255, 255, 255, 0.1);
      padding: 12px 16px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      border: 1px solid rgba(255, 255, 255, 0.2);
      position: relative;
      word-break: break-all;
    }

    .email-container:hover {
      background: rgba(255, 255, 255, 0.15);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      transform: translateY(-2px);
    }

    .admin-email {
      flex: 1;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.9);
      font-size: 15px;
      overflow-wrap: break-word;
      word-wrap: break-word;
    }

    .copy-icon {
      color: rgba(255, 255, 255, 0.7);
      font-size: 20px;
      margin-left: 12px;
      transition: all 0.3s ease;
    }

    .copy-icon.copied {
      color: #4CAF50;
    }

    .copy-tooltip {
      position: absolute;
      top: -32px;
      right: 0;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 12px;
      opacity: 0;
      transform: translateY(5px);
      transition: all 0.3s ease;
      pointer-events: none;
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      z-index: 10;
    }

    .copy-tooltip.visible {
      opacity: 1;
      transform: translateY(0);
    }

    mat-dialog-actions {
      padding: 16px 24px;
      margin: 0;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(0, 0, 0, 0.2);
    }

    button[mat-raised-button] {
      background: linear-gradient(135deg, rgba(244, 67, 54, 0.9) 0%, rgba(211, 47, 47, 0.9) 100%) !important;
      color: white !important;
      border-radius: 8px;
      padding: 4px 16px;
      font-weight: 500;
      letter-spacing: 0.5px;
      box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
      transition: all 0.3s ease;
      border: none;
    }

    button[mat-raised-button]:hover {
      background: linear-gradient(135deg, rgba(244, 67, 54, 1) 0%, rgba(211, 47, 47, 1) 100%) !important;
      box-shadow: 0 6px 16px rgba(244, 67, 54, 0.4);
      transform: translateY(-2px);
    }
  `]
})
export class ErrorDialogComponent implements OnInit {
  emailCopied = false;

  constructor(
    public dialogRef: MatDialogRef<ErrorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ErrorDialogData,
    private clipboard: Clipboard
  ) {}

  ngOnInit(): void {
    // Asegurarse de que los datos tengan valores predeterminados
    this.data = {
      ...{
        title: 'Error',
        message: 'Ha ocurrido un error inesperado.',
        buttonText: 'CERRAR',
        showAdminContact: false
      },
      ...this.data
    };
  }

  copyEmail(): void {
    if (!this.data.adminEmail) return;

    this.clipboard.copy(this.data.adminEmail);
    this.emailCopied = true;

    // Resetear el estado después de 3 segundos
    setTimeout(() => {
      this.emailCopied = false;
    }, 3000);
  }
}
