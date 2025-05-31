import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AnimateDirective } from '../../directives/animate.directive';

export interface ConfirmationDialogData {
  title: string;
  message: string;
  detail?: string;
  icon?: string;
  type?: 'info' | 'warning' | 'danger' | 'success';
  confirmText?: string;
  cancelText?: string;
  hideCancel?: boolean;
  width?: string;
}

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    AnimateDirective
  ],
  template: `
    <div class="confirmation-dialog" [class]="'type-' + data.type">
      <div class="dialog-header" [appAnimate]="'fadeIn'" [animationDuration]="300">
        <div class="icon-container">
          <i class="fas fa-{{getIcon()}}"></i>
        </div>
        <h2 mat-dialog-title>{{data.title}}</h2>
      </div>
      
      <mat-dialog-content [appAnimate]="'fadeIn'" [animationDuration]="300" [animationDelay]="100">
        <div class="dialog-message">{{data.message}}</div>
        <div *ngIf="data.detail" class="dialog-detail">{{data.detail}}</div>
      </mat-dialog-content>
      
      <mat-dialog-actions [appAnimate]="'fadeIn'" [animationDuration]="300" [animationDelay]="200">
        <button 
          *ngIf="!data.hideCancel"
          mat-button 
          [mat-dialog-close]="false" 
          class="cancel-button">
          {{data.cancelText || 'Cancelar'}}
        </button>
        <button 
          mat-raised-button 
          [color]="getButtonColor()" 
          [mat-dialog-close]="true" 
          class="confirm-button">
          {{data.confirmText || 'Confirmar'}}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirmation-dialog {
      padding: 0;
      overflow: hidden;
    }
    
    .dialog-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem 1.5rem 0.5rem;
    }
    
    .icon-container {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
    }
    
    .icon-container i {
      font-size: 1.5rem;
    }
    
    mat-dialog-title {
      margin: 0;
      padding: 0;
      font-size: 1.25rem;
      font-weight: 500;
    }
    
    mat-dialog-content {
      padding: 0 1.5rem;
      margin: 0;
      max-height: none;
    }
    
    .dialog-message {
      font-size: 1rem;
      line-height: 1.5;
      margin-bottom: 1rem;
    }
    
    .dialog-detail {
      font-size: 0.9rem;
      line-height: 1.4;
      color: rgba(255, 255, 255, 0.7);
      padding: 0.75rem;
      background: rgba(0, 0, 0, 0.1);
      border-radius: 4px;
      margin-bottom: 1rem;
    }
    
    mat-dialog-actions {
      padding: 1rem 1.5rem 1.5rem;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-bottom: 0;
    }
    
    /* Types */
    .type-info .icon-container {
      background: rgba(25, 118, 210, 0.1);
      color: #1976d2;
    }
    
    .type-warning .icon-container {
      background: rgba(255, 152, 0, 0.1);
      color: #ff9800;
    }
    
    .type-danger .icon-container {
      background: rgba(244, 67, 54, 0.1);
      color: #f44336;
    }
    
    .type-success .icon-container {
      background: rgba(76, 175, 80, 0.1);
      color: #4caf50;
    }
  `]
})
export class ConfirmationDialogComponent implements OnInit {
  constructor(
    public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmationDialogData
  ) {}
  
  ngOnInit(): void {
    // Establecer valores por defecto
    this.data.type = this.data.type || 'info';
    this.data.icon = this.data.icon || this.getDefaultIcon();
    this.data.confirmText = this.data.confirmText || 'Confirmar';
    this.data.cancelText = this.data.cancelText || 'Cancelar';
    this.data.hideCancel = this.data.hideCancel || false;
    
    // Configurar ancho del diálogo
    if (this.data.width) {
      this.dialogRef.updateSize(this.data.width);
    }
  }
  
  getIcon(): string {
    if (this.data.icon) {
      return this.data.icon;
    }
    
    return this.getDefaultIcon();
  }
  
  getDefaultIcon(): string {
    switch (this.data.type) {
      case 'info':
        return 'info-circle';
      case 'warning':
        return 'exclamation-triangle';
      case 'danger':
        return 'exclamation-circle';
      case 'success':
        return 'check-circle';
      default:
        return 'info-circle';
    }
  }
  
  getButtonColor(): string {
    switch (this.data.type) {
      case 'info':
        return 'primary';
      case 'warning':
        return 'accent';
      case 'danger':
        return 'warn';
      case 'success':
        return 'primary';
      default:
        return 'primary';
    }
  }
}
