import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';
import { LoaderService } from '../../services/loader.service';

/**
 * Componente que muestra un indicador de carga global para operaciones asíncronas.
 * Se muestra automáticamente cuando el servicio LoaderService emite un estado de carga.
 */
@Component({
  selector: 'app-global-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="global-loader-container" 
      *ngIf="isLoading" 
      [@fadeAnimation]
      [class.transparent]="transparent"
    >
      <div class="loader-content">
        <div class="spinner">
          <div class="spinner-inner"></div>
        </div>
        <div class="message" *ngIf="message">{{ message }}</div>
      </div>
    </div>
  `,
  styles: [`
    @use 'src/styles/variables' as *;
    
    .global-loader-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 9999;
      
      &.transparent {
        background-color: rgba(0, 0, 0, 0.2);
      }
    }
    
    .loader-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      background-color: $color-surface;
      border-radius: $border-radius;
      padding: 2rem;
      box-shadow: $box-shadow;
    }
    
    .spinner {
      width: 50px;
      height: 50px;
      position: relative;
      margin-bottom: 1rem;
      
      .spinner-inner {
        width: 100%;
        height: 100%;
        border: 4px solid rgba($color-primary, 0.2);
        border-top-color: $color-primary;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
    }
    
    .message {
      font-size: $font-size-md;
      color: $color-text-primary;
      text-align: center;
      max-width: 300px;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    // Estilos para tema oscuro
    @media (prefers-color-scheme: dark) {
      .loader-content {
        background-color: $color-surface-dark;
      }
      
      .spinner .spinner-inner {
        border-color: rgba($color-primary-dark, 0.2);
        border-top-color: $color-primary-dark;
      }
      
      .message {
        color: $color-text-primary-dark;
      }
    }
  `],
  animations: [
    trigger('fadeAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class GlobalLoaderComponent implements OnInit, OnDestroy {
  isLoading = false;
  message = '';
  transparent = false;
  
  private destroy$ = new Subject<void>();
  
  constructor(private loaderService: LoaderService) {}
  
  ngOnInit(): void {
    this.loaderService.isLoading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.isLoading = state.isLoading;
        this.message = state.message || '';
        this.transparent = state.transparent || false;
      });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
