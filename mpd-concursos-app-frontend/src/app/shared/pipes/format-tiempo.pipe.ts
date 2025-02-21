import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatTiempo',
  standalone: true
})
export class FormatTiempoPipe implements PipeTransform {
  transform(segundos: number): string {
    if (!segundos || isNaN(segundos)) {
      return '00:00:00';
    }

    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = Math.floor(segundos % 60);

    const horasFormateadas = Math.min(horas, 99).toString().padStart(2, '0');
    const minutosFormateados = Math.min(minutos, 59).toString().padStart(2, '0');
    const segsFormateados = Math.min(segs, 59).toString().padStart(2, '0');

    return `${horasFormateadas}:${minutosFormateados}:${segsFormateados}`;
  }
}
