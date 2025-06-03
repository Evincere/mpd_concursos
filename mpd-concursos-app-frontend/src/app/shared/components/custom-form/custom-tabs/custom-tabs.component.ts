import { Component, ContentChildren, QueryList, AfterContentInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomTabComponent } from './custom-tab.component';

@Component({
  selector: 'app-custom-tabs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="custom-tabs">
      <div class="tabs-header" role="tablist" aria-orientation="horizontal">
        <div
          *ngFor="let tab of tabs; let i = index"
          class="tab-item"
          [class.active]="selectedIndex === i"
          [class.disabled]="tab.disabled"
          (click)="selectTab(i)"
          (keydown.enter)="selectTab(i)"
          (keydown.space)="selectTab(i); $event.preventDefault()"
          [attr.tabindex]="tab.disabled ? -1 : 0"
          role="tab"
          [attr.aria-selected]="selectedIndex === i"
          [attr.aria-disabled]="tab.disabled"
        >
          <i *ngIf="tab.icon" class="fas fa-{{ tab.icon }} tab-icon"></i>
          <span class="tab-label">{{ tab.label }}</span>
          <div *ngIf="tab.badge" class="tab-badge">{{ tab.badge }}</div>
        </div>
      </div>

      <div class="tabs-content">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .custom-tabs {
      display: flex;
      flex-direction: column;
      width: 100%;
    }

    .tabs-header {
      display: flex;
      border-bottom: 1px solid var(--color-border, #ddd);
      margin-bottom: 1.5rem;
      width: 100%;
      overflow: visible;
    }

    .tab-item {
      flex: 1;
      padding: 1rem 1.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--color-text-secondary, #666);
      cursor: pointer;
      transition: all 0.2s ease-in-out;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      text-align: center;
      min-width: 0;
    }

    .tab-item:hover:not(.disabled) {
      color: var(--color-primary, #3f51b5);
      background-color: rgba(63, 81, 181, 0.05);
    }

    .tab-item.active {
      color: var(--color-primary, #3f51b5);
      border-bottom: 2px solid var(--color-primary, #3f51b5);
      margin-bottom: -1px;
    }

    .tab-item.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .tab-icon {
      margin-right: 0.5rem;
      flex-shrink: 0;
    }

    .tab-label {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .tab-badge {
      margin-left: 0.5rem;
      background-color: var(--color-primary, #3f51b5);
      color: white;
      border-radius: 10px;
      padding: 0.125rem 0.5rem;
      font-size: 0.75rem;
      font-weight: 500;
      flex-shrink: 0;
    }

    /* Responsive behavior */
    @media (max-width: 768px) {
      .tab-item {
        padding: 0.75rem 0.5rem;
        font-size: 0.8rem;
        flex-direction: column;
        gap: 0.25rem;
      }

      .tab-icon {
        margin-right: 0;
        margin-bottom: 0.25rem;
      }

      .tab-label {
        font-size: 0.75rem;
      }
    }

    @media (max-width: 480px) {
      .tab-item {
        padding: 0.5rem 0.25rem;
      }

      .tab-label {
        display: none;
      }

      .tab-icon {
        margin-bottom: 0;
        font-size: 1.1rem;
      }
    }

    .tabs-content {
      flex: 1;
    }

    /* Estilos para tema oscuro */
    @media (prefers-color-scheme: dark) {
      .tabs-header {
        border-bottom-color: var(--color-border-dark, #555);
      }

      .tabs-header::-webkit-scrollbar-track {
        background: var(--color-background-dark, #222);
      }

      .tabs-header::-webkit-scrollbar-thumb {
        background-color: var(--color-border-dark, #555);
      }

      .tab-item {
        color: var(--color-text-secondary-dark, #aaa);
      }

      .tab-item:hover:not(.disabled) {
        color: var(--color-primary-dark, #7986cb);
        background-color: rgba(121, 134, 203, 0.05);
      }

      .tab-item.active {
        color: var(--color-primary-dark, #7986cb);
        border-bottom-color: var(--color-primary-dark, #7986cb);
      }

      .tab-badge {
        background-color: var(--color-primary-dark, #7986cb);
      }
    }
  `]
})
export class CustomTabsComponent implements AfterContentInit {
  @ContentChildren(CustomTabComponent) tabComponents!: QueryList<CustomTabComponent>;

  @Input() selectedIndex = 0;
  @Input() activeTab = 0;
  @Output() selectedIndexChange = new EventEmitter<number>();
  @Output() tabChange = new EventEmitter<number>();

  tabs: { label: string; icon?: string; badge?: string; disabled?: boolean }[] = [];

  ngAfterContentInit(): void {
    this.tabs = this.tabComponents.map(tab => ({
      label: tab.label,
      icon: tab.icon,
      badge: tab.badge,
      disabled: tab.disabled
    }));

    // Sincronizar activeTab con selectedIndex si es diferente
    if (this.activeTab !== this.selectedIndex) {
      this.selectedIndex = this.activeTab;
    }

    // Mostrar la pestaña seleccionada inicialmente
    this.selectTab(this.selectedIndex);
  }

  selectTab(index: number): void {
    if (this.tabs[index]?.disabled) return;

    this.selectedIndex = index;
    this.activeTab = index;
    this.selectedIndexChange.emit(index);
    this.tabChange.emit(index);

    // Actualizar la visibilidad de las pestañas
    this.tabComponents.forEach((tab, i) => {
      tab.active = i === index;
    });
  }
}
