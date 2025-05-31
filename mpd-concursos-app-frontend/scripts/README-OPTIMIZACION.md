# Optimización de Componentes con Estilos Grandes

Este directorio contiene scripts para optimizar componentes con archivos de estilos demasiado grandes que exceden los presupuestos de tamaño de Angular.

## Problema

Algunos componentes en la aplicación tienen archivos SCSS muy grandes que exceden los presupuestos de tamaño establecidos en Angular. Esto puede causar problemas de rendimiento y dificultar el mantenimiento del código.

## Solución

La solución recomendada es dividir los archivos SCSS grandes en módulos más pequeños y reutilizables. Esto no solo reduce el tamaño de los archivos individuales, sino que también mejora la organización y mantenibilidad del código.

## Scripts disponibles

### optimize-perfil-component.ps1

Este script optimiza el componente `perfil.component.scss` dividiéndolo en módulos más pequeños.

#### Cómo usar

1. Abre PowerShell en el directorio raíz del proyecto
2. Ejecuta el script:

```powershell
.\scripts\optimize-perfil-component.ps1
```

#### Qué hace

1. Crea una copia de seguridad del archivo original
2. Crea un directorio `styles` dentro del directorio del componente
3. Divide el contenido del archivo en secciones lógicas (layout, formularios, etc.)
4. Guarda cada sección en un archivo separado
5. Modifica el archivo original para importar los nuevos módulos

## Mejores prácticas para estilos en Angular

Para evitar problemas similares en el futuro, considera seguir estas mejores prácticas:

1. **Divide los estilos en módulos lógicos**: Crea archivos SCSS separados para diferentes aspectos de tu componente (layout, formularios, botones, etc.).

2. **Utiliza variables y mixins**: Define variables y mixins en archivos compartidos para reducir la duplicación de código.

3. **Aprovecha la herencia de SCSS**: Utiliza la herencia para extender estilos comunes en lugar de duplicarlos.

4. **Crea componentes más pequeños**: Divide los componentes grandes en componentes más pequeños y reutilizables.

5. **Utiliza estilos globales para patrones comunes**: Mueve los estilos que se repiten en múltiples componentes a archivos globales.

6. **Implementa un sistema de diseño**: Considera implementar un sistema de diseño con componentes y estilos predefinidos.

## Monitoreo de tamaño de componentes

Para monitorear el tamaño de tus componentes, puedes ejecutar:

```bash
ng build --stats-json
```

Y luego analizar el archivo `stats.json` generado para identificar los componentes más grandes.

## Recursos adicionales

- [Guía de estilo de Angular](https://angular.io/guide/styleguide)
- [Mejores prácticas de SCSS](https://sass-guidelin.es/)
- [Optimización de rendimiento en Angular](https://angular.io/guide/build-optimizer)
