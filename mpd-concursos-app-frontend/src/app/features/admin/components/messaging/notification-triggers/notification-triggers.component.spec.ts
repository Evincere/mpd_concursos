import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';

import { NotificationTriggersComponent } from './notification-triggers.component';
import { NotificationTriggersService } from '@core/services/messaging/notification-triggers.service';
import { MessageTemplatesService } from '@core/services/messaging/message-templates.service';
import { CustomNotificationService } from '@shared/components/custom-notification/custom-notification.service';
import { CustomDialogService } from '@shared/components/custom-dialog/custom-dialog.service';

describe('NotificationTriggersComponent', () => {
  let component: NotificationTriggersComponent;
  let fixture: ComponentFixture<NotificationTriggersComponent>;
  let mockNotificationTriggersService: jasmine.SpyObj<NotificationTriggersService>;
  let mockMessageTemplatesService: jasmine.SpyObj<MessageTemplatesService>;
  let mockNotificationService: jasmine.SpyObj<CustomNotificationService>;
  let mockDialogService: jasmine.SpyObj<CustomDialogService>;

  const mockTrigger = {
    id: '1',
    name: 'Test Trigger',
    description: 'Test Description',
    type: 'event' as const,
    priority: 'normal' as const,
    isActive: true,
    event: 'user_registered' as const,
    conditions: [],
    actions: [],
    settings: {},
    filters: {},
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(async () => {
    const notificationTriggersServiceSpy = jasmine.createSpyObj('NotificationTriggersService', [
      'getTriggers', 'createTrigger', 'updateTrigger', 'deleteTrigger', 
      'toggleTrigger', 'executeTrigger', 'getExecutions', 'getStats',
      'clearFilters', 'stopPolling'
    ]);
    const messageTemplatesServiceSpy = jasmine.createSpyObj('MessageTemplatesService', ['getTemplates']);
    const notificationServiceSpy = jasmine.createSpyObj('CustomNotificationService', [
      'showSuccess', 'showError', 'showWarning'
    ]);
    const dialogServiceSpy = jasmine.createSpyObj('CustomDialogService', ['showConfirmDialog']);

    await TestBed.configureTestingModule({
      declarations: [NotificationTriggersComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: NotificationTriggersService, useValue: notificationTriggersServiceSpy },
        { provide: MessageTemplatesService, useValue: messageTemplatesServiceSpy },
        { provide: CustomNotificationService, useValue: notificationServiceSpy },
        { provide: CustomDialogService, useValue: dialogServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationTriggersComponent);
    component = fixture.componentInstance;
    
    mockNotificationTriggersService = TestBed.inject(NotificationTriggersService) as jasmine.SpyObj<NotificationTriggersService>;
    mockMessageTemplatesService = TestBed.inject(MessageTemplatesService) as jasmine.SpyObj<MessageTemplatesService>;
    mockNotificationService = TestBed.inject(CustomNotificationService) as jasmine.SpyObj<CustomNotificationService>;
    mockDialogService = TestBed.inject(CustomDialogService) as jasmine.SpyObj<CustomDialogService>;

    // Setup default return values
    mockNotificationTriggersService.getTriggers.and.returnValue(of([]));
    mockNotificationTriggersService.getStats.and.returnValue(of(null));
    mockMessageTemplatesService.getTemplates.and.returnValue(of([]));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize forms on creation', () => {
    expect(component.filtersForm).toBeDefined();
    expect(component.triggerForm).toBeDefined();
    expect(component.triggerForm.get('name')).toBeDefined();
    expect(component.triggerForm.get('type')).toBeDefined();
    expect(component.triggerForm.get('isActive')).toBeDefined();
  });

  it('should load initial data on init', () => {
    component.ngOnInit();
    expect(mockNotificationTriggersService.getTriggers).toHaveBeenCalled();
    expect(mockNotificationTriggersService.getStats).toHaveBeenCalled();
    expect(mockMessageTemplatesService.getTemplates).toHaveBeenCalled();
  });

  it('should get type icon correctly', () => {
    const icon = component.getTypeIcon('event');
    expect(icon).toBe('fas fa-bolt');
    
    const unknownIcon = component.getTypeIcon('unknown' as any);
    expect(unknownIcon).toBe('fas fa-question');
  });

  it('should get type label correctly', () => {
    const label = component.getTypeLabel('event');
    expect(label).toBe('Evento del Sistema');
    
    const unknownLabel = component.getTypeLabel('unknown' as any);
    expect(unknownLabel).toBe('unknown');
  });

  it('should validate required fields', () => {
    component.triggerForm.patchValue({
      name: '',
      type: ''
    });
    
    expect(component.isFieldInvalid(component.triggerForm, 'name')).toBeFalsy(); // Not touched yet
    
    component.triggerForm.get('name')?.markAsTouched();
    component.triggerForm.get('type')?.markAsTouched();
    
    expect(component.isFieldInvalid(component.triggerForm, 'name')).toBeTruthy();
    expect(component.isFieldInvalid(component.triggerForm, 'type')).toBeTruthy();
  });

  it('should add and remove actions', () => {
    const initialLength = component.getActionsFormArray().length;
    
    component.addAction();
    expect(component.getActionsFormArray().length).toBe(initialLength + 1);
    
    component.removeAction(0);
    expect(component.getActionsFormArray().length).toBe(initialLength);
  });

  it('should set active view correctly', () => {
    component.setActiveView('create');
    expect(component.activeView).toBe('create');
    
    component.setActiveView('edit');
    expect(component.activeView).toBe('edit');
  });

  it('should create new trigger', () => {
    component.createTrigger();
    expect(component.activeView).toBe('create');
    expect(component.selectedTrigger).toBeNull();
  });

  it('should edit existing trigger', () => {
    component.editTrigger(mockTrigger);
    expect(component.activeView).toBe('edit');
    expect(component.selectedTrigger).toBe(mockTrigger);
    expect(component.triggerForm.get('name')?.value).toBe(mockTrigger.name);
  });

  it('should cancel edit', () => {
    component.editTrigger(mockTrigger);
    component.cancelEdit();
    expect(component.activeView).toBe('list');
    expect(component.selectedTrigger).toBeNull();
  });

  it('should clear filters', () => {
    component.filtersForm.patchValue({
      search: 'test',
      type: 'event'
    });
    
    component.clearFilters();
    expect(mockNotificationTriggersService.clearFilters).toHaveBeenCalled();
  });

  it('should toggle trigger status', () => {
    mockNotificationTriggersService.toggleTrigger.and.returnValue(of(undefined));
    
    component.toggleTrigger(mockTrigger);
    expect(mockNotificationTriggersService.toggleTrigger).toHaveBeenCalledWith(mockTrigger.id, false);
  });

  it('should execute trigger', () => {
    mockNotificationTriggersService.executeTrigger.and.returnValue(of({} as any));
    mockDialogService.showConfirmDialog.and.returnValue({
      afterClosed: () => of(true)
    } as any);
    
    component.executeTrigger(mockTrigger);
    expect(mockDialogService.showConfirmDialog).toHaveBeenCalled();
  });

  it('should get priority color', () => {
    const color = component.getPriorityColor('high');
    expect(color).toBe('#f59e0b');
    
    const defaultColor = component.getPriorityColor('unknown');
    expect(defaultColor).toBe('#3b82f6');
  });

  it('should get execution status color', () => {
    const color = component.getExecutionStatusColor('completed');
    expect(color).toBe('#10b981');
    
    const defaultColor = component.getExecutionStatusColor('unknown');
    expect(defaultColor).toBe('#6b7280');
  });

  it('should get field error message', () => {
    component.triggerForm.get('name')?.setErrors({ required: true });
    const error = component.getFieldError(component.triggerForm, 'name');
    expect(error).toBe('Este campo es requerido');
    
    component.triggerForm.get('name')?.setErrors({ maxlength: { requiredLength: 100, actualLength: 150 } });
    const maxLengthError = component.getFieldError(component.triggerForm, 'name');
    expect(maxLengthError).toBe('Máximo 100 caracteres');
  });
});
