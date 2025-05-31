# Scripts de Utilidad para MPD Concursos App

Este directorio contiene scripts de utilidad para ayudar en el desarrollo y mantenimiento de la aplicación MPD Concursos.

## fix-ng8107-warnings.ps1

Este script corrige automáticamente los warnings NG8107 en los componentes Angular. Estos warnings ocurren cuando se usa el operador de navegación segura (`?.`) en propiedades que no pueden ser `null` o `undefined`.

### ¿Qué hace?

El script busca patrones como `objeto?.propiedad` en los archivos HTML de los componentes y los reemplaza por `objeto.propiedad` o por `objeto && objeto.propiedad` según corresponda.

### Cómo usar

1. Abre PowerShell en el directorio raíz del proyecto
2. Ejecuta el script:

```powershell
.\scripts\fix-ng8107-warnings.ps1
```

3. Después de ejecutar el script, verifica que los warnings han sido corregidos ejecutando:

```powershell
ng build --configuration=development
```

### Patrones que corrige

- `objeto?.propiedad` en expresiones simples
- `objeto?.propiedad` en atributos ngClass
- `objeto?.propiedad` en expresiones de formato
- `objeto?.propiedad?.subpropiedad` en expresiones anidadas
- `objeto?.propiedad?.subpropiedad` en atributos
- `objeto?.propiedad` en expresiones de array

### Directorios procesados

El script procesa los siguientes directorios:

- `src\app\features\admin\components\roles`
- `src\app\features\admin\components\system-monitoring`
- `src\app\features\admin\components\user-behavior`
- `src\app\features\admin\components\users`
- `src\app\features\admin\components\profiles`

Si necesitas procesar directorios adicionales, puedes modificar el script y agregar los directorios a la lista `$directories`.

## Notas importantes

- Este script modifica archivos en el proyecto, por lo que es recomendable tener una copia de seguridad o asegurarse de que los cambios están en un sistema de control de versiones antes de ejecutarlo.
- Los patrones de reemplazo son generales y pueden no cubrir todos los casos específicos. Revisa los archivos modificados después de ejecutar el script.
- Si encuentras algún problema después de ejecutar el script, puedes revertir los cambios usando git o tu sistema de control de versiones.
