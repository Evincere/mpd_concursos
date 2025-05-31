import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTabsModule } from '@angular/material/tabs';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { AdminProfilesService, UserProfile, ProfileFilter, ProfileStats } from '@core/services/admin/admin-profiles.service';
import { ProfileDetailDialogComponent } from './components/profile-detail-dialog/profile-detail-dialog.component';
import { ProfileEditDialogComponent } from './components/profile-edit-dialog/profile-edit-dialog.component';
import { ProfileStatsComponent } from './components/profile-stats/profile-stats.component';

@Component({
  selector: 'app-profiles-admin',
  templateUrl: './profiles-admin.component.html',
  styleUrls: ['./profiles-admin.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatBadgeModule,
    MatTabsModule,
    ProfileStatsComponent
  ]
})
export class ProfilesAdminComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['avatar', 'name', 'email', 'dni', 'professionalInfo', 'documents', 'status', 'actions'];
  dataSource: UserProfile[] = [];

  isLoading = false;
  totalItems = 0;
  pageSize = 10;
  pageIndex = 0;
  pageSizeOptions: number[] = [5, 10, 25, 50];

  filterForm: FormGroup;

  stats: ProfileStats | null = null;
  activeTab = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private profilesService: AdminProfilesService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      status: [''],
      hasDocuments: [''],
      hasProfessionalInfo: ['']
    });
  }

  ngOnInit(): void {
    this.setupFilterListeners();
    this.loadProfiles();
    this.loadStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setupFilterListeners(): void {
    // Aplicar debounce al campo de búsqueda
    this.filterForm.get('search')?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.pageIndex = 0;
        this.loadProfiles();
      });

    // Escuchar cambios en los demás filtros
    this.filterForm.get('status')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageIndex = 0;
        this.loadProfiles();
      });

    this.filterForm.get('hasDocuments')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageIndex = 0;
        this.loadProfiles();
      });

    this.filterForm.get('hasProfessionalInfo')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageIndex = 0;
        this.loadProfiles();
      });
  }

  loadProfiles(): void {
    this.isLoading = true;

    const filters: ProfileFilter = {
      search: this.filterForm.get('search')?.value,
      status: this.filterForm.get('status')?.value,
      hasDocuments: this.filterForm.get('hasDocuments')?.value === '' ? undefined : this.filterForm.get('hasDocuments')?.value === 'true',
      hasProfessionalInfo: this.filterForm.get('hasProfessionalInfo')?.value === '' ? undefined : this.filterForm.get('hasProfessionalInfo')?.value === 'true',
      page: this.pageIndex,
      size: this.pageSize,
      sort: 'lastName',
      direction: 'asc'
    };

    this.profilesService.getProfiles(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource = response.profiles;
          this.totalItems = response.total;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error cargando perfiles:', error);
          this.snackBar.open('Error al cargar los perfiles de usuario', 'Cerrar', { duration: 3000 });
          this.isLoading = false;
        }
      });
  }

  loadStats(): void {
    this.profilesService.getProfileStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.stats = stats;
        },
        error: (error) => {
          console.error('Error cargando estadísticas:', error);
        }
      });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadProfiles();
  }

  onSort(_sort: Sort): void {
    // Implementar ordenamiento
    this.loadProfiles();
  }

  resetFilters(): void {
    this.filterForm.reset({
      search: '',
      status: '',
      hasDocuments: '',
      hasProfessionalInfo: ''
    });
    this.pageIndex = 0;
    this.loadProfiles();
  }

  openProfileDetailDialog(profile: UserProfile): void {
    this.dialog.open(ProfileDetailDialogComponent, {
      width: '800px',
      data: { profileId: profile.id }
    });
  }

  openProfileEditDialog(profile: UserProfile): void {
    const dialogRef = this.dialog.open(ProfileEditDialogComponent, {
      width: '800px',
      data: { profileId: profile.id }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadProfiles();
        this.loadStats();
      }
    });
  }

  getFullName(profile: UserProfile): string {
    return `${profile.lastName}, ${profile.firstName}`;
  }

  getInitials(profile: UserProfile): string {
    return `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'status-active';
      case 'INACTIVE': return 'status-inactive';
      case 'BLOCKED': return 'status-blocked';
      default: return '';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'Activo';
      case 'INACTIVE': return 'Inactivo';
      case 'BLOCKED': return 'Bloqueado';
      default: return status;
    }
  }

  getDocumentCount(profile: UserProfile): number {
    return profile.documents?.length || 0;
  }

  hasProfessionalInfo(profile: UserProfile): boolean {
    return !!profile.professionalInfo?.title;
  }

  getProfessionalTitle(profile: UserProfile): string {
    return profile.professionalInfo?.title || 'No especificado';
  }

  formatDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  }
}
