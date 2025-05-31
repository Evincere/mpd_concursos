import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-test',
  standalone: true,
  imports: [CommonModule],
  template: `<div>Test Component</div>`,
  styles: []
})
export class TestComponent {
  constructor() {}
}
