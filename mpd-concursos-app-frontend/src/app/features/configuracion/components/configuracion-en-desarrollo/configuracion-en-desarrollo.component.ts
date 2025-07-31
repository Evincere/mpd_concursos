import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EnDesarrolloComponent, DesarrolloConfig } from '@shared/components/en-desarrollo/en-desarrollo.component';

@Component({
  selector: 'app-configuracion-en-desarrollo',
  standalone: true,
  imports: [CommonModule, EnDesarrolloComponent],
  template: `
    <app-en-desarrollo [config]="configuracion"></app-en-desarrollo>
  `,
})
export class ConfiguracionEnDesarrolloComponent {
  configuracion: DesarrolloConfig = {
    titulo: 'Configuración',
    subtitulo: 'Personalización del Sistema',
    imagen: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    mensajeHumor: '',
    descripcion: 'Esta sección está siendo desarrollada para brindar opciones de configuración avanzadas.',
    colorTema: '#f59e0b',
    iconoPrincipal: 'fa-cogs',
    emailContacto: 'concursos_mdp_rrhh@jus.mendoza.gov.ar'
  };
}
