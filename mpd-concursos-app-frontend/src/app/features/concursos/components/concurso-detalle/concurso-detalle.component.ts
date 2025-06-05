import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, ViewChild, TemplateRef } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { Concurso, Contest } from '@shared/interfaces/concurso/concurso.interface';
import { CommonModule } from '@angular/common';
import { DatePipe } from '@angular/common';
import { Subject, BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { InscripcionButtonComponent } from '../inscripcion/inscripcion-button/inscripcion-button.component';
import { ContestStatusBadgeComponent } from '@shared/components/contest-status-badge/contest-status-badge.component';
import { ContestDate } from '@shared/interfaces/concurso/contest-date.interface';
import { InscripcionState } from '@core/models/inscripcion/inscripcion-state.enum';
import { InscriptionService } from '@core/services/inscripcion/inscription.service';
import { CustomTabsComponent, TabItem } from '@shared/components/custom-tabs/custom-tabs.component';
import { CustomIconButtonComponent } from '@shared/components/custom-icon-button/custom-icon-button.component';
import { CustomButtonComponent } from '@shared/components/custom-button/custom-button.component';

import { NotificationService } from '@core/services/notification/notification.service';

@Component({
  selector: 'app-concurso-detalle',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    InscripcionButtonComponent,
    ContestStatusBadgeComponent,
    CustomTabsComponent,
    CustomIconButtonComponent,
    CustomButtonComponent
  ],
  templateUrl: './concurso-detalle.component.html',
  styleUrls: ['./concurso-detalle.component.scss']
})
export class ConcursoDetalleComponent implements OnInit, OnDestroy {
  @Input() concurso!: Contest;
  @Output() cerrarDetalle = new EventEmitter<void>();
  @Output() inscriptionComplete = new EventEmitter<Concurso>();

  @ViewChild('infoGeneralTemplate', { static: true }) infoGeneralTemplate!: TemplateRef<any>;
  @ViewChild('documentacionTemplate', { static: true }) documentacionTemplate!: TemplateRef<any>;
  @ViewChild('fechasTemplate', { static: true }) fechasTemplate!: TemplateRef<any>;

  closing = false;
  inscripcionLoading = false;
  inscripcionState$ = new BehaviorSubject<InscripcionState>(InscripcionState.NO_INSCRIPTO);
  InscripcionState = InscripcionState;
  private destroy$ = new Subject<void>();

  // Tab management
  tabItems: TabItem[] = [];
  activeTabIndex = 0;

  constructor(
    private notificationService: NotificationService,
    private inscriptionService: InscriptionService
  ) {}

  ngOnInit(): void {
    if (this.concurso) {
      this.verificarInscripcion();
      // Inicializar URLs temporales para los documentos
      if (!this.concurso.basesUrl) {
        this.concurso.basesUrl = '#'; // URL temporal
      }
      if (!this.concurso.descriptionUrl) {
        this.concurso.descriptionUrl = '#'; // URL temporal
      }

      // Inicializar fechas si no existen
      if (!this.concurso.dates) {
        this.concurso.dates = this.getDefaultDates();
      }

      // Inicializar tabs
      this.initializeTabs();
    }
  }

  private initializeTabs(): void {
    this.tabItems = [
      {
        id: 'info-general',
        label: 'Información General',
        icon: 'info-circle',
        template: this.infoGeneralTemplate
      },
      {
        id: 'documentacion',
        label: 'Documentación',
        icon: 'file-alt',
        template: this.documentacionTemplate
      },
      {
        id: 'fechas',
        label: 'Fechas',
        icon: 'calendar-alt',
        template: this.fechasTemplate
      }
    ];
  }

  onTabChange(index: number): void {
    this.activeTabIndex = index;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  verificarInscripcion(): void {
    if (!this.concurso) {
      console.warn('[ConcursoDetalleComponent] No hay concurso para verificar inscripción');
      return;
    }

    this.inscripcionLoading = true;
    // Convertir el ID a número
    const concursoId = typeof this.concurso.id === 'string' ? parseInt(this.concurso.id, 10) : this.concurso.id;

    this.inscriptionService.getInscriptionStatus(concursoId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.inscripcionLoading = false;
          console.log('Finalizada verificación de inscripción');
        })
      )
      .subscribe({
        next: (estado: InscripcionState) => {
          console.log('Estado de inscripción actualizado:', estado);
          this.inscripcionState$.next(estado);
        },
        error: (error: Error) => {
          console.error('Error al verificar inscripción:', error);
          this.inscripcionState$.next(InscripcionState.NO_INSCRIPTO);
          this.notificationService.showError(
            'No se pudo verificar el estado de la inscripción'
          );
        }
      });
  }

  getEstadoConcursoLabel(status: string): string {
    const estados: Record<string, string> = {
      'ACTIVE': 'Activo',
      'CLOSED': 'Cerrado',
      'IN_PROGRESS': 'En Proceso',
      'DRAFT': 'Borrador',
      'CANCELLED': 'Cancelado'
    };
    return estados[status] || status;
  }

  onCerrar(): void {
    this.closing = true;
    setTimeout(() => {
      this.cerrarDetalle.emit();
    }, 300);
  }

  onInscriptionComplete(concurso: Concurso): void {
    this.verificarInscripcion();
    this.inscriptionComplete.emit(concurso);
  }

  private getDefaultDates(): ContestDate[] {
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + 15);

    return [
      {
        label: 'Fecha de Inscripción',
        startDate: today,
        endDate: endDate,
        type: 'inscription'
      }
    ];
  }
}
