import { Injectable } from '@angular/core';
import { Router, PreloadingStrategy, Route, NavigationEnd } from '@angular/router';
import { Observable, of, timer, EMPTY } from 'rxjs';
import { switchMap, catchError, tap } from 'rxjs/operators'; // Added tap
import { PerformanceOptimizationService } from './performance-optimization.service';
import { LoggingService } from '@core/services/logging/logging.service';

/**
 * Network Information API interface for TypeScript.
 */
interface NetworkInformation {
  effectiveType: '2g' | '3g' | '4g' | 'slow-2g';
  saveData: boolean;
  downlink?: number;
  rtt?: number;
}

/**
 * Custom preloading strategy configuration.
 */
export interface PreloadingConfig {
  enabled: boolean;
  delay: number;
  priority: 'high' | 'medium' | 'low';
  condition?: () => boolean; // Custom condition for preloading
  networkAware: boolean; // Consider network conditions
  memoryAware: boolean; // Consider memory usage
}

/**
 * Route information for preloading statistics and decision making.
 */
export interface RoutePreloadInfo {
  path: string;
  priority: number; // A numeric priority, higher means more important for preloading
  lastAccessed?: Date;
  accessCount: number;
  loadTime?: number; // Time taken to load the module (ms)
  size?: number; // Size of the module (bytes) - currently not implemented but good for future
}

/**
 * Smart preloading service that implements Angular's PreloadingStrategy.
 * It uses network and memory awareness, and route access statistics to optimize preloading.
 */
@Injectable({
  providedIn: 'root'
})
export class PreloadingService implements PreloadingStrategy {

  private routeStats = new Map<string, RoutePreloadInfo>();
  private preloadQueue: Route[] = []; // Queue for routes waiting to be preloaded
  private maxConcurrentPreloads = 2; // Maximum number of modules to preload concurrently
  private currentPreloads = 0; // Current number of active preloads

  // Default preloading configuration
  private defaultConfig: PreloadingConfig = {
    enabled: true,
    delay: 2000, // Default delay in milliseconds before preloading
    priority: 'medium',
    networkAware: true,
    memoryAware: true
  };

  private readonly LOG_TAG = 'PreloadingService'; // Tag for logging

  constructor(
    private router: Router,
    private performanceService: PerformanceOptimizationService,
    private loggingService: LoggingService // Inject LoggingService
  ) {
    this.loggingService.debug(`[${this.LOG_TAG}] Initializing PreloadingService.`, undefined, this.LOG_TAG);
    this.initializeRouteTracking(); // Start tracking route access for statistics
  }

  /**
   * Implementation of Angular's PreloadingStrategy.
   * Determines if a route should be preloaded and initiates the process.
   * @param route The route to consider for preloading.
   * @param load The function to load the route's module.
   * @returns An Observable that emits when the module is loaded, or EMPTY if not preloaded.
   */
  preload(route: Route, load: () => Observable<any>): Observable<any> {
    const routePath = route.path;
    if (!routePath) {
      this.loggingService.debug(`[${this.LOG_TAG}] Skipping preload: Route has no path.`, route, this.LOG_TAG);
      return EMPTY;
    }

    const config = this.getRouteConfig(route);
    this.loggingService.debug(`[${this.LOG_TAG}] Preload strategy called for route: ${routePath}. Config:`, config, this.LOG_TAG);

    if (!config.enabled) {
      this.loggingService.debug(`[${this.LOG_TAG}] Skipping preload for ${routePath}: Preloading is disabled for this route.`, undefined, this.LOG_TAG);
      return EMPTY;
    }

    // Check custom conditions, network status, and memory availability
    if (!this.shouldPreload(config)) {
      this.loggingService.debug(`[${this.LOG_TAG}] Skipping preload for ${routePath}: Conditions not met.`, undefined, this.LOG_TAG);
      return EMPTY;
    }

    // Calculate delay based on configuration and route statistics
    const delay = this.calculateDelay(config, route);
    this.loggingService.debug(`[${this.LOG_TAG}] Preload for ${routePath} scheduled with delay: ${delay}ms.`, undefined, this.LOG_TAG);

    return timer(delay).pipe(
      switchMap(() => {
        if (this.currentPreloads >= this.maxConcurrentPreloads) {
          this.preloadQueue.push(route);
          this.loggingService.info(`[${this.LOG_TAG}] Preload queueing ${routePath}: Max concurrent preloads reached (${this.maxConcurrentPreloads}). Queue size: ${this.preloadQueue.length}.`, undefined, this.LOG_TAG);
          return EMPTY; // Add to queue, don't execute immediately
        }

        return this.executePreload(route, load);
      }),
      catchError(error => {
        this.loggingService.error(`[${this.LOG_TAG}] Failed to preload route ${routePath} after delay:`, error, this.LOG_TAG);
        this.currentPreloads--; // Decrement active preloads on error as well
        this.processQueue(); // Try to process next in queue
        return EMPTY; // Do not re-throw, just complete the observable
      })
    );
  }

  /**
   * Executes the actual preloading of a route's module.
   * @param route The route to preload.
   * @param load The function to load the route's module.
   * @returns An Observable that emits the loaded module.
   */
  private executePreload(route: Route, load: () => Observable<any>): Observable<any> {
    const routePath = route.path!;
    this.currentPreloads++;
    const startTime = performance.now();
    this.loggingService.info(`[${this.LOG_TAG}] Executing preload for route: ${routePath}. Active preloads: ${this.currentPreloads}.`, undefined, this.LOG_TAG);

    return load().pipe(
      tap(_module => {
        const loadTime = performance.now() - startTime;
        this.loggingService.info(`[${this.LOG_TAG}] Successfully preloaded module for route: ${routePath}. Load time: ${loadTime.toFixed(2)}ms.`, undefined, this.LOG_TAG);
        this.updateRouteStats(routePath, { loadTime }); // Update stats with load time
        this.currentPreloads--; // Decrement active preloads
        this.loggingService.debug(`[${this.LOG_TAG}] Decremented active preloads to: ${this.currentPreloads}.`, undefined, this.LOG_TAG);
        this.processQueue(); // Try to process next in queue
      }),
      catchError(error => {
        this.loggingService.error(`[${this.LOG_TAG}] Error during module load for route ${routePath}:`, error, this.LOG_TAG);
        this.currentPreloads--; // Decrement active preloads on error
        this.processQueue(); // Try to process next in queue
        throw error; // Re-throw the error to be caught by the outer preload catchError
      })
    );
  }

  /**
   * Processes the preload queue, executing routes if capacity allows.
   */
  private processQueue(): void {
    if (this.preloadQueue.length > 0 && this.currentPreloads < this.maxConcurrentPreloads) {
      const nextRoute = this.preloadQueue.shift()!;
      this.loggingService.debug(`[${this.LOG_TAG}] Processing queue. Next route: ${nextRoute.path}. Queue size: ${this.preloadQueue.length}.`, undefined, this.LOG_TAG);
      // Re-trigger the preload logic for the dequeued route
      // Need to pass a function that returns an Observable, simulating the `load` parameter
      this.preload(nextRoute, () => {
        this.loggingService.debug(`[${this.LOG_TAG}] Attempting to load module for dequeued route: ${nextRoute.path}.`, undefined, this.LOG_TAG);
        // This is a simplified load function, in a real scenario, you might get it from a map or use a more robust approach
        if (nextRoute.loadChildren) {
          // If it's a lazy loaded route, call its loadChildren function
          const loadResult = nextRoute.loadChildren();

          // Convert to Observable if it's a Promise
          if (loadResult instanceof Promise) {
            return of(loadResult).pipe(
              switchMap(promise => promise),
              catchError(err => {
                this.loggingService.error(`[${this.LOG_TAG}] Error loading dequeued module for ${nextRoute.path}:`, err, this.LOG_TAG);
                return EMPTY;
              })
            );
          }

          // If it's already an Observable
          if (loadResult && typeof (loadResult as any).pipe === 'function') {
            return (loadResult as Observable<any>).pipe(
              catchError(err => {
                this.loggingService.error(`[${this.LOG_TAG}] Error loading dequeued module for ${nextRoute.path}:`, err, this.LOG_TAG);
                return EMPTY;
              })
            );
          }

          // Fallback for other types
          return of(loadResult);
        }
        // Fallback for non-lazy routes or if loadChildren is missing
        this.loggingService.warn(`[${this.LOG_TAG}] Dequeued route ${nextRoute.path} has no loadChildren. Cannot perform explicit module load.`, undefined, this.LOG_TAG);
        return EMPTY;
      }).subscribe(); // Subscribe to initiate the preload
    } else {
      this.loggingService.debug(`[${this.LOG_TAG}] Preload queue empty or max concurrent preloads reached. Queue size: ${this.preloadQueue.length}, Active preloads: ${this.currentPreloads}.`, undefined, this.LOG_TAG);
    }
  }

  /**
   * Determines if preloading should occur based on the provided configuration.
   * @param config The preloading configuration for the route.
   * @returns true if preloading conditions are met, false otherwise.
   */
  private shouldPreload(config: PreloadingConfig): boolean {
    this.loggingService.debug(`[${this.LOG_TAG}] Checking preload conditions for route.`, config, this.LOG_TAG);

    // Check custom condition if provided
    if (config.condition && !config.condition()) {
      this.loggingService.debug(`[${this.LOG_TAG}] Preload condition failed.`, undefined, this.LOG_TAG);
      return false;
    }

    // Check network suitability
    if (config.networkAware && !this.isNetworkSuitable()) {
      this.loggingService.debug(`[${this.LOG_TAG}] Network is not suitable for preloading.`, undefined, this.LOG_TAG);
      return false;
    }

    // Check available memory
    if (config.memoryAware && !this.isMemorySuitable()) {
      this.loggingService.debug(`[${this.LOG_TAG}] Memory is not suitable for preloading.`, undefined, this.LOG_TAG);
      return false;
    }

    this.loggingService.debug(`[${this.LOG_TAG}] All preload conditions met.`, undefined, this.LOG_TAG);
    return true;
  }

  /**
   * Checks if the current network conditions are suitable for preloading.
   * Avoids preloading on slow connections or when data saver is enabled.
   * @returns true if network is suitable, false otherwise.
   */
  private isNetworkSuitable(): boolean {
    // navigator.connection is non-standard but widely supported
    if (!('connection' in navigator)) {
      this.loggingService.debug(`[${this.LOG_TAG}] Network API not available. Assuming network is suitable.`, undefined, this.LOG_TAG);
      return true; // Assume suitable if no network information is available
    }

    const connection = (navigator as any).connection as NetworkInformation;

    // Do not preload on slow connections
    if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
      this.loggingService.warn(`[${this.LOG_TAG}] Network is slow (${connection.effectiveType}). Skipping preload.`, undefined, this.LOG_TAG);
      return false;
    }

    // Do not preload if user has data saver enabled
    if (connection.saveData) {
      this.loggingService.warn(`[${this.LOG_TAG}] Data Saver is enabled. Skipping preload.`, undefined, this.LOG_TAG);
      return false;
    }

    this.loggingService.debug(`[${this.LOG_TAG}] Network is suitable for preloading (effectiveType: ${connection.effectiveType}, saveData: ${connection.saveData}).`, undefined, this.LOG_TAG);
    return true;
  }

  /**
   * Checks if available memory is suitable for preloading.
   * Avoids preloading if memory usage is high (e.g., above 70%).
   * @returns true if memory is suitable, false otherwise.
   */
  private isMemorySuitable(): boolean {
    const metrics = this.performanceService.getCurrentMetrics();
    this.loggingService.debug(`[${this.LOG_TAG}] Current memory metrics:`, metrics, this.LOG_TAG);

    if (!metrics || !metrics.usedJSHeapSize || !metrics.jsHeapSizeLimit) {
      this.loggingService.debug(`[${this.LOG_TAG}] Memory metrics not available. Assuming memory is suitable.`, undefined, this.LOG_TAG);
      return true; // Assume suitable if no memory information is available
    }

    const memoryUsage = metrics.usedJSHeapSize / metrics.jsHeapSizeLimit;
    const isSuitable = memoryUsage < 0.7; // Preload if memory usage is less than 70%
    this.loggingService.debug(`[${this.LOG_TAG}] Memory usage: ${(memoryUsage * 100).toFixed(2)}%. Suitable: ${isSuitable}.`, undefined, this.LOG_TAG);

    return isSuitable;
  }

  /**
   * Calculates the delay before preloading a route.
   * Factors in configured delay, priority, and route access statistics.
   * @param config The preloading configuration.
   * @param route The route being considered.
   * @returns The calculated delay in milliseconds.
   */
  private calculateDelay(config: PreloadingConfig, route: Route): number {
    let delay = config.delay;
    this.loggingService.debug(`[${this.LOG_TAG}] Calculating delay for ${route.path}. Initial delay: ${delay}ms.`, undefined, this.LOG_TAG);

    // Adjust delay based on priority
    switch (config.priority) {
      case 'high':
        delay = Math.min(delay, 500); // Reduce delay for high priority
        this.loggingService.debug(`[${this.LOG_TAG}] Adjusted delay for high priority: ${delay}ms.`, undefined, this.LOG_TAG);
        break;
      case 'low':
        delay = Math.max(delay, 5000); // Increase delay for low priority
        this.loggingService.debug(`[${this.LOG_TAG}] Adjusted delay for low priority: ${delay}ms.`, undefined, this.LOG_TAG);
        break;
    }

    // Adjust based on route access statistics (more accessed routes have less delay)
    const stats = this.routeStats.get(route.path!);
    if (stats) {
      // Access factor reduces delay for frequently accessed routes
      // Capped at 0.8 to ensure some base delay remains
      const accessFactor = Math.min(stats.accessCount / 10, 0.8);
      delay = delay * (1 - accessFactor);
      this.loggingService.debug(`[${this.LOG_TAG}] Adjusted delay by access count (${stats.accessCount}). Factor: ${accessFactor}. New delay: ${delay.toFixed(2)}ms.`, undefined, this.LOG_TAG);
    }

    this.loggingService.debug(`[${this.LOG_TAG}] Final calculated delay for ${route.path}: ${delay.toFixed(2)}ms.`, undefined, this.LOG_TAG);
    return delay;
  }

  /**
   * Retrieves the preloading configuration for a specific route.
   * Merges default config with any route-specific data.
   * @param route The route.
   * @returns The merged PreloadingConfig.
   */
  private getRouteConfig(route: Route): PreloadingConfig {
    const routeConfig = route.data?.['preload'] as Partial<PreloadingConfig>;
    const finalConfig = { ...this.defaultConfig, ...routeConfig };
    this.loggingService.debug(`[${this.LOG_TAG}] Retrieved config for route ${route.path}:`, finalConfig, this.LOG_TAG);
    return finalConfig;
  }

  /**
   * Initializes tracking of route access through router events.
   */
  private initializeRouteTracking(): void {
    this.loggingService.debug(`[${this.LOG_TAG}] Initializing route tracking.`, undefined, this.LOG_TAG);
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        const url = event.urlAfterRedirects; // Use urlAfterRedirects for the canonical URL
        this.trackRouteAccess(url);
      }
    });
  }

  /**
   * Tracks and updates access statistics for a given route path.
   * @param path The path of the accessed route.
   */
  private trackRouteAccess(path: string): void {
    const existing = this.routeStats.get(path);
    this.loggingService.debug(`[${this.LOG_TAG}] Tracking route access for: ${path}.`, undefined, this.LOG_TAG);

    if (existing) {
      existing.accessCount++;
      existing.lastAccessed = new Date();
      this.loggingService.debug(`[${this.LOG_TAG}] Updated existing route stats for ${path}. Access count: ${existing.accessCount}.`, undefined, this.LOG_TAG);
    } else {
      const newRouteInfo: RoutePreloadInfo = {
        path,
        priority: 1, // Default priority
        accessCount: 1,
        lastAccessed: new Date()
      };
      this.routeStats.set(path, newRouteInfo);
      this.loggingService.debug(`[${this.LOG_TAG}] Created new route stats for ${path}.`, newRouteInfo, this.LOG_TAG);
    }
  }

  /**
   * Updates specific statistics for a route.
   * @param path The path of the route.
   * @param updates Partial object with properties to update.
   */
  private updateRouteStats(path: string, updates: Partial<RoutePreloadInfo>): void {
    const existing = this.routeStats.get(path);
    if (existing) {
      Object.assign(existing, updates);
      this.loggingService.debug(`[${this.LOG_TAG}] Updated route stats for ${path}. Updates:`, updates, this.LOG_TAG);
    } else {
      this.loggingService.warn(`[${this.LOG_TAG}] Attempted to update stats for non-existent route: ${path}.`, undefined, this.LOG_TAG);
    }
  }

  /**
   * Manually triggers the preload of a specific route.
   * This can be used for routes that are known to be needed soon but might not be
   * covered by the automatic strategy (e.g., after a user action).
   * @param path The path of the route to preload.
   * @returns A Promise that resolves when the module is loaded.
   */
  public preloadRoute(path: string): Promise<any> {
    this.loggingService.info(`[${this.LOG_TAG}] Manual preload requested for route: ${path}.`, undefined, this.LOG_TAG);
    return new Promise((resolve, reject) => {
      const route = this.findRouteByPath(path);

      if (!route || !route.loadChildren) { // Ensure route exists and is lazy-loaded
        const errorMsg = `Route not found or not lazy-loadable for manual preload: ${path}.`;
        this.loggingService.error(`[${this.LOG_TAG}] ${errorMsg}`, undefined, this.LOG_TAG);
        reject(new Error(errorMsg));
        return;
      }

      // Simulate module loading via loadChildren
      (route.loadChildren() as Observable<any>).pipe(
        tap(module => {
          this.loggingService.info(`[${this.LOG_TAG}] Manually preloaded module for route: ${path}.`, undefined, this.LOG_TAG);
          this.updateRouteStats(path, {
            loadTime: performance.now(), // Capture load time
            lastAccessed: new Date()
          });
          resolve(module);
        }),
        catchError(error => {
          this.loggingService.error(`[${this.LOG_TAG}] Failed to manually preload route ${path}:`, error, this.LOG_TAG);
          reject(error);
          return EMPTY; // Return EMPTY to complete the observable
        })
      ).subscribe();
    });
  }

  /**
   * Finds a route configuration by its path.
   * NOTE: This is a simplified implementation. In a real application, you would
   * parse the router's configuration to find the actual route object.
   * @param path The path of the route to find.
   * @returns The Route object or null if not found.
   */
  private findRouteByPath(path: string): Route | null {
    this.loggingService.debug(`[${this.LOG_TAG}] Searching for route by path: ${path}.`, undefined, this.LOG_TAG);
    // This is a placeholder. A real implementation would iterate through router.config
    // and potentially its children to find the matching route.
    // For now, we assume a basic lazy-loaded route structure if loadChildren exists.
    if (path.includes('/')) { // Simple heuristic for nested paths often being lazy
      // Example: 'admin/dashboard' might map to a module
      // This part is highly dependent on your actual Angular routing setup.
      return {
        path: path,
        loadChildren: () => Promise.resolve({} as any) /* dummy load - return empty module */
      } as Route;
    }
    return null;
  }


  /**
   * Retrieves current preloading statistics.
   * @returns An object containing various statistics about preloading.
   */
  public getPreloadingStats(): {
    totalRoutes: number;
    preloadedRoutes: number;
    averageLoadTime: number;
    topRoutes: RoutePreloadInfo[];
    queueSize: number;
    activePreloads: number;
  } {
    const routes = Array.from(this.routeStats.values());
    const preloadedRoutes = routes.filter(r => r.loadTime !== undefined);

    const averageLoadTime = preloadedRoutes.length > 0
      ? preloadedRoutes.reduce((sum, r) => sum + (r.loadTime || 0), 0) / preloadedRoutes.length
      : 0;

    // Get top 10 most accessed routes
    const topRoutes = routes
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10);

    const stats = {
      totalRoutes: routes.length,
      preloadedRoutes: preloadedRoutes.length,
      averageLoadTime: parseFloat(averageLoadTime.toFixed(2)), // Format for readability
      topRoutes,
      queueSize: this.preloadQueue.length,
      activePreloads: this.currentPreloads
    };
    this.loggingService.info(`[${this.LOG_TAG}] Preloading statistics requested:`, stats, this.LOG_TAG);
    return stats;
  }

  /**
   * Configures the preloading service with new settings.
   * @param config Partial object of PreloadingConfig to apply.
   */
  public configure(config: Partial<PreloadingConfig>): void {
    const oldConfig = { ...this.defaultConfig };
    this.defaultConfig = { ...this.defaultConfig, ...config };
    this.loggingService.info(`[${this.LOG_TAG}] Preloading configuration updated. Old:`, oldConfig, this.LOG_TAG);
    this.loggingService.info(`[${this.LOG_TAG}] New configuration:`, this.defaultConfig, this.LOG_TAG);
  }

  /**
   * Cleans up old route access statistics.
   * @param maxAge Maximum age for stats in milliseconds (default: 7 days).
   */
  public cleanupOldStats(maxAge: number = 7 * 24 * 60 * 60 * 1000): void {
    const cutoff = new Date(Date.now() - maxAge);
    let cleanedCount = 0;

    this.loggingService.info(`[${this.LOG_TAG}] Cleaning up old route stats older than ${cutoff.toISOString()}.`, undefined, this.LOG_TAG);

    for (const [path, stats] of this.routeStats.entries()) {
      if (stats.lastAccessed && stats.lastAccessed < cutoff) {
        this.routeStats.delete(path);
        cleanedCount++;
        this.loggingService.debug(`[${this.LOG_TAG}] Removed old stats for route: ${path}.`, undefined, this.LOG_TAG);
      }
    }
    this.loggingService.info(`[${this.LOG_TAG}] Cleanup completed. Removed ${cleanedCount} old route statistics.`, undefined, this.LOG_TAG);
  }

  /**
   * Exports current preloading statistics and configuration as a JSON string.
   * @returns A JSON string of the statistics.
   */
  public exportStats(): string {
    const stats = {
      routes: Array.from(this.routeStats.entries()), // Convert Map to array of [key, value] pairs
      config: this.defaultConfig,
      exportedAt: new Date().toISOString()
    };
    const jsonStats = JSON.stringify(stats, null, 2);
    this.loggingService.info(`[${this.LOG_TAG}] Exported preloading statistics.`, undefined, this.LOG_TAG);
    this.loggingService.debug(`[${this.LOG_TAG}] Exported data:`, stats, this.LOG_TAG);
    return jsonStats;
  }

  /**
   * Imports preloading statistics and configuration from a JSON string.
   * @param data The JSON string containing the statistics.
   */
  public importStats(data: string): void {
    this.loggingService.info(`[${this.LOG_TAG}] Attempting to import preloading statistics.`, undefined, this.LOG_TAG);
    try {
      const parsed = JSON.parse(data);

      if (parsed.routes && Array.isArray(parsed.routes)) {
        this.routeStats.clear();
        parsed.routes.forEach(([path, stats]: [string, RoutePreloadInfo]) => {
          this.routeStats.set(path, {
            ...stats,
            lastAccessed: stats.lastAccessed ? new Date(stats.lastAccessed) : undefined // Convert date string back to Date object
          });
        });
        this.loggingService.info(`[${this.LOG_TAG}] Successfully imported ${parsed.routes.length} route statistics.`, undefined, this.LOG_TAG);
      } else {
        this.loggingService.warn(`[${this.LOG_TAG}] Imported data does not contain valid 'routes' array.`, parsed, this.LOG_TAG);
      }

      if (parsed.config) {
        this.defaultConfig = { ...this.defaultConfig, ...parsed.config };
        this.loggingService.info(`[${this.LOG_TAG}] Successfully imported preloading configuration.`, this.defaultConfig, this.LOG_TAG);
      }

    } catch (error) {
      this.loggingService.error(`[${this.LOG_TAG}] Failed to import preloading stats:`, error, this.LOG_TAG);
    }
  }
}
