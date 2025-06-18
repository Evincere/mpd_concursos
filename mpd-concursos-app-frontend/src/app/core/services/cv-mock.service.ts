import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { ExperienceSimple, EducationSimple, ApiResponse } from '@core/models/cv-simple.model';

/**
 * Servicio mock para testing del sistema CV
 */
@Injectable({
  providedIn: 'root'
})
export class CvMockService {

  private mockExperiences: ExperienceSimple[] = [
    {
      id: '1',
      usuarioId: '287b3059-7c89-4054-a4f4-f771447677a02',
      company: 'Tech Solutions SA',
      position: 'Desarrollador Frontend',
      startDate: new Date('2022-01-15'),
      endDate: new Date('2023-12-31'),
      description: 'Desarrollo de aplicaciones web con Angular y TypeScript',
      comments: 'Proyecto exitoso con tecnologías modernas'
    },
    {
      id: '2',
      usuarioId: '287b3059-7c89-4054-a4f4-f771447677a02',
      company: 'Digital Agency',
      position: 'Analista de Sistemas',
      startDate: new Date('2020-03-01'),
      endDate: new Date('2021-12-31'),
      description: 'Análisis y diseño de sistemas de información',
      comments: 'Experiencia en metodologías ágiles'
    }
  ];

  private mockEducation: EducationSimple[] = [
    {
      id: '1',
      usuarioId: '287b3059-7c89-4054-a4f4-f771447677a02',
      title: 'Licenciatura en Sistemas de Información',
      institution: 'Universidad Nacional de Córdoba',
      type: 'Título Universitario',
      issueDate: new Date('2019-12-15'),
      status: 'Completado',
      comments: 'Promedio: 8.5/10'
    },
    {
      id: '2',
      usuarioId: '287b3059-7c89-4054-a4f4-f771447677a02',
      title: 'Curso de Angular Avanzado',
      institution: 'Platzi',
      type: 'Curso de Capacitación',
      issueDate: new Date('2023-06-30'),
      status: 'Completado',
      comments: 'Certificación en desarrollo frontend'
    }
  ];

  /**
   * Obtener experiencias del usuario
   */
  getExperiences(userId: string): Observable<ApiResponse<ExperienceSimple[]>> {
    return of({
      exito: true,
      data: this.mockExperiences,
      mensaje: 'Experiencias cargadas correctamente (MOCK)'
    }).pipe(delay(500));
  }

  /**
   * Crear nueva experiencia
   */
  createExperience(userId: string, experience: Partial<ExperienceSimple>): Observable<ApiResponse<ExperienceSimple>> {
    const newExperience: ExperienceSimple = {
      id: Date.now().toString(),
      usuarioId: userId,
      company: experience.company || '',
      position: experience.position || '',
      startDate: experience.startDate || new Date(),
      endDate: experience.endDate,
      description: experience.description,
      comments: experience.comments
    };

    this.mockExperiences.push(newExperience);

    return of({
      exito: true,
      data: newExperience,
      mensaje: 'Experiencia creada correctamente (MOCK)'
    }).pipe(delay(500));
  }

  /**
   * Actualizar experiencia
   */
  updateExperience(experienceId: string, experience: Partial<ExperienceSimple>): Observable<ApiResponse<ExperienceSimple>> {
    const index = this.mockExperiences.findIndex(exp => exp.id === experienceId);
    if (index !== -1) {
      this.mockExperiences[index] = { ...this.mockExperiences[index], ...experience };
      return of({
        exito: true,
        data: this.mockExperiences[index],
        mensaje: 'Experiencia actualizada correctamente (MOCK)'
      }).pipe(delay(500));
    }

    return of({
      exito: false,
      error: 'Experiencia no encontrada',
      mensaje: 'Error al actualizar experiencia (MOCK)'
    }).pipe(delay(500));
  }

  /**
   * Eliminar experiencia
   */
  deleteExperience(experienceId: string): Observable<ApiResponse<boolean>> {
    const index = this.mockExperiences.findIndex(exp => exp.id === experienceId);
    if (index !== -1) {
      this.mockExperiences.splice(index, 1);
      return of({
        exito: true,
        data: true,
        mensaje: 'Experiencia eliminada correctamente (MOCK)'
      }).pipe(delay(500));
    }

    return of({
      exito: false,
      error: 'Experiencia no encontrada',
      mensaje: 'Error al eliminar experiencia (MOCK)'
    }).pipe(delay(500));
  }

  /**
   * Obtener educación del usuario
   */
  getEducation(userId: string): Observable<ApiResponse<EducationSimple[]>> {
    return of({
      exito: true,
      data: this.mockEducation,
      mensaje: 'Educación cargada correctamente (MOCK)'
    }).pipe(delay(500));
  }

  /**
   * Crear nueva educación
   */
  createEducation(userId: string, education: Partial<EducationSimple>): Observable<ApiResponse<EducationSimple>> {
    const newEducation: EducationSimple = {
      id: Date.now().toString(),
      usuarioId: userId,
      title: education.title || '',
      institution: education.institution || '',
      type: education.type || 'Título Universitario',
      issueDate: education.issueDate,
      status: education.status || 'En Curso',
      comments: education.comments
    };

    this.mockEducation.push(newEducation);

    return of({
      exito: true,
      data: newEducation,
      mensaje: 'Educación creada correctamente (MOCK)'
    }).pipe(delay(500));
  }

  /**
   * Actualizar educación
   */
  updateEducation(educationId: string, education: Partial<EducationSimple>): Observable<ApiResponse<EducationSimple>> {
    const index = this.mockEducation.findIndex(edu => edu.id === educationId);
    if (index !== -1) {
      this.mockEducation[index] = { ...this.mockEducation[index], ...education };
      return of({
        exito: true,
        data: this.mockEducation[index],
        mensaje: 'Educación actualizada correctamente (MOCK)'
      }).pipe(delay(500));
    }

    return of({
      exito: false,
      error: 'Educación no encontrada',
      mensaje: 'Error al actualizar educación (MOCK)'
    }).pipe(delay(500));
  }

  /**
   * Eliminar educación
   */
  deleteEducation(educationId: string): Observable<ApiResponse<boolean>> {
    const index = this.mockEducation.findIndex(edu => edu.id === educationId);
    if (index !== -1) {
      this.mockEducation.splice(index, 1);
      return of({
        exito: true,
        data: true,
        mensaje: 'Educación eliminada correctamente (MOCK)'
      }).pipe(delay(500));
    }

    return of({
      exito: false,
      error: 'Educación no encontrada',
      mensaje: 'Error al eliminar educación (MOCK)'
    }).pipe(delay(500));
  }
}
