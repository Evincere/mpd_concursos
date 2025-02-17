import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Experiencia {
  empresa: string;
  cargo: string;
  fechaInicio: Date;
  fechaFin?: Date;
  descripcion?: string;
}

export interface Educacion {
  institucion: string;
  titulo: string;
  descripcion: string;
  fechaInicio: Date;
  fechaFin?: Date;
}

export interface Habilidad {
  nombre: string;
  nivel: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  dni: string;
  cuit: string;
  firstName: string;
  lastName: string;
  telefono?: string;
  direccion?: string;
  experiencias?: Experiencia[];
  educacion?: Educacion[];
  habilidades?: Habilidad[];
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = `${environment.apiUrl}/users/profile`;

  constructor(private http: HttpClient) { }

  getUserProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(this.apiUrl);
  }

  updateUserProfile(profile: Partial<UserProfile>): Observable<UserProfile> {
    return this.http.put<UserProfile>(this.apiUrl, profile);
  }
}
