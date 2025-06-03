import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'nl2br',
  standalone: true
})
export class Nl2brPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string): SafeHtml {
    if (!value) return '';
    
    // Convertir saltos de línea a <br> tags
    const htmlValue = value
      .replace(/\n\r?/g, '<br>')
      .replace(/\r/g, '<br>');
    
    // Sanitizar el HTML para seguridad
    return this.sanitizer.bypassSecurityTrustHtml(htmlValue);
  }
}
