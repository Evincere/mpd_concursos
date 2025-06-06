import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomButtonComponent } from '../custom-form/custom-button/custom-button.component';
import { CustomSpinnerComponent } from '../custom-form/custom-spinner/custom-spinner.component';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  type?: 'text' | 'date' | 'badge' | 'actions' | 'button';
  width?: string;
}

export interface TableAction {
  icon: string;
  label: string;
  color?: 'primary' | 'accent' | 'warn' | 'success' | 'danger';
  action: string;
  tooltip?: string;
}

@Component({
  selector: 'app-custom-table',
  standalone: true,
  imports: [
    CommonModule,
    CustomButtonComponent,
    CustomSpinnerComponent
  ],
  template: `
    <div class="custom-table-container">
      <!-- Loading State -->
      <div *ngIf="loading" class="table-loading">
        <app-custom-spinner [size]="'medium'"></app-custom-spinner>
        <p>Cargando datos...</p>
      </div>

      <!-- Table -->
      <div *ngIf="!loading" class="table-wrapper">
        <table class="custom-table">
          <!-- Header -->
          <thead>
            <tr>
              <th *ngFor="let column of columns" 
                  [style.width]="column.width"
                  [class.sortable]="column.sortable"
                  (click)="onSort(column)">
                <div class="header-content">
                  <span>{{ column.label }}</span>
                  <i *ngIf="column.sortable && sortColumn === column.key" 
                     class="fas"
                     [class.fa-sort-up]="sortDirection === 'asc'"
                     [class.fa-sort-down]="sortDirection === 'desc'"
                     aria-hidden="true">
                  </i>
                  <i *ngIf="column.sortable && sortColumn !== column.key" 
                     class="fas fa-sort" 
                     aria-hidden="true">
                  </i>
                </div>
              </th>
            </tr>
          </thead>

          <!-- Body -->
          <tbody>
            <tr *ngFor="let row of sortedData; trackBy: trackByFn" class="table-row">
              <td *ngFor="let column of columns" [attr.data-label]="column.label">
                <ng-container [ngSwitch]="column.type">
                  
                  <!-- Date Type -->
                  <span *ngSwitchCase="'date'">
                    {{ formatDate(getColumnValue(row, column.key)) }}
                  </span>
                  
                  <!-- Badge Type -->
                  <span *ngSwitchCase="'badge'" 
                        class="status-badge" 
                        [ngClass]="getBadgeClass(getColumnValue(row, column.key))">
                    <i class="fas" [ngClass]="getBadgeIcon(getColumnValue(row, column.key))" aria-hidden="true"></i>
                    {{ getBadgeText(getColumnValue(row, column.key)) }}
                  </span>
                  
                  <!-- Actions Type -->
                  <div *ngSwitchCase="'actions'" class="table-actions">
                    <app-custom-button
                      *ngFor="let action of getRowActions(row)"
                      variant="icon"
                      [color]="action.color || 'primary'"
                      [icon]="action.icon"
                      [tooltip]="action.tooltip || ''"
                      (buttonClick)="onAction(action.action, row)">
                    </app-custom-button>
                  </div>
                  
                  <!-- Default Text Type -->
                  <span *ngSwitchDefault>
                    {{ getColumnValue(row, column.key) }}
                  </span>
                  
                </ng-container>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Empty State -->
        <div *ngIf="sortedData.length === 0" class="empty-state">
          <i class="fas fa-inbox" aria-hidden="true"></i>
          <h4>No hay datos disponibles</h4>
          <p>No se encontraron registros para mostrar</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .custom-table-container {
      background: rgba(55, 65, 81, 0.8);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(249, 250, 251, 0.1);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    }

    .table-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      color: #d1d5db;

      p {
        margin-top: 1rem;
        font-size: 0.9rem;
      }
    }

    .table-wrapper {
      overflow-x: auto;
    }

    .custom-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;

      th, td {
        padding: 1rem 0.75rem;
        text-align: left;
        border-bottom: 1px solid rgba(249, 250, 251, 0.1);
      }

      th {
        background: rgba(75, 85, 99, 0.3);
        color: #f9fafb;
        font-weight: 600;
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;

        &.sortable {
          cursor: pointer;
          user-select: none;
          transition: background-color 0.2s ease;

          &:hover {
            background: rgba(75, 85, 99, 0.5);
          }
        }

        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;

          i {
            opacity: 0.7;
            font-size: 0.75rem;
          }
        }
      }

      td {
        color: #d1d5db;
        vertical-align: middle;
      }

      .table-row {
        transition: background-color 0.2s ease;

        &:hover {
          background: rgba(75, 85, 99, 0.2);
        }
      }
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;

      &.aprobado {
        background: rgba(76, 175, 80, 0.15);
        color: #4CAF50;
      }

      &.pendiente {
        background: rgba(255, 152, 0, 0.15);
        color: #ff9800;
      }

      &.rechazado {
        background: rgba(244, 67, 54, 0.15);
        color: #f44336;
      }

      &.default {
        background: rgba(158, 158, 158, 0.15);
        color: #9e9e9e;
      }
    }

    .table-actions {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      text-align: center;
      color: #9ca3af;

      i {
        font-size: 3rem;
        margin-bottom: 1rem;
        opacity: 0.5;
      }

      h4 {
        margin: 0 0 0.5rem 0;
        font-size: 1.1rem;
        font-weight: 500;
        color: #d1d5db;
      }

      p {
        margin: 0;
        font-size: 0.9rem;
      }
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .custom-table {
        font-size: 0.8rem;

        th, td {
          padding: 0.75rem 0.5rem;
        }
      }

      .table-actions {
        flex-direction: column;
        gap: 0.25rem;
      }
    }

    @media (max-width: 480px) {
      .table-wrapper {
        overflow-x: scroll;
      }

      .custom-table {
        min-width: 600px;
      }
    }
  `]
})
export class CustomTableComponent implements OnInit, OnChanges {
  @Input() data: any[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() loading = false;
  @Input() showActions = true;
  @Input() actions: TableAction[] = [];

  @Output() actionClick = new EventEmitter<{action: string, row: any}>();
  @Output() sortChange = new EventEmitter<{column: string, direction: 'asc' | 'desc'}>();

  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  sortedData: any[] = [];

  ngOnInit(): void {
    this.sortedData = [...this.data];
  }

  ngOnChanges(): void {
    this.sortedData = [...this.data];
    if (this.sortColumn) {
      this.applySorting();
    }
  }

  onSort(column: TableColumn): void {
    if (!column.sortable) return;

    if (this.sortColumn === column.key) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column.key;
      this.sortDirection = 'asc';
    }

    this.applySorting();
    this.sortChange.emit({ column: this.sortColumn, direction: this.sortDirection });
  }

  private applySorting(): void {
    this.sortedData = [...this.data].sort((a, b) => {
      const aValue = this.getColumnValue(a, this.sortColumn);
      const bValue = this.getColumnValue(b, this.sortColumn);

      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;

      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  getColumnValue(row: any, key: string): any {
    return key.split('.').reduce((obj, prop) => obj?.[prop], row) || '';
  }

  formatDate(value: any): string {
    if (!value) return '';
    try {
      const date = new Date(value);
      return date.toLocaleDateString('es-ES');
    } catch {
      return value;
    }
  }

  getBadgeClass(value: string): string {
    const status = value?.toLowerCase() || '';
    switch (status) {
      case 'aprobado': return 'aprobado';
      case 'pendiente': return 'pendiente';
      case 'rechazado': return 'rechazado';
      default: return 'default';
    }
  }

  getBadgeIcon(value: string): string {
    const status = value?.toLowerCase() || '';
    switch (status) {
      case 'aprobado': return 'fa-check-circle';
      case 'pendiente': return 'fa-clock';
      case 'rechazado': return 'fa-times-circle';
      default: return 'fa-question-circle';
    }
  }

  getBadgeText(value: string): string {
    const status = value?.toLowerCase() || '';
    switch (status) {
      case 'aprobado': return 'Aprobado';
      case 'pendiente': return 'Pendiente';
      case 'rechazado': return 'Rechazado';
      default: return value || 'Desconocido';
    }
  }

  getRowActions(row: any): TableAction[] {
    // Default actions for documents
    return [
      { icon: 'eye', label: 'Ver', action: 'view', color: 'primary', tooltip: 'Ver documento' },
      { icon: 'sync-alt', label: 'Reemplazar', action: 'replace', color: 'success', tooltip: 'Reemplazar documento' },
      { icon: 'trash', label: 'Eliminar', action: 'delete', color: 'danger', tooltip: 'Eliminar documento' }
    ];
  }

  onAction(action: string, row: any): void {
    this.actionClick.emit({ action, row });
  }

  trackByFn(index: number, item: any): any {
    return item.id || index;
  }
}
