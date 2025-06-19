import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { LoggingService } from '@core/services/logging/logging.service';
import { DocumentoValidationService, RequiredDocument, DocumentationCompletenessResult } from '@core/services/documentos/documento-validation.service';
import { DocumentoUsuario } from '@core/models/documento.model';

/**
 * Estado unificado de documentación para inscripción
 */
export interface InscriptionDocumentationState {
  requiredDocuments: RequiredDocument[];
  userDocuments: DocumentoUsuario[];
  completenessResult: DocumentationCompletenessResult;
  provisionalAccepted: boolean;
  isLoading: boolean;
  lastUpdated: Date;
}

/**
 * Servicio centralizado para gestión de documentación en inscripciones
 * Elimina duplicaciones y unifica la lógica de validación
 */
@Injectable({
  providedIn: 'root'
})
export class InscriptionDocumentationService {
  
  private readonly _documentationState$ = new BehaviorSubject<InscriptionDocumentationState>({
    requiredDocuments: [],
    userDocuments: [],
    completenessResult: {
      allDocumentsComplete: false,
      completedCount: 0,
      totalCount: 0,
      missingDocuments: [],
      canProceedWithProvisional: false
    },
    provisionalAccepted: false,
    isLoading: false,
    lastUpdated: new Date()
  });

  /**
   * Observable del estado de documentación
   */
  public readonly documentationState$ = this._documentationState$.asObservable();

  /**
   * Observable que indica si se puede proceder con el paso actual
   */
  public readonly canProceed$ = this.documentationState$.pipe(
    map(state => state.completenessResult.canProceedWithProvisional)
  );

  /**
   * Observable del progreso de documentación (0-100)
   */
  public readonly progress$ = this.documentationState$.pipe(
    map(state => this.documentoValidationService.calculateDocumentationProgress(state.requiredDocuments))
  );

  constructor(
    private loggingService: LoggingService,
    private documentoValidationService: DocumentoValidationService
  ) {
    this.loggingService.debug('[InscriptionDocumentationService] Servicio inicializado', undefined, 'InscriptionDocumentationService');
  }

  /**
   * Inicializa el estado de documentación para un concurso
   * @param contestId ID del concurso
   * @param requiredDocuments Documentos requeridos
   * @param userDocuments Documentos del usuario
   */
  initializeDocumentationState(
    contestId: number,
    requiredDocuments: RequiredDocument[],
    userDocuments: DocumentoUsuario[]
  ): void {
    this.loggingService.debug(
      `[InscriptionDocumentationService] Inicializando estado para concurso ${contestId}`,
      { requiredCount: requiredDocuments.length, userCount: userDocuments.length },
      'InscriptionDocumentationService'
    );

    this.updateDocumentationState(requiredDocuments, userDocuments, false);
  }

  /**
   * Actualiza el estado de documentación
   * @param requiredDocuments Documentos requeridos actualizados
   * @param userDocuments Documentos del usuario actualizados
   * @param provisionalAccepted Si se aceptó inscripción provisional
   */
  updateDocumentationState(
    requiredDocuments: RequiredDocument[],
    userDocuments: DocumentoUsuario[],
    provisionalAccepted: boolean
  ): void {
    // Actualizar el estado de completitud de documentos requeridos
    const updatedRequiredDocuments = this.updateDocumentCompletionStatus(requiredDocuments, userDocuments);
    
    // Validar completitud
    const completenessResult = this.documentoValidationService.validateDocumentationCompleteness(
      updatedRequiredDocuments,
      provisionalAccepted
    );

    const newState: InscriptionDocumentationState = {
      requiredDocuments: updatedRequiredDocuments,
      userDocuments,
      completenessResult,
      provisionalAccepted,
      isLoading: false,
      lastUpdated: new Date()
    };

    this._documentationState$.next(newState);

    this.loggingService.debug(
      '[InscriptionDocumentationService] Estado actualizado',
      { 
        completed: completenessResult.completedCount,
        total: completenessResult.totalCount,
        canProceed: completenessResult.canProceedWithProvisional,
        provisional: provisionalAccepted
      },
      'InscriptionDocumentationService'
    );
  }

  /**
   * Actualiza solo el estado de aceptación provisional
   * @param provisionalAccepted Nuevo estado de aceptación provisional
   */
  updateProvisionalAcceptance(provisionalAccepted: boolean): void {
    const currentState = this._documentationState$.value;
    
    const completenessResult = this.documentoValidationService.validateDocumentationCompleteness(
      currentState.requiredDocuments,
      provisionalAccepted
    );

    const newState: InscriptionDocumentationState = {
      ...currentState,
      provisionalAccepted,
      completenessResult,
      lastUpdated: new Date()
    };

    this._documentationState$.next(newState);

    this.loggingService.debug(
      `[InscriptionDocumentationService] Aceptación provisional actualizada: ${provisionalAccepted}`,
      { canProceed: completenessResult.canProceedWithProvisional },
      'InscriptionDocumentationService'
    );
  }

  /**
   * Obtiene el estado actual de documentación
   * @returns Estado actual
   */
  getCurrentState(): InscriptionDocumentationState {
    return this._documentationState$.value;
  }

  /**
   * Verifica si se puede proceder con el paso actual
   * @returns true si se puede proceder
   */
  canProceedWithCurrentState(): boolean {
    return this._documentationState$.value.completenessResult.canProceedWithProvisional;
  }

  /**
   * Obtiene los documentos faltantes
   * @returns Lista de documentos faltantes
   */
  getMissingDocuments(): RequiredDocument[] {
    return this._documentationState$.value.completenessResult.missingDocuments;
  }

  /**
   * Limpia el estado de documentación
   */
  clearDocumentationState(): void {
    this._documentationState$.next({
      requiredDocuments: [],
      userDocuments: [],
      completenessResult: {
        allDocumentsComplete: false,
        completedCount: 0,
        totalCount: 0,
        missingDocuments: [],
        canProceedWithProvisional: false
      },
      provisionalAccepted: false,
      isLoading: false,
      lastUpdated: new Date()
    });

    this.loggingService.debug('[InscriptionDocumentationService] Estado limpiado', undefined, 'InscriptionDocumentationService');
  }

  /**
   * SIMPLIFICADO: Actualiza el estado de completitud de documentos requeridos basado en documentos del usuario
   * CRITICAL FIX: Un documento se considera completado simplemente por haber sido subido,
   * independientemente de su estado de aprobación administrativa
   * @param requiredDocuments Documentos requeridos
   * @param userDocuments Documentos del usuario
   * @returns Documentos requeridos con estado actualizado
   */
  private updateDocumentCompletionStatus(
    requiredDocuments: RequiredDocument[],
    userDocuments: DocumentoUsuario[]
  ): RequiredDocument[] {

    // 🔍 DEBUGGING: Log detallado de documentos del usuario
    this.loggingService.debug('[InscriptionDocumentationService] === DOCUMENTOS DEL USUARIO ===', {
      userDocumentsCount: userDocuments.length,
      userDocuments: userDocuments.map(doc => ({
        tipoDocumentoId: doc.tipoDocumentoId,
        tipoDocumentoName: doc.tipoDocumento?.nombre,
        nombreArchivo: doc.nombreArchivo,
        estado: doc.estado
      }))
    }, 'InscriptionDocumentationService');

    const updatedDocuments = requiredDocuments.map(requiredDoc => {
      // ✅ CRITICAL FIX: Verificación directa para todos los documentos (incluidos DNI frente y dorso por separado)
      // Un documento se considera completado si existe, independientemente de su estado de aprobación
      const isUploaded = userDocuments.some(userDoc =>
        userDoc.tipoDocumento?.id === requiredDoc.tipoDocumentoId
      );

      // 🔍 DEBUGGING: Log de cada documento individual
      this.loggingService.debug(`[InscriptionDocumentationService] Documento: ${requiredDoc.title}`, {
        tipoDocumentoId: requiredDoc.tipoDocumentoId,
        required: requiredDoc.required,
        wasCompleted: requiredDoc.completed,
        nowCompleted: isUploaded,
        matchingUserDoc: userDocuments.find(userDoc => userDoc.tipoDocumento?.id === requiredDoc.tipoDocumentoId)?.nombreArchivo || 'No encontrado'
      }, 'InscriptionDocumentationService');

      return {
        ...requiredDoc,
        completed: isUploaded
      };
    });

    // 🔍 DEBUGGING: Resumen final
    const obligatoryDocs = updatedDocuments.filter(doc => doc.required);
    const completedObligatory = obligatoryDocs.filter(doc => doc.completed);

    this.loggingService.debug('[InscriptionDocumentationService] === RESUMEN FINAL ===', {
      totalRequired: requiredDocuments.length,
      obligatoryCount: obligatoryDocs.length,
      completedObligatoryCount: completedObligatory.length,
      allObligatoryComplete: completedObligatory.length === obligatoryDocs.length,
      missingObligatory: obligatoryDocs.filter(doc => !doc.completed).map(doc => doc.title)
    }, 'InscriptionDocumentationService');

    return updatedDocuments;
  }
}
