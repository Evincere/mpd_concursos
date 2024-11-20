import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'cuitFormat',
  standalone: true
})
export class CuitFormatPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';
    
    // Elimina cualquier caracter que no sea número
    const numbers = value.replace(/\D/g, '');
    
    // Verifica si hay suficientes números
    if (numbers.length !== 11) return value;
    
    // Formatea como XX-XXXXXXXX-X
    return `${numbers.slice(0,2)}-${numbers.slice(2,10)}-${numbers.slice(10)}`;
  }
} 