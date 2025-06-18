/**
 * CV Mappers Tests - Unit tests for CV model conversion utilities
 */

import { CvMappers } from './cv-mappers';
import { 
  Experience, 
  ExperienceResponse, 
  ExperienciaData,
  Education,
  EducationResponse,
  EducacionData,
  EducationType,
  EducationStatus,
  ScientificActivityType,
  ScientificActivityRole
} from '../models/cv';

describe('CvMappers', () => {

  describe('Experience Mapping', () => {
    
    describe('fromLegacyExperience', () => {
      it('should convert legacy experience with puesto field', () => {
        const legacy: ExperienciaData = {
          id: '123',
          puesto: 'Desarrollador Senior',
          empresa: 'Tech Corp',
          descripcion: 'Desarrollo de aplicaciones',
          fechaInicio: '2020-01-01',
          fechaFin: '2021-12-31',
          actual: false,
          ubicacion: 'Buenos Aires'
        };

        const result = CvMappers.fromLegacyExperience(legacy);

        expect(result).toEqual({
          id: '123',
          userId: '',
          position: 'Desarrollador Senior',
          company: 'Tech Corp',
          startDate: new Date('2020-01-01'),
          endDate: new Date('2021-12-31'),
          description: 'Desarrollo de aplicaciones',
          location: 'Buenos Aires',
          isCurrent: false
        });
      });

      it('should convert legacy experience with cargo field when puesto is missing', () => {
        const legacy: ExperienciaData = {
          id: '123',
          cargo: 'Analista de Sistemas',
          empresa: 'Tech Corp',
          fechaInicio: '2020-01-01'
        };

        const result = CvMappers.fromLegacyExperience(legacy);

        expect(result.position).toBe('Analista de Sistemas');
      });

      it('should handle Date objects in legacy data', () => {
        const legacy: ExperienciaData = {
          id: '123',
          puesto: 'Developer',
          empresa: 'Company',
          fechaInicio: new Date('2020-01-01'),
          fechaFin: new Date('2021-12-31')
        };

        const result = CvMappers.fromLegacyExperience(legacy);

        expect(result.startDate).toEqual(new Date('2020-01-01'));
        expect(result.endDate).toEqual(new Date('2021-12-31'));
      });
    });

    describe('toLegacyExperience', () => {
      it('should convert new experience to legacy format', () => {
        const experience: Experience = {
          id: '123',
          userId: 'user-456',
          position: 'Senior Developer',
          company: 'Tech Corp',
          startDate: new Date('2020-01-01'),
          endDate: new Date('2021-12-31'),
          description: 'Application development',
          location: 'Buenos Aires',
          isCurrent: false
        };

        const result = CvMappers.toLegacyExperience(experience);

        expect(result).toEqual({
          id: '123',
          puesto: 'Senior Developer',
          cargo: 'Senior Developer',
          empresa: 'Tech Corp',
          descripcion: 'Application development',
          fechaInicio: new Date('2020-01-01'),
          fechaFin: new Date('2021-12-31'),
          actual: false,
          ubicacion: 'Buenos Aires'
        });
      });
    });

    describe('fromExperienceResponse', () => {
      it('should convert API response to experience model', () => {
        const response: ExperienceResponse = {
          id: '123',
          userId: 'user-456',
          position: 'Senior Developer',
          company: 'Tech Corp',
          startDate: '2020-01-01T00:00:00Z',
          endDate: '2021-12-31T00:00:00Z',
          description: 'Application development',
          location: 'Buenos Aires',
          documentUrl: 'https://example.com/doc.pdf',
          comments: 'Great experience',
          isCurrent: false,
          createdAt: '2020-01-01T00:00:00Z',
          updatedAt: '2021-01-01T00:00:00Z'
        };

        const result = CvMappers.fromExperienceResponse(response);

        expect(result).toEqual({
          id: '123',
          userId: 'user-456',
          position: 'Senior Developer',
          company: 'Tech Corp',
          startDate: new Date('2020-01-01T00:00:00Z'),
          endDate: new Date('2021-12-31T00:00:00Z'),
          description: 'Application development',
          location: 'Buenos Aires',
          documentUrl: 'https://example.com/doc.pdf',
          comments: 'Great experience',
          isCurrent: false
        });
      });

      it('should handle missing endDate in API response', () => {
        const response: ExperienceResponse = {
          id: '123',
          userId: 'user-456',
          position: 'Current Job',
          company: 'Current Corp',
          startDate: '2020-01-01T00:00:00Z',
          isCurrent: true,
          createdAt: '2020-01-01T00:00:00Z',
          updatedAt: '2021-01-01T00:00:00Z'
        };

        const result = CvMappers.fromExperienceResponse(response);

        expect(result.endDate).toBeUndefined();
        expect(result.isCurrent).toBe(true);
      });
    });
  });

  describe('Education Mapping', () => {
    
    describe('fromLegacyEducation', () => {
      it('should convert legacy education data', () => {
        const legacy: EducacionData = {
          id: '123',
          tipo: 'Título Universitario',
          institucion: 'Universidad Nacional',
          titulo: 'Licenciatura en Sistemas',
          fechaEmision: '2020-12-15'
        };

        const result = CvMappers.fromLegacyEducation(legacy);

        expect(result).toEqual({
          id: '123',
          userId: '',
          type: EducationType.UNIVERSITY_DEGREE,
          status: EducationStatus.COMPLETED,
          title: 'Licenciatura en Sistemas',
          institution: 'Universidad Nacional',
          issueDate: new Date('2020-12-15')
        });
      });

      it('should handle unknown education type', () => {
        const legacy: EducacionData = {
          id: '123',
          tipo: 'Tipo Desconocido',
          institucion: 'Universidad',
          titulo: 'Título'
        };

        const result = CvMappers.fromLegacyEducation(legacy);

        expect(result.type).toBe(EducationType.UNIVERSITY_DEGREE);
      });
    });

    describe('fromEducationResponse', () => {
      it('should convert complete API response to education model', () => {
        const response: EducationResponse = {
          id: '123',
          userId: 'user-456',
          type: 'MASTERS',
          status: 'COMPLETED',
          title: 'Master in Computer Science',
          institution: 'Tech University',
          issueDate: '2020-12-15T00:00:00Z',
          documentUrl: 'https://example.com/diploma.pdf',
          durationYears: 2,
          average: 8.5,
          thesisTopic: 'Machine Learning Applications',
          hourlyLoad: 1200,
          hadFinalEvaluation: true,
          activityType: 'RESEARCH',
          topic: 'AI Research',
          activityRole: 'AUTHOR',
          expositionPlaceDate: 'Conference 2020',
          comments: 'Excellent program',
          createdAt: '2020-01-01T00:00:00Z',
          updatedAt: '2021-01-01T00:00:00Z'
        };

        const result = CvMappers.fromEducationResponse(response);

        expect(result).toEqual({
          id: '123',
          userId: 'user-456',
          type: EducationType.MASTERS,
          status: EducationStatus.COMPLETED,
          title: 'Master in Computer Science',
          institution: 'Tech University',
          issueDate: new Date('2020-12-15T00:00:00Z'),
          documentUrl: 'https://example.com/diploma.pdf',
          durationYears: 2,
          average: 8.5,
          thesisTopic: 'Machine Learning Applications',
          hourlyLoad: 1200,
          hadFinalEvaluation: true,
          activityType: ScientificActivityType.RESEARCH,
          topic: 'AI Research',
          activityRole: ScientificActivityRole.AUTHOR,
          expositionPlaceDate: 'Conference 2020',
          comments: 'Excellent program'
        });
      });

      it('should handle minimal API response', () => {
        const response: EducationResponse = {
          id: '123',
          userId: 'user-456',
          type: 'UNIVERSITY_DEGREE',
          status: 'IN_PROGRESS',
          title: 'Computer Science Degree',
          institution: 'University',
          createdAt: '2020-01-01T00:00:00Z',
          updatedAt: '2021-01-01T00:00:00Z'
        };

        const result = CvMappers.fromEducationResponse(response);

        expect(result.type).toBe(EducationType.UNIVERSITY_DEGREE);
        expect(result.status).toBe(EducationStatus.IN_PROGRESS);
        expect(result.issueDate).toBeUndefined();
        expect(result.activityType).toBeUndefined();
        expect(result.activityRole).toBeUndefined();
      });
    });

    describe('Education Type Mapping', () => {
      it('should map all legacy education types correctly', () => {
        const testCases = [
          { legacy: 'Título Terciario', expected: EducationType.HIGHER_EDUCATION },
          { legacy: 'Título Universitario', expected: EducationType.UNIVERSITY_DEGREE },
          { legacy: 'Especialización', expected: EducationType.SPECIALIZATION },
          { legacy: 'Maestría', expected: EducationType.MASTERS },
          { legacy: 'Doctorado', expected: EducationType.DOCTORATE },
          { legacy: 'Diplomatura', expected: EducationType.DIPLOMA },
          { legacy: 'Curso de Capacitación', expected: EducationType.TRAINING_COURSE },
          { legacy: 'Actividad Científica', expected: EducationType.SCIENTIFIC_ACTIVITY }
        ];

        testCases.forEach(({ legacy, expected }) => {
          const legacyData: EducacionData = {
            tipo: legacy,
            institucion: 'Test',
            titulo: 'Test'
          };

          const result = CvMappers.fromLegacyEducation(legacyData);
          expect(result.type).toBe(expected);
        });
      });
    });

    describe('Scientific Activity Mapping', () => {
      it('should map scientific activity types correctly', () => {
        const testCases = [
          { api: 'RESEARCH', expected: ScientificActivityType.RESEARCH },
          { api: 'PUBLICATION', expected: ScientificActivityType.PUBLICATION },
          { api: 'CONFERENCE', expected: ScientificActivityType.CONFERENCE },
          { api: 'WORKSHOP', expected: ScientificActivityType.WORKSHOP },
          { api: 'SEMINAR', expected: ScientificActivityType.SEMINAR },
          { api: 'OTHER', expected: ScientificActivityType.OTHER }
        ];

        testCases.forEach(({ api, expected }) => {
          const response: EducationResponse = {
            id: '123',
            userId: 'user-456',
            type: 'SCIENTIFIC_ACTIVITY',
            status: 'COMPLETED',
            title: 'Test Activity',
            institution: 'Test Institution',
            activityType: api,
            createdAt: '2020-01-01T00:00:00Z',
            updatedAt: '2021-01-01T00:00:00Z'
          };

          const result = CvMappers.fromEducationResponse(response);
          expect(result.activityType).toBe(expected);
        });
      });

      it('should map scientific activity roles correctly', () => {
        const testCases = [
          { api: 'AUTHOR', expected: ScientificActivityRole.AUTHOR },
          { api: 'CO_AUTHOR', expected: ScientificActivityRole.CO_AUTHOR },
          { api: 'PRESENTER', expected: ScientificActivityRole.PRESENTER },
          { api: 'ORGANIZER', expected: ScientificActivityRole.ORGANIZER },
          { api: 'COORDINATOR', expected: ScientificActivityRole.COORDINATOR },
          { api: 'PARTICIPANT', expected: ScientificActivityRole.PARTICIPANT }
        ];

        testCases.forEach(({ api, expected }) => {
          const response: EducationResponse = {
            id: '123',
            userId: 'user-456',
            type: 'SCIENTIFIC_ACTIVITY',
            status: 'COMPLETED',
            title: 'Test Activity',
            institution: 'Test Institution',
            activityRole: api,
            createdAt: '2020-01-01T00:00:00Z',
            updatedAt: '2021-01-01T00:00:00Z'
          };

          const result = CvMappers.fromEducationResponse(response);
          expect(result.activityRole).toBe(expected);
        });
      });
    });
  });
});
