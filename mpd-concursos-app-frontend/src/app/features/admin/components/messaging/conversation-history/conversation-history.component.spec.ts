import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';

import { ConversationHistoryComponent } from './conversation-history.component';
import { ConversationHistoryService } from '@core/services/messaging/conversation-history.service';
import { CustomNotificationService } from '@shared/components/custom-notification/custom-notification.service';

describe('ConversationHistoryComponent', () => {
  let component: ConversationHistoryComponent;
  let fixture: ComponentFixture<ConversationHistoryComponent>;
  let mockConversationHistoryService: jasmine.SpyObj<ConversationHistoryService>;
  let mockNotificationService: jasmine.SpyObj<CustomNotificationService>;

  const mockConversation = {
    id: '1',
    subject: 'Test Conversation',
    status: 'active',
    priority: 'normal',
    participants: [
      { userId: '1', userName: 'User 1', userRole: 'user' },
      { userId: '2', userName: 'User 2', userRole: 'admin' }
    ],
    messageCount: 5,
    averageResponseTime: 3600000, // 1 hour in ms
    firstMessageDate: new Date('2024-01-01'),
    lastActivityDate: new Date('2024-01-02'),
    unreadCount: 2,
    tags: ['important', 'urgent'],
    metadata: {
      category: 'support'
    },
    participantStats: [
      { userId: '1', userName: 'User 1', messageCount: 3, averageResponseTime: 1800000 },
      { userId: '2', userName: 'User 2', messageCount: 2, averageResponseTime: 5400000 }
    ]
  };

  beforeEach(async () => {
    const conversationHistoryServiceSpy = jasmine.createSpyObj('ConversationHistoryService', [
      'getConversations', 'getConversationStats', 'searchConversations', 'exportHistory'
    ]);
    const notificationServiceSpy = jasmine.createSpyObj('CustomNotificationService', [
      'showSuccess', 'showError', 'showWarning'
    ]);

    await TestBed.configureTestingModule({
      declarations: [ConversationHistoryComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: ConversationHistoryService, useValue: conversationHistoryServiceSpy },
        { provide: CustomNotificationService, useValue: notificationServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConversationHistoryComponent);
    component = fixture.componentInstance;
    
    mockConversationHistoryService = TestBed.inject(ConversationHistoryService) as jasmine.SpyObj<ConversationHistoryService>;
    mockNotificationService = TestBed.inject(CustomNotificationService) as jasmine.SpyObj<CustomNotificationService>;

    // Setup default return values
    mockConversationHistoryService.getConversations.and.returnValue(of([]));
    mockConversationHistoryService.getConversationStats.and.returnValue(of(null));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize forms on creation', () => {
    expect(component.filtersForm).toBeDefined();
    expect(component.searchForm).toBeDefined();
    expect(component.exportForm).toBeDefined();
  });

  it('should set active view correctly', () => {
    component.setActiveView('stats');
    expect(component.activeView).toBe('stats');
    
    component.setActiveView('search');
    expect(component.activeView).toBe('search');
  });

  it('should format duration correctly', () => {
    expect(component.formatDuration(0)).toBe('N/A');
    expect(component.formatDuration(1000)).toBe('1s');
    expect(component.formatDuration(60000)).toBe('1m 0s');
    expect(component.formatDuration(3600000)).toBe('1h 0m');
    expect(component.formatDuration(3661000)).toBe('1h 1m');
  });

  it('should format relative date correctly', () => {
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    expect(component.formatRelativeDate(today)).toBe('Hoy');
    expect(component.formatRelativeDate(yesterday)).toBe('Ayer');
    expect(component.formatRelativeDate(weekAgo)).toBe('Hace 1 semanas');
    expect(component.formatRelativeDate('')).toBe('N/A');
  });

  it('should get status color correctly', () => {
    expect(component.getStatusColor('active')).toBe('#10b981');
    expect(component.getStatusColor('archived')).toBe('#6b7280');
    expect(component.getStatusColor('closed')).toBe('#ef4444');
    expect(component.getStatusColor('pending')).toBe('#f59e0b');
    expect(component.getStatusColor('unknown')).toBe('#6b7280');
  });

  it('should get status icon correctly', () => {
    expect(component.getStatusIcon('active')).toBe('fas fa-circle');
    expect(component.getStatusIcon('archived')).toBe('fas fa-archive');
    expect(component.getStatusIcon('closed')).toBe('fas fa-times-circle');
    expect(component.getStatusIcon('pending')).toBe('fas fa-clock');
    expect(component.getStatusIcon('unknown')).toBe('fas fa-question-circle');
  });

  it('should get priority color correctly', () => {
    expect(component.getPriorityColor('low')).toBe('#6b7280');
    expect(component.getPriorityColor('normal')).toBe('#3b82f6');
    expect(component.getPriorityColor('high')).toBe('#f59e0b');
    expect(component.getPriorityColor('urgent')).toBe('#ef4444');
    expect(component.getPriorityColor('unknown')).toBe('#3b82f6');
  });

  it('should get participants string correctly', () => {
    const result = component.getParticipantsString(mockConversation);
    expect(result).toBe('User 1, User 2');
    
    const emptyConversation = { ...mockConversation, participants: [] };
    expect(component.getParticipantsString(emptyConversation)).toBe('Sin participantes');
    
    const manyParticipants = {
      ...mockConversation,
      participants: [
        { userId: '1', userName: 'User 1', userRole: 'user' },
        { userId: '2', userName: 'User 2', userRole: 'admin' },
        { userId: '3', userName: 'User 3', userRole: 'user' },
        { userId: '4', userName: 'User 4', userRole: 'user' },
        { userId: '5', userName: 'User 5', userRole: 'user' }
      ]
    };
    const manyResult = component.getParticipantsString(manyParticipants);
    expect(manyResult).toBe('User 1, User 2, User 3 y 2 más');
  });

  it('should get most active participant correctly', () => {
    const result = component.getMostActiveParticipant(mockConversation);
    expect(result).toEqual({
      userId: '1',
      userName: 'User 1',
      messageCount: 3,
      averageResponseTime: 1800000
    });
    
    const emptyConversation = { ...mockConversation, participantStats: [] };
    expect(component.getMostActiveParticipant(emptyConversation)).toBeNull();
  });

  it('should detect active filters correctly', () => {
    component.filtersForm.reset();
    expect(component.hasActiveFilters()).toBeFalsy();
    
    component.filtersForm.patchValue({ search: 'test' });
    expect(component.hasActiveFilters()).toBeTruthy();
    
    component.filtersForm.patchValue({ search: '', status: 'active' });
    expect(component.hasActiveFilters()).toBeTruthy();
    
    component.filtersForm.patchValue({ status: 'all' });
    expect(component.hasActiveFilters()).toBeFalsy();
  });

  it('should clear filters correctly', () => {
    component.filtersForm.patchValue({
      search: 'test',
      dateFrom: '2024-01-01',
      status: 'active'
    });
    
    component.clearFilters();
    
    expect(component.filtersForm.get('search')?.value).toBeFalsy();
    expect(component.filtersForm.get('dateFrom')?.value).toBeFalsy();
    expect(component.filtersForm.get('status')?.value).toBe('all');
  });

  it('should navigate to conversation', () => {
    spyOn(console, 'log');
    component.navigateToConversation(mockConversation);
    expect(console.log).toHaveBeenCalledWith('Navegando a conversación:', mockConversation.id);
  });

  it('should load initial data on init', () => {
    component.ngOnInit();
    expect(mockConversationHistoryService.getConversations).toHaveBeenCalled();
    expect(mockConversationHistoryService.getConversationStats).toHaveBeenCalled();
  });

  it('should handle view options correctly', () => {
    expect(component.viewOptions).toBeDefined();
    expect(component.viewOptions.length).toBeGreaterThan(0);
    expect(component.viewOptions[0]).toHaveProperty('value');
    expect(component.viewOptions[0]).toHaveProperty('label');
    expect(component.viewOptions[0]).toHaveProperty('icon');
  });

  it('should initialize with list view', () => {
    expect(component.activeView).toBe('list');
  });

  it('should handle empty conversations array', () => {
    component.conversations = [];
    component.filteredConversations = [];
    expect(component.filteredConversations.length).toBe(0);
  });
});
