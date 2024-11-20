import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Concurso } from '../../../shared/interfaces/concurso/concurso.interface';
import { environment } from '../../../../environments/environment';
import { CategoriaEnum } from '../../../shared/constants/enums/categoria-enum';

@Injectable({
  providedIn: 'root'
})
export class ConcursosService {
  private apiUrl = `${environment.apiUrl}/concursos`;
  concursosOriginal: Concurso[] = [
    {
      id: 1,
      titulo: 'Defensor Público Oficial',
      categoria: CategoriaEnum.CONCURSO,
      fechaInicio: '2024-03-01',
      fechaFin: '2024-04-15',
      estado: 'Activo',
      cargo: 'Defensor',
      dependencia: 'Primera Circunscripción Judicial',
      vacantes: 2,
    },
    {
      id: 2,
      titulo: 'Secretario Judicial',
      categoria: CategoriaEnum.SERVICIOS_AUXILIARES,
      fechaInicio: '2024-03-15',
      fechaFin: '2024-04-30',
      estado: 'Activo',
      cargo: 'Secretario',
      dependencia: 'Segunda Circunscripción Judicial',
      vacantes: 1,
    },
    {
      id: 3,
      titulo: 'Asistente Administrativo',
      categoria: CategoriaEnum.TECNICO_ADMINISTRATIVO,
      fechaInicio: '2024-04-01',
      fechaFin: '2024-05-15',
      estado: 'Activo',
      cargo: 'Asistente',
      dependencia: 'Tercera Circunscripción Judicial',
      vacantes: 3,
    },
    {
      id: 4,
      titulo: 'Asesor Jurídico',
      categoria: CategoriaEnum.TECNICO_JURIDICO,
      fechaInicio: '2024-03-20',
      fechaFin: '2024-05-01',
      estado: 'Activo',
      cargo: 'Asesor',
      dependencia: 'Primera Circunscripción Judicial',
      vacantes: 2,
    },
    {
      id: 5,
      titulo: 'Oficial de Justicia',
      categoria: CategoriaEnum.SERVICIOS_AUXILIARES,
      fechaInicio: '2024-04-10',
      fechaFin: '2024-05-25',
      estado: 'Activo',
      cargo: 'Oficial',
      dependencia: 'Segunda Circunscripción Judicial',
      vacantes: 4,
    },
    {
      id: 6,
      titulo: 'Auxiliar Administrativo',
      categoria: CategoriaEnum.TECNICO_ADMINISTRATIVO,
      fechaInicio: '2024-03-25',
      fechaFin: '2024-05-10',
      estado: 'Activo',
      cargo: 'Auxiliar',
      dependencia: 'Primera Circunscripción Judicial',
      vacantes: 5,
    },
    {
      id: 7,
      titulo: 'Defensor Público Adjunto',
      categoria: CategoriaEnum.CONCURSO,
      fechaInicio: '2024-04-05',
      fechaFin: '2024-05-20',
      estado: 'Activo',
      cargo: 'Defensor Adjunto',
      dependencia: 'Tercera Circunscripción Judicial',
      vacantes: 2,
    },
    {
      id: 8,
      titulo: 'Analista Jurídico',
      categoria: CategoriaEnum.TECNICO_JURIDICO,
      fechaInicio: '2024-04-15',
      fechaFin: '2024-05-30',
      estado: 'Activo',
      cargo: 'Analista',
      dependencia: 'Segunda Circunscripción Judicial',
      vacantes: 1,
    },
    {
      id: 9,
      titulo: 'Coordinador Administrativo',
      categoria: CategoriaEnum.TECNICO_ADMINISTRATIVO,
      fechaInicio: '2024-03-10',
      fechaFin: '2024-04-25',
      estado: 'Activo',
      cargo: 'Coordinador',
      dependencia: 'Primera Circunscripción Judicial',
      vacantes: 1,
    },
    {
      id: 10,
      titulo: 'Asistente Legal',
      categoria: CategoriaEnum.SERVICIOS_AUXILIARES,
      fechaInicio: '2024-04-20',
      fechaFin: '2024-06-05',
      estado: 'Activo',
      cargo: 'Asistente',
      dependencia: 'Tercera Circunscripción Judicial',
      vacantes: 3,
    }
  ];
  constructor(private http: HttpClient) { }

  getConcursos(): Observable<Concurso[]> {
    return of(this.concursosOriginal);
  }
  /* getConcursos(): Observable<Concurso[]> {
    return this.http.get<Concurso[]>(this.apiUrl);
  } */

  postularAConcurso(concursoId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${concursoId}/postular`, {});
  }
}
