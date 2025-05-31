# Componentes Compartidos

Este directorio contiene componentes reutilizables que pueden ser utilizados en toda la aplicación.

## Componentes de Autocompletado de Direcciones

### CustomAddressAutocompleteComponent

Componente personalizado de autocompletado de direcciones que utiliza datos locales de Argentina.

**Características:**
- Implementación personalizada sin dependencia de Material Angular para el panel de sugerencias
- Diseño responsivo y adaptable
- Soporte para navegación con teclado (flechas arriba/abajo, Enter, Escape)
- Autocompletado de direcciones en tiempo real
- Obtención de coordenadas geográficas
- Componentes de dirección desglosados

**Uso:**
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

Para más detalles, consulte el [README del componente](./custom-address-autocomplete/README.md).

### AddressAutocompleteOsmComponent

Componente de autocompletado de direcciones que utiliza OpenStreetMap/Nominatim como proveedor de datos.

**Características:**
- Gratuito y de código abierto
- Sin necesidad de clave de API
- Autocompletado de direcciones en tiempo real
- Obtención de coordenadas geográficas
- Componentes de dirección desglosados

**Uso:**
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

Para más detalles, consulte el [README del componente](./address-autocomplete-osm/README.md).

## Notas sobre la Implementación de Autocompletado de Direcciones

### Cambios Realizados

1. **Eliminación de Google Maps API:**
   - Se eliminó el servicio `GoogleMapsService`
   - Se eliminó el componente `AddressAutocompleteComponent` basado en Google Maps
   - Se eliminó la clave de API de Google Maps del archivo de entorno

2. **Implementación de OpenStreetMap/Nominatim:**
   - Se creó el servicio `NominatimService` para interactuar con la API de Nominatim
   - Se creó el componente `AddressAutocompleteOsmComponent` para proporcionar autocompletado de direcciones
   - Se integró el nuevo componente en el proceso de inscripción

3. **Implementación de Componente Personalizado:**
   - Se creó el componente `CustomAddressAutocompleteComponent` para reemplazar los componentes basados en Material Angular
   - Se eliminaron los componentes `AddressAutocompleteLocalComponent` y `AddressSelectorComponent`
   - Se integró el nuevo componente en el proceso de inscripción

### Ventajas de la Implementación Actual

- **Costo:** Completamente gratuito, sin necesidad de tarjeta de crédito o clave de API
- **Privacidad:** No requiere compartir datos de usuario con Google
- **Datos abiertos:** Utiliza datos de OpenStreetMap, que son mantenidos por la comunidad
- **Sin límites estrictos:** No hay límites mensuales estrictos, solo una política de uso justo
- **Control total sobre el diseño:** El componente personalizado permite un control total sobre el diseño y comportamiento
- **Independencia de Material Angular:** El componente personalizado no depende de los estilos de Material Angular
- **Mejor rendimiento:** El componente personalizado tiene mejor rendimiento al evitar la sobrecarga de componentes de Material
- **Solución a problemas de diseño:** El componente personalizado soluciona problemas de diseño con el panel de sugerencias

### Consideraciones

- **Política de uso justo:** La API de Nominatim tiene una política de uso justo que limita las solicitudes a un máximo de 1 por segundo
- **Precisión:** Puede ser menos preciso que Google Maps en algunas regiones, especialmente en áreas rurales
- **Velocidad:** Puede ser más lento que Google Maps debido a la política de uso justo
- **Mantenimiento:** El componente personalizado requiere mantenimiento adicional en comparación con los componentes de Material Angular

### Posibles Mejoras Futuras

- **Caché local:** Implementar un sistema de caché para reducir las solicitudes a la API
- **Validación adicional:** Mejorar la validación de direcciones
- **Interfaz de usuario:** Refinar la interfaz de usuario para proporcionar una experiencia más fluida
- **Datos más completos:** Agregar más ciudades y localidades de Argentina
- **Integración con mapas:** Agregar un mapa para visualizar la ubicación seleccionada
- **Almacenamiento local:** Utilizar IndexedDB para almacenar datos más completos sin aumentar el tamaño del bundle
