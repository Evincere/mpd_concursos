import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AdminConcursosService } from '../../../../../../core/services/admin/admin-concursos.service';
import { AdminContestDatesService } from '../../../../../../core/services/admin/admin-contest-dates.service';
import { Concurso } from '@shared/interfaces/concurso/concurso.interface';
import { ContestDate } from '@shared/interfaces/concurso/contest-date.interface';

@Component({
  selector: 'app-concurso-calendario',
  templateUrl: './concurso-calendario.component.html',
  styleUrls: ['./concurso-calendario.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ]
})
export class ConcursoCalendarioComponent implements OnInit, OnDestroy {
  isLoading = false;
  filterForm: FormGroup;
  
  // Datos del calendario
  currentDate = new Date();
  currentMonth: number;
  currentYear: number;
  calendarDays: CalendarDay[] = [];
  
  // Eventos y fechas importantes
  allDates: (ContestDate & { contestTitle?: string })[] = [];
  
  // Para limpieza de suscripciones
  private destroy$ = new Subject<void>();
  
  constructor(
    private fb: FormBuilder,
    private concursosService: AdminConcursosService,
    private fechasService: AdminContestDatesService,
    private snackBar: MatSnackBar
  ) {
    this.currentMonth = this.currentDate.getMonth();
    this.currentYear = this.currentDate.getFullYear();
    
    this.filterForm = this.fb.group({
      month: [this.currentMonth],
      year: [this.currentYear]
    });
  }
  
  ngOnInit(): void {
    this.setupFilterListeners();
    this.loadCalendarData();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  setupFilterListeners(): void {
    this.filterForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.currentMonth = this.filterForm.get('month')?.value;
        this.currentYear = this.filterForm.get('year')?.value;
        this.generateCalendar();
      });
  }
  
  loadCalendarData(): void {
    this.isLoading = true;
    
    // Obtener todas las fechas importantes de todos los concursos
    this.fechasService.getAllContestDates()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dates) => {
          // Obtener información adicional de los concursos para cada fecha
          this.enrichDatesWithContestInfo(dates);
        },
        error: (error) => {
          console.error('Error cargando fechas para el calendario:', error);
          this.snackBar.open('Error al cargar las fechas del calendario', 'Cerrar', { duration: 3000 });
          this.isLoading = false;
          this.generateCalendar(); // Generar calendario vacío
        }
      });
  }
  
  enrichDatesWithContestInfo(dates: ContestDate[]): void {
    // Crear un mapa para almacenar los concursos por ID
    const contestsMap = new Map<number | string, Concurso>();
    const contestIds = new Set<number | string>();
    
    // Recopilar todos los IDs de concursos únicos
    dates.forEach(date => {
      if (date.contestId) {
        contestIds.add(date.contestId);
      }
    });
    
    // Si no hay fechas o concursos, generar calendario vacío
    if (contestIds.size === 0) {
      this.allDates = dates;
      this.generateCalendar();
      this.isLoading = false;
      return;
    }
    
    // Contador para seguir las solicitudes pendientes
    let pendingRequests = contestIds.size;
    
    // Obtener información de cada concurso
    contestIds.forEach(contestId => {
      this.concursosService.getConcursoById(contestId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (concurso) => {
            contestsMap.set(contestId, concurso);
            checkComplete();
          },
          error: (error) => {
            console.error(`Error obteniendo concurso con ID ${contestId}:`, error);
            checkComplete();
          }
        });
    });
    
    // Función para verificar si todas las solicitudes han terminado
    const checkComplete = () => {
      pendingRequests--;
      if (pendingRequests <= 0) {
        // Enriquecer las fechas con información de los concursos
        this.allDates = dates.map(date => ({
          ...date,
          contestTitle: date.contestId ? contestsMap.get(date.contestId)?.title : undefined
        }));
        
        this.generateCalendar();
        this.isLoading = false;
      }
    };
  }
  
  generateCalendar(): void {
    this.calendarDays = [];
    
    // Obtener el primer día del mes
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    
    // Obtener el día de la semana del primer día (0 = Domingo, 1 = Lunes, etc.)
    const firstDayOfWeek = firstDay.getDay();
    
    // Agregar días del mes anterior para completar la primera semana
    const prevMonthLastDay = new Date(this.currentYear, this.currentMonth, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const date = new Date(this.currentYear, this.currentMonth - 1, day);
      this.calendarDays.push({
        date,
        day,
        isCurrentMonth: false,
        events: this.getEventsForDate(date)
      });
    }
    
    // Agregar días del mes actual
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(this.currentYear, this.currentMonth, day);
      this.calendarDays.push({
        date,
        day,
        isCurrentMonth: true,
        events: this.getEventsForDate(date)
      });
    }
    
    // Agregar días del mes siguiente para completar la última semana
    const remainingDays = 42 - this.calendarDays.length; // 6 semanas x 7 días = 42
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(this.currentYear, this.currentMonth + 1, day);
      this.calendarDays.push({
        date,
        day,
        isCurrentMonth: false,
        events: this.getEventsForDate(date)
      });
    }
  }
  
  getEventsForDate(date: Date): (ContestDate & { contestTitle?: string })[] {
    // Filtrar eventos que ocurren en la fecha especificada
    return this.allDates.filter(event => {
      if (event.date) {
        const eventDate = new Date(event.date);
        return eventDate.getDate() === date.getDate() &&
               eventDate.getMonth() === date.getMonth() &&
               eventDate.getFullYear() === date.getFullYear();
      }
      return false;
    });
  }
  
  prevMonth(): void {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    
    this.filterForm.patchValue({
      month: this.currentMonth,
      year: this.currentYear
    }, { emitEvent: false });
    
    this.generateCalendar();
  }
  
  nextMonth(): void {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    
    this.filterForm.patchValue({
      month: this.currentMonth,
      year: this.currentYear
    }, { emitEvent: false });
    
    this.generateCalendar();
  }
  
  getMonthName(month: number): string {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[month];
  }
  
  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }
}

interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  events: (ContestDate & { contestTitle?: string })[];
}
