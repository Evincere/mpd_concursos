# Componente de Autocompletado de Direcciones Personalizado

Este componente proporciona una interfaz de usuario para buscar y seleccionar direcciones en Argentina, sin depender de los componentes de Material Angular para el autocompletado.

## Características

- Búsqueda de direcciones en Argentina
- Autocompletado personalizado sin dependencia de Material Angular
- Soporte para navegación con teclado (flechas arriba/abajo, Enter, Escape)
- Diseño responsivo y adaptable
- Estilos personalizados para modo oscuro
- Validación de entrada

## Uso

```html
<app-custom-address-autocomplete
  [label]="'Domicilio'"
  [placeholder]="'Ingrese su domicilio completo'"
  [required]="true"
  [initialValue]="centroDeVidaControl.value"
  [errorMessage]="'Por favor ingrese una dirección válida'"
  [hint]="'Este domicilio se guardará como su centro de vida'"
  (addressSelected)="onAddressSelected($event)"
></app-custom-address-autocomplete>
```

## Propiedades de entrada (Inputs)

| Propiedad | Tipo | Descripción | Valor por defecto |
|-----------|------|-------------|-------------------|
| label | string | Etiqueta del campo | 'Dirección' |
| placeholder | string | Texto de placeholder | 'Ingrese su dirección' |
| required | boolean | Indica si el campo es requerido | false |
| errorMessage | string | Mensaje de error para validación | 'Por favor ingrese una dirección válida' |
| hint | string | Texto de ayuda | '' |
| initialValue | string | Valor inicial del campo | '' |

## Eventos de salida (Outputs)

| Evento | Tipo | Descripción |
|--------|------|-------------|
| addressSelected | EventEmitter<AddressResult> | Se emite cuando se selecciona una dirección |

## Interfaz AddressResult

```typescript
interface AddressResult {
  formattedAddress: string;  // Dirección formateada completa
  placeId: string;           // ID único del lugar
  coordinates: {             // Coordenadas geográficas
    lat: number;
    lng: number;
  };
  components: any;           // Componentes de la dirección (provincia, ciudad, calle, etc.)
  rawData: LocationResult;   // Datos crudos del resultado
}
```

## Navegación con teclado

- **Flecha Abajo**: Navega a la siguiente sugerencia
- **Flecha Arriba**: Navega a la sugerencia anterior
- **Enter**: Selecciona la sugerencia activa
- **Escape**: Cierra el panel de sugerencias

## Dependencias

Este componente utiliza:
- ArgentinaDataService para la búsqueda de ubicaciones
- MatIconModule para los iconos
- MatSnackBarModule para notificaciones

## Ventajas sobre el componente basado en Material

- Control total sobre el diseño y comportamiento
- No depende de los estilos de Material Angular
- Mejor rendimiento al evitar la sobrecarga de componentes de Material
- Soluciona problemas de diseño con el panel de sugerencias
- Más fácil de personalizar y adaptar a diferentes diseños
