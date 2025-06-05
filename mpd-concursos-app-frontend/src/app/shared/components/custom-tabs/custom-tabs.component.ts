import { Component, Input, Output, EventEmitter, ContentChildren, QueryList, AfterContentInit, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TabItem {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  template?: TemplateRef<any>;
}

@Component({
  selector: 'app-custom-tabs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="custom-tabs-container">
      <!-- Tab Headers -->
      <div class="tabs-header">
        <div class="tabs-nav">
          <button
            *ngFor="let tab of tabs; let i = index"
            class="tab-button"
            [class.active]="activeTabIndex === i"
            [class.disabled]="tab.disabled"
            [disabled]="tab.disabled"
            (click)="selectTab(i)"
            (keydown.enter)="selectTab(i)"
            (keydown.space)="selectTab(i); $event.preventDefault()"
            [attr.aria-selected]="activeTabIndex === i"
            [attr.aria-controls]="'tab-panel-' + tab.id"
            [attr.id]="'tab-' + tab.id"
            role="tab"
            tabindex="0">
            <i *ngIf="tab.icon" [class]="'fas fa-' + tab.icon" aria-hidden="true"></i>
            <span>{{ tab.label }}</span>
          </button>
        </div>
        <div class="tab-indicator" [style.transform]="'translateX(' + (activeTabIndex * 100) + '%)'"></div>
      </div>

      <!-- Tab Content -->
      <div class="tabs-content">
        <div
          *ngFor="let tab of tabs; let i = index"
          class="tab-panel"
          [class.active]="activeTabIndex === i"
          [attr.id]="'tab-panel-' + tab.id"
          [attr.aria-labelledby]="'tab-' + tab.id"
          role="tabpanel"
          [attr.tabindex]="activeTabIndex === i ? 0 : -1">
          <ng-container *ngTemplateOutlet="tab.template || null"></ng-container>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./custom-tabs.component.scss']
})
export class CustomTabsComponent implements AfterContentInit {
  @Input() tabs: TabItem[] = [];
  @Input() activeTabIndex = 0;
  @Output() tabChange = new EventEmitter<number>();

  ngAfterContentInit(): void {
    // Ensure we have a valid active tab
    if (this.activeTabIndex >= this.tabs.length) {
      this.activeTabIndex = 0;
    }
  }

  selectTab(index: number): void {
    if (index >= 0 && index < this.tabs.length && !this.tabs[index].disabled) {
      this.activeTabIndex = index;
      this.tabChange.emit(index);
    }
  }

  getActiveTab(): TabItem | null {
    return this.tabs[this.activeTabIndex] || null;
  }
}
