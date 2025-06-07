import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BehaviorSubject, of } from 'rxjs';
import { UserActivityService } from './user-activity.service';
import { AuthService } from '@core/services/auth.service';
import { environment } from '@environments/environment';
import { 
  UserActivity, 
  ActivityFilters, 
  ActivityStatistics,
  UserSession,
  UserAction 
} from '@shared/interfaces/audit/user-activity.interface';

describe('UserActivityService', () => {
  let service: UserActivityService;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  const apiUrl = `${environment.apiUrl}/audit`;

  // Mock data
  const mockUser = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com'
  };

  const mockActivity: UserActivity = {
    id: 'activity-1',
    userId: 'user-1',
    userName: 'Test User',
    userEmail: 'test@example.com',
    sessionId: 'session-1',
    action: 'LOGIN' as UserAction,
    resource: 'authentication',
    details: {
      description: 'User logged in',
      category: 'AUTHENTICATION',
      severity: 'MEDIUM'
    },
    metadata: {
      browser: {
        name: 'Chrome',
        version: '91.0',
        engine: 'WebKit',
        platform: 'Win32',
        mobile: false
      },
      device: {
        type: 'desktop',
        os: 'Windows',
        osVersion: '10'
      },
      screen: {
        width: 1920,
        height: 1080,
        colorDepth: 24,
        pixelRatio: 1
      },
      language: 'en-US',
      timezone: 'America/New_York'
    },
    timestamp: new Date(),
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    success: true
  };

  const mockSession: UserSession = {
    id: 'session-1',
    userId: 'user-1',
    startTime: new Date(),
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    isActive: true,
    activities: [mockActivity],
    lastActivity: new Date(),
    deviceFingerprint: 'test-fingerprint'
  };

  const mockStatistics: ActivityStatistics = {
    totalActivities: 100,
    activitiesByAction: {} as any,
    activitiesByCategory: {} as any,
    activitiesBySeverity: {} as any,
    activitiesByHour: {},
    activitiesByDay: {},
    topUsers: [],
    topResources: [],
    errorRate: 5.0,
    averageSessionDuration: 3600000,
    uniqueUsers: 10,
    uniqueSessions: 15
  };

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser'], {
      currentUser$: new BehaviorSubject(mockUser)
    });

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        UserActivityService,
        { provide: AuthService, useValue: authSpy }
      ]
    });

    service = TestBed.inject(UserActivityService);
    httpMock = TestBed.inject(HttpTestingController);
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

    // Setup default spy returns
    authServiceSpy.getCurrentUser.and.returnValue(mockUser);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getActivities', () => {
    it('should get activities successfully', () => {
      const mockActivities = [mockActivity];

      service.getActivities().subscribe(activities => {
        expect(activities).toEqual(mockActivities);
      });

      const req = httpMock.expectOne(`${apiUrl}/activities`);
      expect(req.request.method).toBe('GET');
      req.flush(mockActivities);
    });

    it('should get activities with filters', () => {
      const filters: ActivityFilters = {
        userId: 'user-1',
        actions: ['LOGIN'],
        dateFrom: new Date('2023-01-01'),
        dateTo: new Date('2023-12-31')
      };

      service.getActivities(filters).subscribe();

      const req = httpMock.expectOne((request) => {
        return request.url === `${apiUrl}/activities` && 
               request.params.has('userId') &&
               request.params.has('actions');
      });
      expect(req.request.method).toBe('GET');
      req.flush([mockActivity]);
    });

    it('should handle error when getting activities', () => {
      service.getActivities().subscribe(activities => {
        expect(activities).toEqual([]);
      });

      const req = httpMock.expectOne(`${apiUrl}/activities`);
      req.error(new ErrorEvent('Network error'));
    });
  });

  describe('getStatistics', () => {
    it('should get statistics successfully', () => {
      service.getStatistics().subscribe(statistics => {
        expect(statistics).toEqual(mockStatistics);
      });

      const req = httpMock.expectOne(`${apiUrl}/statistics`);
      expect(req.request.method).toBe('GET');
      req.flush(mockStatistics);
    });

    it('should handle error when getting statistics', () => {
      service.getStatistics().subscribe(statistics => {
        expect(statistics.totalActivities).toBe(0);
        expect(statistics.errorRate).toBe(0);
      });

      const req = httpMock.expectOne(`${apiUrl}/statistics`);
      req.error(new ErrorEvent('Network error'));
    });
  });

  describe('getUserActivitySummary', () => {
    it('should get user activity summary successfully', () => {
      const userId = 'user-1';
      const mockSummary = {
        userId: 'user-1',
        userName: 'Test User',
        userEmail: 'test@example.com',
        totalActivities: 50,
        lastActivity: new Date(),
        sessionsCount: 5,
        averageSessionDuration: 3600000,
        mostCommonActions: [],
        riskScore: 10,
        isOnline: true
      };

      service.getUserActivitySummary(userId).subscribe(summary => {
        expect(summary).toEqual(mockSummary);
      });

      const req = httpMock.expectOne(`${apiUrl}/users/${userId}/summary`);
      expect(req.request.method).toBe('GET');
      req.flush(mockSummary);
    });
  });

  describe('getUserSessions', () => {
    it('should get user sessions successfully', () => {
      const userId = 'user-1';
      const mockSessions = [mockSession];

      service.getUserSessions(userId).subscribe(sessions => {
        expect(sessions).toEqual(mockSessions);
      });

      const req = httpMock.expectOne(`${apiUrl}/users/${userId}/sessions`);
      expect(req.request.method).toBe('GET');
      req.flush(mockSessions);
    });

    it('should get user sessions with limit', () => {
      const userId = 'user-1';
      const limit = 10;

      service.getUserSessions(userId, limit).subscribe();

      const req = httpMock.expectOne((request) => {
        return request.url === `${apiUrl}/users/${userId}/sessions` && 
               request.params.get('limit') === '10';
      });
      expect(req.request.method).toBe('GET');
      req.flush([mockSession]);
    });
  });

  describe('searchActivities', () => {
    it('should search activities successfully', () => {
      const query = 'login';
      const mockActivities = [mockActivity];

      service.searchActivities(query).subscribe(activities => {
        expect(activities).toEqual(mockActivities);
      });

      const req = httpMock.expectOne((request) => {
        return request.url === `${apiUrl}/activities/search` && 
               request.params.get('search') === query;
      });
      expect(req.request.method).toBe('GET');
      req.flush(mockActivities);
    });
  });

  describe('trackActivity', () => {
    beforeEach(() => {
      // Simular que hay una sesión activa
      service['currentSession'] = mockSession;
      service['trackingEnabled'] = true;
    });

    it('should track activity successfully', () => {
      const action: UserAction = 'PAGE_VIEW';
      const resource = '/dashboard';

      service.trackActivity(action, resource);

      expect(service['activityQueue'].length).toBe(1);
      const queuedActivity = service['activityQueue'][0];
      expect(queuedActivity.action).toBe(action);
      expect(queuedActivity.resource).toBe(resource);
      expect(queuedActivity.userId).toBe(mockUser.id);
    });

    it('should not track when tracking is disabled', () => {
      service['trackingEnabled'] = false;
      
      service.trackActivity('PAGE_VIEW', '/dashboard');

      expect(service['activityQueue'].length).toBe(0);
    });

    it('should not track when no current session', () => {
      service['currentSession'] = null;
      
      service.trackActivity('PAGE_VIEW', '/dashboard');

      expect(service['activityQueue'].length).toBe(0);
    });

    it('should not track when no current user', () => {
      authServiceSpy.getCurrentUser.and.returnValue(null);
      
      service.trackActivity('PAGE_VIEW', '/dashboard');

      expect(service['activityQueue'].length).toBe(0);
    });
  });

  describe('trackPageView', () => {
    beforeEach(() => {
      service['currentSession'] = mockSession;
      service['trackingEnabled'] = true;
      spyOn(service, 'trackActivity');
    });

    it('should track page view', () => {
      const path = '/dashboard';

      service.trackPageView(path);

      expect(service.trackActivity).toHaveBeenCalledWith(
        'PAGE_VIEW',
        path,
        undefined,
        jasmine.objectContaining({
          description: `Viewed page: ${path}`,
          category: 'NAVIGATION',
          severity: 'LOW'
        })
      );
    });
  });

  describe('trackSearch', () => {
    beforeEach(() => {
      service['currentSession'] = mockSession;
      service['trackingEnabled'] = true;
      spyOn(service, 'trackActivity');
    });

    it('should track search activity', () => {
      const query = 'test search';
      const resource = 'users';
      const resultsCount = 5;

      service.trackSearch(query, resource, resultsCount);

      expect(service.trackActivity).toHaveBeenCalledWith(
        'SEARCH',
        resource,
        undefined,
        jasmine.objectContaining({
          description: `Searched for: ${query}`,
          category: 'USER_INTERACTION',
          severity: 'LOW',
          customData: jasmine.objectContaining({
            query,
            resultsCount
          })
        })
      );
    });
  });

  describe('trackCrudOperation', () => {
    beforeEach(() => {
      service['currentSession'] = mockSession;
      service['trackingEnabled'] = true;
      spyOn(service, 'trackActivity');
    });

    it('should track CRUD operation', () => {
      const operation = 'CREATE';
      const resource = 'user';
      const resourceId = 'user-123';
      const newValue = { name: 'New User' };

      service.trackCrudOperation(operation, resource, resourceId, undefined, newValue);

      expect(service.trackActivity).toHaveBeenCalledWith(
        operation,
        resource,
        resourceId,
        jasmine.objectContaining({
          description: `${operation} ${resource} ${resourceId}`,
          category: 'DATA_MODIFICATION',
          severity: 'MEDIUM',
          newValue
        })
      );
    });

    it('should set high severity for DELETE operations', () => {
      spyOn(service, 'trackActivity');

      service.trackCrudOperation('DELETE', 'user', 'user-123');

      expect(service.trackActivity).toHaveBeenCalledWith(
        'DELETE',
        'user',
        'user-123',
        jasmine.objectContaining({
          severity: 'HIGH'
        })
      );
    });
  });

  describe('trackError', () => {
    beforeEach(() => {
      service['currentSession'] = mockSession;
      service['trackingEnabled'] = true;
      spyOn(service, 'trackActivity');
    });

    it('should track error activity', () => {
      const action: UserAction = 'LOGIN';
      const resource = 'authentication';
      const errorMessage = 'Invalid credentials';
      const errorDetails = { code: 401 };

      service.trackError(action, resource, errorMessage, errorDetails);

      expect(service.trackActivity).toHaveBeenCalledWith(
        action,
        resource,
        undefined,
        jasmine.objectContaining({
          description: `Error during ${action}: ${errorMessage}`,
          category: 'SYSTEM',
          severity: 'HIGH',
          customData: errorDetails
        }),
        false,
        errorMessage
      );
    });
  });

  describe('utility methods', () => {
    it('should set tracking enabled/disabled', () => {
      service.setTrackingEnabled(false);
      expect(service.isTrackingEnabled()).toBe(false);

      service.setTrackingEnabled(true);
      expect(service.isTrackingEnabled()).toBe(true);
    });

    it('should clear activity queue', () => {
      service['activityQueue'] = [mockActivity];
      expect(service.getQueueSize()).toBe(1);

      service.clearActivityQueue();
      expect(service.getQueueSize()).toBe(0);
    });

    it('should get current session', () => {
      service['currentSession'] = mockSession;
      expect(service.getCurrentSession()).toBe(mockSession);
    });

    it('should export activities to JSON', () => {
      const activities = [mockActivity];
      const exported = service.exportActivities(activities);
      const parsed = JSON.parse(exported);
      
      expect(parsed).toEqual(activities);
    });

    it('should import activities from JSON', () => {
      const activities = [mockActivity];
      const json = JSON.stringify(activities);
      const imported = service.importActivities(json);
      
      expect(imported).toEqual(activities);
    });

    it('should handle invalid JSON when importing', () => {
      const invalidJson = 'invalid json';
      const imported = service.importActivities(invalidJson);
      
      expect(imported).toEqual([]);
    });
  });

  describe('performance metrics', () => {
    it('should calculate performance metrics', () => {
      const activities = [
        {
          ...mockActivity,
          action: 'PAGE_VIEW' as UserAction,
          details: {
            ...mockActivity.details,
            customData: { loadTime: 1000 }
          }
        },
        {
          ...mockActivity,
          id: 'activity-2',
          action: 'PAGE_VIEW' as UserAction,
          resource: '/users',
          details: {
            ...mockActivity.details,
            customData: { loadTime: 2000 }
          }
        },
        {
          ...mockActivity,
          id: 'activity-3',
          success: false
        }
      ];

      const metrics = service.calculatePerformanceMetrics(activities);

      expect(metrics.totalActivities).toBe(3);
      expect(metrics.pageViews).toBe(2);
      expect(metrics.errors).toBe(1);
      expect(metrics.errorRate).toBe(33.33333333333333);
      expect(metrics.averageLoadTime).toBe(1500);
    });
  });
});
