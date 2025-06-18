/**
 * CV Validators Tests - Unit tests for custom CV validation functions
 */

import { FormControl, FormGroup } from '@angular/forms';
import { CvValidators } from './cv-validators';

describe('CvValidators', () => {

  describe('noXSS', () => {
    it('should return null for valid content', () => {
      const control = new FormControl('Valid content without scripts');
      const result = CvValidators.noXSS(control);
      expect(result).toBeNull();
    });

    it('should return null for empty content', () => {
      const control = new FormControl('');
      const result = CvValidators.noXSS(control);
      expect(result).toBeNull();
    });

    it('should detect script tags', () => {
      const control = new FormControl('<script>alert("xss")</script>');
      const result = CvValidators.noXSS(control);
      expect(result).toEqual({
        xss: jasmine.objectContaining({
          message: 'El contenido contiene elementos no permitidos por seguridad'
        })
      });
    });

    it('should detect javascript protocols', () => {
      const control = new FormControl('javascript:alert("xss")');
      const result = CvValidators.noXSS(control);
      expect(result).toEqual({
        xss: jasmine.objectContaining({
          message: 'El contenido contiene elementos no permitidos por seguridad'
        })
      });
    });

    it('should detect event handlers', () => {
      const control = new FormControl('<div onclick="alert()">content</div>');
      const result = CvValidators.noXSS(control);
      expect(result).toEqual({
        xss: jasmine.objectContaining({
          message: 'El contenido contiene elementos no permitidos por seguridad'
        })
      });
    });

    it('should detect iframe tags', () => {
      const control = new FormControl('<iframe src="malicious.com"></iframe>');
      const result = CvValidators.noXSS(control);
      expect(result).toEqual({
        xss: jasmine.objectContaining({
          message: 'El contenido contiene elementos no permitidos por seguridad'
        })
      });
    });
  });

  describe('maxWords', () => {
    it('should return null for content within limit', () => {
      const control = new FormControl('This has five words exactly');
      const validator = CvValidators.maxWords(5);
      const result = validator(control);
      expect(result).toBeNull();
    });

    it('should return null for empty content', () => {
      const control = new FormControl('');
      const validator = CvValidators.maxWords(5);
      const result = validator(control);
      expect(result).toBeNull();
    });

    it('should return error for content exceeding limit', () => {
      const control = new FormControl('This content has more than five words in it');
      const validator = CvValidators.maxWords(5);
      const result = validator(control);
      expect(result).toEqual({
        maxWords: {
          actual: 9,
          max: 5,
          message: 'Máximo 5 palabras permitidas. Actual: 9'
        }
      });
    });
  });

  describe('minWords', () => {
    it('should return null for content meeting minimum', () => {
      const control = new FormControl('This has exactly five words');
      const validator = CvValidators.minWords(5);
      const result = validator(control);
      expect(result).toBeNull();
    });

    it('should return error for content below minimum', () => {
      const control = new FormControl('Only three words');
      const validator = CvValidators.minWords(5);
      const result = validator(control);
      expect(result).toEqual({
        minWords: {
          actual: 3,
          min: 5,
          message: 'Mínimo 5 palabras requeridas. Actual: 3'
        }
      });
    });
  });

  describe('dateRange', () => {
    it('should return null for valid date range', () => {
      const formGroup = new FormGroup({
        startDate: new FormControl(new Date('2020-01-01')),
        endDate: new FormControl(new Date('2020-12-31'))
      });
      
      const validator = CvValidators.dateRange('startDate', 'endDate');
      const result = validator(formGroup);
      expect(result).toBeNull();
    });

    it('should return null when dates are missing', () => {
      const formGroup = new FormGroup({
        startDate: new FormControl(null),
        endDate: new FormControl(null)
      });
      
      const validator = CvValidators.dateRange('startDate', 'endDate');
      const result = validator(formGroup);
      expect(result).toBeNull();
    });

    it('should return error when end date is before start date', () => {
      const formGroup = new FormGroup({
        startDate: new FormControl(new Date('2020-12-31')),
        endDate: new FormControl(new Date('2020-01-01'))
      });
      
      const validator = CvValidators.dateRange('startDate', 'endDate');
      const result = validator(formGroup);
      expect(result).toEqual({
        dateRange: {
          message: 'La fecha de fin debe ser posterior a la fecha de inicio'
        }
      });
    });
  });

  describe('notFutureDate', () => {
    it('should return null for past date', () => {
      const control = new FormControl(new Date('2020-01-01'));
      const result = CvValidators.notFutureDate(control);
      expect(result).toBeNull();
    });

    it('should return null for today', () => {
      const control = new FormControl(new Date());
      const result = CvValidators.notFutureDate(control);
      expect(result).toBeNull();
    });

    it('should return error for future date', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      const control = new FormControl(futureDate);
      const result = CvValidators.notFutureDate(control);
      expect(result).toEqual({
        futureDate: {
          message: 'La fecha no puede ser en el futuro'
        }
      });
    });
  });

  describe('companyName', () => {
    it('should return null for valid company name', () => {
      const control = new FormControl('Microsoft Corporation');
      const result = CvValidators.companyName(control);
      expect(result).toBeNull();
    });

    it('should return error for name without letters', () => {
      const control = new FormControl('123456');
      const result = CvValidators.companyName(control);
      expect(result).toEqual({
        companyName: {
          message: 'El nombre de la empresa debe contener al menos una letra'
        }
      });
    });

    it('should return error for only numbers and symbols', () => {
      const control = new FormControl('123-456_789');
      const result = CvValidators.companyName(control);
      expect(result).toEqual({
        companyName: {
          message: 'El nombre de la empresa no puede contener solo números o símbolos'
        }
      });
    });
  });

  describe('positionTitle', () => {
    it('should return null for valid position', () => {
      const control = new FormControl('Software Developer');
      const result = CvValidators.positionTitle(control);
      expect(result).toBeNull();
    });

    it('should return error for position without letters', () => {
      const control = new FormControl('123456');
      const result = CvValidators.positionTitle(control);
      expect(result).toEqual({
        positionTitle: {
          message: 'El puesto debe contener al menos una letra'
        }
      });
    });

    it('should return error for position starting with numbers', () => {
      const control = new FormControl('123 Developer');
      const result = CvValidators.positionTitle(control);
      expect(result).toEqual({
        positionTitle: {
          message: 'El puesto no puede comenzar con números o símbolos'
        }
      });
    });
  });

  describe('academicAverage', () => {
    it('should return null for valid average', () => {
      const control = new FormControl(8.5);
      const result = CvValidators.academicAverage(control);
      expect(result).toBeNull();
    });

    it('should return error for non-numeric value', () => {
      const control = new FormControl('not a number');
      const result = CvValidators.academicAverage(control);
      expect(result).toEqual({
        academicAverage: {
          message: 'El promedio debe ser un número válido'
        }
      });
    });

    it('should return error for value below 0', () => {
      const control = new FormControl(-1);
      const result = CvValidators.academicAverage(control);
      expect(result).toEqual({
        academicAverage: {
          message: 'El promedio debe estar entre 0 y 10'
        }
      });
    });

    it('should return error for value above 10', () => {
      const control = new FormControl(11);
      const result = CvValidators.academicAverage(control);
      expect(result).toEqual({
        academicAverage: {
          message: 'El promedio debe estar entre 0 y 10'
        }
      });
    });
  });

  describe('hourlyLoad', () => {
    it('should return null for valid hourly load', () => {
      const control = new FormControl(40);
      const result = CvValidators.hourlyLoad(control);
      expect(result).toBeNull();
    });

    it('should return error for non-numeric value', () => {
      const control = new FormControl('not a number');
      const result = CvValidators.hourlyLoad(control);
      expect(result).toEqual({
        hourlyLoad: {
          message: 'La carga horaria debe ser un número válido'
        }
      });
    });

    it('should return error for value below 1', () => {
      const control = new FormControl(0);
      const result = CvValidators.hourlyLoad(control);
      expect(result).toEqual({
        hourlyLoad: {
          message: 'La carga horaria debe estar entre 1 y 10,000 horas'
        }
      });
    });

    it('should return error for value above 10000', () => {
      const control = new FormControl(10001);
      const result = CvValidators.hourlyLoad(control);
      expect(result).toEqual({
        hourlyLoad: {
          message: 'La carga horaria debe estar entre 1 y 10,000 horas'
        }
      });
    });
  });

  describe('fileSize', () => {
    it('should return null for file within size limit', () => {
      const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      Object.defineProperty(mockFile, 'size', { value: 1024 * 1024 }); // 1MB
      
      const control = new FormControl(mockFile);
      const validator = CvValidators.fileSize(5); // 5MB limit
      const result = validator(control);
      expect(result).toBeNull();
    });

    it('should return error for file exceeding size limit', () => {
      const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      Object.defineProperty(mockFile, 'size', { value: 6 * 1024 * 1024 }); // 6MB
      
      const control = new FormControl(mockFile);
      const validator = CvValidators.fileSize(5); // 5MB limit
      const result = validator(control);
      expect(result).toEqual({
        fileSize: {
          actual: 6,
          max: 5,
          message: 'El archivo no puede superar 5MB'
        }
      });
    });
  });

  describe('fileType', () => {
    it('should return null for allowed file type', () => {
      const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const control = new FormControl(mockFile);
      const validator = CvValidators.fileType(['application/pdf', 'image/jpeg']);
      const result = validator(control);
      expect(result).toBeNull();
    });

    it('should return error for disallowed file type', () => {
      const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' });
      const control = new FormControl(mockFile);
      const validator = CvValidators.fileType(['application/pdf', 'image/jpeg']);
      const result = validator(control);
      expect(result).toEqual({
        fileType: {
          actual: 'text/plain',
          allowed: ['application/pdf', 'image/jpeg'],
          message: 'Tipo de archivo no permitido. Tipos permitidos: application/pdf, image/jpeg'
        }
      });
    });
  });
});
