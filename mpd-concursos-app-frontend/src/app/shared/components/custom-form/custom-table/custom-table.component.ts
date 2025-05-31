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

    .pagination-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      background-color: #222222;
      border-top: 1px solid #484848;
    }

    .pagination-info {
      font-size: 0.875rem;
      color: #B0B0B0;
    }

    .pagination-controls {
      display: flex;
      align-items: center;
    }

    .pagination-pages {
      display: flex;
      margin: 0 0.5rem;
    }

    .pagination-button {
      background: none;
      border: none;
      color: #FFFFFF;
      cursor: pointer;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.2s ease;
    }

    .pagination-button:hover:not(:disabled) {
      background-color: rgba(25, 118, 210, 0.1);
      color: #1976D2;
    }

    .pagination-button:disabled {
      color: #666666;
      cursor: not-allowed;
    }

    .page-button {
      background: none;
      border: none;
      color: #FFFFFF;
      cursor: pointer;
      min-width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: all 0.2s ease;
      font-weight: 500;
    }

    .page-button:hover:not(.active) {
      background-color: rgba(25, 118, 210, 0.1);
    }

    .page-button.active {
      background-color: #1976D2;
      color: white;
      box-shadow: 0 2px 8px rgba(25, 118, 210, 0.4);
    }

    .pagination-size {
      display: flex;
      align-items: center;
      font-size: 0.875rem;
      color: #B0B0B0;
    }

    .pagination-size select {
      margin-left: 0.5rem;
      background-color: #333333;
      color: #FFFFFF;
      border: 1px solid #484848;
      padding: 0.35rem 0.75rem;
      border-radius: 4px;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .pagination-size select:hover {
      border-color: rgba(25, 118, 210, 0.3);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    }

    /* Estilos para la tabla */
    .custom-table-container {
      position: relative;
      width: 100%;
      overflow: hidden;
      border-radius: 8px;
      background-color: #333333;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(72, 72, 72, 0.2);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      transition: all 0.3s ease;
      margin-bottom: 1.5rem;
    }

    .custom-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
    }

    .custom-table th {
      background-color: #222222;
      color: #FFFFFF;
      font-weight: 600;
      padding: 1.25rem 1rem;
      text-align: left;
      border-bottom: 2px solid rgba(25, 118, 210, 0.3);
      position: sticky;
      top: 0;
      z-index: 10;
      font-size: 0.95rem;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    .custom-table td {
      padding: 1.25rem 1rem;
      border-bottom: 1px solid rgba(72, 72, 72, 0.2);
      color: #FFFFFF;
      font-size: 0.95rem;
      transition: all 0.2s ease;
    }

    .custom-table tbody tr {
      transition: all 0.3s ease;
    }

    .custom-table tbody tr:hover {
      background-color: rgba(58, 58, 58, 0.5);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .custom-table tbody tr.clickable {
      cursor: pointer;
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
}
