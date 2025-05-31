import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeResourceUrl, SafeHtml, SafeStyle, SafeScript, SafeUrl } from '@angular/platform-browser';

@Pipe({
  name: 'safe',
  standalone: true
})
export class SafePipe implements PipeTransform {

  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string, type: string = 'resourceUrl'): SafeResourceUrl | SafeHtml | SafeStyle | SafeScript | SafeUrl {
    switch (type) {
      case 'html':
        return this.sanitizer.bypassSecurityTrustHtml(value);
      case 'style':
        return this.sanitizer.bypassSecurityTrustStyle(value);
      case 'script':
        return this.sanitizer.bypassSecurityTrustScript(value);
      case 'url':
        return this.sanitizer.bypassSecurityTrustUrl(value);
      case 'resourceUrl':
      default:
        return this.sanitizer.bypassSecurityTrustResourceUrl(value);
    }
  }
}
