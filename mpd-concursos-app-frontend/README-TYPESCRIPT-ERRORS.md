# Corrección de errores de TypeScript en el proyecto Angular

Este documento proporciona instrucciones para corregir errores comunes de TypeScript en el proyecto Angular.

## Índice

1. [Tipos de errores](#tipos-de-errores)
2. [Soluciones implementadas](#soluciones-implementadas)
3. [Cómo usar las utilidades](#cómo-usar-las-utilidades)
4. [Corrección automática](#corrección-automática)
5. [Corrección manual](#corrección-manual)
6. [Verificación](#verificación)

## Tipos de errores

Los errores de TypeScript más comunes en el proyecto son:

1. **Errores de acceso a propiedades de objetos indexados**:
   - Propiedades como 'authorities', 'queueId', 'progress', 'status', 'documentId', 'errorMessage' deben accederse usando notación de corchetes (ej: `decodedToken['authorities']` en lugar de `decodedToken.authorities`).

2. **Errores de tipos incompatibles**:
   - Propiedades como 'some' que no existen en el tipo '{}'.
   - Asignaciones incorrectas de tipos (como 'unknown' a 'number' o 'string').
   - Propiedades como 'length' y 'map' que no existen en el tipo '{}'.

3. **Errores de importación**:
   - Importaciones incorrectas con prefijo '_' (como '_RouterModule', '_MatTooltipModule', '_AuthService', '_DashboardService', etc.) que deben cambiarse a sus nombres correctos sin el prefijo.

4. **Errores en plantillas de componentes**:
   - Métodos referenciados en plantillas HTML que no existen en los componentes correspondientes.
   - Argumentos de tipo incorrecto pasados a métodos en las plantillas.

5. **Errores de conversión de tipos**:
   - Conversiones incorrectas entre tipos incompatibles (como 'IInscription' a tipos específicos).
   - Problemas con propiedades 'updatedAt' que son de tipo 'Date' pero se esperan como 'string'.

6. **Errores de inyección de dependencias**:
   - Clases que no pueden ser creadas mediante inyección de dependencias por falta de decoradores Angular.

## Soluciones implementadas

Se han implementado las siguientes soluciones:

1. **Utilidades para acceso seguro a propiedades de objetos indexados**:
   - `object-access.utils.ts`: Funciones para acceder de forma segura a propiedades de objetos.

2. **Utilidades para verificación de tipos**:
   - `type-guards.utils.ts`: Funciones para verificar tipos y convertir valores de forma segura.

3. **Script para corregir errores de importación**:
   - `fix-imports.js`: Script para corregir importaciones con prefijo '_'.

4. **Utilidades para plantillas de componentes**:
   - `template-utils.ts`: Funciones para usar en plantillas de componentes.

5. **Utilidades para conversión de tipos**:
   - `type-conversion.utils.ts`: Funciones para convertir entre tipos de forma segura.

6. **Utilidades para inyección de dependencias**:
   - `injection.utils.ts`: Clases y funciones para facilitar la inyección de dependencias.

7. **Script para corrección automática**:
   - `fix-typescript-errors.js`: Script para aplicar automáticamente las correcciones a los archivos del proyecto.

## Cómo usar las utilidades

Consulta el archivo `src/app/shared/utils/README.md` para obtener instrucciones detalladas sobre cómo usar las utilidades para corregir cada tipo de error.

## Corrección automática

Para aplicar automáticamente las correcciones a los archivos del proyecto, ejecuta el siguiente comando:

```bash
node scripts/fix-typescript-errors.js
```

Este script:

1. Buscará archivos TypeScript en el proyecto.
2. Aplicará correcciones para cada tipo de error.
3. Mostrará un resumen de las correcciones realizadas.

## Corrección manual

Si prefieres corregir los errores manualmente o si el script no corrige todos los errores, puedes seguir estos pasos:

### 1. Errores de acceso a propiedades de objetos indexados

```typescript
// Importar utilidades
import { getProperty, hasProperty } from '@shared/utils/object-access.utils';

// Antes:
const roles = decodedToken.authorities;

// Después:
const roles = getProperty(decodedToken, 'authorities');
```

### 2. Errores de tipos incompatibles

```typescript
// Importar utilidades
import { isArray, isObject } from '@shared/utils/type-guards.utils';

// Antes:
const hasAdmin = roles.some(role => role === 'ROLE_ADMIN');

// Después:
const hasAdmin = isArray(roles) ? roles.some(role => role === 'ROLE_ADMIN') : false;
```

### 3. Errores de importación

```typescript
// Antes:
import { _RouterModule } from '@angular/router';

// Después:
import { RouterModule } from '@angular/router';
```

### 4. Errores en plantillas de componentes

```typescript
// Importar utilidades
import { formatDate, hasRole } from '@shared/utils/template-utils';

// Implementar métodos en el componente:
formatDate(date: Date | string | null): string {
  return formatDate(date);
}

isAdmin(user: any): boolean {
  return hasRole(user, 'ROLE_ADMIN');
}
```

### 5. Errores de conversión de tipos

```typescript
// Importar utilidades
import { dateToISOString, stringToDate } from '@shared/utils/type-conversion.utils';

// Antes:
const updatedDate: string = user.updatedAt.toISOString();

// Después:
const updatedDate: string = dateToISOString(user.updatedAt);
```

### 6. Errores de inyección de dependencias

```typescript
// Importar decorador
import { Injectable } from '@angular/core';

// Antes:
export class MyHelper {
  constructor(private http: HttpClient) {}
}

// Después:
@Injectable({
  providedIn: 'root'
})
export class MyHelper {
  constructor(private http: HttpClient) {}
}
```

## Verificación

Después de aplicar las correcciones, ejecuta el siguiente comando para verificar si se han resuelto los errores:

```bash
ng build
```

Si aún hay errores, revisa los mensajes de error y aplica las correcciones manualmente siguiendo las instrucciones en este documento y en `src/app/shared/utils/README.md`.
