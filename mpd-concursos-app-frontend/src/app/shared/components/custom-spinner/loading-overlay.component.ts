import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { LoadingService } from './loading.service';
import { CustomSpinnerComponent } from './custom-spinner.component';

@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  imports: [CommonModule, CustomSpinnerComponent],
  template: `
    <div *ngIf="isLoading" class="loading-overlay">
      <app-custom-spinner
        [size]="'large'"
        [message]="message"
      ></app-custom-spinner>
    </div>
  `,
  styles: [`
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(var(--color-background-rgb, 255, 255, 255), 0.7);
      backdrop-filter: blur(3px);
      z-index: 9999;
      animation: fadeIn 0.3s ease;
    }
    
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
    
    @media (prefers-color-scheme: dark) {
      .loading-overlay {
        background-color: rgba(var(--color-background-dark-rgb, 33, 33, 33), 0.7);
      }
    }
  `]
})
export class LoadingOverlayComponent implements OnInit, OnDestroy {
  isLoading = false;
  message = 'Cargando...';
  
  private loadingSubscription?: Subscription;
  private messageSubscription?: Subscription;
  
  constructor(private loadingService: LoadingService) {}
  
  ngOnInit(): void {
    this.loadingSubscription = this.loadingService.getLoading().subscribe(
      isLoading => {
        // Pequeño retraso para evitar parpadeos en cargas muy rápidas
        if (isLoading) {
          setTimeout(() => {
            if (this.loadingService.getLoading()) {
              this.isLoading = true;
            }
          }, 200);
        } else {
          this.isLoading = false;
        }
      }
    );
    
    this.messageSubscription = this.loadingService.getLoadingMessage().subscribe(
      message => {
        this.message = message;
      }
    );
  }
  
  ngOnDestroy(): void {
    this.loadingSubscription?.unsubscribe();
    this.messageSubscription?.unsubscribe();
  }
}
