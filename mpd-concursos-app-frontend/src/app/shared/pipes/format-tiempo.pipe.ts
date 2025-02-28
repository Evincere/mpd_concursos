import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatTiempo',
  standalone: true
})
export class FormatTiempoPipe implements PipeTransform {
  transform(segundos: number): string {
    if (segundos === null || segundos === undefined) return '00:00';

    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;

    return `${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
  }
}
