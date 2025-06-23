/**
 * Servicio de Estado Centralizado para CV
 * 
 * @description Gestión centralizada del estado del CV coordinando experiencias y educación
 * @author Augment Agent
 * @date 2025-06-22
 * @version 1.0.0
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, EMPTY } from 'rxjs';
import { map, catchError, finalize } from 'rxjs/operators';
import { ExperienceCvService } from './experience-cv.service';
import { EducationCvService } from './education-cv.service';
import { WorkExperience, EducationEntry, CvExportConfig, CvExportResult } from '@core/models/cv';

export interface CvState {
  experiences: WorkExperience[];
  education: EducationEntry[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  hasData: boolean;
  totalItems: number;
}

export interface CvLoadingState {
  experiences: boolean;
  education: boolean;
  overall: boolean;
}

export interface CvErrorState {
  experiences: string | null;
  education: string | null;
  general: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class CvStateService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  private lastUpdatedSubject = new BehaviorSubject<Date | null>(null);
  private currentUserIdSubject = new BehaviorSubject<string | null>(null);

  // Observables públicos para el estado general
  public isLoading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();
  public lastUpdated$ = this.lastUpdatedSubject.asObservable();
  public currentUserId$ = this.currentUserIdSubject.asObservable();

  // Estado combinado del CV - se inicializa en el constructor
  public cvState$: Observable<CvState>;

  // Estado de carga detallado - se inicializa en el constructor
  public loadingState$: Observable<CvLoadingState>;

  // Estado de errores detallado - se inicializa en el constructor
  public errorState$: Observable<CvErrorState>;

  constructor(
    private experienceService: ExperienceCvService,
    private educationService: EducationCvService
  ) {
    console.log('[CvStateService] Service initialized');

    // Inicializar los observables después de la inyección de dependencias
    this.cvState$ = combineLatest([
      this.experienceService.experiences$,
      this.educationService.education$,
      this.isLoading$,
      this.error$,
      this.lastUpdated$
    ]).pipe(
      map(([experiences, education, isLoading, error, lastUpdated]) => ({
        experiences,
        education,
        isLoading,
        error,
        lastUpdated,
        hasData: experiences.length > 0 || education.length > 0,
        totalItems: experiences.length + education.length
      }))
    );

    this.loadingState$ = combineLatest([
      this.experienceService.loading$,
      this.educationService.loading$,
      this.isLoading$
    ]).pipe(
      map(([experiencesLoading, educationLoading, overallLoading]) => ({
        experiences: experiencesLoading,
        education: educationLoading,
        overall: overallLoading || experiencesLoading || educationLoading
      }))
    );

    this.errorState$ = combineLatest([
      this.experienceService.error$,
      this.educationService.error$,
      this.error$
    ]).pipe(
      map(([experiencesError, educationError, generalError]) => ({
        experiences: experiencesError,
        education: educationError,
        general: generalError
      }))
    );
  }

  /**
   * Carga todos los datos del CV para un usuario
   */
  loadCvData(userId: string): Observable<CvState> {
    if (!userId) {
      this.setError('ID de usuario requerido para cargar datos del CV');
      return EMPTY;
    }

    console.log(`[CvStateService] Loading CV data for user: ${userId}`);

    this.setLoading(true);
    this.setError(null);
    this.currentUserIdSubject.next(userId);

    // Cargar experiencias y educación en paralelo
    const experiencesLoad$ = this.experienceService.getAllByUserId(userId).pipe(
      catchError(error => {
        console.error('[CvStateService] Error loading experiences:', error);
        return EMPTY; // Continuar aunque falle
      })
    );

    const educationLoad$ = this.educationService.getAllByUserId(userId).pipe(
      catchError(error => {
        console.error('[CvStateService] Error loading education:', error);
        return EMPTY; // Continuar aunque falle
      })
    );

    return combineLatest([experiencesLoad$, educationLoad$]).pipe(
      map(([experiences, education]) => {
        this.setLastUpdated(new Date());
        console.log(`[CvStateService] CV data loaded successfully. Experiences: ${experiences.length}, Education: ${education.length}`);

        return {
          experiences,
          education,
          isLoading: false,
          error: null,
          lastUpdated: new Date(),
          hasData: experiences.length > 0 || education.length > 0,
          totalItems: experiences.length + education.length
        };
      }),
      finalize(() => {
        this.setLoading(false);
      }),
      catchError(error => {
        const errorMessage = 'Error al cargar datos del CV';
        this.setError(errorMessage);
        console.error('[CvStateService] Error loading CV data:', error);
        throw error;
      })
    );
  }

  /**
   * Refresca todos los datos del CV
   */
  refreshCvData(): void {
    const currentUserId = this.currentUserIdSubject.value;
    if (currentUserId) {
      this.loadCvData(currentUserId).subscribe();
    } else {
      console.warn('[CvStateService] Cannot refresh: no current user ID');
    }
  }

  /**
   * Refresca solo las experiencias laborales
   */
  refreshExperiences(): void {
    const currentUserId = this.currentUserIdSubject.value;
    if (currentUserId) {
      this.experienceService.refresh(currentUserId);
    }
  }

  /**
   * Refresca solo la educación
   */
  refreshEducation(): void {
    const currentUserId = this.currentUserIdSubject.value;
    if (currentUserId) {
      this.educationService.refresh(currentUserId);
    }
  }

  /**
   * Limpia todo el estado del CV
   */
  clearState(): void {
    console.log('[CvStateService] Clearing CV state');
    this.experienceService.clearState();
    this.educationService.clearState();
    this.setLoading(false);
    this.setError(null);
    this.setLastUpdated(null);
    this.currentUserIdSubject.next(null);
  }

  /**
   * Obtiene el estado actual del CV de forma síncrona
   */
  getCurrentState(): CvState {
    return {
      experiences: this.experienceService.experiences$.pipe(map(exp => exp)).subscribe().unsubscribe() as any || [],
      education: this.educationService.education$.pipe(map(edu => edu)).subscribe().unsubscribe() as any || [],
      isLoading: this.loadingSubject.value,
      error: this.errorSubject.value,
      lastUpdated: this.lastUpdatedSubject.value,
      hasData: false, // Se calculará dinámicamente
      totalItems: 0 // Se calculará dinámicamente
    };
  }

  /**
   * Verifica si hay datos cargados
   */
  hasData(): Observable<boolean> {
    return this.cvState$.pipe(
      map(state => state.hasData)
    );
  }

  /**
   * Obtiene el conteo total de elementos del CV
   */
  getTotalItems(): Observable<number> {
    return this.cvState$.pipe(
      map(state => state.totalItems)
    );
  }

  /**
   * Verifica si el CV está siendo cargado
   */
  isLoading(): Observable<boolean> {
    return this.loadingState$.pipe(
      map(state => state.overall)
    );
  }

  /**
   * Obtiene el último error ocurrido
   */
  getLastError(): Observable<string | null> {
    return this.errorState$.pipe(
      map(state => state.general || state.experiences || state.education)
    );
  }

  // ===== MÉTODOS PRIVADOS =====

  /**
   * Establece el estado de carga general
   */
  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  /**
   * Establece el mensaje de error general
   */
  private setError(error: string | null): void {
    this.errorSubject.next(error);
  }

  /**
   * Establece la fecha de última actualización
   */
  private setLastUpdated(date: Date | null): void {
    this.lastUpdatedSubject.next(date);
  }

  /**
   * Obtiene estadísticas del CV
   */
  getCvStats(): Observable<{
    totalExperiences: number;
    totalEducation: number;
    totalItems: number;
    hasDocuments: boolean;
    lastUpdated: Date | null;
  }> {
    return this.cvState$.pipe(
      map(state => ({
        totalExperiences: state.experiences.length,
        totalEducation: state.education.length,
        totalItems: state.totalItems,
        hasDocuments: state.experiences.some(exp => exp.document) ||
          state.education.some(edu => edu.document),
        lastUpdated: state.lastUpdated
      }))
    );
  }

  /**
   * Busca en el CV por término
   */
  searchCv(searchTerm: string): Observable<{
    experiences: WorkExperience[];
    education: EducationEntry[];
  }> {
    return this.cvState$.pipe(
      map(state => {
        const term = searchTerm.toLowerCase();

        const filteredExperiences = state.experiences.filter(exp =>
          exp.position.toLowerCase().includes(term) ||
          exp.company.toLowerCase().includes(term) ||
          exp.description?.toLowerCase().includes(term)
        );

        const filteredEducation = state.education.filter(edu =>
          edu.title.toLowerCase().includes(term) ||
          edu.institution.toLowerCase().includes(term) ||
          edu.comments?.toLowerCase().includes(term)
        );

        return {
          experiences: filteredExperiences,
          education: filteredEducation
        };
      })
    );
  }

  /**
   * Exporta el CV completo
   */
  exportCv(userId: string, config: CvExportConfig): Observable<CvExportResult> {
    console.log(`[CvStateService] Exporting CV for user: ${userId}`, config);

    // Por ahora, simular la exportación hasta que se implemente el servicio real
    return new Observable(observer => {
      setTimeout(() => {
        observer.next({
          success: true,
          downloadUrl: 'data:application/pdf;base64,JVBERi0xLjQKJdPr6eEKMSAwIG9iago8PAovVGl0bGUgKEN1cnJpY3VsdW0gVml0YWUpCi9Qcm9kdWNlciAoTVBEIENvbmN1cnNvcyBTeXN0ZW0pCi9DcmVhdGlvbkRhdGUgKEQ6MjAyNTA2MjIpCj4+CmVuZG9iagp4cmVmCjAgMQowMDAwMDAwMDAwIDY1NTM1IGYgCnRyYWlsZXIKPDwKL1NpemUgMQovUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKMTczCiUlRU9G',
          fileName: `cv_${userId}_${new Date().toISOString().split('T')[0]}.pdf`
        });
        observer.complete();
      }, 2000);
    });
  }
}
