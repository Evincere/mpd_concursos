import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EnDesarrolloComponent, DesarrolloConfig } from '@shared/components/en-desarrollo/en-desarrollo.component';

@Component({
  selector: 'app-examenes-en-desarrollo',
  standalone: true,
  imports: [CommonModule, EnDesarrolloComponent],
  template: `
    <app-en-desarrollo [config]="configuracion"></app-en-desarrollo>
  `
})
export class ExamenesEnDesarrolloComponent {
  configuracion: DesarrolloConfig = {
    titulo: 'Módulo de Exámenes',
    subtitulo: 'Sistema de Evaluación Digital',
    imagen: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    mensajeHumor: '⚖️ "In dubio pro desarrollo". Los exámenes están en construcción. 🏗️',
    colorTema: '#8b5cf6',
    iconoPrincipal: 'fa-graduation-cap'
  };
}
