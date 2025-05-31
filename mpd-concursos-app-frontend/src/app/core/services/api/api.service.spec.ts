import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS, HttpErrorResponse } from '@angular/common/http';
import { ApiService } from './api.service';
import { CacheService } from '../cache/cache.service';
import { ApiErrorService } from '../error/api-error.service';
import { environment } from '../../../../environments/environment';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;
  let cacheService: CacheService;
  let errorService: ApiErrorService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ApiService,
        CacheService,
        {
          provide: ApiErrorService,
          useValue: {
            handleError: jasmine.createSpy('handleError').and.callFake((error) => {
              throw error;
            })
          }
        }
      ]
    });
    
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
    cacheService = TestBed.inject(CacheService);
    errorService = TestBed.inject(ApiErrorService);
    
    // Limpiar caché antes de cada prueba
    cacheService.clear();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
  
  describe('get', () => {
    it('should make a GET request to the correct URL', () => {
      const testData = { id: 1, name: 'Test' };
      
      service.get('test-endpoint').subscribe(data => {
        expect(data).toEqual(testData);
      });
      
      const req = httpMock.expectOne(`${environment.apiUrl}/test-endpoint`);
      expect(req.request.method).toBe('GET');
      req.flush(testData);
    });
    
    it('should handle URL with leading slash', () => {
      service.get('/test-endpoint').subscribe();
      
      const req = httpMock.expectOne(`${environment.apiUrl}/test-endpoint`);
      expect(req.request.method).toBe('GET');
      req.flush({});
    });
    
    it('should use cache for repeated requests', () => {
      const testData = { id: 1, name: 'Test' };
      const endpoint = 'cached-endpoint';
      
      // First request should hit the network
      service.get(endpoint, { cache: { ttl: 1000 } }).subscribe();
      
      const req1 = httpMock.expectOne(`${environment.apiUrl}/${endpoint}`);
      req1.flush(testData);
      
      // Second request should use cache
      service.get(endpoint, { cache: { ttl: 1000 } }).subscribe();
      
      // No additional HTTP request should be made
      httpMock.expectNone(`${environment.apiUrl}/${endpoint}`);
    });
    
    it('should bypass cache with forceRefresh option', () => {
      const testData = { id: 1, name: 'Test' };
      const endpoint = 'force-refresh-endpoint';
      
      // First request
      service.get(endpoint, { cache: { ttl: 1000 } }).subscribe();
      
      const req1 = httpMock.expectOne(`${environment.apiUrl}/${endpoint}`);
      req1.flush(testData);
      
      // Second request with forceRefresh
      service.get(endpoint, { cache: { ttl: 1000, forceRefresh: true } }).subscribe();
      
      // Should make a new HTTP request
      const req2 = httpMock.expectOne(`${environment.apiUrl}/${endpoint}`);
      req2.flush(testData);
    });
    
    it('should handle query parameters correctly', () => {
      const params = { id: '1', filter: 'active' };
      
      service.get('test-endpoint', { params }).subscribe();
      
      const req = httpMock.expectOne(`${environment.apiUrl}/test-endpoint?id=1&filter=active`);
      expect(req.request.method).toBe('GET');
      req.flush({});
    });
    
    it('should handle errors correctly', () => {
      const errorResponse = new HttpErrorResponse({
        error: 'test error',
        status: 404,
        statusText: 'Not Found'
      });
      
      service.get('error-endpoint').subscribe({
        next: () => fail('should have failed with 404 error'),
        error: (error) => {
          expect(errorService.handleError).toHaveBeenCalledWith(errorResponse);
        }
      });
      
      const req = httpMock.expectOne(`${environment.apiUrl}/error-endpoint`);
      req.flush('test error', { status: 404, statusText: 'Not Found' });
    });
  });
  
  describe('post', () => {
    it('should make a POST request to the correct URL with the correct body', () => {
      const testData = { name: 'Test' };
      const responseData = { id: 1, name: 'Test' };
      
      service.post('test-endpoint', testData).subscribe(data => {
        expect(data).toEqual(responseData);
      });
      
      const req = httpMock.expectOne(`${environment.apiUrl}/test-endpoint`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(testData);
      req.flush(responseData);
    });
    
    it('should invalidate related cache entries', () => {
      const getEndpoint = 'test-endpoint';
      const postEndpoint = 'test-endpoint';
      const testData = { id: 1, name: 'Test' };
      
      // Populate cache
      service.get(getEndpoint, { cache: { ttl: 1000 } }).subscribe();
      
      const getReq = httpMock.expectOne(`${environment.apiUrl}/${getEndpoint}`);
      getReq.flush(testData);
      
      // Verify cache has the entry
      expect(cacheService.has('GET:' + environment.apiUrl + '/' + getEndpoint)).toBe(true);
      
      // Make POST request
      service.post(postEndpoint, { name: 'New Test' }).subscribe();
      
      const postReq = httpMock.expectOne(`${environment.apiUrl}/${postEndpoint}`);
      postReq.flush({ id: 2, name: 'New Test' });
      
      // Cache should be invalidated
      expect(cacheService.has('GET:' + environment.apiUrl + '/' + getEndpoint)).toBe(false);
    });
  });
  
  describe('put', () => {
    it('should make a PUT request to the correct URL with the correct body', () => {
      const testData = { id: 1, name: 'Updated Test' };
      
      service.put('test-endpoint/1', testData).subscribe(data => {
        expect(data).toEqual(testData);
      });
      
      const req = httpMock.expectOne(`${environment.apiUrl}/test-endpoint/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(testData);
      req.flush(testData);
    });
    
    it('should invalidate related cache entries', () => {
      const getEndpoint = 'test-endpoint';
      const putEndpoint = 'test-endpoint/1';
      const testData = { id: 1, name: 'Test' };
      
      // Populate cache
      service.get(getEndpoint, { cache: { ttl: 1000 } }).subscribe();
      
      const getReq = httpMock.expectOne(`${environment.apiUrl}/${getEndpoint}`);
      getReq.flush([testData]);
      
      // Verify cache has the entry
      expect(cacheService.has('GET:' + environment.apiUrl + '/' + getEndpoint)).toBe(true);
      
      // Make PUT request
      service.put(putEndpoint, { id: 1, name: 'Updated Test' }).subscribe();
      
      const putReq = httpMock.expectOne(`${environment.apiUrl}/${putEndpoint}`);
      putReq.flush({ id: 1, name: 'Updated Test' });
      
      // Cache should be invalidated
      expect(cacheService.has('GET:' + environment.apiUrl + '/' + getEndpoint)).toBe(false);
    });
  });
  
  describe('patch', () => {
    it('should make a PATCH request to the correct URL with the correct body', () => {
      const testData = { name: 'Partially Updated Test' };
      const responseData = { id: 1, name: 'Partially Updated Test' };
      
      service.patch('test-endpoint/1', testData).subscribe(data => {
        expect(data).toEqual(responseData);
      });
      
      const req = httpMock.expectOne(`${environment.apiUrl}/test-endpoint/1`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(testData);
      req.flush(responseData);
    });
  });
  
  describe('delete', () => {
    it('should make a DELETE request to the correct URL', () => {
      service.delete('test-endpoint/1').subscribe();
      
      const req = httpMock.expectOne(`${environment.apiUrl}/test-endpoint/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });
    
    it('should invalidate related cache entries', () => {
      const getEndpoint = 'test-endpoint';
      const deleteEndpoint = 'test-endpoint/1';
      const testData = [{ id: 1, name: 'Test' }];
      
      // Populate cache
      service.get(getEndpoint, { cache: { ttl: 1000 } }).subscribe();
      
      const getReq = httpMock.expectOne(`${environment.apiUrl}/${getEndpoint}`);
      getReq.flush(testData);
      
      // Verify cache has the entry
      expect(cacheService.has('GET:' + environment.apiUrl + '/' + getEndpoint)).toBe(true);
      
      // Make DELETE request
      service.delete(deleteEndpoint).subscribe();
      
      const deleteReq = httpMock.expectOne(`${environment.apiUrl}/${deleteEndpoint}`);
      deleteReq.flush({});
      
      // Cache should be invalidated
      expect(cacheService.has('GET:' + environment.apiUrl + '/' + getEndpoint)).toBe(false);
    });
  });
});
