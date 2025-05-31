# Plan de Migración para Componentes de Autocompletado de Direcciones

Este documento describe el plan para migrar gradualmente de los componentes de autocompletado de direcciones basados en Material Angular a nuestro nuevo componente personalizado `CustomAddressAutocompleteComponent`.

## Motivación

Los componentes de autocompletado de direcciones basados en Material Angular (`AddressAutocompleteLocalComponent` y `AddressSelectorComponent`) presentan problemas de diseño cuando se despliegan las sugerencias, rompiendo el layout de la aplicación. Estos problemas son difíciles de solucionar debido a las limitaciones de personalización de los componentes de Material Angular.

Para resolver estos problemas, hemos creado un nuevo componente personalizado `CustomAddressAutocompleteComponent` que implementa la funcionalidad de autocompletado sin depender de los componentes de Material Angular para el panel de sugerencias.

## Componentes a Migrar

1. **AddressAutocompleteLocalComponent**: Componente de autocompletado de direcciones que utiliza datos locales de Argentina.
2. **AddressSelectorComponent**: Componente de selección de direcciones utilizado en el proceso de inscripción.

## Estado Actual

- Se ha creado el nuevo componente `CustomAddressAutocompleteComponent` que reemplaza la funcionalidad de los componentes anteriores.
- Se han actualizado las referencias en los componentes de inscripción para utilizar el nuevo componente.
- Los componentes antiguos todavía existen en el proyecto y podrían estar siendo utilizados en otras partes de la aplicación.

## Plan de Migración

### Fase 1: Identificación (Completado)

- ✅ Identificar los problemas de diseño en los componentes existentes.
- ✅ Crear un nuevo componente personalizado que resuelva estos problemas.
- ✅ Actualizar las referencias en los componentes de inscripción.

### Fase 2: Inventario

- Identificar todas las partes de la aplicación que utilizan los componentes antiguos.
- Crear una lista de archivos y componentes que necesitan ser actualizados.

### Fase 3: Migración Gradual

- Actualizar gradualmente cada instancia de los componentes antiguos con el nuevo componente personalizado.
- Probar cada cambio para asegurarse de que la funcionalidad se mantiene.
- Actualizar la documentación y los ejemplos de uso.

### Fase 4: Deprecación

- Marcar los componentes antiguos como obsoletos (deprecated) en la documentación.
- Agregar comentarios en los archivos de los componentes antiguos indicando que están obsoletos y que se debe utilizar el nuevo componente.
- Agregar advertencias en la consola cuando se utilicen los componentes antiguos.

### Fase 5: Eliminación

- Una vez que todas las instancias de los componentes antiguos hayan sido reemplazadas, eliminar los componentes antiguos del proyecto.
- Actualizar la documentación para eliminar las referencias a los componentes antiguos.

## Guía de Migración

### Reemplazar AddressAutocompleteLocalComponent

**Antes:**
```html
<app-address-autocomplete-local
  [label]="'Domicilio'"
  [placeholder]="'Ingrese su domicilio completo'"
  [required]="true"
  [initialValue]="centroDeVidaControl.value"
  [errorMessage]="'Por favor ingrese una dirección válida'"
  (addressSelected)="onAddressSelected($event)"
></app-address-autocomplete-local>
```

**Después:**
```html
<app-custom-address-autocomplete
  [label]="'Domicilio'"
  [placeholder]="'Ingrese su domicilio completo'"
  [required]="true"
  [initialValue]="centroDeVidaControl.value"
  [errorMessage]="'Por favor ingrese una dirección válida'"
  [hint]="'Este domicilio se guardará en su perfil como su centro de vida'"
  (addressSelected)="onAddressSelected($event)"
></app-custom-address-autocomplete>
```

### Reemplazar AddressSelectorComponent

**Antes:**
```html
<app-address-selector
  [label]="'Domicilio (Centro de Vida)'"
  [placeholder]="'Ingrese su domicilio completo (calle, número, localidad, provincia)'"
  [required]="true"
  [initialValue]="inscriptionForm.get('centroDeVida')?.value"
  [errorMessage]="'Debe ingresar un domicilio válido'"
  [hint]="'Este domicilio se guardará en su perfil como su centro de vida'"
  (addressSelected)="onAddressSelected($event)"
></app-address-selector>
```

**Después:**
```html
<app-custom-address-autocomplete
  [label]="'Domicilio (Centro de Vida)'"
  [placeholder]="'Ingrese su domicilio completo (calle, número, localidad, provincia)'"
  [required]="true"
  [initialValue]="inscriptionForm.get('centroDeVida')?.value"
  [errorMessage]="'Debe ingresar un domicilio válido'"
  [hint]="'Este domicilio se guardará en su perfil como su centro de vida'"
  (addressSelected)="onAddressSelected($event)"
></app-custom-address-autocomplete>
```

## Importaciones en Componentes TypeScript

**Antes:**
```typescript
import { AddressAutocompleteLocalComponent } from '@shared/components/address-autocomplete-local/address-autocomplete-local.component';
// o
import { AddressSelectorComponent } from '../../components/address-selector/address-selector.component';
```

**Después:**
```typescript
import { CustomAddressAutocompleteComponent } from '@shared/components/custom-address-autocomplete/custom-address-autocomplete.component';
```

## Notas Adicionales

- El nuevo componente `CustomAddressAutocompleteComponent` es compatible con la interfaz de los componentes antiguos, por lo que la migración debería ser sencilla en la mayoría de los casos.
- Si se encuentran casos específicos donde el nuevo componente no funciona correctamente, se pueden hacer ajustes al componente para adaptarlo a esos casos.
- Es importante probar cada cambio para asegurarse de que la funcionalidad se mantiene y que no hay problemas de diseño.
