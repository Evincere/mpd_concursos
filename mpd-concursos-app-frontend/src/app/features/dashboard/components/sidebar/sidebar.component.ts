import { Component, OnInit, OnDestroy, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { SidebarService } from '@core/services/sidebar/sidebar.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit, OnDestroy {
  isCollapsed = false;
  isAdmin = false;
  private destroy$ = new Subject<void>();
  @Output() sidebarCollapsed = new EventEmitter<boolean>();

  constructor(private authService: AuthService, private sidebarService: SidebarService) {
    // Verificar si el usuario es administrador
    this.isAdmin = this.authService.hasRole('ROLE_ADMIN');
  }

  ngOnInit(): void {
    this.sidebarService.isCollapsed$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.isCollapsed = state;
        this.sidebarCollapsed.emit(state);
      });
  }

  logout(event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    this.authService.logout();
    window.location.href = '/login';
  }

  toggleSidebar(): void {
    this.sidebarService.toggleSidebar();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
