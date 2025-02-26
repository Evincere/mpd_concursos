import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { ExamenesStateService } from '@core/services/examenes/examenes-state.service';
import { Examen, ESTADO_EXAMEN } from '@shared/interfaces/examen/examen.interface';
import { SearchHeaderComponent } from '@shared/components/search-header/search-header.component';
import { LoaderComponent } from '@shared/components/loader/loader.component';
import { Subject, takeUntil } from 'rxjs';
import { RouterModule, Router } from '@angular/router';
import { ExamenSecurityService } from '@core/services/examenes/security/examen-security.service';
import { ExamenNotificationService } from '@core/services/examenes/examen-notification.service';

@Component({
  selector: 'app-examenes',
  templateUrl: './examenes.component.html',
  styleUrls: ['./examenes.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    SearchHeaderComponent,
    LoaderComponent,
    RouterModule
  ]
})
export class ExamenesComponent implements OnInit, OnDestroy {
  examenes: Examen[] = [];
  loading = true;
  error: string | null = null;
  private destroy$ = new Subject<void>();
  readonly ESTADO_EXAMEN = ESTADO_EXAMEN;

  constructor(
    private examenesState: ExamenesStateService,
    private router: Router,
    private examenSecurity: ExamenSecurityService,
    private cdr: ChangeDetectorRef,
    private notificationService: ExamenNotificationService
  ) {}

  ngOnInit(): void {
    // Nos aseguramos de que todas las estrategias de seguridad estén desactivadas
    // al entrar al listado de exámenes
    this.examenSecurity.deactivateSecureMode();
    this.examenSecurity.resetSecurityState();
    
    // Limpiamos todas las notificaciones y diálogos abiertos
    this.notificationService.cleanupNotifications();
    
    // Deshabilitamos explícitamente las notificaciones de seguridad
    this.notificationService.disableNotifications();
    
    console.log('Estrategias de seguridad y notificaciones desactivadas en el listado de exámenes');
    
    // Suscribirse a los cambios de estado
    this.examenesState.getExamenes()
      .pipe(takeUntil(this.destroy$))
      .subscribe(examenes => this.examenes = examenes);

    this.examenesState.getLoading()
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => this.loading = loading);

    this.examenesState.getError()
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => this.error = error);

    // Cargar exámenes iniciales
    this.examenesState.loadExamenes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearch(termino: string): void {
    this.examenesState.filterExamenes(termino);
  }

  onFilter(): void {
    // Implementar filtros
  }

  async iniciarExamen(examenId: string): Promise<void> {
    try {
      // Primero activamos el modo seguro
      await this.examenSecurity.activateSecureMode();

      // Luego navegamos al examen
      await this.router.navigate([`/dashboard/examenes/${examenId}/rendir`]);

      // Forzamos la detección de cambios
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error al iniciar el examen:', error);
      // Manejar el error apropiadamente
    }
  }
}
