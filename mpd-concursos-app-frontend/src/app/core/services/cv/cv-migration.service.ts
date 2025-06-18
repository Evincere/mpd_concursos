/**
 * CV Migration Service - Manages gradual migration from legacy to new CV services
 * 
 * This service coordinates the transition between legacy services and new standardized
 * services using feature flags, ensuring a smooth and safe migration process.
 */

import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError, forkJoin } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';

import { FeatureToggleService } from '../feature-toggle.service';
import { ExperienceCvService } from './experience-cv.service';
import { EducationCvService } from './education-cv.service';
import { CvStateService } from './cv-state.service';

// Legacy services (to be imported when needed)
import { ExperienceService } from '../experience/experience.service';
import { EducacionService } from '../educacion/educacion.service';

import { 
  Experience, 
  Education, 
  CvData,
  CvOperationResult 
} from '../../models/cv';
import { CvMappers } from '../../mappers';

export interface MigrationStrategy {
  useNewExperienceService: boolean;
  useNewEducationService: boolean;
  useNewStateManagement: boolean;
  enableDataValidation: boolean;
  enableErrorRecovery: boolean;
  fallbackToLegacy: boolean;
}

export interface MigrationStatus {
  phase: 'legacy' | 'hybrid' | 'new';
  experienceService: 'legacy' | 'new';
  educationService: 'legacy' | 'new';
  stateManagement: 'legacy' | 'new';
  lastMigrationCheck: Date;
  errors: string[];
  warnings: string[];
}

@Injectable({
  providedIn: 'root'
})
export class CvMigrationService {
  
  private readonly featureToggle = inject(FeatureToggleService);
  private readonly newExperienceService = inject(ExperienceCvService);
  private readonly newEducationService = inject(EducationCvService);
  private readonly newStateService = inject(CvStateService);
  
  // Legacy services (injected conditionally)
  private readonly legacyExperienceService = inject(ExperienceService);
  private readonly legacyEducationService = inject(EducacionService);

  constructor() {
    console.log('[CvMigrationService] Initializing CV migration coordinator');
    this.logCurrentStrategy();
  }

  /**
   * Get current migration strategy based on feature flags
   */
  getCurrentStrategy(): MigrationStrategy {
    const flags = this.featureToggle.getCvMigrationStrategy();
    
    return {
      useNewExperienceService: flags.useRealServices && flags.useStandardizedModels,
      useNewEducationService: flags.useRealServices && flags.useStandardizedModels,
      useNewStateManagement: flags.useRealServices,
      enableDataValidation: flags.useEnhancedValidation,
      enableErrorRecovery: true, // Always enabled for safety
      fallbackToLegacy: !flags.useRealServices
    };
  }

  /**
   * Get current migration status
   */
  getMigrationStatus(): MigrationStatus {
    const strategy = this.getCurrentStrategy();
    
    let phase: 'legacy' | 'hybrid' | 'new';
    if (strategy.fallbackToLegacy) {
      phase = 'legacy';
    } else if (strategy.useNewExperienceService && strategy.useNewEducationService) {
      phase = 'new';
    } else {
      phase = 'hybrid';
    }

    return {
      phase,
      experienceService: strategy.useNewExperienceService ? 'new' : 'legacy',
      educationService: strategy.useNewEducationService ? 'new' : 'legacy',
      stateManagement: strategy.useNewStateManagement ? 'new' : 'legacy',
      lastMigrationCheck: new Date(),
      errors: [],
      warnings: []
    };
  }

  /**
   * Load user CV data using appropriate services
   */
  loadUserCv(userId: string): Observable<CvData> {
    const strategy = this.getCurrentStrategy();
    
    console.log(`[CvMigrationService] Loading CV for user ${userId} with strategy:`, strategy);

    if (strategy.useNewStateManagement) {
      return this.newStateService.loadUserCv(userId).pipe(
        catchError(error => this.handleLoadError(error, userId, strategy))
      );
    }

    // Fallback to manual coordination of legacy services
    return this.loadWithLegacyServices(userId, strategy);
  }

  /**
   * Create experience using appropriate service
   */
  createExperience(userId: string, experience: Experience): Observable<CvOperationResult<Experience>> {
    const strategy = this.getCurrentStrategy();
    
    if (strategy.useNewExperienceService) {
      return this.newExperienceService.create(userId, experience).pipe(
        catchError(error => this.handleExperienceError(error, 'create', userId, experience, strategy))
      );
    }

    return this.createExperienceWithLegacy(userId, experience);
  }

  /**
   * Update experience using appropriate service
   */
  updateExperience(id: string, experience: Experience): Observable<CvOperationResult<Experience>> {
    const strategy = this.getCurrentStrategy();
    
    if (strategy.useNewExperienceService) {
      return this.newExperienceService.update(id, experience).pipe(
        catchError(error => this.handleExperienceError(error, 'update', id, experience, strategy))
      );
    }

    return this.updateExperienceWithLegacy(id, experience);
  }

  /**
   * Delete experience using appropriate service
   */
  deleteExperience(id: string): Observable<CvOperationResult<void>> {
    const strategy = this.getCurrentStrategy();
    
    if (strategy.useNewExperienceService) {
      return this.newExperienceService.delete(id).pipe(
        catchError(error => this.handleExperienceError(error, 'delete', id, null, strategy))
      );
    }

    return this.deleteExperienceWithLegacy(id);
  }

  /**
   * Create education using appropriate service
   */
  createEducation(userId: string, education: Education): Observable<CvOperationResult<Education>> {
    const strategy = this.getCurrentStrategy();
    
    if (strategy.useNewEducationService) {
      return this.newEducationService.create(userId, education).pipe(
        catchError(error => this.handleEducationError(error, 'create', userId, education, strategy))
      );
    }

    return this.createEducationWithLegacy(userId, education);
  }

  /**
   * Update education using appropriate service
   */
  updateEducation(id: string, education: Education): Observable<CvOperationResult<Education>> {
    const strategy = this.getCurrentStrategy();
    
    if (strategy.useNewEducationService) {
      return this.newEducationService.update(id, education).pipe(
        catchError(error => this.handleEducationError(error, 'update', id, education, strategy))
      );
    }

    return this.updateEducationWithLegacy(id, education);
  }

  /**
   * Delete education using appropriate service
   */
  deleteEducation(id: string): Observable<CvOperationResult<void>> {
    const strategy = this.getCurrentStrategy();
    
    if (strategy.useNewEducationService) {
      return this.newEducationService.delete(id).pipe(
        catchError(error => this.handleEducationError(error, 'delete', id, null, strategy))
      );
    }

    return this.deleteEducationWithLegacy(id);
  }

  /**
   * Test migration readiness
   */
  testMigrationReadiness(): Observable<{ ready: boolean; issues: string[] }> {
    console.log('[CvMigrationService] Testing migration readiness...');
    
    const issues: string[] = [];
    
    // Test feature flags
    const flags = this.featureToggle.getCvMigrationStrategy();
    if (!flags.useStandardizedModels) {
      issues.push('Standardized models feature flag not enabled');
    }
    
    // Test services availability
    try {
      const strategy = this.getCurrentStrategy();
      if (strategy.useNewExperienceService && !this.newExperienceService) {
        issues.push('New experience service not available');
      }
      if (strategy.useNewEducationService && !this.newEducationService) {
        issues.push('New education service not available');
      }
    } catch (error) {
      issues.push(`Service injection error: ${error}`);
    }

    const ready = issues.length === 0;
    
    console.log(`[CvMigrationService] Migration readiness: ${ready ? 'READY' : 'NOT READY'}`, { issues });
    
    return of({ ready, issues });
  }

  /**
   * Handle load errors with fallback
   */
  private handleLoadError(error: any, userId: string, strategy: MigrationStrategy): Observable<CvData> {
    console.error('[CvMigrationService] Load error, attempting fallback:', error);
    
    if (strategy.enableErrorRecovery && strategy.fallbackToLegacy) {
      console.log('[CvMigrationService] Falling back to legacy services');
      return this.loadWithLegacyServices(userId, strategy);
    }
    
    return throwError(() => error);
  }

  /**
   * Load CV data using legacy services
   */
  private loadWithLegacyServices(userId: string, strategy: MigrationStrategy): Observable<CvData> {
    console.log('[CvMigrationService] Loading with legacy services');
    
    return forkJoin({
      experiences: this.legacyExperienceService.getAllExperiencesByUserId(userId).pipe(
        map(responses => responses.map(response => CvMappers.fromLegacyExperience(response))),
        catchError(() => of([]))
      ),
      education: this.legacyEducationService.obtenerEducacionPorUsuario(userId).pipe(
        map(response => {
          if (response.exito && response.data) {
            return response.data.map(edu => CvMappers.fromLegacyEducation(edu));
          }
          return [];
        }),
        catchError(() => of([]))
      )
    }).pipe(
      map(({ experiences, education }) => ({
        experiences,
        education,
        lastUpdated: new Date()
      }))
    );
  }

  /**
   * Handle experience operation errors
   */
  private handleExperienceError(
    error: any, 
    operation: string, 
    id: string, 
    experience: Experience | null, 
    strategy: MigrationStrategy
  ): Observable<CvOperationResult<any>> {
    console.error(`[CvMigrationService] Experience ${operation} error:`, error);
    
    if (strategy.enableErrorRecovery && strategy.fallbackToLegacy) {
      console.log(`[CvMigrationService] Falling back to legacy for experience ${operation}`);
      
      switch (operation) {
        case 'create':
          return this.createExperienceWithLegacy(id, experience!);
        case 'update':
          return this.updateExperienceWithLegacy(id, experience!);
        case 'delete':
          return this.deleteExperienceWithLegacy(id);
        default:
          return throwError(() => error);
      }
    }
    
    return throwError(() => error);
  }

  /**
   * Handle education operation errors
   */
  private handleEducationError(
    error: any, 
    operation: string, 
    id: string, 
    education: Education | null, 
    strategy: MigrationStrategy
  ): Observable<CvOperationResult<any>> {
    console.error(`[CvMigrationService] Education ${operation} error:`, error);
    
    if (strategy.enableErrorRecovery && strategy.fallbackToLegacy) {
      console.log(`[CvMigrationService] Falling back to legacy for education ${operation}`);
      
      switch (operation) {
        case 'create':
          return this.createEducationWithLegacy(id, education!);
        case 'update':
          return this.updateEducationWithLegacy(id, education!);
        case 'delete':
          return this.deleteEducationWithLegacy(id);
        default:
          return throwError(() => error);
      }
    }
    
    return throwError(() => error);
  }

  // Legacy service operations (simplified implementations)
  private createExperienceWithLegacy(userId: string, experience: Experience): Observable<CvOperationResult<Experience>> {
    // Convert to legacy format and call legacy service
    const legacyRequest = CvMappers.toLegacyExperienceRequest(experience);
    
    return this.legacyExperienceService.createExperience(userId, legacyRequest).pipe(
      map(response => ({
        success: true,
        data: CvMappers.fromLegacyExperience(response),
        message: 'Experiencia creada con servicio legacy'
      })),
      catchError(error => of({
        success: false,
        error: error.message,
        message: 'Error al crear experiencia con servicio legacy'
      }))
    );
  }

  private updateExperienceWithLegacy(id: string, experience: Experience): Observable<CvOperationResult<Experience>> {
    const legacyRequest = CvMappers.toLegacyExperienceRequest(experience);
    
    return this.legacyExperienceService.updateExperience(id, legacyRequest).pipe(
      map(response => ({
        success: true,
        data: CvMappers.fromLegacyExperience(response),
        message: 'Experiencia actualizada con servicio legacy'
      })),
      catchError(error => of({
        success: false,
        error: error.message,
        message: 'Error al actualizar experiencia con servicio legacy'
      }))
    );
  }

  private deleteExperienceWithLegacy(id: string): Observable<CvOperationResult<void>> {
    return this.legacyExperienceService.deleteExperience(id).pipe(
      map(() => ({
        success: true,
        message: 'Experiencia eliminada con servicio legacy'
      })),
      catchError(error => of({
        success: false,
        error: error.message,
        message: 'Error al eliminar experiencia con servicio legacy'
      }))
    );
  }

  private createEducationWithLegacy(userId: string, education: Education): Observable<CvOperationResult<Education>> {
    // Simplified legacy education creation
    return of({
      success: false,
      error: 'Legacy education service not fully implemented',
      message: 'Funcionalidad no disponible en servicio legacy'
    });
  }

  private updateEducationWithLegacy(id: string, education: Education): Observable<CvOperationResult<Education>> {
    return of({
      success: false,
      error: 'Legacy education service not fully implemented',
      message: 'Funcionalidad no disponible en servicio legacy'
    });
  }

  private deleteEducationWithLegacy(id: string): Observable<CvOperationResult<void>> {
    return of({
      success: false,
      error: 'Legacy education service not fully implemented',
      message: 'Funcionalidad no disponible en servicio legacy'
    });
  }

  /**
   * Log current strategy
   */
  private logCurrentStrategy(): void {
    const strategy = this.getCurrentStrategy();
    const status = this.getMigrationStatus();
    
    console.log('[CvMigrationService] Current migration status:', {
      phase: status.phase,
      strategy,
      services: {
        experience: status.experienceService,
        education: status.educationService,
        state: status.stateManagement
      }
    });
  }
}
