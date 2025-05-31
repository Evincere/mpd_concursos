# Guía de Refactorización de Material UI a Componentes Personalizados

Este documento proporciona una guía para refactorizar los componentes de Material UI a componentes personalizados en la aplicación MPD Concursos.

## Motivación

Los componentes de Material UI presentan limitaciones de personalización que dificultan mantener una consistencia visual con el resto de la aplicación. Además, los estilos de Material UI pueden ser difíciles de sobrescribir y a menudo generan problemas de rendimiento debido a la cantidad de CSS que incluyen.

## Componentes Personalizados Disponibles

Se han creado los siguientes componentes personalizados para reemplazar a los componentes de Material UI:

1. **CustomFormFieldComponent**: Reemplaza a `MatFormField` y `MatInput`
2. **CustomSelectComponent**: Reemplaza a `MatSelect`
3. **CustomButtonComponent**: Reemplaza a `MatButton` y `MatIconButton`
4. **CustomTableComponent**: Reemplaza a `MatTable`, `MatPaginator` y `MatSort`
5. **CustomDialogComponent**: Reemplaza a `MatDialog`
6. **CustomCardComponent**: Reemplaza a `MatCard`
7. **CustomTabsComponent**: Reemplaza a `MatTabs`

## Guía de Refactorización

### 1. Importar los Componentes Personalizados

En lugar de importar los módulos de Material UI, importa el módulo `CustomFormModule`:

```typescript
// Antes
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
// ... más importaciones de Material UI

// Después
import { CustomFormModule } from '@shared/components/custom-form/custom-form.module';
```

### 2. Refactorizar Botones

#### Antes (con Material UI):

```html
<button mat-raised-button color="primary" (click)="onSave()">
  <mat-icon>save</mat-icon>
  Guardar
</button>
```

#### Después (con componentes personalizados):

```html
<app-custom-button 
  [label]="'Guardar'" 
  [icon]="'save'"
  (buttonClick)="onSave()">
</app-custom-button>
```

### 3. Refactorizar Campos de Formulario

#### Antes (con Material UI):

```html
<mat-form-field appearance="outline">
  <mat-label>Nombre</mat-label>
  <input matInput formControlName="nombre" required>
  <mat-error *ngIf="form.get('nombre')?.invalid">El nombre es requerido</mat-error>
</mat-form-field>
```

#### Después (con componentes personalizados):

```html
<app-custom-form-field 
  [label]="'Nombre'" 
  [required]="true"
  [control]="form.get('nombre')" 
  [errorMessage]="'El nombre es requerido'">
</app-custom-form-field>
```

### 4. Refactorizar Selectores

#### Antes (con Material UI):

```html
<mat-form-field appearance="outline">
  <mat-label>Tipo</mat-label>
  <mat-select formControlName="tipo">
    <mat-option value="1">Tipo 1</mat-option>
    <mat-option value="2">Tipo 2</mat-option>
  </mat-select>
</mat-form-field>
```

#### Después (con componentes personalizados):

```html
<app-custom-select
  [label]="'Tipo'"
  [control]="form.get('tipo')"
  [options]="[
    { value: '1', label: 'Tipo 1' },
    { value: '2', label: 'Tipo 2' }
  ]">
</app-custom-select>
```

### 5. Refactorizar Tarjetas

#### Antes (con Material UI):

```html
<mat-card>
  <mat-card-header>
    <mat-card-title>Título</mat-card-title>
    <mat-card-subtitle>Subtítulo</mat-card-subtitle>
  </mat-card-header>
  <mat-card-content>
    Contenido de la tarjeta
  </mat-card-content>
  <mat-card-actions>
    <button mat-button>Acción</button>
  </mat-card-actions>
</mat-card>
```

#### Después (con componentes personalizados):

```html
<app-custom-card 
  [title]="'Título'" 
  [subtitle]="'Subtítulo'"
  [hasFooter]="true">
  
  Contenido de la tarjeta
  
  <ng-container card-footer>
    <app-custom-button [label]="'Acción'"></app-custom-button>
  </ng-container>
</app-custom-card>
```

### 6. Refactorizar Tablas

#### Antes (con Material UI):

```html
<table mat-table [dataSource]="dataSource" matSort>
  <ng-container matColumnDef="nombre">
    <th mat-header-cell *matHeaderCellDef mat-sort-header>Nombre</th>
    <td mat-cell *matCellDef="let item">{{item.nombre}}</td>
  </ng-container>
  
  <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
  <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
</table>

<mat-paginator [pageSize]="10" [pageSizeOptions]="[5, 10, 25, 50]"></mat-paginator>
```

#### Después (con componentes personalizados):

```html
<app-custom-table
  [data]="dataSource"
  [columns]="tableColumns"
  [paginated]="true"
  [pageSize]="10"
  [pageSizeOptions]="[5, 10, 25, 50]"
  (sortChange)="onSortChange($event)"
  (pageChange)="onPageChange($event)">
  
  <app-custom-table-column property="nombre" header="Nombre" [sortable]="true">
    <ng-template let-item>
      {{item.nombre}}
    </ng-template>
  </app-custom-table-column>
  
</app-custom-table>
```

### 7. Refactorizar Diálogos

#### Antes (con Material UI):

```typescript
const dialogRef = this.dialog.open(MiDialogoComponent, {
  width: '500px',
  data: { id: 1 }
});

dialogRef.afterClosed().subscribe(result => {
  if (result) {
    // Hacer algo con el resultado
  }
});
```

#### Después (con componentes personalizados):

```typescript
const dialogRef = this.dialogService.open(MiDialogoComponent, {
  title: 'Mi Diálogo',
  icon: 'info',
  size: 'medium',
  data: { id: 1 }
});

dialogRef.afterClosed().subscribe(result => {
  if (result) {
    // Hacer algo con el resultado
  }
});
```

### 8. Refactorizar Pestañas

#### Antes (con Material UI):

```html
<mat-tab-group>
  <mat-tab label="Pestaña 1">
    Contenido de la pestaña 1
  </mat-tab>
  <mat-tab label="Pestaña 2">
    Contenido de la pestaña 2
  </mat-tab>
</mat-tab-group>
```

#### Después (con componentes personalizados):

```html
<app-custom-tabs>
  <app-custom-tab [label]="'Pestaña 1'">
    Contenido de la pestaña 1
  </app-custom-tab>
  <app-custom-tab [label]="'Pestaña 2'">
    Contenido de la pestaña 2
  </app-custom-tab>
</app-custom-tabs>
```

## Ejemplo Completo

Se ha creado un ejemplo completo de refactorización para el componente `RolesAdminComponent`:

- `roles-admin.component.refactored.html`: Versión refactorizada del HTML
- `roles-admin.component.refactored.ts`: Versión refactorizada del TypeScript
- `roles-admin.component.refactored.scss`: Versión refactorizada de los estilos

Puedes usar estos archivos como referencia para refactorizar otros componentes.

## Consideraciones Importantes

1. **Pruebas**: Después de refactorizar un componente, asegúrate de probarlo exhaustivamente para verificar que mantiene la misma funcionalidad.

2. **Estilos**: Los componentes personalizados tienen sus propios estilos, pero puedes personalizarlos usando CSS/SCSS en el componente padre.

3. **Compatibilidad**: Los componentes personalizados están diseñados para ser compatibles con la API de los componentes de Material UI, pero pueden haber diferencias sutiles. Consulta la documentación de cada componente para más detalles.

4. **Rendimiento**: Los componentes personalizados son más ligeros que los de Material UI, lo que debería mejorar el rendimiento de la aplicación.

5. **Accesibilidad**: Los componentes personalizados mantienen las características de accesibilidad de los componentes de Material UI.

## Recursos Adicionales

- [Documentación de los Componentes Personalizados](../src/app/shared/components/custom-form/README.md)
- [Ejemplos de Uso](../src/app/features/admin/components/roles/roles-admin.component.refactored.html)
