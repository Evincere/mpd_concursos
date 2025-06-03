import { Component, Input, Output, EventEmitter, ContentChildren, QueryList, AfterContentInit, TemplateRef, ViewEncapsulation } from '@angular/core';
import { CommonModule, NgClass, NgStyle } from '@angular/common';
import { CustomTableColumnComponent, CellTemplateContext } from './custom-table-column.component';

export interface TableColumn<T = unknown> {
  property: string;
  header: string;
  sortable?: boolean;
  width?: string;
  cellTemplate?: TemplateRef<{ $implicit: T; rowIndex: number }>;
}

export interface SortEvent {
  property: string;
  direction: 'asc' | 'desc' | '';
}

export interface PageEvent {
  pageIndex: number;
  pageSize: number;
}

@Component({
  selector: 'app-custom-table',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, NgClass, NgStyle, CustomTableColumnComponent],
  template: `
    <div class="custom-table-container" [class.loading]="loading" [ngClass]="containerClass" [ngStyle]="containerStyle">
      <div *ngIf="loading" class="loading-overlay">
        <div class="spinner"></div>
        <span>Cargando...</span>
      </div>

      <div *ngIf="!loading && (!data || data.length === 0)" class="empty-state">
        <i class="fas fa-inbox empty-icon"></i>
        <p class="empty-message">{{ emptyMessage }}</p>
      </div>

      <table *ngIf="data && data.length > 0" class="custom-table" [ngClass]="tableClass" [ngStyle]="tableStyle">
        <colgroup>
          <col *ngFor="let column of columnComponents; trackBy: trackByColumn">
        </colgroup>
        <thead>
          <tr>
            <th *ngIf="selectable" class="selection-column">
              <div class="checkbox-container">
                <input
                  type="checkbox"
                  [checked]="allSelected"
                  (change)="toggleSelectAll()"
                  [disabled]="loading"
                />
              </div>
            </th>

            <th
              *ngFor="let column of columns"
              [style.width]="column.width"
              [class.sortable]="column.sortable"
              [ngClass]="headerClass"
              [ngStyle]="headerStyle"
              (click)="column.sortable ? sort(column.property) : null"
            >
              <div class="header-cell">
                {{ column.header }}

                <div *ngIf="column.sortable" class="sort-icon">
                  <i
                    class="fas"
                    [class.fa-sort]="sortProperty !== column.property"
                    [class.fa-sort-up]="sortProperty === column.property && sortDirection === 'asc'"
                    [class.fa-sort-down]="sortProperty === column.property && sortDirection === 'desc'"
                  ></i>
                </div>
              </div>
            </th>
          </tr>
        </thead>

        <tbody>
          <tr
            *ngFor="let item of displayData; let i = index"
            [class.selected]="isSelected(item)"
            [class.clickable]="rowClickable"
            [ngClass]="rowClass"
            [ngStyle]="rowStyle"
            (click)="onRowClick(item)"
          >
            <td *ngIf="selectable" class="selection-column">
              <div class="checkbox-container">
                <input
                  type="checkbox"
                  [checked]="isSelected(item)"
                  (click)="$event.stopPropagation()"
                  (change)="toggleSelect(item)"
                  [disabled]="loading"
                />
              </div>
            </td>

            <td *ngFor="let column of columns" [ngClass]="cellClass" [ngStyle]="cellStyle">
              <ng-container *ngIf="column.cellTemplate; else defaultCell">
                <ng-container *ngTemplateOutlet="column.cellTemplate; context: { $implicit: item, rowIndex: i }"></ng-container>
              </ng-container>

              <ng-template #defaultCell>
                {{ getPropertyValue(item, column.property) }}
              </ng-template>
            </td>
          </tr>
        </tbody>
      </table>

      <div *ngIf="paginated && data && data.length > 0" class="pagination-container">
        <div class="pagination-info">
          Mostrando {{ startIndex + 1 }} - {{ endIndex }} de {{ totalItems }}
        </div>

        <div class="pagination-controls">
          <button
            class="pagination-button"
            [disabled]="pageIndex === 0"
            (click)="changePage(pageIndex - 1)"
          >
            <i class="fas fa-chevron-left"></i>
          </button>

          <div class="pagination-pages">
            <button
              *ngFor="let page of visiblePages"
              class="page-button"
              [class.active]="page === pageIndex"
              (click)="changePage(page)"
            >
              {{ page + 1 }}
            </button>
          </div>

          <button
            class="pagination-button"
            [disabled]="pageIndex >= totalPages - 1"
            (click)="changePage(pageIndex + 1)"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>

        <div class="pagination-size">
          <span>Filas por página:</span>
          <select [value]="pageSize" (change)="changePageSize($event)">
            <option *ngFor="let size of pageSizeOptions" [value]="size">{{ size }}</option>
          </select>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Estilos básicos que no interfieren con los estilos globales */
    .header-cell {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .sortable {
      cursor: pointer;
    }

    .sort-icon {
      margin-left: 0.5rem;
    }

    .selection-column {
      width: 48px;
      text-align: center;
    }

    .checkbox-container {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 2;
      background-color: rgba(51, 51, 51, 0.7);
      backdrop-filter: blur(4px);
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(25, 118, 210, 0.3);
      border-top-color: #1976D2;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .empty-state {
      padding: 3rem 1rem;
      text-align: center;
      color: #B0B0B0;
    }

    .empty-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      opacity: 0.5;
      color: #B0B0B0;
    }

    .empty-message {
      font-size: 1rem;
      margin: 0;
      color: #B0B0B0;
    }

    /* ===== PAGINACIÓN CON GLASSMORPHISM ===== */
    .pagination-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.5rem;

      /* Premium glassmorphism base */
      background: linear-gradient(135deg,
        rgba(55, 65, 81, 0.95) 0%,
        rgba(75, 85, 99, 0.9) 100%);
      background-image:
        linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%),
        radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.08) 0%, transparent 50%);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-top: none;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-radius: 0 0 8px 8px;
      position: relative;
      overflow: hidden;

      /* Efecto de brillo sutil en hover */
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg,
          transparent,
          rgba(255, 255, 255, 0.1),
          transparent);
        transition: left 1s ease;
        z-index: 1;
        pointer-events: none;
      }

      &:hover::before {
        left: 100%;
      }
    }

    .pagination-info {
      font-size: 0.875rem;
      color: #d1d5db;
      font-weight: 500;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      position: relative;
      z-index: 2;
    }

    .pagination-controls {
      display: flex;
      align-items: center;
      position: relative;
      z-index: 2;
    }

    .pagination-pages {
      display: flex;
      margin: 0 0.5rem;
    }

    .pagination-button {
      background: linear-gradient(135deg,
        rgba(59, 130, 246, 0.1) 0%,
        rgba(59, 130, 246, 0.05) 100%);
      border: 1px solid rgba(59, 130, 246, 0.2);
      color: #f9fafb;
      cursor: pointer;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      backdrop-filter: blur(4px);
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }

    .pagination-button:hover:not(:disabled) {
      background: linear-gradient(135deg,
        rgba(59, 130, 246, 0.2) 0%,
        rgba(59, 130, 246, 0.1) 100%);
      color: #3b82f6;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
      border-color: rgba(59, 130, 246, 0.4);
    }

    .pagination-button:disabled {
      background: linear-gradient(135deg,
        rgba(107, 114, 128, 0.1) 0%,
        rgba(107, 114, 128, 0.05) 100%);
      border-color: rgba(107, 114, 128, 0.2);
      color: #9ca3af;
      cursor: not-allowed;
      opacity: 0.6;
    }

    .page-button {
      background: linear-gradient(135deg,
        rgba(59, 130, 246, 0.1) 0%,
        rgba(59, 130, 246, 0.05) 100%);
      border: 1px solid rgba(59, 130, 246, 0.2);
      color: #f9fafb;
      cursor: pointer;
      min-width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      font-weight: 500;
      backdrop-filter: blur(4px);
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      margin: 0 2px;
    }

    .page-button:hover:not(.active) {
      background: linear-gradient(135deg,
        rgba(59, 130, 246, 0.2) 0%,
        rgba(59, 130, 246, 0.1) 100%);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
      border-color: rgba(59, 130, 246, 0.4);
    }

    .page-button.active {
      background: linear-gradient(135deg,
        #3b82f6 0%,
        #2563eb 100%);
      color: white;
      box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
      border-color: #3b82f6;
      transform: translateY(-1px);
    }

    .pagination-size {
      display: flex;
      align-items: center;
      font-size: 0.875rem;
      color: #d1d5db;
      font-weight: 500;
      position: relative;
      z-index: 2;
    }

    .pagination-size select {
      margin-left: 0.5rem;
      background: linear-gradient(135deg,
        rgba(75, 85, 99, 0.9) 0%,
        rgba(55, 65, 81, 0.9) 100%) !important;
      color: #f9fafb !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
      padding: 0.375rem 0.75rem;
      border-radius: 6px;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      backdrop-filter: blur(4px) !important;
      -webkit-backdrop-filter: blur(4px) !important;
      appearance: none;
      -webkit-appearance: none;
      -moz-appearance: none;
      background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23f9fafb' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e") !important;
      background-repeat: no-repeat !important;
      background-position: right 0.5rem center !important;
      background-size: 1rem !important;
      padding-right: 2.5rem !important;
    }

    .pagination-size select:hover {
      border-color: rgba(59, 130, 246, 0.3) !important;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2) !important;
      background: linear-gradient(135deg,
        rgba(75, 85, 99, 1) 0%,
        rgba(55, 65, 81, 1) 100%) !important;
      background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23f9fafb' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e") !important;
      background-repeat: no-repeat !important;
      background-position: right 0.5rem center !important;
      background-size: 1rem !important;
    }

    .pagination-size select:focus {
      outline: none !important;
      border-color: rgba(59, 130, 246, 0.5) !important;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2) !important;
      background: linear-gradient(135deg,
        rgba(75, 85, 99, 0.9) 0%,
        rgba(55, 65, 81, 0.9) 100%) !important;
      background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23f9fafb' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e") !important;
      background-repeat: no-repeat !important;
      background-position: right 0.5rem center !important;
      background-size: 1rem !important;
    }

    /* ===== GLASSMORPHISM DROPDOWN OPTIONS ===== */
    .pagination-size select option {
      background: rgba(55, 65, 81, 0.95);
      color: #f9fafb;
      padding: 0.5rem;
      border: none;
    }

    .pagination-size select option:hover,
    .pagination-size select option:focus {
      background: rgba(75, 85, 99, 0.95);
      color: #f9fafb;
    }

    .pagination-size select option:checked {
      background: rgba(59, 130, 246, 0.8);
      color: #f9fafb;
    }

    /* ===== GLASSMORPHISM DESIGN SYSTEM FOR CUSTOM TABLE ===== */
    .custom-table-container {
      position: relative;
      width: 100%;
      overflow: hidden;
      border-radius: 8px;

      /* Premium glassmorphism base */
      background: linear-gradient(135deg,
        rgba(55, 65, 81, 0.95) 0%,
        rgba(75, 85, 99, 0.9) 100%);
      background-image:
        linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%),
        radial-gradient(circle at 70% 30%, rgba(59, 130, 246, 0.08) 0%, transparent 50%);
      border: 1px solid rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      box-shadow:
        0 8px 24px rgba(0, 0, 0, 0.2),
        0 4px 12px rgba(0, 0, 0, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.15),
        inset 0 -1px 0 rgba(0, 0, 0, 0.1);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      margin-bottom: 0;
    }

    .custom-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      background: transparent;
    }

    .custom-table th {
      background: linear-gradient(135deg,
        rgba(55, 65, 81, 0.9) 0%,
        rgba(75, 85, 99, 0.8) 100%);
      color: #f9fafb;
      font-weight: 600;
      padding: 1rem 1.25rem;
      text-align: left;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      position: sticky;
      top: 0;
      z-index: 10;
      font-size: 0.8125rem;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);

      &:first-child {
        border-top-left-radius: 8px;
      }

      &:last-child {
        border-top-right-radius: 8px;
      }
    }

    .custom-table td {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      color: #f9fafb;
      font-size: 0.875rem;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      background: transparent;
    }

    .custom-table tbody tr {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
    }

    .custom-table tbody tr:hover {
      background: linear-gradient(135deg,
        rgba(255, 255, 255, 0.05) 0%,
        rgba(255, 255, 255, 0.02) 100%);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .custom-table tbody tr.clickable {
      cursor: pointer;
    }

    .custom-table tbody tr:last-child td:first-child {
      border-bottom-left-radius: 8px;
    }

    .custom-table tbody tr:last-child td:last-child {
      border-bottom-right-radius: 8px;
    }

    /* Estilos para tema oscuro */
    @media (prefers-color-scheme: dark) {
      .custom-table-container {
        background-color: #222222;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(51, 51, 51, 0.2);
      }

      .custom-table th {
        background-color: #1a1a1a;
        color: #E0E0E0;
        border-bottom: 2px solid rgba(21, 101, 192, 0.3);
      }

      .custom-table td {
        border-bottom: 1px solid rgba(51, 51, 51, 0.2);
        color: #E0E0E0;
      }

      .custom-table tbody tr:hover {
        background-color: rgba(68, 68, 68, 0.5);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }

      .loading-overlay {
        background-color: rgba(34, 34, 34, 0.7);
      }

      .spinner {
        border-color: rgba(21, 101, 192, 0.3);
        border-top-color: #1565C0;
      }

      .empty-state {
        color: #A0A0A0;
      }

      .empty-icon {
        color: #A0A0A0;
      }

      .empty-message {
        color: #A0A0A0;
      }

      .pagination-container {
        background-color: #1a1a1a;
        border-top: 1px solid #333333;
      }

      .pagination-info {
        color: #A0A0A0;
      }

      .pagination-button {
        color: #E0E0E0;
      }

      .pagination-button:hover:not(:disabled) {
        color: #1565C0;
        background-color: rgba(21, 101, 192, 0.1);
      }

      .pagination-button:disabled {
        color: #666666;
      }

      .page-button {
        color: #E0E0E0;
      }

      .page-button:hover:not(.active) {
        background-color: rgba(21, 101, 192, 0.1);
      }

      .page-button.active {
        background-color: #1565C0;
        box-shadow: 0 2px 8px rgba(21, 101, 192, 0.4);
      }

      .pagination-size {
        color: #A0A0A0;
      }

      .pagination-size select {
        background-color: #222222;
        color: #E0E0E0;
        border: 1px solid #333333;
      }

      .pagination-size select:hover {
        border-color: rgba(21, 101, 192, 0.3);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
      }
    }
  `]
})
export class CustomTableComponent<T = unknown> implements AfterContentInit {
  @Input() data: T[] = [];
  @Input() columns: TableColumn<T>[] = [];
  @Input() loading = false;
  @Input() emptyMessage = 'No hay datos disponibles';
  @Input() rowClickable = false;
  @Input() selectable = false;
  @Input() paginated = false;
  @Input() pageSize = 10;
  @Input() pageIndex = 0;
  @Input() totalItems = 0;
  @Input() pageSizeOptions: number[] = [5, 10, 25, 50];
  @Input() serverSidePagination = true; // Indica si la paginación se maneja en el servidor

  // Propiedades para estilos personalizados
  @Input() containerClass = '';
  @Input() tableClass = '';
  @Input() headerClass = '';
  @Input() rowClass = '';
  @Input() cellClass = '';

  // Propiedades para estilos inline
  @Input() containerStyle: { [key: string]: string } = {};
  @Input() tableStyle: { [key: string]: string } = {};
  @Input() headerStyle: { [key: string]: string } = {};
  @Input() rowStyle: { [key: string]: string } = {};
  @Input() cellStyle: { [key: string]: string } = {};

  @Output() rowClick = new EventEmitter<T>();
  @Output() sortChange = new EventEmitter<SortEvent>();
  @Output() pageChange = new EventEmitter<PageEvent>();
  @Output() selectionChange = new EventEmitter<T[]>();

  @ContentChildren(CustomTableColumnComponent) columnComponents!: QueryList<CustomTableColumnComponent<T>>;

  sortProperty = '';
  sortDirection: 'asc' | 'desc' | '' = '';
  selectedItems: T[] = [];

  get displayData(): T[] {
    if (!this.data) {
      return [];
    }

    // Si la paginación se maneja en el servidor, no hacemos paginación local
    if (this.paginated && !this.serverSidePagination) {
      const start = this.pageIndex * this.pageSize;
      const end = start + this.pageSize;
      return this.data.slice(start, end);
    }
    return this.data;
  }

  get allSelected(): boolean {
    const displayData = this.displayData;
    return displayData && displayData.length > 0 && displayData.every(item => this.isSelected(item));
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  get startIndex(): number {
    return this.pageIndex * this.pageSize;
  }

  get endIndex(): number {
    const end = this.startIndex + this.pageSize;
    return Math.min(end, this.totalItems);
  }

  get visiblePages(): number[] {
    const totalPages = this.totalPages;
    const currentPage = this.pageIndex;
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i);
    }

    let startPage = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = startPage + maxVisiblePages - 1;

    if (endPage >= totalPages) {
      endPage = totalPages - 1;
      startPage = Math.max(0, endPage - maxVisiblePages + 1);
    }

    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  }

  ngAfterContentInit(): void {
    if (this.columnComponents.length > 0 && this.columns.length === 0) {
      this.columns = this.columnComponents.map(column => {
        return {
          property: column.property,
          header: column.header,
          sortable: column.sortable,
          width: column.width,
          cellTemplate: column.cellTemplate as TemplateRef<{ $implicit: T; rowIndex: number }>
        };
      });
    }
  }

  getPropertyValue(item: T, property: string): unknown {
    const properties = property.split('.');
    let value: unknown = item;

    for (const prop of properties) {
      if (value === null || value === undefined) {
        return '';
      }
      value = (value as Record<string, unknown>)[prop];
    }

    return value;
  }

  sort(property: string): void {
    let direction: 'asc' | 'desc' | '' = 'asc';

    if (this.sortProperty === property) {
      direction = this.sortDirection === 'asc' ? 'desc' : this.sortDirection === 'desc' ? '' : 'asc';
    }

    this.sortProperty = property;
    this.sortDirection = direction;

    this.sortChange.emit({ property, direction });
  }

  changePage(page: number): void {
    if (page < 0 || page >= this.totalPages) return;

    this.pageIndex = page;
    this.pageChange.emit({ pageIndex: this.pageIndex, pageSize: this.pageSize });
  }

  changePageSize(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.pageSize = Number(select.value);
    this.pageIndex = 0; // Reset to first page

    this.pageChange.emit({ pageIndex: this.pageIndex, pageSize: this.pageSize });
  }

  onRowClick(item: T): void {
    if (this.rowClickable) {
      this.rowClick.emit(item);
    }
  }

  isSelected(item: T): boolean {
    return this.selectedItems.includes(item);
  }

  toggleSelect(item: T): void {
    const index = this.selectedItems.indexOf(item);

    if (index === -1) {
      this.selectedItems.push(item);
    } else {
      this.selectedItems.splice(index, 1);
    }

    this.selectionChange.emit([...this.selectedItems]);
  }

  toggleSelectAll(): void {
    if (this.allSelected) {
      this.selectedItems = this.selectedItems.filter(item => !this.displayData.includes(item));
    } else {
      this.displayData.forEach(item => {
        if (!this.isSelected(item)) {
          this.selectedItems.push(item);
        }
      });
    }

    this.selectionChange.emit([...this.selectedItems]);
  }

  // TrackBy function para optimizar el renderizado de columnas
  trackByColumn(index: number, column: any): any {
    return column.key || index;
  }
}
