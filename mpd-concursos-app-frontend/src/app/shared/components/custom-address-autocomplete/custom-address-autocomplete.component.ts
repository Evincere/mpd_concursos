import { Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output, ViewChild } from  '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { LocationResult, ArgentinaDataService } from '@core/services/geocoding/argentina-data.service';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, switchMap, takeUntil, tap } from 'rxjs/operators';

export interface AddressResult {
  formattedAddress: string;
  placeId: string;
  coordinates: { lat: number; lng: number };
  components: any;
  rawData: LocationResult;
}

@Component({
  selector: 'app-custom-address-autocomplete',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatSnackBarModule
  ],
  template: `
    <div class="custom-address-container">
      <label class="custom-label" *ngIf="label">{{ label }}</label>
      <div class="input-container">
        <input
          #addressInput
          class="custom-input"
          [formControl]="addressControl"
          [placeholder]="placeholder"
          [required]="required"
          (focus)="onFocus()"
          (blur)="onBlur()"
          (input)="onInput($event)"
        >
        <span class="icon-container">
          <mat-icon>location_on</mat-icon>
        </span>
      </div>
      <div class="error-message" *ngIf="addressControl.invalid && addressControl.touched">
        {{ errorMessage }}
      </div>
      <div class="hint-text" *ngIf="hint">{{ hint }}</div>
      <div class="format-info">
        <mat-icon class="info-icon">info</mat-icon>
        <span>Formato esperado: Calle Número, Ciudad, Provincia, Argentina</span>
      </div>
      <div class="format-info" *ngIf="province">
        <mat-icon class="info-icon" style="color: #4caf50;">filter_alt</mat-icon>
        <span>Búsqueda filtrada por provincia: {{ province }}</span>
      </div>

      <!-- Panel de sugerencias personalizado -->
      <div class="suggestions-panel" *ngIf="showSuggestions && (isLoading || filteredOptions.length > 0)">
        <div class="loading-option" *ngIf="isLoading">
          <div class="option-content">
            <mat-icon class="option-icon">hourglass_empty</mat-icon>
            <span>Buscando direcciones...</span>
          </div>
        </div>

        <div *ngIf="!isLoading">
          <div
            *ngFor="let option of filteredOptions; let i = index"
            class="suggestion-option"
            [class.active]="i === activeIndex"
            (mousedown)="selectOption(option)"
            (mouseover)="activeIndex = i"
          >
            <div class="option-content">
              <mat-icon class="option-icon" *ngIf="option.type === 'province'">location_city</mat-icon>
              <mat-icon class="option-icon" *ngIf="option.type === 'city'">apartment</mat-icon>
              <mat-icon class="option-icon" *ngIf="option.type === 'address'">home</mat-icon>
              <span [ngClass]="{'province': option.type === 'province', 'city': option.type === 'city', 'address': option.type === 'address'}">
                {{ option.fullAddress }}
              </span>
            </div>
          </div>
        </div>

        <div class="no-results" *ngIf="!isLoading && filteredOptions.length === 0 && addressControl.value">
          <div class="option-content">
            <mat-icon class="option-icon">info</mat-icon>
            <span>No se encontraron resultados para "{{ addressControl.value }}"</span>
          </div>
          <div class="use-manual-option" (mousedown)="useManualAddress()">
            <mat-icon>edit</mat-icon>
            <span>Usar dirección ingresada manualmente</span>
          </div>
          <div class="suggestion-tip">
            <mat-icon class="option-icon" style="color: #FFC107;">lightbulb</mat-icon>
            <span>Sugerencia: Asegúrate de incluir el número de la dirección. Prueba con un formato como "Calle 123" o "Avenida Principal 456, Ciudad"</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .custom-address-container {
      width: 100%;
      margin-bottom: 16px;
      position: relative;
    }

    .custom-label {
      display: block;
      margin-bottom: 10px;
      color: rgba(255, 255, 255, 0.87);
      font-size: 14px;
      font-weight: 500;
    }

    .input-container {
      position: relative;
      display: flex;
      align-items: center;
    }

    .custom-input {
      width: 100%;
      padding: 14px 40px 14px 16px;
      background-color: #2d2d2d;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      color: white;
      font-size: 16px;
      transition: all 0.3s ease;
      height: 52px;
      box-sizing: border-box;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .custom-input:focus {
      outline: none;
      border-color: #1976d2;
      box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.2);
    }

    .custom-input::placeholder {
      color: rgba(255, 255, 255, 0.4);
    }

    .icon-container {
      position: absolute;
      right: 12px;
      color: rgba(255, 255, 255, 0.5);
    }

    .error-message {
      color: #f44336;
      font-size: 12px;
      margin-top: 6px;
      font-weight: 500;
    }

    .hint-text {
      color: rgba(255, 255, 255, 0.5);
      font-size: 12px;
      margin-top: 6px;
    }

    /* Estilos para el panel de sugerencias */
    .suggestions-panel {
      position: absolute;
      top: 100%;
      left: 0;
      width: 100%;
      max-height: 300px;
      overflow-y: auto;
      background-color: #2d2d2d;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      margin-top: 4px;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .suggestion-option {
      padding: 10px 16px;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .suggestion-option:hover,
    .suggestion-option.active {
      background-color: rgba(63, 81, 181, 0.1);
    }

    .option-content {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .option-icon {
      opacity: 0.8;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .loading-option, .no-results {
      padding: 10px 16px;
    }

    .loading-option {
      font-style: italic;
      color: rgba(255, 255, 255, 0.5);
    }

    .province {
      font-weight: bold;
      color: #4caf50;
    }

    .city {
      color: #2196f3;
      font-weight: 500;
    }

    .address {
      color: #ffffff;
    }

    .format-info {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 6px;
      color: rgba(255, 255, 255, 0.6);
      font-size: 12px;
    }

    .info-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #2196f3;
    }

    .use-manual-option {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      cursor: pointer;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      color: #4caf50;
      font-weight: 500;
    }

    .use-manual-option:hover {
      background-color: rgba(76, 175, 80, 0.1);
    }

    .suggestion-tip {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.7);
      font-size: 12px;
      font-style: italic;
    }
  `]
})
export class CustomAddressAutocompleteComponent implements OnInit, OnDestroy {
  @Input() label = 'Dirección';
  @Input() placeholder = 'Ingrese su dirección';
  @Input() required = false;
  @Input() errorMessage = 'Por favor ingrese una dirección válida';
  @Input() hint = '';
  @Input() initialValue = '';
  @Input() province = 'Mendoza'; // Por defecto, filtrar por Mendoza

  @Output() addressSelected = new EventEmitter<AddressResult>();

  @ViewChild('addressInput') addressInput!: ElementRef;

  addressControl = new FormControl('');
  filteredOptions: LocationResult[] = [];
  isLoading = false;
  showSuggestions = false;
  activeIndex = -1;

  private destroy$ = new Subject<void>();

  constructor(
    private argentinaDataService: ArgentinaDataService,
    private snackBar: MatSnackBar
  ) {}



  ngOnInit(): void {
    // Inicializar con el valor proporcionado si existe
    if (this.initialValue) {
      this.addressControl.setValue(this.initialValue);
    }

    // Configurar el autocompletado
    this.addressControl.valueChanges.pipe(
      takeUntil(this.destroy$),
      debounceTime(300), // Esperar 300ms después de que el usuario deje de escribir
      distinctUntilChanged(),
      filter(value => {
        // Si el valor es una cadena vacía o muy corta, no hacer la búsqueda
        if (!value || typeof value !== 'string' || value.length < 2) {
          this.filteredOptions = [];
          return false;
        }

        return true;
      }),
      tap((value) => {
        console.log('Buscando direcciones para:', value);
        this.isLoading = true;
      }),
      switchMap(value => {
        if (typeof value === 'string' && value.length >= 2) {
          // Verificar si la búsqueda incluye "San Rafael" para priorizar resultados
          const isSanRafaelSearch = value.toLowerCase().includes('san rafael');

          // Usar el filtro por provincia si está definido
          return this.argentinaDataService.searchLocations(value, 10, this.province).pipe(
            map((results: LocationResult[]) => {
              // Si la búsqueda incluye "San Rafael", priorizar resultados que contengan "San Rafael"
              if (isSanRafaelSearch) {
                // Filtrar primero por resultados que contengan "San Rafael"
                const sanRafaelResults = results.filter((result: LocationResult) =>
                  result.fullAddress.toLowerCase().includes('san rafael')
                );

                // Si hay resultados de San Rafael, mostrar solo esos
                if (sanRafaelResults.length > 0) {
                  return sanRafaelResults;
                }
              }

              return results;
            })
          );
        }
        return of([]);
      })
    ).subscribe({
      next: (results: LocationResult[]) => {
        console.log('Resultados obtenidos:', results.length);
        this.filteredOptions = results;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al buscar direcciones:', error);
        this.isLoading = false;
        this.filteredOptions = [];

        // Mostrar un mensaje de error al usuario
        this.snackBar.open('Error al buscar direcciones. Intente nuevamente más tarde.', 'Cerrar', {
          duration: 3000
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFocus(): void {
    this.showSuggestions = true;
  }

  onBlur(): void {
    // Retrasar el cierre para permitir que se procese el clic en una opción
    setTimeout(() => {
      this.showSuggestions = false;
    }, 200);
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (value.length < 2) {
      this.filteredOptions = [];
    }
    this.activeIndex = -1;
  }

  selectOption(option: LocationResult): void {
    console.log('Opción seleccionada:', option);

    // Formatear la dirección seleccionada
    const formattedAddress = option.fullAddress;

    // Extraer las coordenadas
    const coordinates = option.coordinates;

    // Extraer componentes de la dirección según el tipo
    const components: any = {
      province: option.province || this.province || 'Mendoza'
    };

    if (option.type === 'province') {
      components.province = option.name;
    } else if (option.type === 'city') {
      components.city = option.name;
    } else if (option.type === 'address') {
      // Para direcciones, intentar extraer calle y número
      const addressParts = this.parseManualAddress(option.name);
      components.street = addressParts.street;
      components.number = addressParts.number;

      // Si hay una ciudad en la dirección completa, intentar extraerla
      if (!components.city && option.fullAddress) {
        const fullAddressParts = this.parseManualAddress(option.fullAddress);
        components.city = fullAddressParts.city;
      }
    }

    // Emitir el evento con los datos de la dirección
    this.addressSelected.emit({
      formattedAddress,
      placeId: option.id,
      coordinates,
      components,
      rawData: option
    });

    // Actualizar el valor del control con la dirección formateada
    this.addressControl.setValue(formattedAddress);

    // Ocultar las sugerencias
    this.showSuggestions = false;

    // Mostrar un mensaje de confirmación
    this.snackBar.open(`Dirección seleccionada: ${formattedAddress}`, 'OK', {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: 'success-snackbar'
    });
  }

  /**
   * Permite al usuario utilizar la dirección ingresada manualmente
   */
  useManualAddress(): void {
    const manualAddress = this.addressControl.value;
    if (!manualAddress) {
      this.snackBar.open('Por favor ingrese una dirección', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    // Intentar extraer componentes de la dirección manual
    const addressParts = this.parseManualAddress(manualAddress);

    // Crear un objeto de dirección manual con los componentes extraídos
    const manualAddressObj: LocationResult = {
      id: `manual-${Date.now()}`,
      name: addressParts.street,
      fullAddress: manualAddress,
      province: addressParts.province || this.province || 'Mendoza',
      type: 'address',
      coordinates: {
        lat: 0, // Coordenadas por defecto
        lng: 0
      }
    };

    // Emitir el evento con los datos de la dirección manual
    this.addressSelected.emit({
      formattedAddress: manualAddress,
      placeId: manualAddressObj.id,
      coordinates: manualAddressObj.coordinates,
      components: {
        province: addressParts.province || this.province || 'Mendoza',
        city: addressParts.city || '',
        street: addressParts.street || manualAddress,
        number: addressParts.number
      },
      rawData: manualAddressObj
    });

    // Ocultar las sugerencias
    this.showSuggestions = false;

    // Construir un mensaje más informativo
    let confirmationMessage = `Dirección guardada: ${manualAddress}`;

    // Agregar información sobre los componentes extraídos
    if (addressParts.street || addressParts.city || addressParts.province) {
      confirmationMessage += '\nComponentes detectados:';
      if (addressParts.street) confirmationMessage += `\n- Calle: ${addressParts.street}`;
      if (addressParts.number) confirmationMessage += ` ${addressParts.number}`;
      if (addressParts.city) confirmationMessage += `\n- Ciudad: ${addressParts.city}`;
      if (addressParts.province) confirmationMessage += `\n- Provincia: ${addressParts.province}`;
    }

    // Mostrar un mensaje de confirmación
    this.snackBar.open(confirmationMessage, 'OK', {
      duration: 4000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: 'success-snackbar'
    });
  }

  /**
   * Intenta extraer componentes de una dirección ingresada manualmente
   * @param address Dirección manual ingresada por el usuario
   * @returns Objeto con los componentes extraídos
   */
  private parseManualAddress(address: string): { street: string, number?: string | undefined, city?: string | undefined, province?: string | undefined } {
    // Inicializar resultado
    const result: {
      street: string,
      number?: string | undefined,
      city?: string | undefined,
      province?: string | undefined
    } = {
      street: address,
      number: undefined,
      city: undefined,
      province: undefined
    };

    try {
      // Dividir por comas para separar partes de la dirección
      const parts = address.split(',').map(part => part.trim());

      if (parts.length >= 1) {
        // La primera parte debería ser calle y número
        const streetPart = parts[0];

        // Intentar extraer número de la calle con una expresión regular más robusta
        // Busca patrones como "Calle 123", "Av. Principal 456", etc.
        const streetMatch = streetPart.match(/^(.*?)\s+(\d+(?:\/\d+)?)?$/);

        if (streetMatch && streetMatch[1]) {
          result.street = streetMatch[1].trim();
          result.number = streetMatch[2] || '';
        } else {
          // Si no se pudo extraer con el patrón anterior, intentar buscar números al final
          const numberMatch = streetPart.match(/(\d+(?:\/\d+)?)$/);
          if (numberMatch) {
            // Extraer el número y quitar del nombre de la calle
            result.number = numberMatch[1];
            result.street = streetPart.replace(numberMatch[0], '').trim();
          } else {
            result.street = streetPart.trim();
          }
        }
      }

      if (parts.length >= 2) {
        // La segunda parte suele ser la ciudad
        result.city = parts[1];
      }

      if (parts.length >= 3) {
        // La tercera parte suele ser la provincia
        result.province = parts[2];
      }

      // Si no se encontró provincia pero hay una palabra que coincide con "Mendoza"
      if (!result.province && address.toLowerCase().includes('mendoza')) {
        result.province = 'Mendoza';
      }
    } catch (error) {
      console.error('Error al analizar dirección manual:', error);
      // En caso de error, devolver la dirección completa como calle
      result.street = address;
    }

    return result;
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (!this.showSuggestions) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.activeIndex = Math.min(this.activeIndex + 1, this.filteredOptions.length - 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.activeIndex = Math.max(this.activeIndex - 1, -1);
        break;
      case 'Enter':
        if (this.activeIndex >= 0 && this.activeIndex < this.filteredOptions.length) {
          event.preventDefault();
          this.selectOption(this.filteredOptions[this.activeIndex]);
        } else if (this.filteredOptions.length === 0) {
          // Si no hay resultados, usar la dirección manual
          event.preventDefault();
          this.useManualAddress();
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.showSuggestions = false;
        break;
    }
  }
}
