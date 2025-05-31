import { Component, Input, TemplateRef, ContentChild, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Interfaz para el contexto de la celda de la tabla
 */
export interface CellTemplateContext<T = unknown> {
  $implicit: T;
  rowIndex: number;
}

@Component({
  selector: 'app-custom-table-column',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule],
  template: `
    <ng-template #cellTemplate let-item let-rowIndex="rowIndex">
      <ng-content></ng-content>
    </ng-template>
  `
})
export class CustomTableColumnComponent<T = unknown> {
  @Input() property = '';
  @Input() header = '';
  @Input() sortable = false;
  @Input() width = '';

  @ContentChild(TemplateRef) customTemplate: TemplateRef<CellTemplateContext<T>> | null = null;

  get cellTemplate(): TemplateRef<CellTemplateContext<T>> | null {
    return this.customTemplate;
  }
}
