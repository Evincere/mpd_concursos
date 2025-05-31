import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-paginator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="paginator">
      <div class="paginator-range">
        <span>{{ (pageIndex * pageSize) + 1 }} - {{ Math.min((pageIndex + 1) * pageSize, length) }} de {{ length }}</span>
      </div>
      <div class="paginator-controls">
        <button 
          *ngIf="showFirstLastButtons"
          class="paginator-button" 
          [disabled]="pageIndex === 0"
          (click)="onPageChange(0)">
          <span class="paginator-icon">«</span>
        </button>
        <button 
          class="paginator-button" 
          [disabled]="pageIndex === 0"
          (click)="onPageChange(pageIndex - 1)">
          <span class="paginator-icon">←</span>
        </button>
        <button 
          class="paginator-button"
          [disabled]="(pageIndex + 1) * pageSize >= length"
          (click)="onPageChange(pageIndex + 1)">
          <span class="paginator-icon">→</span>
        </button>
        <button 
          *ngIf="showFirstLastButtons"
          class="paginator-button"
          [disabled]="(pageIndex + 1) * pageSize >= length"
          (click)="onPageChange(Math.ceil(length / pageSize) - 1)">
          <span class="paginator-icon">»</span>
        </button>
      </div>
      <div class="paginator-size">
        <select 
          class="paginator-select"
          [value]="pageSize"
          (change)="onPageSizeChange($event)">
          <option *ngFor="let size of pageSizeOptions" [value]="size">{{ size }}</option>
        </select>
        <span>items por página</span>
      </div>
    </div>
  `,
  styles: [`
    .paginator {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding: 8px 16px;
      background-color: #f5f5f5;
      border-top: 1px solid #e0e0e0;
    }

    .paginator-range {
      margin-right: 32px;
    }

    .paginator-controls {
      display: flex;
      gap: 8px;
      margin-right: 32px;
    }

    .paginator-button {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
    }

    .paginator-button:hover:not([disabled]) {
      background-color: #e0e0e0;
    }

    .paginator-button[disabled] {
      cursor: default;
      opacity: 0.5;
    }

    .paginator-icon {
      font-size: 18px;
    }

    .paginator-size {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .paginator-select {
      padding: 4px 8px;
      border-radius: 4px;
      border: 1px solid #e0e0e0;
    }
  `]
})
export class PaginatorComponent {
  @Input() length: number = 0;
  @Input() pageSize: number = 10;
  @Input() pageIndex: number = 0;
  @Input() pageSizeOptions: number[] = [5, 10, 25, 50];
  @Input() showFirstLastButtons: boolean = false;

  @Output() page = new EventEmitter<{pageIndex: number, pageSize: number}>();

  protected Math = Math;

  onPageChange(newPageIndex: number): void {
    this.pageIndex = newPageIndex;
    this.page.emit({ pageIndex: this.pageIndex, pageSize: this.pageSize });
  }

  onPageSizeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.pageSize = Number(select.value);
    this.pageIndex = 0;
    this.page.emit({ pageIndex: this.pageIndex, pageSize: this.pageSize });
  }
}