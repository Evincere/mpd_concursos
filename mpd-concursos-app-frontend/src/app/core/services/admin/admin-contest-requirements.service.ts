import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface ContestRequirement {
  id: number | string;
  contestId: number | string;
  description: string;
  category: string;
  required: boolean;
  priority: number;
  documentType?: string;
}

export interface RequirementTemplate {
  id: number | string;
  name: string;
  description: string;
  category: string;
  requirements: Omit<ContestRequirement, 'id' | 'contestId'>[];
}

export interface ContestRequirementCreateRequest {
  contestId: number | string;
  description: string;
  category: string;
  required: boolean;
  priority: number;
  documentType?: string;
}

export interface ContestRequirementUpdateRequest extends ContestRequirementCreateRequest {
  id: number | string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminContestRequirementsService {
  private apiUrl = `${environment.apiUrl}/admin/contests`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todos los requisitos de un concurso
   * @param contestId ID del concurso
   */
  getContestRequirements(contestId: number | string): Observable<ContestRequirement[]> {
    return this.http.get<ContestRequirement[]>(`${this.apiUrl}/${contestId}/requirements`).pipe(
      catchError(error => {
        console.error(`Error obteniendo requisitos del concurso ${contestId}:`, error);
        throw error;
      })
    );
  }



  /**
   * Obtiene un requisito por su ID
   * @param contestId ID del concurso
   * @param requirementId ID del requisito
   */
  getRequirementById(contestId: number | string, requirementId: number | string): Observable<ContestRequirement> {
    return this.http.get<ContestRequirement>(`${this.apiUrl}/${contestId}/requirements/${requirementId}`).pipe(
      catchError(error => {
        console.error(`Error obteniendo requisito con ID ${requirementId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Crea un nuevo requisito para un concurso
   * @param requirement Datos del requisito a crear
   */
  createRequirement(requirement: ContestRequirementCreateRequest): Observable<ContestRequirement> {
    return this.http.post<ContestRequirement>(
      `${this.apiUrl}/${requirement.contestId}/requirements`,
      requirement
    ).pipe(
      catchError(error => {
        console.error('Error creando requisito:', error);
        throw error;
      })
    );
  }

  /**
   * Actualiza un requisito existente
   * @param requirement Datos del requisito a actualizar
   */
  updateRequirement(requirement: ContestRequirementUpdateRequest): Observable<ContestRequirement> {
    return this.http.put<ContestRequirement>(
      `${this.apiUrl}/${requirement.contestId}/requirements/${requirement.id}`,
      requirement
    ).pipe(
      catchError(error => {
        console.error(`Error actualizando requisito con ID ${requirement.id}:`, error);
        throw error;
      })
    );
  }

  /**
   * Elimina un requisito
   * @param contestId ID del concurso
   * @param requirementId ID del requisito
   */
  deleteRequirement(contestId: number | string, requirementId: number | string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${contestId}/requirements/${requirementId}`).pipe(
      catchError(error => {
        console.error(`Error eliminando requisito con ID ${requirementId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Obtiene las categorías de requisitos disponibles
   */
  getRequirementCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/requirement-categories`).pipe(
      catchError(error => {
        console.error('Error obteniendo categorías de requisitos:', error);
        // Devolver categorías predeterminadas en caso de error
        return of([
          'DOCUMENTACION',
          'EXPERIENCIA',
          'FORMACION',
          'IDIOMAS',
          'INFORMATICA',
          'OTRO'
        ]);
      })
    );
  }

  /**
   * Obtiene los tipos de documentos disponibles
   */
  getDocumentTypes(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/document-types`).pipe(
      catchError(error => {
        console.error('Error obteniendo tipos de documentos:', error);
        // Devolver tipos predeterminados en caso de error
        return of([
          'DNI',
          'CURRICULUM',
          'TITULO',
          'CERTIFICADO_ANTECEDENTES',
          'CERTIFICADO_DOMICILIO',
          'OTRO'
        ]);
      })
    );
  }

  /**
   * Obtiene todas las plantillas de requisitos
   */
  getRequirementTemplates(): Observable<RequirementTemplate[]> {
    return this.http.get<RequirementTemplate[]>(`${this.apiUrl}/requirement-templates`).pipe(
      catchError(error => {
        console.error('Error obteniendo plantillas de requisitos:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtiene una plantilla de requisitos por su ID
   * @param templateId ID de la plantilla
   */
  getTemplateById(templateId: number | string): Observable<RequirementTemplate> {
    return this.http.get<RequirementTemplate>(`${this.apiUrl}/requirement-templates/${templateId}`).pipe(
      catchError(error => {
        console.error(`Error obteniendo plantilla con ID ${templateId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Crea una nueva plantilla de requisitos
   * @param template Datos de la plantilla a crear
   */
  createTemplate(template: Omit<RequirementTemplate, 'id'>): Observable<RequirementTemplate> {
    return this.http.post<RequirementTemplate>(`${this.apiUrl}/requirement-templates`, template).pipe(
      catchError(error => {
        console.error('Error creando plantilla de requisitos:', error);
        throw error;
      })
    );
  }

  /**
   * Actualiza una plantilla de requisitos existente
   * @param template Datos de la plantilla a actualizar
   */
  updateTemplate(template: RequirementTemplate): Observable<RequirementTemplate> {
    return this.http.put<RequirementTemplate>(
      `${this.apiUrl}/requirement-templates/${template.id}`,
      template
    ).pipe(
      catchError(error => {
        console.error(`Error actualizando plantilla con ID ${template.id}:`, error);
        throw error;
      })
    );
  }

  /**
   * Elimina una plantilla de requisitos
   * @param templateId ID de la plantilla
   */
  deleteTemplate(templateId: number | string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/requirement-templates/${templateId}`).pipe(
      catchError(error => {
        console.error(`Error eliminando plantilla con ID ${templateId}:`, error);
        throw error;
      })
    );
  }

  /**
   * Aplica una plantilla de requisitos a un concurso
   * @param contestId ID del concurso
   * @param templateId ID de la plantilla
   */
  applyTemplate(contestId: number | string, templateId: number | string): Observable<ContestRequirement[]> {
    return this.http.post<ContestRequirement[]>(
      `${this.apiUrl}/${contestId}/apply-template/${templateId}`,
      {}
    ).pipe(
      catchError(error => {
        console.error(`Error aplicando plantilla con ID ${templateId} al concurso con ID ${contestId}:`, error);
        throw error;
      })
    );
  }
}
