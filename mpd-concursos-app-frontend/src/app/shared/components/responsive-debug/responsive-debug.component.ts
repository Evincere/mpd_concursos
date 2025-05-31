import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ResponsiveService } from '../../services/responsive.service';
import { ResponsiveTestRunnerService } from '../../services/responsive-test-runner.service';


@Component({
  selector: 'app-responsive-debug',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="responsive-debug" *ngIf="showDebug && screenSize">
      <div class="debug-content">
        <div class="size-info">
          <span class="breakpoint">{{ screenSize.breakpoint }}</span>
          <span class="dimensions">{{ screenSize.width }}x{{ screenSize.height }}</span>
        </div>
        <div class="device-type">
          <span [class.active]="screenSize.isMobile">Mobile</span>
          <span [class.active]="screenSize.isTablet">Tablet</span>
          <span [class.active]="screenSize.isDesktop">Desktop</span>
        </div>
        <div class="controls">
          <button (click)="simulateSize(375, 667)">iPhone 8</button>
          <button (click)="simulateSize(414, 896)">iPhone 11</button>
          <button (click)="simulateSize(768, 1024)">iPad</button>
          <button (click)="simulateSize(1024, 768)">Tablet L</button>
          <button (click)="simulateSize(1280, 800)">Desktop S</button>
          <button (click)="simulateSize(1920, 1080)">Desktop L</button>
          <button (click)="restoreSize()">Reset</button>
        </div>
        <div class="test-button">
          <button (click)="runTests()">Ejecutar Pruebas</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .responsive-debug {
      position: fixed;
      bottom: 0;
      right: 0;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 8px;
      border-top-left-radius: 8px;
      font-family: monospace;
      z-index: 9999;
      font-size: 12px;
    }

    .debug-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .size-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
    }

    .breakpoint {
      font-weight: bold;
      text-transform: uppercase;
      color: #4caf50;
    }

    .dimensions {
      color: #2196f3;
    }

    .device-type {
      display: flex;
      gap: 8px;
    }

    .device-type span {
      opacity: 0.5;
    }

    .device-type span.active {
      opacity: 1;
      font-weight: bold;
      color: #ff9800;
    }

    .controls {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 4px;
    }

    .controls button {
      background: #333;
      border: 1px solid #555;
      color: white;
      padding: 2px 4px;
      border-radius: 4px;
      font-size: 10px;
      cursor: pointer;
    }

    .controls button:hover {
      background: #444;
    }

    .test-button {
      margin-top: 4px;
    }

    .test-button button {
      width: 100%;
      background: #2196f3;
      border: none;
      color: white;
      padding: 4px;
      border-radius: 4px;
      font-size: 11px;
      cursor: pointer;
    }

    .test-button button:hover {
      background: #1976d2;
    }
  `]
})
export class ResponsiveDebugComponent implements OnInit, OnDestroy {


  screenSize: {
    breakpoint: string;
    width: number;
    height: number;
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
  } | null = null;
  showDebug = false; // Deshabilitado temporalmente
  private subscription: Subscription | null = null;

  constructor(
    private responsiveService: ResponsiveService,
    private testRunner: ResponsiveTestRunnerService
  ) {}



  ngOnInit(): void {
    this.subscription = this.responsiveService.screenSize$.subscribe((size: any) => {
      this.screenSize = {
        breakpoint: size.breakpoint || '',
        width: size.width || 0,
        height: size.height || 0,
        isMobile: size.isMobile || false,
        isTablet: size.isTablet || false,
        isDesktop: size.isDesktop || false
      };
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  simulateSize(width: number, height: number): void {
    this.responsiveService.simulateScreenSize(width, height);
  }

  restoreSize(): void {
    this.responsiveService.restoreRealScreenSize();
  }

  runTests(): void {
    this.testRunner.runTests();
  }
}
