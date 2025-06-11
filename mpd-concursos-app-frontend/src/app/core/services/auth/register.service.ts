import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NewUser } from '../../../shared/interfaces/auth/new-user.interface';
import { UserRegisterDTO } from '../../../shared/interfaces/user/base-user.interface';
import { environment } from '../../../../environments/environment';

interface ValidationError {
  field: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class RegisterService {
  private apiUrl = environment.apiUrl + '/auth';

  constructor(private http: HttpClient) {}

  /**
   * Registra un nuevo usuario
   * @param userData Datos del usuario a registrar
   */
  register(userData: NewUser): Observable<{ message: string }> {
    // Convertir NewUser a formato del backend
    const backendData = {
      username: userData.username,
      email: userData.email,
      password: userData.password,
      confirmPassword: userData.confirmPassword,
      firstName: userData.firstName,
      lastName: userData.lastName,
      dni: userData.dni,
      cuit: userData.cuit,
      birthDate: userData.birthDate,
      country: userData.country,
      province: userData.province,
      municipality: userData.municipality,
      legalAddress: userData.legalAddress,
      residentialAddress: userData.residentialAddress,
      telefono: userData.telefono,
      termsAccepted: userData.termsAccepted
    };

    return this.http.post<{ message: string }>(`${this.apiUrl}/register`, backendData)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Registra un nuevo usuario usando la nueva interfaz estandarizada
   * @param userData Datos del usuario a registrar
   */
  registerUser(userData: UserRegisterDTO): Observable<{ message: string }> {
    const backendData = {
      username: userData.username,
      email: userData.email,
      password: userData.password,
      confirmPassword: userData.confirmPassword,
      firstName: userData.firstName,
      lastName: userData.lastName,
      dni: userData.dni,
      cuit: userData.cuit,
      birthDate: userData.birthDate,
      country: userData.country,
      province: userData.province,
      municipality: userData.municipality,
      legalAddress: userData.legalAddress,
      residentialAddress: userData.residentialAddress,
      telefono: userData.telefono,
      termsAccepted: userData.termsAccepted
    };

    return this.http.post<{ message: string }>(`${this.apiUrl}/register`, backendData)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    // Log silently for registration errors

    const errorResponse = error.error;

    // Verificar si tenemos field y message en la respuesta
    if (errorResponse?.field && errorResponse?.message) {
      return throwError(() => ({
        error: {
          fieldErrors: [{ field: errorResponse.field, message: errorResponse.message }]
        }
      }));
    }

    // Mapeo de mensajes de error con sus campos correspondientes
    const errorMappings: Record<string, ValidationError> = {
      'El email ya está registrado': { field: 'email', message: 'Este email ya está en uso' },
      'El username ya está en uso': { field: 'username', message: 'Este nombre de usuario no está disponible' },
      'El DNI ya está registrado': { field: 'dni', message: 'Este DNI ya está registrado en el sistema' },
      'DNI ya registrado': { field: 'dni', message: 'Este DNI ya está registrado en el sistema' },
      'El CUIT ya está registrado': { field: 'cuit', message: 'Este CUIT ya está registrado en el sistema' },
      'CUIT ya registrado': { field: 'cuit', message: 'Este CUIT ya está registrado en el sistema' },
      'El nombre es obligatorio': { field: 'nombre', message: 'El nombre es obligatorio' },
      'El apellido es obligatorio': { field: 'apellido', message: 'El apellido es obligatorio' },
      'DNI inválido': { field: 'dni', message: 'El formato del DNI no es válido' },
      'CUIT inválido': { field: 'cuit', message: 'El formato del CUIT no es válido' }
    };

    // Si tenemos un mensaje de error como string
    if (typeof errorResponse === 'string') {
      const mapping = errorMappings[errorResponse];
      if (mapping) {
        return throwError(() => ({
          error: {
            fieldErrors: [mapping]
          }
        }));
      }

      // Si no hay coincidencia exacta, buscar coincidencia parcial
      for (const [key, value] of Object.entries(errorMappings)) {
        if (errorResponse.toLowerCase().includes(key.toLowerCase())) {
          return throwError(() => ({
            error: {
              fieldErrors: [value]
            }
          }));
        }
      }
    }

    // Error por defecto
    return throwError(() => ({
      error: {
        message: errorResponse?.message || 'Error en el servidor. Intente más tarde.'
      }
    }));
  }
}
