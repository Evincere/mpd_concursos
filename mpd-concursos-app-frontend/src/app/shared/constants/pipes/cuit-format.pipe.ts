import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'cuitFormat',
  standalone: true
})
export class CuitFormatPipe implements PipeTransform {
  transform(value: string | null): string {
    if (!value) return '';
    
    // Eliminar cualquier caracter que no sea número
    const numbers = value.replace(/\D/g, '');
    
    // Asegurarse de que tengamos exactamente 11 dígitos
    if (numbers.length !== 11) return value;
    
    // Formatear como XX-XXXXXXXX-X
    return `${numbers.slice(0, 2)}-${numbers.slice(2, 10)}-${numbers.slice(10)}`;
  }
}