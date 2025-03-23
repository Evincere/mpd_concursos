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
  certificadoId?: string;
  comentario?: string;
}

export enum TipoEducacion {
  NIVEL_SUPERIOR = 'Carrera de Nivel Superior',
  GRADO = 'Carrera de grado',
  POSGRADO_ESPECIALIZACION = 'Posgrado: especialización',
  POSGRADO_MAESTRIA = 'Posgrado: maestría',
  POSGRADO_DOCTORADO = 'Posgrado: doctorado',
  DIPLOMATURA = 'Diplomatura',
  CURSO = 'Curso de Capacitación',
  ACTIVIDAD_CIENTIFICA = 'Actividad Científica (investigación y/o difusión)'
}

export enum EstadoEducacion {
  FINALIZADO = 'finalizado',
  EN_PROCESO = 'en proceso'
}

export enum TipoActividadCientifica {
  INVESTIGACION = 'investigación',
  PONENCIA = 'ponencia',
  PUBLICACION = 'publicación'
}

export enum CaracterActividadCientifica {
  AYUDANTE = 'ayudante-participante',
  AUTOR = 'autor-disertante-panelista-exponente'
}

export interface Educacion {
  // Campos comunes
  tipo: TipoEducacion;
  estado: EstadoEducacion;
  titulo: string;
  institucion: string;
  fechaEmision?: Date;
  documentoId?: string;

  // Campos específicos según el tipo
  // Para carreras
  duracionAnios?: number;
  promedio?: number;

  // Para posgrados
  temaTesis?: string;

  // Para diplomatura y cursos
  cargaHoraria?: number;
  evaluacionFinal?: boolean;

  // Para actividad científica
  tipoActividad?: TipoActividadCientifica;
  caracter?: CaracterActividadCientifica;
  lugarFechaExposicion?: string;
  comentarios?: string;

  // Campos para backward compatibility
  descripcion?: string;
  fechaInicio?: Date;
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
    // Asegurarse de que las experiencias sean un array
    if (profile.experiencias === undefined) {
      profile.experiencias = [];
    }
    
    // Asegurarse de que la educación sea un array
    if (profile.educacion === undefined) {
      profile.educacion = [];
    }
    
    // Asegurarse de que las habilidades sean un array
    if (profile.habilidades === undefined) {
      profile.habilidades = [];
    }
    
    console.log('Enviando perfil actualizado al servidor:', profile);
    return this.http.put<UserProfile>(this.apiUrl, profile);
  }
}
