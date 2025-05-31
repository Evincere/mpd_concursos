# Utilidades para corregir errores de TypeScript en Angular

Este directorio contiene utilidades para corregir errores comunes de TypeScript en proyectos Angular.

## Índice

1. [Acceso a propiedades de objetos indexados](#acceso-a-propiedades-de-objetos-indexados)
2. [Errores de tipos incompatibles](#errores-de-tipos-incompatibles)
3. [Errores de importación](#errores-de-importación)
4. [Errores en plantillas de componentes](#errores-en-plantillas-de-componentes)
5. [Errores de conversión de tipos](#errores-de-conversión-de-tipos)
6. [Errores de inyección de dependencias](#errores-de-inyección-de-dependencias)

## Acceso a propiedades de objetos indexados

Para corregir errores de acceso a propiedades de objetos indexados, utiliza las funciones en `object-access.utils.ts`:

```typescript
import { getProperty, hasProperty, getNestedProperty } from '@shared/utils/object-access.utils';

// En lugar de:
const roles = decodedToken.authorities; // Error: La propiedad 'authorities' no existe en el tipo 'Record<string, unknown>'

// Usa:
const roles = getProperty(decodedToken, 'authorities');

// Para verificar si existe una propiedad:
if (hasProperty(decodedToken, 'authorities')) {
  // ...
}

// Para acceder a propiedades anidadas:
const street = getNestedProperty(user, 'address.street');
```

## Errores de tipos incompatibles

Para corregir errores de tipos incompatibles, utiliza las funciones en `type-guards.utils.ts`:

```typescript
import { isArray, isObject, isDate, isString, isNumber, isBoolean, toDate, toString, toNumber } from '@shared/utils/type-guards.utils';

// En lugar de:
const hasAdmin = roles.some(role => role === 'ROLE_ADMIN'); // Error: La propiedad 'some' no existe en el tipo '{}'

// Usa:
const hasAdmin = isArray(roles) ? roles.some(role => role === 'ROLE_ADMIN') : false;

// Para verificar tipos antes de usarlos:
if (isArray(data)) {
  // Ahora TypeScript sabe que data es un array
  data.forEach(item => {
    // ...
  });
}

// Para convertir tipos de forma segura:
const date = toDate(dateValue);
const text = toString(value);
const num = toNumber(value);
```

## Errores de importación

Para corregir errores de importación con prefijo '_', ejecuta el script `fix-imports.js`:

```bash
node scripts/fix-imports.js
```

Este script buscará y corregirá automáticamente importaciones como:

```typescript
// Antes:
import { _RouterModule } from '@angular/router';
import { _MatTooltipModule } from '@angular/material/tooltip';

// Después:
import { RouterModule } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
```

## Errores en plantillas de componentes

Para corregir errores en plantillas de componentes, utiliza las funciones en `template-utils.ts`:

```typescript
import { formatDate, hasRole, truncateText, getPropertyValue } from '@shared/utils/template-utils';

// En el componente:
formatDate(item.createdAt): string {
  return formatDate(item.createdAt);
}

isAdmin(user: any): boolean {
  return hasRole(user, 'ROLE_ADMIN');
}

// En la plantilla:
<span>{{ formatDate(item.createdAt) }}</span>
<button *ngIf="isAdmin(user)">Admin</button>
```

## Errores de conversión de tipos

Para corregir errores de conversión de tipos, utiliza las funciones en `type-conversion.utils.ts`:

```typescript
import { mapToInscription, dateToISOString, stringToDate, convertToType, convertWithPropertyMap } from '@shared/utils/type-conversion.utils';

// En lugar de:
const detail: InscriptionDetail = inscription; // Error: El tipo 'IInscription' no se puede convertir a 'InscriptionDetail'

// Usa:
const detail: InscriptionDetail = convertToType<InscriptionDetail>(inscription, {
  // Valores por defecto
  formattedStatus: formatStatus(inscription.state)
});

// Para convertir fechas:
const updatedDate: string = dateToISOString(user.updatedAt);
const createdAt: Date | null = stringToDate(response.createdAt);

// Para mapear propiedades:
const userDTO = convertWithPropertyMap(user, {
  'name': 'nombre',
  'lastName': 'apellido',
  'email': 'correo'
}, {
  // Valores por defecto
  active: true
});
```

## Errores de inyección de dependencias

Para corregir errores de inyección de dependencias, utiliza las clases y funciones en `injection.utils.ts`:

```typescript
import { BaseService, BaseStrategy, InjectableService, getService } from '@shared/utils/injection.utils';

// En lugar de:
class MyHelper {
  constructor(private http: HttpClient) {}
  // ...
}

// Usa:
@InjectableService()
class MyHelper {
  constructor(private http: HttpClient) {}
  // ...
}

// O extiende de una clase base:
class MyService extends BaseService {
  constructor(private http: HttpClient) {
    super();
  }
  // ...
}

// Para estrategias:
class MyStrategy extends BaseStrategy {
  constructor(private service: MyService) {
    super();
  }
  // ...
}

// Para obtener un servicio mediante inyección:
const authService = getService(AuthService);
```
