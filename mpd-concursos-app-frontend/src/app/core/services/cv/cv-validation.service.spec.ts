/**
 * Tests Unitarios para CvValidationService
 * 
 * @description Tests completos para el servicio de validación del CV
 * @author Augment Agent
 * @date 2025-06-21
 * @version 1.0.0
 */

import { TestBed } from '@angular/core/testing';
import { CvValidationService, ValidationResult } from './cv-validation.service';
import { WorkExperience, EducationEntry, EducationType, EducationStatus } from '@core/models/cv';

describe('CvValidationService', () => {
  let service: CvValidationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CvValidationService]
    });
    service = TestBed.inject(CvValidationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Validación de experiencias laborales', () => {
    let validExperience: WorkExperience;

    beforeEach(() => {
      validExperience = {
        id: '1',
        position: 'Desarrollador Frontend',
        company: 'TechCorp',
        startDate: new Date('2022-01-01'),
        endDate: new Date('2023-12-31'),
        description: 'Desarrollo de aplicaciones web con Angular',
        technologies: ['Angular', 'TypeScript'],
        achievements: ['Implementó sistema de testing'],
        isCurrentJob: false,
        location: 'Buenos Aires'
      };
    });

    it('should validate a correct work experience', () => {
      const result = service.validateWorkExperience(validExperience);
      
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.warnings.length).toBe(0);
    });

    it('should detect missing required fields', () => {
      const invalidExperience = { ...validExperience };
      delete (invalidExperience as any).position;
      delete (invalidExperience as any).company;

      const result = service.validateWorkExperience(invalidExperience);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('El puesto es obligatorio');
      expect(result.errors).toContain('La empresa es obligatoria');
    });

    it('should validate date ranges', () => {
      const invalidExperience = {
        ...validExperience,
        startDate: new Date('2023-01-01'),
        endDate: new Date('2022-01-01') // Fecha de fin anterior a inicio
      };

      const result = service.validateWorkExperience(invalidExperience);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('La fecha de fin debe ser posterior a la fecha de inicio');
    });

    it('should validate future dates for current jobs', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const invalidExperience = {
        ...validExperience,
        startDate: futureDate,
        isCurrentJob: true,
        endDate: undefined
      };

      const result = service.validateWorkExperience(invalidExperience);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('La fecha de inicio no puede ser futura');
    });

    it('should warn about short descriptions', () => {
      const experienceWithShortDescription = {
        ...validExperience,
        description: 'Corto'
      };

      const result = service.validateWorkExperience(experienceWithShortDescription);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('La descripción es muy corta. Se recomienda al menos 20 caracteres');
    });

    it('should warn about missing technologies', () => {
      const experienceWithoutTech = {
        ...validExperience,
        technologies: []
      };

      const result = service.validateWorkExperience(experienceWithoutTech);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Se recomienda agregar al menos una tecnología');
    });

    it('should validate current job without end date', () => {
      const currentJob = {
        ...validExperience,
        isCurrentJob: true,
        endDate: undefined
      };

      const result = service.validateWorkExperience(currentJob);
      
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should detect current job with end date', () => {
      const invalidCurrentJob = {
        ...validExperience,
        isCurrentJob: true,
        endDate: new Date('2023-12-31')
      };

      const result = service.validateWorkExperience(invalidCurrentJob);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Un trabajo actual no puede tener fecha de fin');
    });
  });

  describe('Validación de educación', () => {
    let validEducation: EducationEntry;

    beforeEach(() => {
      validEducation = {
        id: '1',
        type: EducationType.UNIVERSITY,
        title: 'Ingeniería en Sistemas',
        institution: 'Universidad Nacional',
        startDate: new Date('2018-03-01'),
        endDate: new Date('2022-12-01'),
        status: EducationStatus.COMPLETED,
        description: 'Carrera de grado en ingeniería de sistemas',
        grade: 8.5,
        isOngoing: false
      };
    });

    it('should validate a correct education entry', () => {
      const result = service.validateEducation(validEducation);
      
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should detect missing required fields', () => {
      const invalidEducation = { ...validEducation };
      delete (invalidEducation as any).title;
      delete (invalidEducation as any).institution;

      const result = service.validateEducation(invalidEducation);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('El título es obligatorio');
      expect(result.errors).toContain('La institución es obligatoria');
    });

    it('should validate grade ranges', () => {
      const invalidEducation = {
        ...validEducation,
        grade: 15 // Calificación fuera del rango 0-10
      };

      const result = service.validateEducation(invalidEducation);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('La calificación debe estar entre 0 y 10');
    });

    it('should validate ongoing education without end date', () => {
      const ongoingEducation = {
        ...validEducation,
        isOngoing: true,
        endDate: undefined,
        status: EducationStatus.IN_PROGRESS
      };

      const result = service.validateEducation(ongoingEducation);
      
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should detect ongoing education with end date', () => {
      const invalidOngoingEducation = {
        ...validEducation,
        isOngoing: true,
        endDate: new Date('2023-12-31')
      };

      const result = service.validateEducation(invalidOngoingEducation);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Una educación en curso no puede tener fecha de fin');
    });

    it('should validate status consistency', () => {
      const inconsistentEducation = {
        ...validEducation,
        status: EducationStatus.COMPLETED,
        endDate: undefined
      };

      const result = service.validateEducation(inconsistentEducation);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Una educación completada debe tener fecha de fin');
    });

    it('should warn about missing description for university education', () => {
      const universityWithoutDescription = {
        ...validEducation,
        type: EducationType.UNIVERSITY,
        description: ''
      };

      const result = service.validateEducation(universityWithoutDescription);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Se recomienda agregar una descripción para educación universitaria');
    });
  });

  describe('Validación de archivos', () => {
    it('should validate PDF files correctly', () => {
      const pdfFile = new File(['content'], 'document.pdf', { type: 'application/pdf' });
      
      const result = service.validateFile(pdfFile, {
        allowedTypes: ['application/pdf'],
        maxSizeBytes: 5 * 1024 * 1024, // 5MB
        minSizeBytes: 1024 // 1KB
      });
      
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should reject files with invalid types', () => {
      const txtFile = new File(['content'], 'document.txt', { type: 'text/plain' });
      
      const result = service.validateFile(txtFile, {
        allowedTypes: ['application/pdf'],
        maxSizeBytes: 5 * 1024 * 1024
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Tipo de archivo no permitido. Tipos permitidos: application/pdf');
    });

    it('should reject files that are too large', () => {
      const largeContent = 'x'.repeat(6 * 1024 * 1024); // 6MB
      const largeFile = new File([largeContent], 'large.pdf', { type: 'application/pdf' });
      
      const result = service.validateFile(largeFile, {
        allowedTypes: ['application/pdf'],
        maxSizeBytes: 5 * 1024 * 1024 // 5MB
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('El archivo es demasiado grande. Tamaño máximo: 5.00 MB');
    });

    it('should reject files that are too small', () => {
      const smallFile = new File(['x'], 'small.pdf', { type: 'application/pdf' });
      
      const result = service.validateFile(smallFile, {
        allowedTypes: ['application/pdf'],
        maxSizeBytes: 5 * 1024 * 1024,
        minSizeBytes: 1024 // 1KB
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('El archivo es demasiado pequeño. Tamaño mínimo: 1.00 KB');
    });

    it('should validate file names', () => {
      const fileWithInvalidName = new File(['content'], 'file with spaces and símbolos$.pdf', { 
        type: 'application/pdf' 
      });
      
      const result = service.validateFile(fileWithInvalidName, {
        allowedTypes: ['application/pdf'],
        maxSizeBytes: 5 * 1024 * 1024,
        validateFileName: true
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('El nombre del archivo contiene caracteres no válidos');
    });
  });

  describe('Validación de formularios completos', () => {
    it('should validate complete CV data', () => {
      const experiences: WorkExperience[] = [
        {
          id: '1',
          position: 'Desarrollador',
          company: 'TechCorp',
          startDate: new Date('2022-01-01'),
          endDate: new Date('2023-12-31'),
          description: 'Desarrollo de aplicaciones web',
          technologies: ['Angular'],
          achievements: [],
          isCurrentJob: false,
          location: 'Buenos Aires'
        }
      ];

      const education: EducationEntry[] = [
        {
          id: '1',
          type: EducationType.UNIVERSITY,
          title: 'Ingeniería en Sistemas',
          institution: 'Universidad Nacional',
          startDate: new Date('2018-03-01'),
          endDate: new Date('2022-12-01'),
          status: EducationStatus.COMPLETED,
          description: 'Carrera de grado',
          isOngoing: false
        }
      ];

      const result = service.validateCompleteCV(experiences, education);
      
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should detect empty CV', () => {
      const result = service.validateCompleteCV([], []);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('El CV debe tener al menos una experiencia laboral o educación');
    });

    it('should warn about missing recent experience', () => {
      const oldExperience: WorkExperience = {
        id: '1',
        position: 'Desarrollador',
        company: 'OldCorp',
        startDate: new Date('2010-01-01'),
        endDate: new Date('2015-12-31'),
        description: 'Desarrollo antiguo',
        technologies: [],
        achievements: [],
        isCurrentJob: false,
        location: 'Buenos Aires'
      };

      const result = service.validateCompleteCV([oldExperience], []);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('No hay experiencia laboral reciente (últimos 2 años)');
    });
  });

  describe('Validaciones personalizadas', () => {
    it('should allow custom validation rules', () => {
      const customValidator = (experience: WorkExperience): ValidationResult => {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (experience.company === 'BlacklistedCorp') {
          errors.push('Empresa no permitida');
        }

        if (experience.technologies.length > 10) {
          warnings.push('Demasiadas tecnologías listadas');
        }

        return {
          isValid: errors.length === 0,
          errors,
          warnings
        };
      };

      service.addCustomValidator('work-experience', customValidator);

      const experience: WorkExperience = {
        id: '1',
        position: 'Desarrollador',
        company: 'BlacklistedCorp',
        startDate: new Date('2022-01-01'),
        endDate: new Date('2023-12-31'),
        description: 'Desarrollo',
        technologies: [],
        achievements: [],
        isCurrentJob: false,
        location: 'Buenos Aires'
      };

      const result = service.validateWorkExperience(experience);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Empresa no permitida');
    });
  });

  describe('Utilidades de validación', () => {
    it('should format file sizes correctly', () => {
      expect(service.formatFileSize(1024)).toBe('1.00 KB');
      expect(service.formatFileSize(1024 * 1024)).toBe('1.00 MB');
      expect(service.formatFileSize(1024 * 1024 * 1024)).toBe('1.00 GB');
    });

    it('should validate email formats', () => {
      expect(service.isValidEmail('test@example.com')).toBe(true);
      expect(service.isValidEmail('invalid-email')).toBe(false);
      expect(service.isValidEmail('test@')).toBe(false);
      expect(service.isValidEmail('@example.com')).toBe(false);
    });

    it('should validate phone numbers', () => {
      expect(service.isValidPhone('+54 11 1234-5678')).toBe(true);
      expect(service.isValidPhone('011 1234-5678')).toBe(true);
      expect(service.isValidPhone('1234')).toBe(false);
      expect(service.isValidPhone('abc-def-ghij')).toBe(false);
    });

    it('should validate URLs', () => {
      expect(service.isValidUrl('https://www.example.com')).toBe(true);
      expect(service.isValidUrl('http://example.com')).toBe(true);
      expect(service.isValidUrl('ftp://files.example.com')).toBe(true);
      expect(service.isValidUrl('not-a-url')).toBe(false);
      expect(service.isValidUrl('www.example.com')).toBe(false);
    });
  });

  describe('Manejo de errores', () => {
    it('should handle null or undefined inputs gracefully', () => {
      expect(() => service.validateWorkExperience(null as any)).not.toThrow();
      expect(() => service.validateEducation(undefined as any)).not.toThrow();
      expect(() => service.validateFile(null as any, {})).not.toThrow();
    });

    it('should handle malformed data gracefully', () => {
      const malformedExperience = {
        position: 123, // Debería ser string
        startDate: 'not-a-date', // Debería ser Date
        technologies: 'not-an-array' // Debería ser array
      } as any;

      const result = service.validateWorkExperience(malformedExperience);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
