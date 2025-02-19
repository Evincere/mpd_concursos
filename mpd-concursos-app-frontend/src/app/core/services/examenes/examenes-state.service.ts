import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Examen } from '@shared/interfaces/examen/examen.interface';
import { ExamenesService } from './examenes.service';

@Injectable({
  providedIn: 'root'
})
export class ExamenesStateService {
  private examenes$ = new BehaviorSubject<Examen[]>([]);
  private loading$ = new BehaviorSubject<boolean>(false);
  private error$ = new BehaviorSubject<string | null>(null);

  constructor(private examenesService: ExamenesService) {}

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

    this.examenesService.getExamenes()
      .subscribe({
        next: (examenes) => {
          this.examenes$.next(examenes);
          this.loading$.next(false);
        },
        error: (error) => {
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
} 