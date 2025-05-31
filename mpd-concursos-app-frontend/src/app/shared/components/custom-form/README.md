# Componentes de Formulario Personalizados

Este directorio contiene componentes de formulario personalizados que reemplazan a los componentes de Material UI. Estos componentes están diseñados para ser consistentes con el estilo visual del resto de la aplicación y resolver problemas de personalización que se presentan con Material UI.

## Motivación

Los componentes de formulario de Material UI presentan limitaciones de personalización que dificultan mantener una consistencia visual con el resto de la aplicación. Además, los estilos de Material UI pueden ser difíciles de sobrescribir y a menudo generan problemas de rendimiento debido a la cantidad de CSS que incluyen.

Para resolver estos problemas, hemos creado componentes personalizados que:

1. Mantienen la misma funcionalidad que los componentes de Material UI
2. Son visualmente consistentes con el resto de la aplicación
3. Son más ligeros y tienen mejor rendimiento
4. Son más fáciles de personalizar

## Componentes disponibles

### CustomFormFieldComponent

Reemplaza a `MatFormField` y `MatInput`. Proporciona un campo de entrada con etiqueta, mensaje de error y pista.

### CustomSelectComponent

Reemplaza a `MatSelect`. Proporciona un campo de selección con opciones desplegables.

### CustomCheckboxComponent

Reemplaza a `MatCheckbox`. Proporciona un campo de casilla de verificación.

### CustomDatepickerComponent

Reemplaza a `MatDatepicker`. Proporciona un campo para seleccionar fechas.

### CustomButtonComponent

Reemplaza a `MatButton` y `MatIconButton`. Proporciona botones con diferentes estilos y variantes.

### CustomTableComponent

Reemplaza a `MatTable`, `MatPaginator` y `MatSort`. Proporciona una tabla con paginación y ordenamiento.

### CustomDialogComponent

Reemplaza a `MatDialog`. Proporciona un diálogo modal personalizado.

### CustomCardComponent

Reemplaza a `MatCard`. Proporciona una tarjeta con contenido.

### CustomTabsComponent

Reemplaza a `MatTabs`. Proporciona pestañas para organizar contenido.

## Uso

Cada componente tiene su propia documentación con ejemplos de uso. Consulta los archivos README.md en cada directorio de componente para más detalles.

## Migración desde Material UI

Para migrar de Material UI a estos componentes personalizados, sigue estos pasos:

1. Identifica los componentes de Material UI que estás utilizando
2. Busca el componente personalizado equivalente
3. Reemplaza las importaciones de Material UI por las importaciones de los componentes personalizados
4. Actualiza las plantillas HTML para usar los nuevos componentes
5. Ajusta los estilos según sea necesario

## Ejemplo de migración

### Antes (con Material UI):

```html
<mat-form-field appearance="outline">
  <mat-label>Nombre</mat-label>
  <input matInput formControlName="nombre" required>
  <mat-error *ngIf="form.get('nombre')?.invalid">El nombre es requerido</mat-error>
</mat-form-field>
```

### Después (con componentes personalizados):

```html
<app-custom-form-field 
  label="Nombre" 
  [required]="true"
  [control]="form.get('nombre')" 
  errorMessage="El nombre es requerido">
</app-custom-form-field>
```
