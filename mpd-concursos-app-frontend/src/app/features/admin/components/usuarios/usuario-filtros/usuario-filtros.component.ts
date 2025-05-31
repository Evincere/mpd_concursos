import { Component, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

// Componentes personalizados
import { CustomFormFieldComponent } from '@shared/components/custom-form/custom-form-field/custom-form-field.component';
import { CustomSelectComponent } from '@shared/components/custom-form/custom-select/custom-select.component';
import { CustomButtonComponent } from '@shared/components/custom-form/custom-button/custom-button.component';
import { CustomCardComponent } from '@shared/components/custom-form/custom-card/custom-card.component';
import { CustomDatepickerComponent } from '@shared/components/custom-form/custom-datepicker/custom-datepicker.component';

// Interfaces
import { UserFilterEvent } from '../domain/models/ui-events.model';
import { UserStatus } from '../domain/models/user.model';

// Servicios
import { UserService } from '../application/services/user.service';

@Component({
  selector: 'app-usuario-filtros',
  templateUrl: './usuario-filtros.component.html',
  styleUrls: ['./usuario-filtros.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CustomFormFieldComponent,
    CustomSelectComponent,
    CustomButtonComponent,
    CustomCardComponent,
    CustomDatepickerComponent
  ]
})
export class UsuarioFiltrosComponent implements OnInit, OnDestroy {
  @Output() filterChange = new EventEmitter<UserFilterEvent>();

  filterForm!: FormGroup;
  showAdvancedFilters = false;

  // Opciones para los selects
  statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: UserStatus.ACTIVE, label: 'Activo' },
    { value: UserStatus.INACTIVE, label: 'Inactivo' },
    { value: UserStatus.BLOCKED, label: 'Bloqueado' },
    { value: UserStatus.LOCKED, label: 'Bloqueado Temporalmente' },
    { value: UserStatus.EXPIRED, label: 'Expirado' }
  ];

  roleOptions: { value: string, label: string }[] = [
    { value: '', label: 'Todos los roles' },
    { value: 'ROLE_ADMIN', label: 'Administrador' },
    { value: 'ROLE_USER', label: 'Usuario' },
    { value: 'ROLE_EVALUATOR', label: 'Evaluador' }
  ];

  // Opciones para ordenar
  sortOptions = [
    { value: 'createdAt', label: 'Fecha de registro' },
    { value: 'firstName', label: 'Nombre' },
    { value: 'lastName', label: 'Apellido' },
    { value: 'email', label: 'Email' },
    { value: 'lastLogin', label: 'Último acceso' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadRoles();
    this.initForm();
    this.setupFilterListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicializa el formulario
   */
  initForm(): void {
    this.filterForm = this.fb.group({
      search: [''],
      role: [''],
      status: [''],
      startDate: [null],
      endDate: [null],
      sortBy: ['createdAt'],
      sortDirection: ['desc']
    });
  }

  /**
   * Carga los roles disponibles
   */
  loadRoles(): void {
    this.userService.getAvailableRoles()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (roles) => {
          // Opción por defecto
          const defaultOption = { value: '', label: 'Todos los roles' };

          // Verificar si roles es un array y no está vacío
          if (Array.isArray(roles) && roles.length > 0) {
            // Mapear los roles con manejo seguro de propiedades undefined
            const mappedRoles = roles.map(role => {
              // Si role es un string (como en la respuesta del backend)
              if (typeof role === 'string') {
                const roleStr: string = role;
                return {
                  value: roleStr,
                  label: roleStr.replace('ROLE_', '')
                };
              }

              // Si role es un objeto con la estructura esperada
              if (role && typeof role === 'object') {
                return {
                  value: role.id || role.name || '',
                  label: (role.name && typeof role.name === 'string')
                    ? role.name.replace('ROLE_', '')
                    : (role.id || 'Rol sin nombre')
                };
              }

              // Caso de fallback para cualquier otro tipo de datos
              return {
                value: '',
                label: 'Rol desconocido'
              };
            });

            this.roleOptions = [defaultOption, ...mappedRoles];
          } else {
            // Si no hay roles o no es un array, usar solo la opción por defecto
            this.roleOptions = [defaultOption];
          }
        },
        error: (error) => {
          console.error('Error cargando roles:', error);
          // En caso de error, establecer al menos la opción por defecto
          this.roleOptions = [{ value: '', label: 'Todos los roles' }];
        }
      });
  }

  /**
   * Configura los listeners para los cambios en los filtros
   */
  setupFilterListeners(): void {
    // Escuchar cambios en el campo de búsqueda con debounce
    this.filterForm.get('search')?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.applyFilters();
      });

    // Escuchar cambios en los demás campos
    this.filterForm.get('role')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.applyFilters();
      });

    this.filterForm.get('status')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.applyFilters();
      });

    // Escuchar cambios en las fechas
    this.filterForm.get('startDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.applyFilters();
      });

    this.filterForm.get('endDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.applyFilters();
      });

    // Escuchar cambios en el ordenamiento
    this.filterForm.get('sortBy')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.applyFilters();
      });

    this.filterForm.get('sortDirection')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.applyFilters();
      });
  }

  /**
   * Alterna la visibilidad de los filtros avanzados
   */
  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  /**
   * Aplica los filtros y emite el evento
   */
  applyFilters(): void {
    const formValues = this.filterForm.value;

    const filters: UserFilterEvent = {
      search: formValues.search || undefined,
      role: formValues.role || undefined,
      status: formValues.status as UserStatus || undefined,
      startDate: formValues.startDate || undefined,
      endDate: formValues.endDate || undefined,
      // Incluir también los valores de ordenamiento
      sort: formValues.sortBy || undefined,
      direction: formValues.sortDirection || undefined,
      // Añadir timestamp para evitar caché
      _t: new Date().getTime()
    };

    // Eliminar propiedades con valores vacíos o nulos
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof UserFilterEvent] === '' || filters[key as keyof UserFilterEvent] === null) {
        delete filters[key as keyof UserFilterEvent];
      }
    });

    console.log('Emitiendo evento de filtro:', filters);
    this.filterChange.emit(filters);
  }

  /**
   * Limpia todos los filtros
   */
  onReset(): void {
    this.filterForm.reset({
      search: '',
      role: '',
      status: '',
      startDate: null,
      endDate: null,
      sortBy: 'createdAt',
      sortDirection: 'desc'
    });

    this.applyFilters();
  }
}
