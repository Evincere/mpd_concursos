import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
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
    ProfileStatsComponent
  ]
})
export class ProfilesAdminComponent implements OnInit, OnDestroy {
  dataSource: UserProfile[] = [];

  isLoading = false;
  totalItems = 0;
  pageSize = 10;
  pageIndex = 0;
  pageSizeOptions: number[] = [5, 10, 25, 50];

  filterForm: FormGroup;

  stats: ProfileStats | null = null;
  activeTab = 0;



  // Propiedades para ordenamiento
  currentSort: string = 'lastName';
  currentDirection: 'asc' | 'desc' = 'asc';

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
      sort: this.currentSort,
      direction: this.currentDirection
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

  onPageChange(pageIndex: number, pageSize?: number): void {
    this.pageIndex = pageIndex;
    if (pageSize) {
      this.pageSize = pageSize;
    }
    this.loadProfiles();
  }

  onSort(column: string): void {
    if (this.currentSort === column) {
      this.currentDirection = this.currentDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.currentSort = column;
      this.currentDirection = 'asc';
    }
    this.pageIndex = 0;
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



  // Métodos para iconos de estado
  getStatusIconClass(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'fas fa-check-circle';
      case 'INACTIVE': return 'fas fa-pause-circle';
      case 'BLOCKED': return 'fas fa-ban';
      default: return 'fas fa-question-circle';
    }
  }

  // Métodos para paginación personalizada
  getTotalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  getStartIndex(): number {
    return this.pageIndex * this.pageSize + 1;
  }

  getEndIndex(): number {
    const end = (this.pageIndex + 1) * this.pageSize;
    return Math.min(end, this.totalItems);
  }

  getVisiblePages(): (number | string)[] {
    const totalPages = this.getTotalPages();
    const currentPage = this.pageIndex + 1;
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      // Mostrar todas las páginas si son 7 o menos
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Lógica para mostrar páginas con elipsis
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  }

  goToFirstPage(): void {
    if (this.pageIndex > 0) {
      this.onPageChange(0);
    }
  }

  goToPreviousPage(): void {
    if (this.pageIndex > 0) {
      this.onPageChange(this.pageIndex - 1);
    }
  }

  goToNextPage(): void {
    if (this.pageIndex < this.getTotalPages() - 1) {
      this.onPageChange(this.pageIndex + 1);
    }
  }

  goToLastPage(): void {
    const lastPage = this.getTotalPages() - 1;
    if (this.pageIndex < lastPage) {
      this.onPageChange(lastPage);
    }
  }

  goToPage(pageIndex: number): void {
    if (pageIndex >= 0 && pageIndex < this.getTotalPages()) {
      this.onPageChange(pageIndex);
    }
  }

  goToPageNumber(page: number | string): void {
    if (typeof page === 'number' && page !== this.pageIndex + 1) {
      this.goToPage(page - 1);
    }
  }

  onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newPageSize = parseInt(target.value, 10);
    this.pageIndex = 0; // Reset to first page
    this.onPageChange(0, newPageSize);
  }

  // Método para trackBy en ngFor
  trackByProfileId(index: number, profile: UserProfile): string {
    return profile.id;
  }

  /**
   * Establece el tab activo
   */
  setActiveTab(tabIndex: number): void {
    this.activeTab = tabIndex;
  }
}
