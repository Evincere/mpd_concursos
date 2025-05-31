import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { UsuariosAdminComponent } from './usuarios-admin.component';
import { UserService } from './application/services/user.service';
import { CustomDialogService } from '@shared/components/custom-form/custom-dialog/custom-dialog.service';
import { NotificationService } from '@shared/services/notification.service';
import { MockUserRepository } from './testing/test-utils';
import { USER_REPOSITORY_TOKEN } from './infrastructure/providers/user-service.provider';
import { UserStatus } from './domain/models/user.model';

describe('UsuariosAdminComponent', () => {
  let component: UsuariosAdminComponent;
  let fixture: ComponentFixture<UsuariosAdminComponent>;
  let userService: jasmine.SpyObj<UserService>;
  let dialogService: jasmine.SpyObj<CustomDialogService>;
  let notificationService: jasmine.SpyObj<NotificationService>;
  let mockUserRepository: MockUserRepository;

  beforeEach(async () => {
    mockUserRepository = new MockUserRepository();
    
    userService = jasmine.createSpyObj('UserService', [
      'getUsers',
      'getUserById',
      'createUser',
      'updateUser',
      'changeUserStatus',
      'deleteUser'
    ]);
    
    dialogService = jasmine.createSpyObj('CustomDialogService', [
      'open',
      'confirm'
    ]);
    
    notificationService = jasmine.createSpyObj('NotificationService', [
      'showSuccess',
      'showError'
    ]);
    
    await TestBed.configureTestingModule({
      imports: [UsuariosAdminComponent],
      providers: [
        { provide: UserService, useValue: userService },
        { provide: CustomDialogService, useValue: dialogService },
        { provide: NotificationService, useValue: notificationService },
        { provide: USER_REPOSITORY_TOKEN, useValue: mockUserRepository },
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({ status: UserStatus.ACTIVE })
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UsuariosAdminComponent);
    component = fixture.componentInstance;
    
    // Configurar los espías
    userService.getUsers.and.returnValue(of({
      users: mockUserRepository.users,
      total: mockUserRepository.users.length
    }));
    
    dialogService.confirm.and.returnValue({
      afterClosed: () => of(true)
    } as any);
    
    dialogService.open.and.returnValue({
      afterClosed: () => of(true)
    } as any);
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load users on init', () => {
    expect(userService.getUsers).toHaveBeenCalled();
    expect(component.usuarios.length).toBeGreaterThan(0);
  });

  it('should open user detail when a user is selected', () => {
    const user = mockUserRepository.users[0];
    component.openUserDetail(user);
    expect(component.selectedUserId).toBe(user.id);
    expect(component.showUserDetail).toBeTrue();
  });

  it('should close user detail', () => {
    component.selectedUserId = '1';
    component.showUserDetail = true;
    component.closeUserDetail();
    expect(component.selectedUserId).toBeNull();
    expect(component.showUserDetail).toBeFalse();
  });

  it('should open create user dialog', () => {
    component.openCreateUserDialog();
    expect(dialogService.open).toHaveBeenCalled();
  });

  it('should change user status', () => {
    const user = mockUserRepository.users[0];
    userService.changeUserStatus.and.returnValue(of(user));
    component.changeUserStatus(user, UserStatus.BLOCKED);
    expect(userService.changeUserStatus).toHaveBeenCalledWith({
      userId: user.id,
      status: UserStatus.BLOCKED
    });
    expect(notificationService.showSuccess).toHaveBeenCalled();
  });

  it('should delete user', () => {
    const user = mockUserRepository.users[0];
    userService.deleteUser.and.returnValue(of({ success: true }));
    component.deleteUser(user);
    expect(dialogService.confirm).toHaveBeenCalled();
    expect(userService.deleteUser).toHaveBeenCalledWith(user.id);
    expect(notificationService.showSuccess).toHaveBeenCalled();
  });

  it('should apply filters', () => {
    const filters = { search: 'test', status: UserStatus.ACTIVE };
    component.onFilterChange(filters);
    expect(component.currentFilters).toEqual(jasmine.objectContaining(filters));
    expect(userService.getUsers).toHaveBeenCalled();
  });

  it('should handle page change', () => {
    const event = { pageIndex: 1, pageSize: 10 };
    component.onPageChange(event);
    expect(component.pageIndex).toBe(1);
    expect(component.pageSize).toBe(10);
    expect(userService.getUsers).toHaveBeenCalled();
  });

  it('should handle sort change', () => {
    const event = { active: 'username', direction: 'asc' };
    component.onSortChange(event);
    expect(component.currentFilters.sort).toBe('username');
    expect(component.currentFilters.direction).toBe('asc');
    expect(userService.getUsers).toHaveBeenCalled();
  });
});
