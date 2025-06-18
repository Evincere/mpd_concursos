/**
 * CV State Service - Centralized state management for CV data
 * 
 * This service provides a unified interface for managing CV state,
 * coordinating between experience and education services, and handling
 * feature flag-based service selection.
 */

import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, forkJoin, combineLatest, of } from 'rxjs';
import { map, tap, catchError, finalize, switchMap } from 'rxjs/operators';

import { 
  Experience, 
  Education, 
  CvData, 
  CvSummary, 
  CvLoadingState,
  CvOperationResult,
  EducationType 
} from '../../models/cv';
import { ExperienceCvService } from './experience-cv.service';
import { EducationCvService } from './education-cv.service';
import { FeatureToggleService } from '../feature-toggle.service';

@Injectable({
  providedIn: 'root'
})
export class CvStateService {
  
  private readonly experienceService = inject(ExperienceCvService);
  private readonly educationService = inject(EducationCvService);
  private readonly featureToggle = inject(FeatureToggleService);
  
  // Centralized state
  private cvDataSubject = new BehaviorSubject<CvData>({
    experiences: [],
    education: [],
    lastUpdated: new Date()
  });
  
  private loadingSubject = new BehaviorSubject<CvLoadingState>({
    isLoading: false,
    error: null,
    lastLoaded: null
  });

  // Public observables
  public cvData$ = this.cvDataSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  
  // Derived observables
  public experiences$ = this.cvData$.pipe(map(data => data.experiences));
  public education$ = this.cvData$.pipe(map(data => data.education));
  public summary$ = this.cvData$.pipe(map(data => this.calculateSummary(data)));

  constructor() {
    console.log('[CvStateService] Initializing CV state management');
    this.initializeStateSubscriptions();
  }

  /**
   * Load complete CV data for a user
   */
  loadUserCv(userId: string): Observable<CvData> {
    this.setLoading(true);
    
    console.log(`[CvStateService] Loading complete CV for user: ${userId}`);
    
    // Check feature flags to determine which services to use
    const strategy = this.featureToggle.getCvMigrationStrategy();
    
    if (!strategy.useRealServices) {
      console.log('[CvStateService] Using mock services (feature flag disabled)');
      return this.loadMockData(userId);
    }
    
    return forkJoin({
      experiences: this.experienceService.getAllByUserId(userId).pipe(
        catchError(error => {
          console.error('[CvStateService] Failed to load experiences:', error);
          return of([]);
        })
      ),
      education: this.educationService.getAllByUserId(userId).pipe(
        catchError(error => {
          console.error('[CvStateService] Failed to load education:', error);
          return of([]);
        })
      )
    }).pipe(
      map(({ experiences, education }) => {
        const cvData: CvData = {
          experiences,
          education,
          lastUpdated: new Date()
        };
        
        this.cvDataSubject.next(cvData);
        this.setLoading(false, null, new Date());
        
        console.log(`[CvStateService] CV loaded successfully:`, {
          experiencesCount: experiences.length,
          educationCount: education.length
        });
        
        return cvData;
      }),
      catchError(error => {
        console.error('[CvStateService] Failed to load CV:', error);
        this.setLoading(false, 'Error al cargar el currículum');
        throw error;
      })
    );
  }

  /**
   * Add new experience
   */
  addExperience(userId: string, experience: Experience): Observable<CvOperationResult<Experience>> {
    console.log('[CvStateService] Adding new experience');
    
    return this.experienceService.create(userId, experience).pipe(
      tap(result => {
        if (result.success && result.data) {
          this.updateCvData();
        }
      })
    );
  }

  /**
   * Update existing experience
   */
  updateExperience(id: string, experience: Experience): Observable<CvOperationResult<Experience>> {
    console.log(`[CvStateService] Updating experience: ${id}`);
    
    return this.experienceService.update(id, experience).pipe(
      tap(result => {
        if (result.success) {
          this.updateCvData();
        }
      })
    );
  }

  /**
   * Delete experience
   */
  deleteExperience(id: string): Observable<CvOperationResult<void>> {
    console.log(`[CvStateService] Deleting experience: ${id}`);
    
    return this.experienceService.delete(id).pipe(
      tap(result => {
        if (result.success) {
          this.updateCvData();
        }
      })
    );
  }

  /**
   * Add new education
   */
  addEducation(userId: string, education: Education): Observable<CvOperationResult<Education>> {
    console.log('[CvStateService] Adding new education');
    
    return this.educationService.create(userId, education).pipe(
      tap(result => {
        if (result.success && result.data) {
          this.updateCvData();
        }
      })
    );
  }

  /**
   * Update existing education
   */
  updateEducation(id: string, education: Education): Observable<CvOperationResult<Education>> {
    console.log(`[CvStateService] Updating education: ${id}`);
    
    return this.educationService.update(id, education).pipe(
      tap(result => {
        if (result.success) {
          this.updateCvData();
        }
      })
    );
  }

  /**
   * Delete education
   */
  deleteEducation(id: string): Observable<CvOperationResult<void>> {
    console.log(`[CvStateService] Deleting education: ${id}`);
    
    return this.educationService.delete(id).pipe(
      tap(result => {
        if (result.success) {
          this.updateCvData();
        }
      })
    );
  }

  /**
   * Get current CV data
   */
  getCurrentCvData(): CvData {
    return this.cvDataSubject.value;
  }

  /**
   * Clear all CV state
   */
  clearState(): void {
    this.experienceService.clearState();
    this.educationService.clearState();
    this.cvDataSubject.next({
      experiences: [],
      education: [],
      lastUpdated: new Date()
    });
    this.setLoading(false, null, null);
    console.log('[CvStateService] All state cleared');
  }

  /**
   * Refresh CV data
   */
  refresh(userId: string): Observable<CvData> {
    console.log('[CvStateService] Refreshing CV data');
    return this.loadUserCv(userId);
  }

  /**
   * Initialize state subscriptions
   */
  private initializeStateSubscriptions(): void {
    // Subscribe to individual service state changes
    combineLatest([
      this.experienceService.experiences$,
      this.educationService.education$
    ]).subscribe(([experiences, education]) => {
      const currentData = this.cvDataSubject.value;
      this.cvDataSubject.next({
        ...currentData,
        experiences,
        education,
        lastUpdated: new Date()
      });
    });
  }

  /**
   * Update CV data from individual services
   */
  private updateCvData(): void {
    const experiences = this.experienceService.getCurrentExperiences();
    const education = this.educationService.getCurrentEducation();
    
    this.cvDataSubject.next({
      experiences,
      education,
      lastUpdated: new Date()
    });
  }

  /**
   * Calculate CV summary
   */
  private calculateSummary(cvData: CvData): CvSummary {
    const { experiences, education } = cvData;
    
    // Calculate years of experience
    const yearsOfExperience = this.calculateYearsOfExperience(experiences);
    
    // Find highest education level
    const highestEducation = this.findHighestEducation(education);
    
    // Check if has documents
    const hasDocuments = experiences.some(exp => exp.documentUrl) || 
                        education.some(edu => edu.documentUrl);
    
    return {
      totalExperiences: experiences.length,
      totalEducation: education.length,
      yearsOfExperience,
      highestEducation,
      hasDocuments
    };
  }

  /**
   * Calculate total years of experience
   */
  private calculateYearsOfExperience(experiences: Experience[]): number {
    let totalMonths = 0;
    
    experiences.forEach(exp => {
      const startDate = new Date(exp.startDate);
      const endDate = exp.endDate ? new Date(exp.endDate) : new Date();
      
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
      totalMonths += diffMonths;
    });
    
    return Math.round(totalMonths / 12 * 10) / 10; // Round to 1 decimal
  }

  /**
   * Find highest education level
   */
  private findHighestEducation(education: Education[]): EducationType | null {
    if (education.length === 0) return null;
    
    const hierarchy = [
      EducationType.DOCTORATE,
      EducationType.MASTERS,
      EducationType.SPECIALIZATION,
      EducationType.UNIVERSITY_DEGREE,
      EducationType.HIGHER_EDUCATION,
      EducationType.DIPLOMA,
      EducationType.TRAINING_COURSE,
      EducationType.SCIENTIFIC_ACTIVITY
    ];
    
    for (const level of hierarchy) {
      if (education.some(edu => edu.type === level)) {
        return level;
      }
    }
    
    return education[0].type;
  }

  /**
   * Load mock data (fallback when real services are disabled)
   */
  private loadMockData(userId: string): Observable<CvData> {
    console.log('[CvStateService] Loading mock CV data');
    
    const mockData: CvData = {
      experiences: [],
      education: [],
      lastUpdated: new Date()
    };
    
    this.cvDataSubject.next(mockData);
    this.setLoading(false, null, new Date());
    
    return of(mockData);
  }

  /**
   * Set loading state
   */
  private setLoading(isLoading: boolean, error: string | null = null, lastLoaded: Date | null = null): void {
    this.loadingSubject.next({
      isLoading,
      error,
      lastLoaded: lastLoaded || this.loadingSubject.value.lastLoaded
    });
  }
}
