import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { QuickAccessWidget } from '../../../../../../core/services/admin/admin-dashboard.service';

@Component({
  selector: 'app-quick-access-widget',
  templateUrl: './quick-access-widget.component.html',
  styleUrls: ['./quick-access-widget.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ]
})
export class QuickAccessWidgetComponent {
  @Input() widget!: QuickAccessWidget;

  constructor(private router: Router) {}

  /**
   * Handles card click navigation
   */
  onCardClick(): void {
    if (this.widget?.route) {
      this.router.navigate([this.widget.route]);
    }
  }

  /**
   * Gets the icon background with opacity based on widget color
   */
  getIconBackground(): string {
    if (!this.widget?.color) {
      return 'rgba(59, 130, 246, 0.1)'; // Default blue
    }

    // Convert hex to rgba with 10% opacity
    const hex = this.widget.color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    return `rgba(${r}, ${g}, ${b}, 0.1)`;
  }
}
