/**
 * CV Validators - Custom validation functions for CV forms
 * 
 * Provides robust validation including XSS prevention, data sanitization,
 * and business rule validation for CV-related forms.
 */

import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class CvValidators {

  /**
   * Validates against XSS attacks by checking for script tags and javascript protocols
   */
  static noXSS(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }

    const value = control.value.toString();
    
    // Check for script tags, javascript protocols, and event handlers
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>/gi,
      /<object[^>]*>/gi,
      /<embed[^>]*>/gi,
      /<link[^>]*>/gi,
      /<meta[^>]*>/gi
    ];

    for (const pattern of xssPatterns) {
      if (pattern.test(value)) {
        return { 
          xss: { 
            message: 'El contenido contiene elementos no permitidos por seguridad',
            pattern: pattern.source 
          } 
        };
      }
    }

    return null;
  }

  /**
   * Validates maximum word count
   */
  static maxWords(maxWords: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const wordCount = control.value.toString().trim().split(/\s+/).length;
      
      if (wordCount > maxWords) {
        return { 
          maxWords: { 
            actual: wordCount, 
            max: maxWords,
            message: `Máximo ${maxWords} palabras permitidas. Actual: ${wordCount}`
          } 
        };
      }

      return null;
    };
  }

  /**
   * Validates minimum word count
   */
  static minWords(minWords: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const wordCount = control.value.toString().trim().split(/\s+/).length;
      
      if (wordCount < minWords) {
        return { 
          minWords: { 
            actual: wordCount, 
            min: minWords,
            message: `Mínimo ${minWords} palabras requeridas. Actual: ${wordCount}`
          } 
        };
      }

      return null;
    };
  }

  /**
   * Validates that end date is after start date
   */
  static dateRange(startDateField: string, endDateField: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const startDate = control.get(startDateField)?.value;
      const endDate = control.get(endDateField)?.value;

      if (!startDate || !endDate) {
        return null;
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start >= end) {
        return {
          dateRange: {
            message: 'La fecha de fin debe ser posterior a la fecha de inicio'
          }
        };
      }

      return null;
    };
  }

  /**
   * Validates that date is not in the future
   */
  static notFutureDate(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }

    const inputDate = new Date(control.value);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    if (inputDate > today) {
      return {
        futureDate: {
          message: 'La fecha no puede ser en el futuro'
        }
      };
    }

    return null;
  }

  /**
   * Validates company name format
   */
  static companyName(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }

    const value = control.value.toString().trim();
    
    // Must contain at least one letter
    if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(value)) {
      return {
        companyName: {
          message: 'El nombre de la empresa debe contener al menos una letra'
        }
      };
    }

    // Cannot be only numbers or special characters
    if (/^[\d\s\-_.]+$/.test(value)) {
      return {
        companyName: {
          message: 'El nombre de la empresa no puede contener solo números o símbolos'
        }
      };
    }

    return null;
  }

  /**
   * Validates position/job title format
   */
  static positionTitle(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }

    const value = control.value.toString().trim();
    
    // Must contain at least one letter
    if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(value)) {
      return {
        positionTitle: {
          message: 'El puesto debe contener al menos una letra'
        }
      };
    }

    // Cannot start with numbers or special characters
    if (/^[\d\s\-_.!@#$%^&*()]+/.test(value)) {
      return {
        positionTitle: {
          message: 'El puesto no puede comenzar con números o símbolos'
        }
      };
    }

    return null;
  }

  /**
   * Validates academic average (GPA)
   */
  static academicAverage(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }

    const value = parseFloat(control.value);
    
    if (isNaN(value)) {
      return {
        academicAverage: {
          message: 'El promedio debe ser un número válido'
        }
      };
    }

    if (value < 0 || value > 10) {
      return {
        academicAverage: {
          message: 'El promedio debe estar entre 0 y 10'
        }
      };
    }

    return null;
  }

  /**
   * Validates hourly load for courses
   */
  static hourlyLoad(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }

    const value = parseInt(control.value, 10);
    
    if (isNaN(value)) {
      return {
        hourlyLoad: {
          message: 'La carga horaria debe ser un número válido'
        }
      };
    }

    if (value < 1 || value > 10000) {
      return {
        hourlyLoad: {
          message: 'La carga horaria debe estar entre 1 y 10,000 horas'
        }
      };
    }

    return null;
  }

  /**
   * Validates duration in years
   */
  static durationYears(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }

    const value = parseInt(control.value, 10);
    
    if (isNaN(value)) {
      return {
        durationYears: {
          message: 'La duración debe ser un número válido'
        }
      };
    }

    if (value < 1 || value > 20) {
      return {
        durationYears: {
          message: 'La duración debe estar entre 1 y 20 años'
        }
      };
    }

    return null;
  }

  /**
   * Sanitizes HTML content by removing dangerous tags
   */
  static sanitizeHtml(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }

    const value = control.value.toString();
    
    // Remove potentially dangerous HTML tags
    const sanitized = value
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      .replace(/<object[^>]*>.*?<\/object>/gi, '')
      .replace(/<embed[^>]*>/gi, '')
      .replace(/<link[^>]*>/gi, '')
      .replace(/<meta[^>]*>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');

    // Update the control value if sanitization occurred
    if (sanitized !== value) {
      control.setValue(sanitized, { emitEvent: false });
    }

    return null;
  }

  /**
   * Validates file size for document uploads
   */
  static fileSize(maxSizeInMB: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const file = control.value as File;
      const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

      if (file.size > maxSizeInBytes) {
        return {
          fileSize: {
            actual: Math.round(file.size / 1024 / 1024 * 100) / 100,
            max: maxSizeInMB,
            message: `El archivo no puede superar ${maxSizeInMB}MB`
          }
        };
      }

      return null;
    };
  }

  /**
   * Validates file type for document uploads
   */
  static fileType(allowedTypes: string[]): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const file = control.value as File;

      if (!allowedTypes.includes(file.type)) {
        return {
          fileType: {
            actual: file.type,
            allowed: allowedTypes,
            message: `Tipo de archivo no permitido. Tipos permitidos: ${allowedTypes.join(', ')}`
          }
        };
      }

      return null;
    };
  }

  /**
   * Checks if content contains dangerous/malicious patterns
   * Used by inline components for real-time validation
   */
  static containsDangerousContent(value: string): boolean {
    if (!value || typeof value !== 'string') {
      return false;
    }

    const dangerousPatterns = [
      // Script injection patterns
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /data:text\/html/gi,

      // Event handlers
      /on\w+\s*=/gi,

      // Dangerous HTML tags
      /<iframe[^>]*>/gi,
      /<object[^>]*>/gi,
      /<embed[^>]*>/gi,
      /<link[^>]*>/gi,
      /<meta[^>]*>/gi,
      /<form[^>]*>/gi,

      // SQL injection patterns
      /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/gi,

      // Command injection patterns
      /(\||&|;|\$\(|\`)/g,

      // XSS patterns
      /alert\s*\(/gi,
      /confirm\s*\(/gi,
      /prompt\s*\(/gi,
      /document\.(cookie|domain|location)/gi,
      /window\.(location|open)/gi,

      // Base64 encoded scripts (common in attacks)
      /data:.*base64.*script/gi,

      // PHP/ASP code injection
      /<\?php/gi,
      /<%.*%>/gi
    ];

    // Check each pattern
    for (const pattern of dangerousPatterns) {
      if (pattern.test(value)) {
        return true;
      }
    }

    // Check for suspicious character sequences
    const suspiciousSequences = [
      'eval(',
      'Function(',
      'setTimeout(',
      'setInterval(',
      'document.write',
      'innerHTML',
      'outerHTML',
      'document.createElement',
      'appendChild'
    ];

    const lowerValue = value.toLowerCase();
    for (const sequence of suspiciousSequences) {
      if (lowerValue.includes(sequence.toLowerCase())) {
        return true;
      }
    }

    return false;
  }

  /**
   * Sanitizes dangerous content from a string
   * Returns cleaned version of the input
   */
  static sanitizeDangerousContent(value: string): string {
    if (!value || typeof value !== 'string') {
      return value;
    }

    let sanitized = value;

    // Remove script tags and their content
    sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '');

    // Remove dangerous HTML tags
    sanitized = sanitized.replace(/<(iframe|object|embed|link|meta|form)[^>]*>/gi, '');

    // Remove javascript and vbscript protocols
    sanitized = sanitized.replace(/javascript:/gi, '');
    sanitized = sanitized.replace(/vbscript:/gi, '');

    // Remove event handlers
    sanitized = sanitized.replace(/on\w+\s*=/gi, '');

    // Remove dangerous functions
    sanitized = sanitized.replace(/eval\s*\(/gi, '');
    sanitized = sanitized.replace(/Function\s*\(/gi, '');

    return sanitized.trim();
  }
}
