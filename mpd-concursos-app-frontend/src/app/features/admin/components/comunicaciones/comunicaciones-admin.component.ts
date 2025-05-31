import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-comunicaciones-admin',
  template: `
    <div>
      <h1>Comunicaciones Masivas</h1>
      <p>Componente simplificado para pruebas</p>
    </div>
  `,
  standalone: true,
  imports: [CommonModule]
})
export class ComunicacionesAdminComponent {
  constructor() {}
}
