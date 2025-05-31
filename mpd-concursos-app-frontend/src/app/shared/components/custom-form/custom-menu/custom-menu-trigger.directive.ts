import { Directive, Input, HostListener, ElementRef, ViewContainerRef } from '@angular/core';
import { CustomMenuComponent } from './custom-menu.component';

@Directive({
  selector: '[appCustomMenuTrigger]',
  standalone: true,
  exportAs: 'appCustomMenuTrigger'
})
export class CustomMenuTriggerDirective {
  @Input('appCustomMenuTrigger') menu!: CustomMenuComponent;
  
  constructor(private elementRef: ElementRef) {}
  
  @HostListener('click')
  onClick(): void {
    this.toggleMenu();
  }
  
  @HostListener('keydown.enter')
  @HostListener('keydown.space', ['$event'])
  onKeyPress(event?: KeyboardEvent): void {
    if (event) {
      event.preventDefault();
    }
    this.toggleMenu();
  }
  
  toggleMenu(): void {
    if (this.menu.isOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }
  
  openMenu(): void {
    if (!this.menu.isOpen) {
      this.menu.open(this.elementRef.nativeElement);
    }
  }
  
  closeMenu(): void {
    if (this.menu.isOpen) {
      this.menu.close();
    }
  }
}
