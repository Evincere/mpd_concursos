import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-custom-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="spinner-container" [ngClass]="{'overlay': overlay, 'fullscreen': fullscreen}">
      <div class="spinner-content">
        <div class="spinner" [ngClass]="size">
          <div class="spinner-inner">
            <div class="spinner-circle"></div>
            <div class="spinner-circle-shadow"></div>
          </div>
        </div>
        <div *ngIf="message" class="spinner-message">{{ message }}</div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: contents;
    }
    
    .spinner-container {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    
    .spinner-container.overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(var(--color-background-rgb, 255, 255, 255), 0.7);
      backdrop-filter: blur(2px);
      z-index: 100;
    }
    
    .spinner-container.fullscreen {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 9999;
    }
    
    .spinner-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    
    .spinner {
      position: relative;
      width: 40px;
      height: 40px;
    }
    
    .spinner.small {
      width: 24px;
      height: 24px;
    }
    
    .spinner.large {
      width: 64px;
      height: 64px;
    }
    
    .spinner-inner {
      position: relative;
      width: 100%;
      height: 100%;
      animation: spinner-rotate 1.5s linear infinite;
    }
    
    .spinner-circle {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      border: 3px solid transparent;
      border-top-color: var(--color-primary, #1976D2);
      animation: spinner-dash 1.5s ease-in-out infinite;
    }
    
    .spinner.small .spinner-circle {
      border-width: 2px;
    }
    
    .spinner.large .spinner-circle {
      border-width: 4px;
    }
    
    .spinner-circle-shadow {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      border: 3px solid rgba(var(--color-primary-rgb, 25, 118, 210), 0.1);
    }
    
    .spinner.small .spinner-circle-shadow {
      border-width: 2px;
    }
    
    .spinner.large .spinner-circle-shadow {
      border-width: 4px;
    }
    
    .spinner-message {
      margin-top: 1rem;
      font-size: 0.9rem;
      color: var(--color-text-secondary, #666666);
      text-align: center;
      max-width: 200px;
    }
    
    @keyframes spinner-rotate {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
    
    @keyframes spinner-dash {
      0% {
        transform: rotate(0deg);
      }
      50% {
        transform: rotate(180deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
    
    @media (prefers-color-scheme: dark) {
      .spinner-container.overlay {
        background-color: rgba(var(--color-background-dark-rgb, 33, 33, 33), 0.7);
      }
      
      .spinner-message {
        color: var(--color-text-secondary-dark, #B0B0B0);
      }
    }
  `]
})
export class CustomSpinnerComponent {
  /**
   * Tamaño del spinner: 'small', 'medium' (default), 'large'
   */
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  
  /**
   * Mensaje opcional para mostrar debajo del spinner
   */
  @Input() message?: string;
  
  /**
   * Si el spinner debe mostrarse como un overlay sobre su contenedor
   */
  @Input() overlay = false;
  
  /**
   * Si el spinner debe mostrarse a pantalla completa
   */
  @Input() fullscreen = false;
}
