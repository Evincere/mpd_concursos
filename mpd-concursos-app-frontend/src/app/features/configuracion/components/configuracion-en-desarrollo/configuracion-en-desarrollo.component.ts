import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-configuracion-en-desarrollo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="configuracion-container">
      <div class="development-card">
        <div class="icon-container">
          <i class="fas fa-cogs"></i>
        </div>
        <h2>Configuración</h2>
        <p class="subtitle">In dubio pro desarrollo</p>
        <p class="description">
          Esta sección está siendo desarrollada para brindar opciones de configuración avanzadas.
        </p>
        <div class="contact-info">
          <p><strong>Asistencia técnica:</strong></p>
          <a href="mailto:asistencia_mpd&#64;jus.mendoza.gov.ar" class="contact-link">
            <i class="fas fa-envelope"></i>
            asistencia_mpd&#64;jus.mendoza.gov.ar
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .configuracion-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 60vh;
      padding: 2rem;
    }

    .development-card {
      background: rgba(55, 65, 81, 0.95);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(156, 163, 175, 0.2);
      border-radius: 16px;
      padding: 3rem;
      text-align: center;
      max-width: 500px;
      width: 100%;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }

    .icon-container {
      margin-bottom: 1.5rem;
    }

    .icon-container i {
      font-size: 4rem;
      color: #f59e0b;
      opacity: 0.8;
    }

    h2 {
      color: #f9fafb;
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }

    .subtitle {
      color: #f59e0b;
      font-style: italic;
      font-size: 1.1rem;
      margin-bottom: 1.5rem;
      font-weight: 500;
    }

    .description {
      color: #d1d5db;
      font-size: 1rem;
      line-height: 1.6;
      margin-bottom: 2rem;
    }

    .contact-info {
      border-top: 1px solid rgba(156, 163, 175, 0.2);
      padding-top: 1.5rem;
    }

    .contact-info p {
      color: #f9fafb;
      margin-bottom: 0.5rem;
      font-weight: 600;
    }

    .contact-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: #3b82f6;
      text-decoration: none;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .contact-link:hover {
      color: #60a5fa;
      transform: translateY(-1px);
    }

    .contact-link i {
      font-size: 1rem;
    }

    @media (max-width: 768px) {
      .configuracion-container {
        padding: 1rem;
        min-height: 50vh;
      }

      .development-card {
        padding: 2rem;
      }

      h2 {
        font-size: 1.5rem;
      }

      .icon-container i {
        font-size: 3rem;
      }
    }
  `]
})
export class ConfiguracionEnDesarrolloComponent {
}
