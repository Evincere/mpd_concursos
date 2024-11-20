import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { SidebarService } from '../../../../core/services/sidebar/sidebar.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  @Output() collapseChange = new EventEmitter<boolean>();
  isCollapsed = false;

  constructor(private authService: AuthService, private sidebarService: SidebarService) {
    this.sidebarService.isCollapsed$.subscribe(
      collapsed => {
        this.isCollapsed = collapsed;
        this.collapseChange.emit(collapsed); // Emitir el evento cuando cambia el estado
      }
    );
  }

  logout() {
    this.authService.logout();
    window.location.href = '/login';
  }

  toggleSidebar() {
    this.sidebarService.toggleSidebar();
  }
}
