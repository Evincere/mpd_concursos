# Sistema de Botones Unificado - Glassmorphism Premium Dark

## 📋 **RESUMEN**

Este documento describe el sistema unificado de botones implementado para mantener la consistencia visual en toda la aplicación, siguiendo el diseño glassmorphism premium dark.

## 🎯 **OBJETIVOS**

- **Consistencia Visual**: Todos los botones siguen el mismo sistema de diseño
- **Accesibilidad**: Cumplimiento con estándares WCAG AA
- **Mantenibilidad**: Un solo componente para todos los tipos de botones
- **Flexibilidad**: Múltiples variantes para diferentes casos de uso

## 🛠️ **COMPONENTE PRINCIPAL**

### **CustomButtonComponent**

**Ubicación**: `src/app/shared/components/custom-button/custom-button.component.ts`

**Selector**: `app-custom-button`

## 📊 **VARIANTES DISPONIBLES**

### **1. Primary (Predeterminado)**
```html
<app-custom-button
  variant="primary"
  label="Botón Principal"
  icon="check">
</app-custom-button>
```
- **Uso**: Acciones principales, CTAs importantes
- **Color**: Azul (#3b82f6)
- **Estilo**: Sólido con glassmorphism

### **2. Secondary**
```html
<app-custom-button
  variant="secondary"
  label="Botón Secundario">
</app-custom-button>
```
- **Uso**: Acciones secundarias
- **Color**: Gris glassmorphism
- **Estilo**: Glassmorphism con fondo translúcido

### **3. Stroked**
```html
<app-custom-button
  variant="stroked"
  label="Botón Contorno">
</app-custom-button>
```
- **Uso**: Acciones alternativas
- **Color**: Transparente con borde
- **Estilo**: Solo contorno glassmorphism

### **4. Danger**
```html
<app-custom-button
  variant="danger"
  label="Eliminar"
  icon="trash">
</app-custom-button>
```
- **Uso**: Acciones destructivas
- **Color**: Rojo (#ef4444)
- **Estilo**: Glassmorphism con tinte rojo

### **5. Success**
```html
<app-custom-button
  variant="success"
  label="Confirmar"
  icon="check">
</app-custom-button>
```
- **Uso**: Confirmaciones, acciones exitosas
- **Color**: Verde (#4CAF50)
- **Estilo**: Glassmorphism con tinte verde

### **6. Warning**
```html
<app-custom-button
  variant="warning"
  label="Advertencia"
  icon="exclamation-triangle">
</app-custom-button>
```
- **Uso**: Advertencias, acciones que requieren atención
- **Color**: Naranja (#ff9800)
- **Estilo**: Glassmorphism con tinte naranja

### **7. Download**
```html
<app-custom-button
  variant="download"
  label="Descargar PDF"
  icon="download"
  href="/path/to/file.pdf"
  target="_blank">
</app-custom-button>
```
- **Uso**: Botones de descarga
- **Color**: Azul sólido
- **Estilo**: Optimizado para descargas

### **8. Navigation**
```html
<app-custom-button
  variant="navigation"
  label="Volver"
  icon="arrow-left">
</app-custom-button>
```
- **Uso**: Navegación, botones de volver
- **Color**: Glassmorphism neutro
- **Estilo**: Diseño para navegación

### **9. Ghost**
```html
<app-custom-button
  variant="ghost"
  label="Cancelar">
</app-custom-button>
```
- **Uso**: Acciones de cancelación, botones sutiles
- **Color**: Transparente con hover
- **Estilo**: Mínimo glassmorphism

## 📏 **TAMAÑOS DISPONIBLES**

### **Small**
```html
<app-custom-button size="small" label="Pequeño">
</app-custom-button>
```
- **Padding**: 0.5rem 1rem
- **Font Size**: 0.8125rem
- **Min Height**: 32px

### **Medium (Predeterminado)**
```html
<app-custom-button size="medium" label="Mediano">
</app-custom-button>
```
- **Padding**: 0.75rem 1.5rem
- **Font Size**: 0.875rem
- **Min Height**: 40px

### **Large**
```html
<app-custom-button size="large" label="Grande">
</app-custom-button>
```
- **Padding**: 1rem 2rem
- **Font Size**: 1rem
- **Min Height**: 48px

## 🎨 **PROPIEDADES DISPONIBLES**

| Propiedad | Tipo | Predeterminado | Descripción |
|-----------|------|----------------|-------------|
| `label` | string | '' | Texto del botón |
| `icon` | string | '' | Icono FontAwesome (sin 'fa-') |
| `variant` | string | 'primary' | Variante de estilo |
| `size` | string | 'medium' | Tamaño del botón |
| `disabled` | boolean | false | Estado deshabilitado |
| `loading` | boolean | false | Estado de carga |
| `ariaLabel` | string | '' | Etiqueta de accesibilidad |
| `tooltip` | string | '' | Tooltip al hacer hover |
| `href` | string | '' | URL para enlaces |
| `target` | string | '' | Target para enlaces |
| `iconOnly` | boolean | false | Solo mostrar icono |

## 🔗 **EVENTOS**

### **buttonClick**
```html
<app-custom-button
  label="Hacer clic"
  (buttonClick)="onButtonClick()">
</app-custom-button>
```

## 📱 **RESPONSIVE DESIGN**

El sistema incluye optimizaciones automáticas para dispositivos móviles:

- **Tablet (≤768px)**: Tamaños ligeramente reducidos
- **Móvil (≤480px)**: Tamaños más compactos
- **Touch targets**: Mínimo 44px para accesibilidad

## ♿ **ACCESIBILIDAD**

### **Características Implementadas**
- **Focus visible**: Outline azul en navegación por teclado
- **ARIA labels**: Soporte completo para lectores de pantalla
- **High contrast**: Soporte para modo alto contraste
- **Reduced motion**: Respeta preferencias de movimiento reducido
- **Touch targets**: Tamaños mínimos para dispositivos táctiles

### **Navegación por Teclado**
- **Enter**: Activa el botón
- **Space**: Activa el botón
- **Tab**: Navegación entre botones

## 🔄 **MIGRACIÓN DESDE BOTONES ANTIGUOS**

### **Antes (Material UI)**
```html
<button mat-raised-button color="primary">
  Botón
</button>
```

### **Después (Sistema Unificado)**
```html
<app-custom-button
  variant="primary"
  label="Botón">
</app-custom-button>
```

### **Antes (CSS Personalizado)**
```html
<button class="custom-download-button">
  <i class="fas fa-download"></i>
  Descargar
</button>
```

### **Después (Sistema Unificado)**
```html
<app-custom-button
  variant="download"
  icon="download"
  label="Descargar">
</app-custom-button>
```

## 🎯 **CASOS DE USO COMUNES**

### **Botón de Acción Principal**
```html
<app-custom-button
  variant="primary"
  label="Guardar Cambios"
  icon="save"
  (buttonClick)="onSave()">
</app-custom-button>
```

### **Botón de Descarga**
```html
<app-custom-button
  variant="download"
  label="Descargar PDF"
  icon="download"
  href="/api/documents/123.pdf"
  target="_blank">
</app-custom-button>
```

### **Botón de Navegación**
```html
<app-custom-button
  variant="navigation"
  label="Volver"
  icon="arrow-left"
  (buttonClick)="goBack()">
</app-custom-button>
```

### **Botón Solo Icono**
```html
<app-custom-button
  variant="ghost"
  icon="times"
  [iconOnly]="true"
  ariaLabel="Cerrar"
  (buttonClick)="close()">
</app-custom-button>
```

### **Botón con Estado de Carga**
```html
<app-custom-button
  variant="primary"
  label="Procesando..."
  [loading]="isLoading"
  [disabled]="isLoading"
  (buttonClick)="process()">
</app-custom-button>
```

## 🔧 **MANTENIMIENTO**

### **Agregar Nueva Variante**
1. Agregar el tipo en `CustomButtonComponent.variant`
2. Crear estilos CSS en `custom-button.component.scss`
3. Documentar en este archivo
4. Actualizar tests si es necesario

### **Modificar Estilos Globales**
- Editar variables CSS en `custom-button.component.scss`
- Mantener consistencia con el sistema glassmorphism
- Verificar accesibilidad después de cambios

## ✅ **BENEFICIOS DEL SISTEMA UNIFICADO**

1. **Consistencia**: Todos los botones siguen el mismo diseño
2. **Mantenibilidad**: Un solo lugar para cambios globales
3. **Accesibilidad**: Estándares implementados uniformemente
4. **Performance**: Componente optimizado y reutilizable
5. **Flexibilidad**: Múltiples variantes para todos los casos
6. **Responsive**: Adaptación automática a diferentes pantallas
7. **Glassmorphism**: Efectos premium consistentes en toda la app
