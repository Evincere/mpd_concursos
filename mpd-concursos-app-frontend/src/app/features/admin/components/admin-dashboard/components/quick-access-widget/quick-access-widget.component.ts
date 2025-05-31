import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { QuickAccessWidget } from '../../../../../../core/services/admin/admin-dashboard.service';

@Component({
  selector: 'app-quick-access-widget',
  templateUrl: './quick-access-widget.component.html',
  styleUrls: ['./quick-access-widget.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    RouterModule
  ]
})
export class QuickAccessWidgetComponent {
  @Input() widget!: QuickAccessWidget;
}
