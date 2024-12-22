import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NewUser } from '../../../shared/interfaces/auth/new-user.interface';
import { environment } from 'src/environments/environment';

interface ValidationError {
  field: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class RegisterService {
  private apiUrl = environment.apiUrl + '/auth/register';

  constructor(private http: HttpClient) { }

  register(userData: NewUser): Observable<any> {
    console.log('Datos enviados al servidor:', userData);
    return this.http.post(`${this.apiUrl}`, userData)
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse) {
    console.log('Error HTTP:', error);
    if (error.status === 400 || error.status === 409) {
      const errorResponse = error.error;

      // Verificar si tenemos field y message en la respuesta
      if (errorResponse?.field && errorResponse?.message) {
        console.log('Error de validación:', errorResponse);
        return throwError(() => ({
          field: errorResponse.field,
          message: errorResponse.message
        }));
      }

      // Mapeo de mensajes de error con sus campos correspondientes
      const errorMappings: { [key: string]: ValidationError } = {
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
        console.log('Mensaje de error:', errorResponse);
        // Buscar coincidencia exacta primero
        if (errorMappings[errorResponse]) {
          console.log('Error mapeado:', errorMappings[errorResponse]);
          return throwError(() => errorMappings[errorResponse]);
        }

        // Si no hay coincidencia exacta, buscar coincidencia parcial
        for (const [key, value] of Object.entries(errorMappings)) {
          if (errorResponse.toLowerCase().includes(key.toLowerCase())) {
            console.log('Error mapeado parcialmente:', value);
            return throwError(() => value);
          }
        }
      }
    }

    // Error por defecto
    console.log('Error por defecto:', {
      field: 'general',
      message: 'Error en el registro. Por favor, intente nuevamente.'
    });
    return throwError(() => ({
      field: 'general',
      message: 'Error en el registro. Por favor, intente nuevamente.'
    }));
  }
}
