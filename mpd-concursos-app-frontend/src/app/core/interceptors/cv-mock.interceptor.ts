import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpResponse, HttpEvent } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { CvMockService } from '@core/services/cv-mock.service';
import { LoggingService } from '@core/services/logging.service';
import { ExperienceSimple, EducationSimple } from '@core/models/cv-simple.model';

/**
 * Interceptor funcional para redirigir llamadas de CV al mock service
 * Solo para testing - remover en producción
 */
export const cvMockInterceptor: HttpInterceptorFn = (req, next): Observable<HttpEvent<any>> => {
  const cvMockService = inject(CvMockService);
  const loggingService = inject(LoggingService);

  // Solo interceptar llamadas a APIs de CV
  if (req.url.includes('/api/experiencias') || req.url.includes('/api/educacion')) {

    loggingService.cvLog(`Mock Interceptor - ${req.method} ${req.url}`);

    // Extraer userId de la URL
    const userIdMatch = req.url.match(/\/usuario\/([^\/]+)/);
    const userId = userIdMatch ? userIdMatch[1] : '287b3059-7c89-4054-a4f4-f771447677a02';

    // Función helper para extraer ID de URL
    const extractIdFromUrl = (url: string): string => {
      const parts = url.split('/');
      return parts[parts.length - 1];
    };

    // Función helper para mapear respuesta
    const mapToHttpResponse = () => {
      return map((data: any) => new HttpResponse({
        status: 200,
        body: data
      }));
    };

    // Experiencias
    if (req.url.includes('/api/experiencias')) {
      if (req.method === 'GET' && req.url.includes('/usuario/')) {
        return cvMockService.getExperiences(userId).pipe(
          mapToHttpResponse()
        );
      }

      if (req.method === 'POST' && req.url.includes('/usuario/')) {
        return cvMockService.createExperience(userId, req.body as Partial<ExperienceSimple>).pipe(
          mapToHttpResponse()
        );
      }

      if (req.method === 'PUT') {
        const experienceId = extractIdFromUrl(req.url);
        return cvMockService.updateExperience(experienceId, req.body as Partial<ExperienceSimple>).pipe(
          mapToHttpResponse()
        );
      }

      if (req.method === 'DELETE') {
        const experienceId = extractIdFromUrl(req.url);
        return cvMockService.deleteExperience(experienceId).pipe(
          mapToHttpResponse()
        );
      }
    }

    // Educación
    if (req.url.includes('/api/educacion')) {
      if (req.method === 'GET' && req.url.includes('/usuario/')) {
        return cvMockService.getEducation(userId).pipe(
          mapToHttpResponse()
        );
      }

      if (req.method === 'POST' && req.url.includes('/usuario/')) {
        return cvMockService.createEducation(userId, req.body as Partial<EducationSimple>).pipe(
          mapToHttpResponse()
        );
      }

      if (req.method === 'PUT') {
        const educationId = extractIdFromUrl(req.url);
        return cvMockService.updateEducation(educationId, req.body as Partial<EducationSimple>).pipe(
          mapToHttpResponse()
        );
      }

      if (req.method === 'DELETE') {
        const educationId = extractIdFromUrl(req.url);
        return cvMockService.deleteEducation(educationId).pipe(
          mapToHttpResponse()
        );
      }
    }
  }

  // Para todas las demás llamadas, continuar normalmente
  return next(req);
};
