import { Injectable } from '@angular/core';
import { LoggingService } from '@core/services/logging/logging.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { Examen } from '@shared/interfaces/examen/examen.interface';
import { ExamenEnCurso, Pregunta } from '@shared/interfaces/examen/pregunta.interface';
import { HttpClient } from '@angular/common/http';


@Injectable({
  providedIn: 'root'
})
export class ExamenesStateService {
  private examenes$ = new BehaviorSubject<Examen[]>([]);
  private loading$ = new BehaviorSubject<boolean>(false);
  private error$ = new BehaviorSubject<string | null>(null);
  private examenEnCurso$ = new BehaviorSubject<ExamenEnCurso | null>(null);
  private apiUrl = '/api/examenes';

  constructor(
    private http: HttpClient,
    private loggingService: LoggingService
  ) {}


  // Getters para los observables
  getExamenes(): Observable<Examen[]> {
    return this.examenes$.asObservable();
  }

  getLoading(): Observable<boolean> {
    return this.loading$.asObservable();
  }

  getError(): Observable<string | null> {
    return this.error$.asObservable();
  }

  // Métodos para cargar datos
  loadExamenes(): void {
    this.loading$.next(true);
    this.error$.next(null);

    this.http.get<Examen[]>(`${this.apiUrl}`)
      .subscribe({
        next: (examenes: Examen[]) => {
          this.examenes$.next(examenes);
          this.loading$.next(false);
        },
        error: (error: unknown) => {
          this.error$.next('Error al cargar los exámenes');
          this.loading$.next(false);
          console.error('Error cargando exámenes:', error);
        }
      });
  }

  // Método para filtrar exámenes
  filterExamenes(searchTerm: string): void {
    const currentExamenes = this.examenes$.value;
    if (!searchTerm.trim()) {
      this.loadExamenes();
      return;
    }

    const filteredExamenes = currentExamenes.filter(examen =>
      examen.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      examen.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    this.examenes$.next(filteredExamenes);
  }

  /**
   * Obtiene un examen por su ID
   * @param id ID del examen
   * @returns Observable con el examen
   */
  getExamen(id: string): Observable<Examen | null> {
    return this.http.get<Examen>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtiene las preguntas de un examen
   * @param examenId ID del examen
   * @returns Observable con las preguntas del examen
   */
  getPreguntas(examenId: string): Observable<Pregunta[]> {
    return this.http.get<Pregunta[]>(`${this.apiUrl}/${examenId}/questions`);
  }

  /**
   * Inicializa un examen en curso
   * @param examen Datos del examen en curso
   */
  inicializarExamen(examen: ExamenEnCurso): void {
    this.examenEnCurso$.next(examen);
  }

  /**
   * Obtiene el examen en curso
   * @returns Observable con el examen en curso
   */
  getExamenEnCurso(): Observable<ExamenEnCurso | null> {
    return this.examenEnCurso$.asObservable();
  }

  /**
   * Cambia el estado del examen en curso
   * @param estado Nuevo estado del examen
   */
  cambiarEstadoExamen(estado: "FINALIZADO" | "ANULADO" | "EN_CURSO" | "PAUSADO"): void {
    const examenActual = this.examenEnCurso$.value;
    if (examenActual) {
      this.examenEnCurso$.next({
        ...examenActual,
        estado
      });
    }
  }
}