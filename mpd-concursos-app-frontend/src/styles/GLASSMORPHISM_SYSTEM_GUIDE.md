# Glassmorphism Design System - Guía de Uso

## 📋 Descripción General

Este sistema unificado de glassmorphism elimina duplicaciones de código y proporciona un conjunto consistente de variables, mixins y clases de utilidad para toda la aplicación.

## 🗂️ Estructura del Sistema

```
src/styles/
├── glassmorphism-variables.scss    # Variables CSS unificadas
├── glassmorphism-mixins.scss       # Mixins SCSS consolidados
├── glassmorphism-system.scss       # Punto de entrada principal
└── GLASSMORPHISM_SYSTEM_GUIDE.md   # Esta guía
```

## 🚀 Cómo Usar

### 1. Importación en Componentes

```scss
// En archivos SCSS de componentes
@import 'src/styles/glassmorphism-system';

.my-component {
  @include glassmorphism-card;
}
```

### 2. Uso de Variables CSS

```scss
.my-element {
  background: var(--glass-background-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  transition: var(--transition-normal);
}
```

### 3. Uso de Mixins

```scss
.my-card {
  @include glassmorphism-card('primary', 'normal');
}

.my-button {
  @include glassmorphism-button('success', 'large');
}

.my-input {
  @include glassmorphism-form-field;
}
```

### 4. Clases de Utilidad

```html
<!-- En templates HTML -->
<div class="glass-card">
  <button class="glass-btn glass-btn-success">Guardar</button>
  <input class="glass-input" placeholder="Nombre">
</div>
```

## 🎨 Variables Disponibles

### Backgrounds
- `--glass-background-primary`: Fondo principal
- `--glass-background-secondary`: Fondo secundario
- `--glass-background-hover`: Estado hover
- `--glass-background-light`: Versión clara
- `--glass-background-dark`: Versión oscura

### Colores de Texto
- `--text-primary`: Texto principal (#f9fafb)
- `--text-secondary`: Texto secundario (#d1d5db)
- `--text-tertiary`: Texto terciario (#9ca3af)
- `--text-muted`: Texto atenuado (#6b7280)

### Bordes
- `--border-primary`: Borde principal
- `--border-hover`: Borde en hover
- `--border-focus`: Borde en focus

### Espaciado
- `--spacing-xs`: 0.25rem
- `--spacing-sm`: 0.5rem
- `--spacing-md`: 1rem
- `--spacing-lg`: 1.5rem
- `--spacing-xl`: 2rem
- `--spacing-2xl`: 3rem

### Transiciones
- `--transition-fast`: 0.15s
- `--transition-normal`: 0.3s
- `--transition-slow`: 0.5s

## 🔧 Mixins Disponibles

### Glassmorphism Base
```scss
@include glassmorphism-base('primary'); // 'primary', 'secondary', 'light', 'dark'
```

### Cards
```scss
@include glassmorphism-card('primary', 'normal'); // variant, padding
@include glassmorphism-card-compact; // Versión compacta
```

### Botones
```scss
@include glassmorphism-button('primary', 'normal'); // variant, size
// Variants: 'primary', 'secondary', 'success', 'warning', 'danger', 'ghost'
// Sizes: 'small', 'normal', 'large'
```

### Formularios
```scss
@include glassmorphism-form-field;
```

### Tablas
```scss
@include glassmorphism-table;
```

### Diálogos
```scss
@include glassmorphism-dialog;
```

### Badges
```scss
@include glassmorphism-badge('success'); // 'success', 'warning', 'danger', 'info'
```

### Utilidades
```scss
@include glassmorphism-scrollbar;
@include glassmorphism-responsive;
@include glassmorphism-accessibility;
@include glassmorphism-loading;
```

## 🎯 Clases de Utilidad

### Cards
- `.glass-card`: Card estándar
- `.glass-card-compact`: Card compacto
- `.glass-card-dark`: Card oscuro
- `.glass-card-light`: Card claro

### Botones
- `.glass-btn`: Botón primario
- `.glass-btn-secondary`: Botón secundario
- `.glass-btn-success`: Botón de éxito
- `.glass-btn-warning`: Botón de advertencia
- `.glass-btn-danger`: Botón de peligro
- `.glass-btn-ghost`: Botón fantasma
- `.glass-btn-sm`: Botón pequeño
- `.glass-btn-lg`: Botón grande

### Formularios
- `.glass-input`: Input estándar
- `.glass-textarea`: Textarea
- `.glass-select`: Select

### Badges
- `.glass-badge`: Badge estándar
- `.glass-badge-success`: Badge de éxito
- `.glass-badge-warning`: Badge de advertencia
- `.glass-badge-danger`: Badge de peligro
- `.glass-badge-info`: Badge de información

### Layout
- `.glass-container`: Contenedor principal
- `.glass-section`: Sección
- `.glass-scrollbar`: Scrollbar personalizado

### Animaciones
- `.glass-fade-in`: Animación de aparición
- `.glass-slide-up`: Animación de deslizamiento
- `.glass-scale-in`: Animación de escala

## 🔄 Migración desde Sistema Anterior

### Antes (Duplicado)
```scss
// En múltiples archivos
$glass-background: rgba(55, 65, 81, 0.8);
$text-primary: #f9fafb;

@mixin glass-card {
  background: $glass-background;
  // ... más código duplicado
}
```

### Después (Unificado)
```scss
// Solo importar el sistema
@import 'src/styles/glassmorphism-system';

.my-component {
  @include glassmorphism-card;
  color: var(--text-primary);
}
```

## ✅ Beneficios

1. **Eliminación de duplicaciones**: Un solo lugar para todas las variables y mixins
2. **Consistencia visual**: Todos los componentes usan el mismo sistema
3. **Mantenimiento simplificado**: Cambios centralizados
4. **Mejor rendimiento**: Menos CSS duplicado
5. **Accesibilidad integrada**: Soporte para prefers-reduced-motion y high-contrast
6. **Responsive por defecto**: Breakpoints y utilidades incluidas

## 🚨 Reglas de Uso

1. **NO crear variables locales** que dupliquen las del sistema
2. **Usar siempre las variables CSS** en lugar de valores hardcodeados
3. **Preferir mixins** sobre código CSS repetitivo
4. **Usar clases de utilidad** para casos simples
5. **Mantener la nomenclatura** consistente con el sistema

## 🔍 Debugging

Para verificar que el sistema está funcionando:

```scss
// Verificar que las variables están disponibles
.test {
  background: var(--glass-background-primary, red); // Si es rojo, hay problema
}
```

## 📚 Referencias

- [Glassmorphism Design System Guide](../glassmorphism-design-system-guide.md)
- [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
- [SCSS Mixins](https://sass-lang.com/documentation/at-rules/mixin)
