import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { SupportTicketService } from '../../../../../core/services/support/support-ticket.service';
import { CustomNotificationService } from '../../../../../shared/components/custom-notification/custom-notification.service';

import {
  SupportTicket,
  TicketStatus,
  TicketPriority,
  TicketCategory,
  TicketFilters
} from '../../../../../core/models/support-ticket.model';

/**
 * Componente de lista de tickets
 */
@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="ticket-list">
      <div class="list-header">
        <h1>
          <i class="fas fa-ticket-alt"></i>
          Lista de Tickets
        </h1>
        <div class="header-actions">
          <button class="btn primary" routerLink="/admin/soporte/tickets/new">
            <i class="fas fa-plus"></i>
            Nuevo Ticket
          </button>
        </div>
      </div>

      <!-- Filtros -->
      <div class="filters-section">
        <form [formGroup]="filtersForm" class="filters-form">
          <div class="filters-grid">
            <div class="filter-field">
              <label>Búsqueda</label>
              <input type="text" formControlName="searchText" placeholder="Buscar tickets...">
            </div>
            <div class="filter-field">
              <label>Estado</label>
              <select formControlName="status" multiple>
                <option *ngFor="let status of statusOptions" [value]="status.value">
                  {{ status.label }}
                </option>
              </select>
            </div>
            <div class="filter-field">
              <label>Prioridad</label>
              <select formControlName="priority" multiple>
                <option *ngFor="let priority of priorityOptions" [value]="priority.value">
                  {{ priority.label }}
                </option>
              </select>
            </div>
          </div>
        </form>
      </div>

      <!-- Lista de tickets -->
      <div class="tickets-container" *ngIf="tickets.length > 0; else noTickets">
        <div class="ticket-card" *ngFor="let ticket of tickets" 
             [routerLink]="['/admin/soporte/tickets', ticket.id]">
          <div class="ticket-header">
            <span class="ticket-number">#{{ ticket.ticketNumber }}</span>
            <span class="ticket-priority" [class]="'priority-' + getPriorityColor(ticket.priority)">
              {{ getPriorityLabel(ticket.priority) }}
            </span>
          </div>
          <h3 class="ticket-title">{{ ticket.title }}</h3>
          <p class="ticket-description">{{ ticket.description | slice:0:150 }}...</p>
          <div class="ticket-meta">
            <span class="ticket-status" [class]="'status-' + getStatusColor(ticket.status)">
              {{ getStatusLabel(ticket.status) }}
            </span>
            <span class="ticket-date">{{ ticket.createdAt | date:'short' }}</span>
          </div>
        </div>
      </div>

      <ng-template #noTickets>
        <div class="empty-state">
          <i class="fas fa-inbox"></i>
          <h3>No hay tickets</h3>
          <p>No se encontraron tickets con los filtros aplicados</p>
        </div>
      </ng-template>
    </div>
  `,
  styleUrls: ['./ticket-list.component.scss']
})
export class TicketListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  tickets: SupportTicket[] = [];
  loading = false;
  filtersForm!: FormGroup;

  // Configuración de opciones
  statusOptions = [
    { value: TicketStatus.OPEN, label: 'Abierto', color: 'blue' },
    { value: TicketStatus.IN_PROGRESS, label: 'En Progreso', color: 'orange' },
    { value: TicketStatus.PENDING_USER, label: 'Pendiente Usuario', color: 'yellow' },
    { value: TicketStatus.PENDING_INTERNAL, label: 'Pendiente Interno', color: 'purple' },
    { value: TicketStatus.RESOLVED, label: 'Resuelto', color: 'green' },
    { value: TicketStatus.CLOSED, label: 'Cerrado', color: 'gray' },
    { value: TicketStatus.CANCELLED, label: 'Cancelado', color: 'red' }
  ];

  priorityOptions = [
    { value: TicketPriority.LOW, label: 'Baja', color: 'green' },
    { value: TicketPriority.NORMAL, label: 'Normal', color: 'blue' },
    { value: TicketPriority.HIGH, label: 'Alta', color: 'orange' },
    { value: TicketPriority.URGENT, label: 'Urgente', color: 'red' },
    { value: TicketPriority.CRITICAL, label: 'Crítica', color: 'red' }
  ];

  constructor(
    private fb: FormBuilder,
    private supportTicketService: SupportTicketService,
    private notificationService: CustomNotificationService
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadTickets();
    this.setupFormSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForms(): void {
    this.filtersForm = this.fb.group({
      searchText: [''],
      status: [[]],
      priority: [[]]
    });
  }

  private setupFormSubscriptions(): void {
    this.filtersForm.valueChanges.pipe(
      takeUntil(this.destroy$),
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.applyFilters();
    });
  }

  private loadTickets(): void {
    this.loading = true;
    this.supportTicketService.getTickets().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.tickets = response.tickets;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando tickets:', error);
        this.notificationService.showError('Error al cargar los tickets');
        this.loading = false;
      }
    });
  }

  private applyFilters(): void {
    const formValue = this.filtersForm.value;
    const filters: TicketFilters = {};

    if (formValue.status?.length) {
      filters.status = formValue.status;
    }
    if (formValue.priority?.length) {
      filters.priority = formValue.priority;
    }
    if (formValue.searchText) {
      filters.searchText = formValue.searchText;
    }

    this.supportTicketService.getTickets(filters).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.tickets = response.tickets;
      },
      error: (error) => {
        console.error('Error aplicando filtros:', error);
        this.notificationService.showError('Error al filtrar tickets');
      }
    });
  }

  getStatusColor(status: TicketStatus): string {
    const option = this.statusOptions.find(opt => opt.value === status);
    return option?.color || 'gray';
  }

  getPriorityColor(priority: TicketPriority): string {
    const option = this.priorityOptions.find(opt => opt.value === priority);
    return option?.color || 'gray';
  }

  getStatusLabel(status: TicketStatus): string {
    const option = this.statusOptions.find(opt => opt.value === status);
    return option?.label || status;
  }

  getPriorityLabel(priority: TicketPriority): string {
    const option = this.priorityOptions.find(opt => opt.value === priority);
    return option?.label || priority;
  }
}
