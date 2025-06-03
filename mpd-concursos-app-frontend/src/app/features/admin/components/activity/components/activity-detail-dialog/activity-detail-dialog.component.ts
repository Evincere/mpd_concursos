import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AdminActivityService, ActivityLog } from '@core/services/admin/admin-activity.service';

@Component({
  selector: 'app-activity-detail-dialog',
  templateUrl: './activity-detail-dialog.component.html',
  styleUrls: ['./activity-detail-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule
  ]
})
export class ActivityDetailDialogComponent implements OnInit, OnDestroy {
  log: ActivityLog | null = null;
  isLoading = true;
  
  private destroy$ = new Subject<void>();

  constructor(
    private activityService: AdminActivityService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<ActivityDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { logId: string }
  ) { }

  ngOnInit(): void {
    this.loadActivityLog();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadActivityLog(): void {
    this.isLoading = true;
    
    this.activityService.getActivityLogById(this.data.logId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (log) => {
          this.log = log;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error cargando registro de actividad:', error);
          this.snackBar.open('Error al cargar los detalles del registro de actividad', 'Cerrar', { duration: 3000 });
          this.isLoading = false;
        }
      });
  }
  
  getActionIcon(action: string): string {
    switch (action) {
      case 'LOGIN': return 'login';
      case 'LOGOUT': return 'logout';
      case 'CREATE': return 'add_circle';
      case 'UPDATE': return 'edit';
      case 'DELETE': return 'delete';
      case 'READ': return 'visibility';
      case 'DOWNLOAD': return 'download';
      case 'UPLOAD': return 'upload';
      default: return 'info';
    }
  }
  
  getActionClass(action: string): string {
    switch (action) {
      case 'LOGIN':
      case 'CREATE':
        return 'action-success';
      case 'DELETE':
        return 'action-error';
      case 'UPDATE':
        return 'action-warning';
      case 'READ':
      case 'DOWNLOAD':
        return 'action-info';
      case 'LOGOUT':
        return 'action-secondary';
      default:
        return 'action-default';
    }
  }
  
  getModuleIcon(module: string): string {
    switch (module) {
      case 'AUTH': return 'security';
      case 'USERS': return 'people';
      case 'ROLES': return 'admin_panel_settings';
      case 'PROFILE': return 'person';
      case 'CONTESTS': return 'gavel';
      case 'INSCRIPTIONS': return 'assignment';
      case 'DOCUMENTS': return 'description';
      case 'SYSTEM': return 'settings';
      default: return 'folder';
    }
  }
  
  formatDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleString();
  }
  
  hasMetadata(): boolean {
    return !!this.log?.metadata && Object.keys(this.log.metadata).length > 0;
  }
  
  getMetadataKeys(): string[] {
    if (!this.log?.metadata) return [];
    return Object.keys(this.log.metadata);
  }
  
  formatMetadataValue(value: unknown): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return value.toString();
  }
  
  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text)
      .then(() => {
        this.snackBar.open('Copiado al portapapeles', 'Cerrar', { duration: 2000 });
      })
      .catch(() => {
        this.snackBar.open('Error al copiar al portapapeles', 'Cerrar', { duration: 2000 });
      });
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
