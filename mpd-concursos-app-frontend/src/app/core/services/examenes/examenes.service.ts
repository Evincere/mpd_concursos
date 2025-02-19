import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Examen, TipoExamen, EstadoExamen } from '@shared/interfaces/examen/examen.interface';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root'
})
export class ExamenesService {
  private apiUrl = `${environment.apiUrl}/examenes`;

  // Datos mockeados para desarrollo
  private examenesMock: Examen[] = [
    {
      id: '1',
      titulo: 'Examen Técnico Jurídico 2024',
      tipo: TipoExamen.TECNICO_JURIDICO,
      fechaInicio: '2024-03-15T10:00:00',
      fechaFin: '2024-03-15T12:00:00',
      estado: EstadoExamen.PENDIENTE,
      descripcion: 'Evaluación de conocimientos jurídicos generales',
      duracion: 120,
      puntajeMaximo: 100,
      intentosPermitidos: 1
    },
    {
      id: '2',
      titulo: 'Evaluación Técnico Administrativa',
      tipo: TipoExamen.TECNICO_ADMINISTRATIVO,
      fechaInicio: '2024-03-20T14:00:00',
      fechaFin: '2024-03-20T16:00:00',
      estado: EstadoExamen.PENDIENTE,
      duracion: 120,
      puntajeMaximo: 100,
      intentosPermitidos: 1
    }
  ];

  constructor(private http: HttpClient) {}

  getExamenes(): Observable<Examen[]> {
    // Por ahora retornamos datos mockeados
    return of(this.examenesMock);
  }
} 