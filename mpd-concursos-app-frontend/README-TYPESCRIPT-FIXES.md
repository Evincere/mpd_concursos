# Corrección de errores de TypeScript

Este documento proporciona instrucciones para corregir errores comunes de TypeScript en el proyecto Angular.

## Índice

1. [Tipos de errores](#tipos-de-errores)
2. [Corrección automática](#corrección-automática)
3. [Corrección manual](#corrección-manual)
4. [Utilidades disponibles](#utilidades-disponibles)
5. [Verificación](#verificación)

## Tipos de errores

Los errores de TypeScript más comunes en el proyecto son:

1. **Errores de acceso a propiedades desde índices**:
   - Accesos directos como `decodedToken.authorities` que deben cambiarse a notación de corchetes `decodedToken['authorities']`
   - Propiedades como `queueId`, `progress`, `status`, `documentId`, `errorMessage` que deben accederse con notación de corchetes

2. **Errores de tipos**:
   - Propiedades que no existen en ciertos tipos (como `some` en `{}`)
   - Falta de comprobaciones de nulidad antes de acceder a propiedades como `length` en objetos
   - Asignaciones incorrectas de tipos (como `unknown` a `number` o `string`)
   - Tipos incompatibles en conversiones

3. **Errores de importación**:
   - Importaciones con prefijo "_" (como `_RouterModule`, `_MatTooltipModule`, `_AuthService`)
   - Nombres incorrectos en importaciones

4. **Errores en plantillas**:
   - Métodos no existentes en componentes (como `closeNotifications`)
   - Tipos de parámetros incorrectos en eventos (como `$event` en `onSearch`)

5. **Errores de inyección de dependencias**:
   - Falta de decoradores Angular en servicios que se inyectan (como `ExamenRendicionService`)
   - Propiedades no existentes en componentes (como `inscriptionService`, `dashboardService`)

## Corrección automática

Para corregir automáticamente la mayoría de los errores, ejecuta el siguiente comando:

```bash
node scripts/fix-all-typescript-errors.js
```

Este script ejecutará los siguientes scripts en orden:

1. `fix-import-prefixes.js`: Corrige importaciones con prefijo "_"
2. `fix-property-access.js`: Corrige accesos a propiedades
3. `fix-dependency-injection.js`: Corrige errores de inyección de dependencias

## Corrección manual

Si los scripts automáticos no corrigen todos los errores, puedes corregirlos manualmente siguiendo estas pautas:

### 1. Errores de acceso a propiedades desde índices

Utiliza la función `safeGet` para acceder a propiedades de forma segura:

```typescript
// Importar utilidad
import { safeGet } from '@shared/utils/safe-access.utils';

// Antes:
const roles = decodedToken.authorities;

// Después:
const roles = safeGet(decodedToken, 'authorities');
```

### 2. Errores de tipos

Utiliza las funciones de verificación de tipos:

```typescript
// Importar utilidades
import { isArray, safeArrayMethod, safeLength } from '@shared/utils/safe-access.utils';

// Antes:
const hasAdmin = roles.some(role => role === 'ROLE_ADMIN');

// Después:
const hasAdmin = isArray(roles) 
  ? safeArrayMethod(roles, 'some', [role => role === 'ROLE_ADMIN'], false) 
  : false;

// Antes:
if (data.length > 0) { ... }

// Después:
if (safeLength(data) > 0) { ... }
```

### 3. Errores de importación

Elimina los prefijos "_" de las importaciones:

```typescript
// Antes:
import { _RouterModule } from '@angular/router';
import { _MatTooltipModule } from '@angular/material/tooltip';
import { _AuthService } from './services/auth.service';

// Después:
import { RouterModule } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from './services/auth.service';
```

### 4. Errores en plantillas

Utiliza las funciones auxiliares para plantillas:

```typescript
// Importar utilidades
import { formatDate, handleSearch, closeNotification, handleClick } from '@shared/utils/template-helpers';

// En el componente:
formatDate(date: Date | string | null): string {
  return formatDate(date);
}

onSearch(event: any): void {
  handleSearch(event, (query) => {
    this.searchQuery = query;
    this.loadData();
  });
}

closeNotifications(): void {
  closeNotification(this.notificationService);
}

handleButtonClick(event: any): void {
  handleClick(event, () => {
    // Lógica del clic
  });
}
```

### 5. Errores de inyección de dependencias

Agrega el decorador `@Injectable` a los servicios:

```typescript
// Importar decorador
import { Injectable } from '@angular/core';

// Antes:
export class ExamenRendicionService {
  constructor(private http: HttpClient) {}
}

// Después:
@Injectable({
  providedIn: 'root'
})
export class ExamenRendicionService {
  constructor(private http: HttpClient) {}
}
```

## Utilidades disponibles

Se han creado las siguientes utilidades para ayudar con la corrección de errores:

1. **safe-access.utils.ts**: Funciones para acceso seguro a propiedades y verificación de tipos
   - `safeGet`: Obtiene una propiedad de un objeto de forma segura
   - `isArray`: Verifica si un valor es un array
   - `isObject`: Verifica si un valor es un objeto
   - `isDate`: Verifica si un valor es una fecha
   - `toDate`: Convierte un valor a fecha de forma segura
   - `toString`: Convierte un valor a cadena de forma segura
   - `toNumber`: Convierte un valor a número de forma segura
   - `safeArrayMethod`: Accede de forma segura a un método de un array
   - `safeLength`: Obtiene la longitud de un array de forma segura

2. **template-helpers.ts**: Funciones para ayudar con errores en plantillas
   - `formatDate`: Formatea una fecha para mostrar en la interfaz de usuario
   - `hasRole`: Verifica si un usuario tiene un rol específico
   - `truncateText`: Trunca un texto a una longitud máxima
   - `handleSearch`: Maneja eventos de búsqueda de forma segura
   - `closeNotification`: Cierra notificaciones de forma segura
   - `handleClick`: Maneja eventos de clic de forma segura

## Verificación

Después de aplicar las correcciones, ejecuta el siguiente comando para verificar si se han resuelto los errores:

```bash
ng build
```

Si aún hay errores, revisa los mensajes de error y aplica las correcciones manualmente siguiendo las instrucciones en este documento.
