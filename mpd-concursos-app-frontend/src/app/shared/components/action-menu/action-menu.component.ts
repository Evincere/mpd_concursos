import { Component, Input, Output, EventEmitter, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ActionMenuItem {
  id: string;
  label: string;
  icon: string;
  variant: 'primary' | 'secondary' | 'danger' | 'success';
  disabled?: boolean;
  hidden?: boolean;
  tooltip?: string;
  loading?: boolean;
}

@Component({
  selector: 'app-action-menu',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="action-menu-container" [class.open]="isOpen">
      <!-- Botón principal (siempre visible) -->
      <button 
        *ngIf="primaryAction"
        class="action-btn primary-action"
        [class]="'variant-' + primaryAction.variant"
        [disabled]="primaryAction.disabled || primaryAction.loading"
        [title]="primaryAction.tooltip || primaryAction.label"
        [attr.aria-label]="primaryAction.label"
        (click)="onActionClick(primaryAction)"
        (keydown.enter)="onActionClick(primaryAction)"
        (keydown.space)="$event.preventDefault(); onActionClick(primaryAction)">
        
        <i *ngIf="!primaryAction.loading" 
           [class]="primaryAction.icon" 
           aria-hidden="true"></i>
        <i *ngIf="primaryAction.loading" 
           class="fas fa-spinner fa-spin" 
           aria-hidden="true"></i>
        
        <span *ngIf="showLabels && !compact">{{ primaryAction.label }}</span>
      </button>

      <!-- Botón de menú (si hay acciones secundarias) -->
      <button 
        *ngIf="hasSecondaryActions"
        class="action-btn menu-trigger"
        [class.active]="isOpen"
        [attr.aria-label]="'Más acciones'"
        [attr.aria-expanded]="isOpen"
        [attr.aria-haspopup]="'menu'"
        (click)="toggleMenu()"
        (keydown.enter)="toggleMenu()"
        (keydown.space)="$event.preventDefault(); toggleMenu()">
        
        <i class="fas fa-ellipsis-v" aria-hidden="true"></i>
      </button>

      <!-- Menú desplegable glassmorphism -->
      <div 
        *ngIf="isOpen && hasSecondaryActions"
        class="action-menu glassmorphism"
        role="menu"
        [attr.aria-label]="'Menú de acciones'">
        
        <button 
          *ngFor="let action of visibleSecondaryActions; trackBy: trackByActionId"
          class="menu-item"
          [class]="'variant-' + action.variant"
          [disabled]="action.disabled || action.loading"
          [title]="action.tooltip || action.label"
          role="menuitem"
          [attr.aria-label]="action.label"
          (click)="onActionClick(action)"
          (keydown.enter)="onActionClick(action)"
          (keydown.space)="$event.preventDefault(); onActionClick(action)">
          
          <i *ngIf="!action.loading" 
             [class]="action.icon" 
             aria-hidden="true"></i>
          <i *ngIf="action.loading" 
             class="fas fa-spinner fa-spin" 
             aria-hidden="true"></i>
          
          <span>{{ action.label }}</span>
        </button>
      </div>

      <!-- Backdrop para cerrar el menú -->
      <div 
        *ngIf="isOpen"
        class="menu-backdrop"
        (click)="closeMenu()"
        aria-hidden="true">
      </div>
    </div>
  `,
  styleUrls: ['./action-menu.component.scss']
})
export class ActionMenuComponent {
  @Input() actions: ActionMenuItem[] = [];
  @Input() primaryActionId?: string;
  @Input() showLabels: boolean = false;
  @Input() compact: boolean = false;
  @Input() position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' = 'bottom-right';

  @Output() actionClick = new EventEmitter<ActionMenuItem>();

  isOpen = false;

  constructor(private elementRef: ElementRef) {}

  get primaryAction(): ActionMenuItem | undefined {
    if (this.primaryActionId) {
      return this.actions.find(action => action.id === this.primaryActionId && !action.hidden);
    }
    // Si no se especifica, usar la primera acción no oculta
    return this.actions.find(action => !action.hidden);
  }

  get secondaryActions(): ActionMenuItem[] {
    const primaryId = this.primaryAction?.id;
    return this.actions.filter(action => action.id !== primaryId && !action.hidden);
  }

  get visibleSecondaryActions(): ActionMenuItem[] {
    return this.secondaryActions.filter(action => !action.hidden);
  }

  get hasSecondaryActions(): boolean {
    return this.visibleSecondaryActions.length > 0;
  }

  toggleMenu(): void {
    this.isOpen = !this.isOpen;
  }

  closeMenu(): void {
    this.isOpen = false;
  }

  onActionClick(action: ActionMenuItem): void {
    if (action.disabled || action.loading) {
      return;
    }

    this.actionClick.emit(action);
    this.closeMenu();
  }

  trackByActionId(index: number, action: ActionMenuItem): string {
    return action.id;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeMenu();
    }
  }

  @HostListener('keydown.escape')
  onEscapeKey(): void {
    this.closeMenu();
  }
}
