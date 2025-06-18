/**
 * Real-time Validation Service - Advanced validation with visual feedback
 * 
 * This service provides enhanced real-time validation capabilities with:
 * - Debounced validation to avoid excessive API calls
 * - Visual feedback with animations
 * - Context-aware validation rules
 * - Accessibility support
 */

import { Injectable, inject } from '@angular/core';
import { FormControl, ValidatorFn, AbstractControl } from '@angular/forms';
import { Observable, Subject, BehaviorSubject, of, timer } from 'rxjs';
import { 
  debounceTime, 
  distinctUntilChanged, 
  switchMap, 
  map, 
  catchError,
  tap,
  shareReplay
} from 'rxjs/operators';

import { CvValidators } from '../../core/validators';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: ValidationSuggestion[];
  score: number; // 0-100 quality score
}

export interface ValidationError {
  code: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  field?: string;
  position?: number;
}

export interface ValidationWarning {
  code: string;
  message: string;
  suggestion?: string;
  field?: string;
}

export interface ValidationSuggestion {
  code: string;
  message: string;
  action?: string;
  autoFix?: boolean;
}

export interface ValidationConfig {
  debounceTime?: number;
  enableSuggestions?: boolean;
  enableQualityScore?: boolean;
  enableAccessibility?: boolean;
  strictMode?: boolean;
  context?: 'experience' | 'education' | 'general';
}

export interface FieldValidationState {
  fieldId: string;
  value: any;
  isValidating: boolean;
  result: ValidationResult | null;
  lastValidated: Date | null;
  validationCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class RealTimeValidationService {
  
  private validationSubjects = new Map<string, Subject<any>>();
  private validationStates = new Map<string, BehaviorSubject<FieldValidationState>>();
  private validationCache = new Map<string, ValidationResult>();
  
  private defaultConfig: ValidationConfig = {
    debounceTime: 300,
    enableSuggestions: true,
    enableQualityScore: true,
    enableAccessibility: true,
    strictMode: false,
    context: 'general'
  };

  /**
   * Register a field for real-time validation
   */
  registerField(
    fieldId: string, 
    validators: ValidatorFn[], 
    config: Partial<ValidationConfig> = {}
  ): Observable<FieldValidationState> {
    
    const mergedConfig = { ...this.defaultConfig, ...config };
    
    // Create validation subject if it doesn't exist
    if (!this.validationSubjects.has(fieldId)) {
      this.validationSubjects.set(fieldId, new Subject<any>());
    }
    
    // Create validation state if it doesn't exist
    if (!this.validationStates.has(fieldId)) {
      const initialState: FieldValidationState = {
        fieldId,
        value: null,
        isValidating: false,
        result: null,
        lastValidated: null,
        validationCount: 0
      };
      this.validationStates.set(fieldId, new BehaviorSubject(initialState));
    }
    
    const subject = this.validationSubjects.get(fieldId)!;
    const stateSubject = this.validationStates.get(fieldId)!;
    
    // Setup validation pipeline
    subject.pipe(
      debounceTime(mergedConfig.debounceTime!),
      distinctUntilChanged(),
      tap(value => {
        // Update state to show validation in progress
        const currentState = stateSubject.value;
        stateSubject.next({
          ...currentState,
          value,
          isValidating: true,
          validationCount: currentState.validationCount + 1
        });
      }),
      switchMap(value => this.validateValue(value, validators, mergedConfig)),
      tap(result => {
        // Update state with validation result
        const currentState = stateSubject.value;
        stateSubject.next({
          ...currentState,
          isValidating: false,
          result,
          lastValidated: new Date()
        });
        
        // Cache result for performance
        const cacheKey = this.getCacheKey(fieldId, currentState.value);
        this.validationCache.set(cacheKey, result);
      }),
      catchError(error => {
        console.error(`[RealTimeValidationService] Validation error for field ${fieldId}:`, error);
        
        // Update state with error
        const currentState = stateSubject.value;
        stateSubject.next({
          ...currentState,
          isValidating: false,
          result: {
            isValid: false,
            errors: [{
              code: 'VALIDATION_ERROR',
              message: 'Error interno de validación',
              severity: 'error'
            }],
            warnings: [],
            suggestions: [],
            score: 0
          },
          lastValidated: new Date()
        });
        
        return of(null);
      }),
      shareReplay(1)
    ).subscribe();
    
    return stateSubject.asObservable();
  }

  /**
   * Validate a value immediately
   */
  validateValue(
    value: any, 
    validators: ValidatorFn[], 
    config: ValidationConfig
  ): Observable<ValidationResult> {
    
    // Check cache first
    const cacheKey = this.getCacheKey('immediate', value);
    const cachedResult = this.validationCache.get(cacheKey);
    if (cachedResult) {
      return of(cachedResult);
    }
    
    return timer(0).pipe(
      map(() => {
        const control = new FormControl(value);
        const errors: ValidationError[] = [];
        const warnings: ValidationWarning[] = [];
        const suggestions: ValidationSuggestion[] = [];
        
        // Apply standard validators
        validators.forEach(validator => {
          const result = validator(control);
          if (result) {
            Object.keys(result).forEach(key => {
              errors.push(this.mapValidationError(key, result[key], value));
            });
          }
        });
        
        // Apply context-specific validations
        this.applyContextValidations(value, config.context!, errors, warnings, suggestions);
        
        // Apply enhanced validations
        if (config.enableSuggestions) {
          this.generateSuggestions(value, config.context!, suggestions);
        }
        
        // Calculate quality score
        let score = 100;
        if (config.enableQualityScore) {
          score = this.calculateQualityScore(value, errors, warnings, config.context!);
        }
        
        const result: ValidationResult = {
          isValid: errors.length === 0,
          errors,
          warnings,
          suggestions,
          score
        };
        
        // Cache result
        this.validationCache.set(cacheKey, result);
        
        return result;
      })
    );
  }

  /**
   * Trigger validation for a specific field
   */
  validateField(fieldId: string, value: any): void {
    const subject = this.validationSubjects.get(fieldId);
    if (subject) {
      subject.next(value);
    }
  }

  /**
   * Get current validation state for a field
   */
  getFieldState(fieldId: string): FieldValidationState | null {
    const stateSubject = this.validationStates.get(fieldId);
    return stateSubject ? stateSubject.value : null;
  }

  /**
   * Clear validation state for a field
   */
  clearField(fieldId: string): void {
    this.validationSubjects.delete(fieldId);
    this.validationStates.delete(fieldId);
    
    // Clear related cache entries
    Array.from(this.validationCache.keys())
      .filter(key => key.startsWith(fieldId))
      .forEach(key => this.validationCache.delete(key));
  }

  /**
   * Clear all validation states
   */
  clearAll(): void {
    this.validationSubjects.clear();
    this.validationStates.clear();
    this.validationCache.clear();
  }

  /**
   * Get validation statistics
   */
  getValidationStats(): {
    activeFields: number;
    cacheSize: number;
    totalValidations: number;
  } {
    const totalValidations = Array.from(this.validationStates.values())
      .reduce((sum, state) => sum + state.value.validationCount, 0);
    
    return {
      activeFields: this.validationStates.size,
      cacheSize: this.validationCache.size,
      totalValidations
    };
  }

  /**
   * Apply context-specific validations
   */
  private applyContextValidations(
    value: any, 
    context: string, 
    errors: ValidationError[], 
    warnings: ValidationWarning[], 
    suggestions: ValidationSuggestion[]
  ): void {
    
    if (!value || typeof value !== 'string') return;
    
    // XSS validation
    if (CvValidators.containsDangerousContent(value)) {
      errors.push({
        code: 'XSS_CONTENT',
        message: 'El contenido contiene caracteres potencialmente peligrosos',
        severity: 'error'
      });
    }
    
    // Context-specific validations
    switch (context) {
      case 'experience':
        this.validateExperienceContext(value, warnings, suggestions);
        break;
      case 'education':
        this.validateEducationContext(value, warnings, suggestions);
        break;
    }
    
    // General content quality checks
    this.validateContentQuality(value, warnings, suggestions);
  }

  /**
   * Validate experience-specific content
   */
  private validateExperienceContext(
    value: string, 
    warnings: ValidationWarning[], 
    suggestions: ValidationSuggestion[]
  ): void {
    
    // Check for common experience keywords
    const experienceKeywords = ['responsabilidades', 'logros', 'proyectos', 'equipo', 'resultados'];
    const hasKeywords = experienceKeywords.some(keyword => 
      value.toLowerCase().includes(keyword)
    );
    
    if (!hasKeywords && value.length > 50) {
      suggestions.push({
        code: 'EXPERIENCE_KEYWORDS',
        message: 'Considera incluir palabras clave como "responsabilidades", "logros" o "proyectos"',
        action: 'Agregar palabras clave relevantes'
      });
    }
    
    // Check for quantifiable achievements
    const hasNumbers = /\d+/.test(value);
    if (!hasNumbers && value.length > 100) {
      suggestions.push({
        code: 'QUANTIFIABLE_ACHIEVEMENTS',
        message: 'Incluye números o métricas para hacer más impactante tu experiencia',
        action: 'Agregar métricas cuantificables'
      });
    }
  }

  /**
   * Validate education-specific content
   */
  private validateEducationContext(
    value: string, 
    warnings: ValidationWarning[], 
    suggestions: ValidationSuggestion[]
  ): void {
    
    // Check for academic terms
    const academicKeywords = ['especialización', 'tesis', 'investigación', 'promedio', 'materias'];
    const hasAcademicTerms = academicKeywords.some(keyword => 
      value.toLowerCase().includes(keyword)
    );
    
    if (!hasAcademicTerms && value.length > 50) {
      suggestions.push({
        code: 'ACADEMIC_TERMS',
        message: 'Considera mencionar especialización, tesis o áreas de estudio relevantes',
        action: 'Agregar detalles académicos'
      });
    }
  }

  /**
   * Validate general content quality
   */
  private validateContentQuality(
    value: string, 
    warnings: ValidationWarning[], 
    suggestions: ValidationSuggestion[]
  ): void {
    
    // Check for excessive repetition
    const words = value.toLowerCase().split(/\s+/);
    const wordCount = new Map<string, number>();
    words.forEach(word => {
      if (word.length > 3) {
        wordCount.set(word, (wordCount.get(word) || 0) + 1);
      }
    });
    
    const repeatedWords = Array.from(wordCount.entries())
      .filter(([word, count]) => count > 3)
      .map(([word]) => word);
    
    if (repeatedWords.length > 0) {
      warnings.push({
        code: 'WORD_REPETITION',
        message: `Palabras repetidas frecuentemente: ${repeatedWords.join(', ')}`,
        suggestion: 'Considera usar sinónimos para mejorar la variedad'
      });
    }
    
    // Check for very short sentences
    const sentences = value.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const shortSentences = sentences.filter(s => s.trim().split(/\s+/).length < 4);
    
    if (shortSentences.length > sentences.length * 0.5) {
      suggestions.push({
        code: 'SENTENCE_LENGTH',
        message: 'Muchas oraciones son muy cortas. Considera combinar algunas para mejor fluidez',
        action: 'Expandir oraciones cortas'
      });
    }
  }

  /**
   * Generate intelligent suggestions
   */
  private generateSuggestions(
    value: any, 
    context: string, 
    suggestions: ValidationSuggestion[]
  ): void {
    
    if (!value || typeof value !== 'string') return;
    
    const length = value.length;
    
    // Length-based suggestions
    if (length < 20 && context !== 'general') {
      suggestions.push({
        code: 'TOO_SHORT',
        message: 'El contenido es muy breve. Considera agregar más detalles',
        action: 'Expandir descripción',
        autoFix: false
      });
    }
    
    if (length > 500) {
      suggestions.push({
        code: 'TOO_LONG',
        message: 'El contenido es muy extenso. Considera resumir los puntos principales',
        action: 'Resumir contenido',
        autoFix: false
      });
    }
    
    // Formatting suggestions
    if (!value.includes('.') && length > 50) {
      suggestions.push({
        code: 'NO_PUNCTUATION',
        message: 'Considera usar puntos para separar ideas',
        action: 'Agregar puntuación',
        autoFix: true
      });
    }
  }

  /**
   * Calculate content quality score
   */
  private calculateQualityScore(
    value: any, 
    errors: ValidationError[], 
    warnings: ValidationWarning[], 
    context: string
  ): number {
    
    if (!value || typeof value !== 'string') return 0;
    
    let score = 100;
    
    // Deduct for errors and warnings
    score -= errors.length * 20;
    score -= warnings.length * 10;
    
    // Length scoring
    const length = value.length;
    if (length < 10) score -= 30;
    else if (length < 20) score -= 15;
    else if (length > 1000) score -= 20;
    
    // Content quality factors
    const sentences = value.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length > 1) score += 10;
    
    const words = value.split(/\s+/).filter(w => w.length > 0);
    if (words.length > 10) score += 5;
    
    // Context-specific scoring
    if (context === 'experience') {
      const hasActionWords = /\b(desarrollé|implementé|lideré|gestioné|creé|optimicé)\b/i.test(value);
      if (hasActionWords) score += 10;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Map validation errors to standardized format
   */
  private mapValidationError(errorKey: string, errorValue: any, value: any): ValidationError {
    const errorMessages: { [key: string]: string } = {
      required: 'Este campo es requerido',
      minlength: `Debe tener al menos ${errorValue.requiredLength} caracteres`,
      maxlength: `No puede exceder ${errorValue.requiredLength} caracteres`,
      email: 'Debe ser un email válido',
      pattern: 'El formato no es válido'
    };
    
    return {
      code: errorKey.toUpperCase(),
      message: errorMessages[errorKey] || 'Valor inválido',
      severity: 'error',
      field: undefined,
      position: undefined
    };
  }

  /**
   * Generate cache key
   */
  private getCacheKey(fieldId: string, value: any): string {
    const valueHash = typeof value === 'string' 
      ? value.substring(0, 50) 
      : JSON.stringify(value).substring(0, 50);
    return `${fieldId}:${valueHash}`;
  }
}
