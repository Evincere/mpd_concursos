# Scripts de Refactorización de Material UI

Este directorio contiene scripts para ayudar en la refactorización de componentes de Material UI a componentes personalizados en la aplicación MPD Concursos.

## Motivación

Los componentes de Material UI presentan limitaciones de personalización que dificultan mantener una consistencia visual con el resto de la aplicación. Además, los estilos de Material UI pueden ser difíciles de sobrescribir y a menudo generan problemas de rendimiento debido a la cantidad de CSS que incluyen.

Para resolver estos problemas, se han creado componentes personalizados que reemplazan a los componentes de Material UI. Estos scripts ayudan a automatizar el proceso de refactorización.

## Scripts disponibles

### refactor-material-ui.ps1

Script maestro que ejecuta todos los scripts de refactorización en el orden correcto.

#### Cómo usar

1. Abre PowerShell en el directorio raíz del proyecto
2. Ejecuta el script:

```powershell
.\scripts\refactor-material-ui.ps1
```

Este script realizará las siguientes acciones:

1. Crear una copia de seguridad del proyecto
2. Reemplazar componentes de Material UI por componentes personalizados
3. Eliminar módulos de Material UI de los imports de los módulos
4. Eliminar importaciones de Material UI que ya no se utilizan
5. Verificar que los cambios son correctos

### replace-material-components.ps1

Script para reemplazar componentes de Material UI por componentes personalizados en archivos HTML.

#### Cómo usar

```powershell
.\scripts\replace-material-components.ps1
```

### remove-material-modules.ps1

Script para eliminar módulos de Material UI de los imports de los módulos TypeScript.

#### Cómo usar

```powershell
.\scripts\remove-material-modules.ps1
```

### remove-material-imports.ps1

Script para eliminar importaciones de Material UI que ya no se utilizan en archivos TypeScript.

#### Cómo usar

```powershell
.\scripts\remove-material-imports.ps1
```

## Consideraciones importantes

### Copia de seguridad

El script maestro `refactor-material-ui.ps1` crea automáticamente una copia de seguridad del proyecto antes de realizar cualquier cambio. Si algo sale mal, puedes restaurar esta copia de seguridad.

### Verificación manual

Aunque los scripts intentan hacer la mayor parte del trabajo, es importante revisar manualmente los archivos modificados para asegurarte de que los cambios son correctos. Algunos componentes pueden requerir ajustes adicionales.

### Componentes no soportados

Los scripts pueden no manejar todos los casos posibles de componentes de Material UI. Si encuentras componentes que no se han refactorizado correctamente, deberás hacerlo manualmente siguiendo la guía de refactorización.

## Guía de refactorización manual

Para los casos que los scripts no pueden manejar automáticamente, consulta la guía de refactorización manual:

[Guía de Refactorización de Material UI](../docs/REFACTORIZACION-MATERIAL-UI.md)

## Solución de problemas

### Los scripts no modifican ningún archivo

Asegúrate de que estás ejecutando los scripts desde el directorio raíz del proyecto y que los directorios especificados en los scripts existen.

### Errores después de la refactorización

Si encuentras errores después de ejecutar los scripts, puedes:

1. Restaurar la copia de seguridad creada por el script maestro
2. Corregir manualmente los errores siguiendo la guía de refactorización
3. Ejecutar `ng build --configuration=development` para verificar que los cambios son correctos

### Componentes que no se refactorizan correctamente

Algunos componentes pueden requerir una refactorización manual debido a su complejidad o a patrones de uso específicos. Consulta la guía de refactorización manual para estos casos.

## Ejemplo de refactorización

Se ha creado un ejemplo completo de refactorización para el componente `RolesAdminComponent`:

- `roles-admin.component.refactored.html`: Versión refactorizada del HTML
- `roles-admin.component.refactored.ts`: Versión refactorizada del TypeScript
- `roles-admin.component.refactored.scss`: Versión refactorizada de los estilos

Puedes usar estos archivos como referencia para refactorizar manualmente otros componentes.
