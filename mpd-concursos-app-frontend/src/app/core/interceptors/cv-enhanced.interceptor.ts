/**
 * CV Enhanced Interceptor - Modern functional interceptor for CV operations
 * 
 * This interceptor provides advanced features like request deduplication,
 * intelligent caching, and performance monitoring for CV endpoints.
 */

import { inject } from '@angular/core';
import { 
  HttpInterceptorFn, 
  HttpRequest, 
  HttpHandlerFn,
  HttpEvent,
  HttpResponse,
  HttpErrorResponse 
} from '@angular/common/http';
import { Observable, of, timer, EMPTY } from 'rxjs';
import { 
  map, 
  catchError, 
  tap, 
  shareReplay, 
  switchMap,
  timeout,
  retry,
  finalize 
} from 'rxjs/operators';

import { FeatureToggleService } from '../services/feature-toggle.service';
import { environment } from '../../../environments/environment';

interface CvCacheEntry {
  response: HttpResponse<any>;
  timestamp: number;
  ttl: number;
}

interface PendingRequest {
  observable: Observable<HttpEvent<any>>;
  timestamp: number;
}

// Global cache and pending requests maps
const cvCache = new Map<string, CvCacheEntry>();
const pendingRequests = new Map<string, PendingRequest>();

/**
 * CV Enhanced Interceptor Function
 */
export const cvEnhancedInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  
  const featureToggle = inject(FeatureToggleService);
  
  // Only process CV-related requests
  if (!isCvRequest(request)) {
    return next(request);
  }

  // Check if enhanced CV features are enabled
  if (!featureToggle.isEnabled('useEnhancedValidation')) {
    return next(request);
  }

  const requestKey = generateRequestKey(request);
  
  // Handle GET requests with caching and deduplication
  if (request.method === 'GET') {
    return handleGetRequest(request, next, requestKey, featureToggle);
  }
  
  // Handle mutation requests (POST, PUT, DELETE)
  return handleMutationRequest(request, next, requestKey, featureToggle);
};

/**
 * Check if request is CV-related
 */
function isCvRequest(request: HttpRequest<unknown>): boolean {
  const cvEndpoints = ['/api/experiencias', '/api/educacion', '/api/cv'];
  return cvEndpoints.some(endpoint => request.url.includes(endpoint));
}

/**
 * Generate unique key for request
 */
function generateRequestKey(request: HttpRequest<unknown>): string {
  const url = request.url;
  const method = request.method;
  const body = request.body ? JSON.stringify(request.body) : '';
  return `${method}:${url}:${body}`;
}

/**
 * Handle GET requests with caching and deduplication
 */
function handleGetRequest(
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
  requestKey: string,
  featureToggle: FeatureToggleService
): Observable<HttpEvent<unknown>> {
  
  // Check cache first
  const cachedResponse = getCachedResponse(requestKey);
  if (cachedResponse) {
    logDebug(`[CvEnhancedInterceptor] Cache hit for: ${request.url}`);
    return of(cachedResponse);
  }
  
  // Check for pending identical request (deduplication)
  const pendingRequest = pendingRequests.get(requestKey);
  if (pendingRequest && !isRequestExpired(pendingRequest)) {
    logDebug(`[CvEnhancedInterceptor] Deduplicating request: ${request.url}`);
    return pendingRequest.observable;
  }
  
  // Create new request with enhancements
  const enhancedRequest = addCvHeaders(request, featureToggle);
  
  const requestObservable = next(enhancedRequest).pipe(
    timeout(30000), // 30 second timeout
    retry({
      count: 2,
      delay: (error, retryCount) => {
        if (!shouldRetryError(error)) {
          throw error;
        }
        const delay = 1000 * Math.pow(2, retryCount - 1);
        logDebug(`[CvEnhancedInterceptor] Retrying request (${retryCount}/2) after ${delay}ms: ${request.url}`);
        return timer(delay);
      }
    }),
    tap(event => {
      if (event instanceof HttpResponse) {
        // Cache successful GET responses
        cacheResponse(requestKey, event, getCacheTtl(request.url));
        logDebug(`[CvEnhancedInterceptor] Response cached for: ${request.url}`);
      }
    }),
    catchError(error => {
      logError(`[CvEnhancedInterceptor] Request failed: ${request.url}`, error);
      return handleCvError(error, request);
    }),
    finalize(() => {
      // Remove from pending requests
      pendingRequests.delete(requestKey);
    }),
    shareReplay(1) // Share the response with multiple subscribers
  );
  
  // Store as pending request
  pendingRequests.set(requestKey, {
    observable: requestObservable,
    timestamp: Date.now()
  });
  
  return requestObservable;
}

/**
 * Handle mutation requests (POST, PUT, DELETE)
 */
function handleMutationRequest(
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
  requestKey: string,
  featureToggle: FeatureToggleService
): Observable<HttpEvent<unknown>> {
  
  const enhancedRequest = addCvHeaders(request, featureToggle);
  
  return next(enhancedRequest).pipe(
    timeout(45000), // 45 second timeout for mutations
    tap(event => {
      if (event instanceof HttpResponse) {
        // Invalidate related cache entries on successful mutations
        invalidateRelatedCache(request.url);
        logDebug(`[CvEnhancedInterceptor] Cache invalidated for mutations on: ${request.url}`);
      }
    }),
    catchError(error => {
      logError(`[CvEnhancedInterceptor] Mutation failed: ${request.url}`, error);
      return handleCvError(error, request);
    })
  );
}

/**
 * Add CV-specific headers
 */
function addCvHeaders(
  request: HttpRequest<unknown>, 
  featureToggle: FeatureToggleService
): HttpRequest<unknown> {
  
  const strategy = featureToggle.getCvMigrationStrategy();
  
  return request.clone({
    setHeaders: {
      'X-CV-Enhanced': 'true',
      'X-CV-Version': '2.0',
      'X-CV-Strategy': JSON.stringify(strategy),
      'X-Request-ID': generateRequestId()
    }
  });
}

/**
 * Get cached response if valid
 */
function getCachedResponse(requestKey: string): HttpResponse<any> | null {
  const entry = cvCache.get(requestKey);
  
  if (!entry) {
    return null;
  }
  
  // Check if cache entry is still valid
  if (Date.now() - entry.timestamp > entry.ttl) {
    cvCache.delete(requestKey);
    return null;
  }
  
  return entry.response;
}

/**
 * Cache response
 */
function cacheResponse(requestKey: string, response: HttpResponse<any>, ttl: number): void {
  cvCache.set(requestKey, {
    response: response.clone(),
    timestamp: Date.now(),
    ttl
  });
  
  // Clean up old cache entries (keep max 50 entries)
  if (cvCache.size > 50) {
    const oldestKey = cvCache.keys().next().value;
    cvCache.delete(oldestKey);
  }
}

/**
 * Get cache TTL based on endpoint
 */
function getCacheTtl(url: string): number {
  if (url.includes('/experiencias')) {
    return 5 * 60 * 1000; // 5 minutes for experiences
  }
  if (url.includes('/educacion')) {
    return 5 * 60 * 1000; // 5 minutes for education
  }
  return 2 * 60 * 1000; // 2 minutes default
}

/**
 * Invalidate related cache entries
 */
function invalidateRelatedCache(url: string): void {
  const keysToDelete: string[] = [];
  
  for (const [key] of cvCache) {
    if (key.includes('/experiencias') && url.includes('/experiencias')) {
      keysToDelete.push(key);
    } else if (key.includes('/educacion') && url.includes('/educacion')) {
      keysToDelete.push(key);
    }
  }
  
  keysToDelete.forEach(key => cvCache.delete(key));
}

/**
 * Check if pending request is expired
 */
function isRequestExpired(pendingRequest: PendingRequest): boolean {
  return Date.now() - pendingRequest.timestamp > 30000; // 30 seconds
}

/**
 * Determine if error should be retried
 */
function shouldRetryError(error: any): boolean {
  if (!(error instanceof HttpErrorResponse)) {
    return true; // Retry network errors
  }
  
  const status = error.status;
  
  // Don't retry client errors except specific cases
  if (status >= 400 && status < 500) {
    return status === 408 || status === 429;
  }
  
  // Retry server errors and network errors
  return status >= 500 || status === 0;
}

/**
 * Handle CV-specific errors
 */
function handleCvError(error: HttpErrorResponse, request: HttpRequest<unknown>): Observable<never> {
  const enhancedError = new HttpErrorResponse({
    error: {
      ...error.error,
      cvEnhanced: true,
      originalUrl: request.url,
      timestamp: new Date().toISOString()
    },
    headers: error.headers,
    status: error.status,
    statusText: error.statusText,
    url: error.url || undefined
  });
  
  throw enhancedError;
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `cv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Debug logging
 */
function logDebug(message: string, data?: any): void {
  if (!environment.production) {
    if (data) {
      console.debug(message, data);
    } else {
      console.debug(message);
    }
  }
}

/**
 * Error logging
 */
function logError(message: string, error: any): void {
  console.error(message, error);
}

/**
 * Clear CV cache (utility function)
 */
export function clearCvCache(): void {
  cvCache.clear();
  pendingRequests.clear();
  logDebug('[CvEnhancedInterceptor] Cache and pending requests cleared');
}

/**
 * Get cache statistics (utility function)
 */
export function getCvCacheStats(): { cacheSize: number; pendingRequests: number } {
  return {
    cacheSize: cvCache.size,
    pendingRequests: pendingRequests.size
  };
}
