import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loader-container" [class.overlay]="overlay">
      <div class="loader">
        <svg class="mpd-loader" viewBox="0 0 100 100">
          <!-- Círculo exterior -->
          <circle class="outer-circle" cx="50" cy="50" r="45" />
          
          <!-- Figuras humanas estilizadas -->
          <g class="figures-group">
            <!-- Figura izquierda -->
            <path class="figure left" d="M35,65 C35,65 30,55 35,45 C40,35 45,40 45,40 L45,60" />
            <circle class="head left" cx="35" cy="35" r="6" />
            
            <!-- Figura derecha -->
            <path class="figure right" d="M65,65 C65,65 70,55 65,45 C60,35 55,40 55,40 L55,60" />
            <circle class="head right" cx="65" cy="35" r="6" />
          </g>
          
          <!-- Línea divisoria central -->
          <line class="center-line" x1="50" y1="25" x2="50" y2="75" />
        </svg>
        <div class="loader-text" *ngIf="message">{{ message }}</div>
      </div>
    </div>
  `,
  styleUrls: ['./loader.component.scss']
})
export class LoaderComponent {
  @Input() message: string = '';
  @Input() overlay: boolean = false;
}
