import { Component, OnInit, OnDestroy, ViewChild, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableModule } from  '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { SelectionModel } from '@angular/cdk/collections';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import {
  AdminUsersService,
  AdminUser,
  UserFilter
} from '../../../../../core/services/admin/admin-users.service';

interface DialogData {
  selectedUsers: AdminUser[];
  selectedRoles: string[];
}

@Component({
  selector: 'app-destinatarios-dialog',
  templateUrl: './destinatarios-dialog.component.html',
  styleUrls: ['./destinatarios-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatChipsModule,
    MatIconModule
  ]
})
export class DestinatariosDialogComponent implements OnInit, OnDestroy {
  // Users table
  displayedColumns: string[] = ['select', 'username', 'nombre', 'email', 'roles'];
  dataSource: AdminUser[] = [];
  selection = new SelectionModel<AdminUser>(true, []);

  // Roles
  availableRoles: string[] = ['ROLE_ADMIN', 'ROLE_USER'];
  selectedRoles: string[] = [];

  // Filters
  filterForm: FormGroup;

  // Pagination
  totalUsers = 0;
  pageSize = 10;
  pageIndex = 0;

  // UI state
  isLoading = false;
  activeTab = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Cleanup
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private adminUsersService: AdminUsersService,
    public dialogRef: MatDialogRef<DestinatariosDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      role: [''],
      status: ['ACTIVE']
    });

    // Initialize selection with previously selected users
    if (data.selectedUsers && data.selectedUsers.length > 0) {
      this.selection = new SelectionModel<AdminUser>(true, [...data.selectedUsers]);
    }

    // Initialize selected roles
    if (data.selectedRoles && data.selectedRoles.length > 0) {
      this.selectedRoles = [...data.selectedRoles];
    }
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUsers(): void {
    this.isLoading = true;

    const filters: UserFilter = {
      search: this.filterForm.value.search,
      role: this.filterForm.value.role,
      status: this.filterForm.value.status,
      page: this.pageIndex,
      size: this.pageSize,
      sort: 'username',
      direction: 'asc'
    };

    this.adminUsersService.getUsers(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.dataSource = result.users;
          this.totalUsers = result.total;
          this.isLoading = false;

          // Restore selection for users in the current page
          this.restoreSelection();
        },
        error: (error) => {
          console.error('Error loading users:', error);
          this.isLoading = false;
        }
      });
  }

  applyFilter(): void {
    this.pageIndex = 0;
    this.loadUsers();
  }

  resetFilter(): void {
    this.filterForm.reset({
      search: '',
      role: '',
      status: 'ACTIVE'
    });
    this.applyFilter();
  }

  onPageChange(event: unknown): void {
    const eventObj = event as { pageIndex: number; pageSize: number };
    this.pageIndex = eventObj.pageIndex;
    this.pageSize = eventObj.pageSize;
    this.loadUsers();
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  toggleAllRows(): void {
    if (this.isAllSelected()) {
      // Remove only the current page items from selection
      this.dataSource.forEach(row => this.selection.deselect(row));
    } else {
      this.dataSource.forEach(row => this.selection.select(row));
    }
  }

  /** Restore selection for users in the current page */
  private restoreSelection(): void {
    // For each user in the current page, check if it was previously selected
    this.dataSource.forEach(user => {
      const isSelected = this.selection.selected.some(selectedUser => selectedUser.id === user.id);
      if (isSelected) {
        // Replace the old user object with the new one to ensure we have the latest data
        this.selection.deselect(this.selection.selected.find(u => u.id === user.id)!);
        this.selection.select(user);
      }
    });
  }

  toggleRole(role: string): void {
    const index = this.selectedRoles.indexOf(role);
    if (index === -1) {
      this.selectedRoles.push(role);
    } else {
      this.selectedRoles.splice(index, 1);
    }
  }

  isRoleSelected(role: string): boolean {
    return this.selectedRoles.includes(role);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    this.dialogRef.close({
      selectedUsers: this.selection.selected,
      selectedRoles: this.selectedRoles
    });
  }
}
