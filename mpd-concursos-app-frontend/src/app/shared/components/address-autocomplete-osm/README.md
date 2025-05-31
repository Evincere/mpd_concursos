# Componente de Autocompletado de Direcciones con OpenStreetMap

Este componente proporciona funcionalidad de autocompletado de direcciones utilizando la API gratuita de OpenStreetMap (Nominatim).

## Características

- Autocompletado de direcciones basado en OpenStreetMap
- Búsqueda de direcciones en tiempo real
- Validación de direcciones
- Obtención de coordenadas geográficas
- Componentes de dirección desglosados (calle, número, localidad, etc.)
- Cumple con la política de uso justo de Nominatim (máximo 1 solicitud por segundo)

## Uso

```html
<app-address-autocomplete-osm
  [label]="'Dirección'"
  [placeholder]="'Ingrese su dirección'"
  [required]="true"
  [initialValue]="direccionInicial"
  [errorMessage]="'Por favor ingrese una dirección válida'"
  [hint]="'Ingrese su dirección completa'"
  (addressSelected)="onAddressSelected($event)"
></app-address-autocomplete-osm>
```

## Propiedades de entrada (Inputs)

| Propiedad | Tipo | Descripción | Valor por defecto |
|-----------|------|-------------|-------------------|
| label | string | Etiqueta del campo | 'Dirección' |
| placeholder | string | Texto de placeholder | 'Ingrese su dirección' |
| required | boolean | Si el campo es requerido | false |
| errorMessage | string | Mensaje de error para validación | 'Por favor ingrese una dirección válida' |
| hint | string | Texto de ayuda | '' |
| initialValue | string | Valor inicial del campo | '' |

## Eventos de salida (Outputs)

| Evento | Tipo | Descripción |
|--------|------|-------------|
| addressSelected | AddressResult | Emitido cuando se selecciona una dirección |

## Interfaz AddressResult

```typescript
interface AddressResult {
  formattedAddress: string;       // Dirección formateada
  placeId: number;                // ID del lugar en OpenStreetMap
  coordinates: {                  // Coordenadas geográficas
    lat: number;                  // Latitud
    lng: number;                  // Longitud
  };
  components: any;                // Componentes de la dirección (calle, número, etc.)
  rawData: NominatimResult;       // Datos crudos de la respuesta de Nominatim
}
```

## Servicio NominatimService

Este componente utiliza el servicio `NominatimService` para interactuar con la API de Nominatim. El servicio proporciona los siguientes métodos:

- `searchAddress(searchText: string, countryCode: string = 'ar', limit: number = 5): Observable<NominatimResult[]>`
- `getAddressDetails(placeId: number): Observable<NominatimResult>`
- `formatAddress(address: NominatimAddress): string`

## Política de uso justo de Nominatim

La API de Nominatim tiene una política de uso justo que limita las solicitudes a un máximo de 1 por segundo. El servicio `NominatimService` implementa esta política automáticamente, agregando retrasos entre solicitudes si es necesario.

## Ventajas sobre Google Maps API

- **Costo**: Completamente gratuito, sin necesidad de tarjeta de crédito o clave de API.
- **Privacidad**: No requiere compartir datos de usuario con Google.
- **Datos abiertos**: Utiliza datos de OpenStreetMap, que son mantenidos por la comunidad.
- **Sin límites estrictos**: No hay límites mensuales estrictos, solo una política de uso justo.

## Limitaciones

- **Precisión**: Puede ser menos preciso que Google Maps en algunas regiones.
- **Velocidad**: Puede ser más lento que Google Maps en algunas situaciones.
- **Política de uso**: Limitado a 1 solicitud por segundo.

## Personalización

El componente puede ser personalizado mediante CSS para adaptarse al diseño de la aplicación. Los estilos principales están definidos en el archivo del componente.
