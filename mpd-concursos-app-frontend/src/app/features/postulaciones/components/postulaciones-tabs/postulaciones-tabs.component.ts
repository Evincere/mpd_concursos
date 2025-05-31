import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';

@Component({
  selector: 'app-postulaciones-tabs',
  templateUrl: './postulaciones-tabs.component.html',
  styleUrls: ['./postulaciones-tabs.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatIconModule,
    MatBadgeModule
  ]
})
export class PostulacionesTabsComponent implements OnInit {
  activeTab = 0;
  alertCount = 0;

  constructor() {}

  ngOnInit() {
    // TODO: Implement alert count fetching
    this.alertCount = 3; // Temporary hardcoded value
  }

  onTabChange(event: any) {
    this.activeTab = event.index;
  }
}