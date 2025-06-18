/**
 * CV HTTP Interceptor - Specialized interceptor for CV-related HTTP requests
 * 
 * This interceptor provides enhanced error handling, retry logic, and logging
 * specifically for CV endpoints (experiences and education).
 */

import { Injectable, inject } from '@angular/core';
import { 
  HttpInterceptor, 
  HttpRequest, 
  HttpHandler, 
  HttpEvent, 
  HttpErrorResponse,
  HttpResponse 
} from '@angular/common/http';
import { Observable, throwError, timer, of } from 'rxjs';
import { 
  catchError, 
  retry, 
  tap, 
  timeout,
  finalize,
  switchMap 
} from 'rxjs/operators';

import { FeatureToggleService } from '../services/feature-toggle.service';
import { environment } from '../../../environments/environment';

export interface CvHttpConfig {
  enableRetry: boolean;
  enableTimeout: boolean;
  enableLogging: boolean;
  maxRetries: number;
  timeoutMs: number;
  retryDelay: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export interface CvRequestMetrics {
  url: string;
  method: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  retries: number;
  success: boolean;
  errorCode?: number;
  errorMessage?: string;
}

@Injectable()
export class CvHttpInterceptor implements HttpInterceptor {
  
  private readonly featureToggle = inject(FeatureToggleService);
  
  private readonly CV_ENDPOINTS = [
    '/api/experiencias',
    '/api/educacion',
    '/api/cv'
  ];
  
  private readonly config: CvHttpConfig = {
    enableRetry: true,
    enableTimeout: true,
    enableLogging: !environment.production,
    maxRetries: 3,
    timeoutMs: 30000, // 30 seconds
    retryDelay: 1000, // 1 second
    logLevel: environment.production ? 'error' : 'debug'
  };
  
  private metrics: CvRequestMetrics[] = [];

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Only intercept CV-related requests
    if (!this.isCvRequest(request)) {
      return next.handle(request);
    }

    // Check if CV interceptor is enabled via feature flags
    if (!this.featureToggle.isEnabled('enableCvDebugMode')) {
      return next.handle(request);
    }

    const metrics = this.createRequestMetrics(request);
    this.log('debug', `[CvHttpInterceptor] Intercepting CV request: ${request.method} ${request.url}`);

    // Add CV-specific headers
    const enhancedRequest = this.addCvHeaders(request);

    let requestObservable = next.handle(enhancedRequest);

    // Apply timeout if enabled
    if (this.config.enableTimeout) {
      requestObservable = requestObservable.pipe(
        timeout(this.config.timeoutMs)
      );
    }

    // Apply retry logic if enabled
    if (this.config.enableRetry) {
      requestObservable = requestObservable.pipe(
        retry({
          count: this.config.maxRetries,
          delay: (error, retryCount) => {
            metrics.retries = retryCount;
            
            if (!this.shouldRetry(error)) {
              throw error;
            }
            
            const delay = this.calculateRetryDelay(retryCount);
            this.log('warn', `[CvHttpInterceptor] Retrying CV request (attempt ${retryCount}/${this.config.maxRetries}) after ${delay}ms: ${request.url}`);
            
            return timer(delay);
          }
        })
      );
    }

    return requestObservable.pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          this.handleSuccessResponse(event, metrics);
        }
      }),
      catchError(error => this.handleError(error, metrics, request)),
      finalize(() => this.finalizeRequest(metrics))
    );
  }

  /**
   * Check if request is CV-related
   */
  private isCvRequest(request: HttpRequest<unknown>): boolean {
    return this.CV_ENDPOINTS.some(endpoint => request.url.includes(endpoint));
  }

  /**
   * Add CV-specific headers
   */
  private addCvHeaders(request: HttpRequest<unknown>): HttpRequest<unknown> {
    let headers = request.headers;

    // Add CV-specific headers
    headers = headers.set('X-CV-Client', 'angular-cv-service');
    headers = headers.set('X-CV-Version', '2.0');
    
    // Add feature flag information
    const strategy = this.featureToggle.getCvMigrationStrategy();
    headers = headers.set('X-CV-Strategy', JSON.stringify(strategy));

    return request.clone({ headers });
  }

  /**
   * Create request metrics
   */
  private createRequestMetrics(request: HttpRequest<unknown>): CvRequestMetrics {
    const metrics: CvRequestMetrics = {
      url: request.url,
      method: request.method,
      startTime: Date.now(),
      retries: 0,
      success: false
    };

    this.metrics.push(metrics);
    return metrics;
  }

  /**
   * Handle successful response
   */
  private handleSuccessResponse(response: HttpResponse<any>, metrics: CvRequestMetrics): void {
    metrics.endTime = Date.now();
    metrics.duration = metrics.endTime - metrics.startTime;
    metrics.success = true;

    this.log('debug', `[CvHttpInterceptor] CV request successful: ${metrics.method} ${metrics.url} (${metrics.duration}ms)`);

    // Log response details in debug mode
    if (this.config.logLevel === 'debug') {
      this.log('debug', `[CvHttpInterceptor] Response data:`, response.body);
    }
  }

  /**
   * Handle request error
   */
  private handleError(
    error: HttpErrorResponse, 
    metrics: CvRequestMetrics, 
    request: HttpRequest<unknown>
  ): Observable<never> {
    metrics.endTime = Date.now();
    metrics.duration = metrics.endTime - metrics.startTime;
    metrics.success = false;
    metrics.errorCode = error.status;
    metrics.errorMessage = error.message;

    // Enhanced error logging for CV requests
    this.log('error', `[CvHttpInterceptor] CV request failed: ${metrics.method} ${metrics.url}`, {
      status: error.status,
      statusText: error.statusText,
      message: error.message,
      duration: metrics.duration,
      retries: metrics.retries
    });

    // Create enhanced error with CV context
    const enhancedError = this.createEnhancedError(error, request, metrics);

    return throwError(() => enhancedError);
  }

  /**
   * Create enhanced error with CV context
   */
  private createEnhancedError(
    error: HttpErrorResponse, 
    request: HttpRequest<unknown>, 
    metrics: CvRequestMetrics
  ): HttpErrorResponse {
    const cvContext = {
      isCvRequest: true,
      endpoint: this.getCvEndpointType(request.url),
      metrics: {
        duration: metrics.duration,
        retries: metrics.retries
      },
      featureFlags: this.featureToggle.getCvMigrationStrategy()
    };

    // Clone error with additional CV context
    return new HttpErrorResponse({
      error: {
        ...error.error,
        cvContext
      },
      headers: error.headers,
      status: error.status,
      statusText: error.statusText,
      url: error.url
    });
  }

  /**
   * Determine if error should be retried
   */
  private shouldRetry(error: any): boolean {
    if (!(error instanceof HttpErrorResponse)) {
      return true; // Retry network errors
    }

    const status = error.status;

    // Don't retry client errors (4xx) except for specific cases
    if (status >= 400 && status < 500) {
      // Retry only for specific 4xx errors
      return status === 408 || status === 429; // Timeout or Too Many Requests
    }

    // Retry server errors (5xx) and network errors (0)
    return status >= 500 || status === 0;
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(retryCount: number): number {
    return this.config.retryDelay * Math.pow(2, retryCount - 1);
  }

  /**
   * Get CV endpoint type
   */
  private getCvEndpointType(url: string): string {
    if (url.includes('/experiencias')) return 'experience';
    if (url.includes('/educacion')) return 'education';
    if (url.includes('/cv')) return 'cv';
    return 'unknown';
  }

  /**
   * Finalize request processing
   */
  private finalizeRequest(metrics: CvRequestMetrics): void {
    // Clean up old metrics (keep only last 100 requests)
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    // Log final metrics in debug mode
    if (this.config.logLevel === 'debug') {
      this.log('debug', `[CvHttpInterceptor] Request finalized:`, metrics);
    }
  }

  /**
   * Get CV request metrics
   */
  getCvMetrics(): CvRequestMetrics[] {
    return [...this.metrics];
  }

  /**
   * Clear CV metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    this.log('debug', '[CvHttpInterceptor] Metrics cleared');
  }

  /**
   * Log message with level
   */
  private log(level: string, message: string, data?: any): void {
    if (!this.config.enableLogging) return;

    const logMethod = console[level as keyof Console] as Function;
    if (data) {
      logMethod(message, data);
    } else {
      logMethod(message);
    }
  }
}
