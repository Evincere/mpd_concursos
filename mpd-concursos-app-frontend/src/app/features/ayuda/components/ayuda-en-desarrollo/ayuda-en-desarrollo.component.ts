import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EnDesarrolloComponent, DesarrolloConfig } from '@shared/components/en-desarrollo/en-desarrollo.component';

@Component({
  selector: 'app-ayuda-en-desarrollo',
  standalone: true,
  imports: [CommonModule, EnDesarrolloComponent],
  template: `
    <app-en-desarrollo [config]="configuracion"></app-en-desarrollo>
  `
})
export class AyudaEnDesarrolloComponent {
  configuracion: DesarrolloConfig = {
    titulo: 'Centro de Ayuda',
    subtitulo: 'Soporte y Asistencia Técnica',
    imagen: 'https://images.unsplash.com/photo-1553484771-371a605b060b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    mensajeHumor: '',
    colorTema: '#f59e0b',
    iconoPrincipal: 'fa-life-ring',
    emailContacto: 'concursos_mdp_rrhh@jus.mendoza.gov.ar'
  };
}
