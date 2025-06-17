# 📱 Guía de Responsive Design - MPD Concursos

## 🎯 Visión General

Esta guía documenta el sistema de diseño responsive implementado en la aplicación MPD Concursos, basado en un enfoque **mobile-first** con **glassmorphism** y **accesibilidad** como pilares fundamentales.

## 🏗️ Arquitectura del Sistema

### 📐 Enfoque Mobile-First

```scss
// ✅ Correcto - Mobile First
.component {
  // Estilos base para móvil (320px+)
  padding: 1rem;
  font-size: 1rem;
  
  // Tablet (768px+)
  @media (min-width: 768px) {
    padding: 1.5rem;
    font-size: 1.125rem;
  }
  
  // Desktop (1024px+)
  @media (min-width: 1024px) {
    padding: 2rem;
    font-size: 1.25rem;
  }
}
```

### 🎨 Sistema Glassmorphism Responsive

El sistema glassmorphism se adapta automáticamente a diferentes dispositivos:

```scss
// Variables que se ajustan por dispositivo
:root {
  --backdrop-blur-light: blur(8px);
  --backdrop-blur-medium: blur(12px);
  --backdrop-blur-strong: blur(16px);
}

// Optimizaciones para móvil
@media (max-width: 768px) {
  :root {
    --backdrop-blur-light: blur(6px);
    --backdrop-blur-medium: blur(8px);
    --backdrop-blur-strong: blur(10px);
  }
}
```

## 📏 Breakpoints del Sistema

### 🎯 Breakpoints Principales

| Dispositivo | Ancho Mínimo | Variable SCSS | Uso Principal |
|-------------|--------------|---------------|---------------|
| Mobile      | 320px        | `$mobile`     | Smartphones   |
| Tablet      | 768px        | `$tablet`     | Tablets       |
| Desktop     | 1024px       | `$desktop`    | Laptops       |
| Large       | 1440px       | `$large`      | Monitores     |
| XLarge      | 1920px       | `$xlarge`     | 4K/UltraWide  |

### 🛠️ Mixins de Breakpoints

```scss
// Uso de mixins responsive
.component {
  // Mobile (base)
  display: block;
  
  @include tablet {
    display: flex;
  }
  
  @include desktop {
    display: grid;
    grid-template-columns: 1fr 2fr;
  }
}
```

## 🔤 Tipografía Fluida

### 📝 Sistema clamp()

Implementamos tipografía fluida que escala suavemente entre dispositivos:

```scss
// Variables de tipografía fluida
--font-size-xs: clamp(0.7rem, 0.65rem + 0.25vw, 0.75rem);
--font-size-sm: clamp(0.8rem, 0.75rem + 0.25vw, 0.875rem);
--font-size-base: clamp(0.9rem, 0.85rem + 0.25vw, 1rem);
--font-size-lg: clamp(1.1rem, 1rem + 0.5vw, 1.25rem);

// Headings específicos
--heading-h1: clamp(1.75rem, 1.5rem + 1.25vw, 2.5rem);
--heading-h2: clamp(1.5rem, 1.25rem + 1.25vw, 2rem);
```

### 🎨 Clases Utilitarias

```html
<!-- Tipografía fluida -->
<h1 class="fluid-h1">Título Principal</h1>
<h2 class="fluid-h2">Subtítulo</h2>
<p class="text-base">Texto base responsive</p>
```

## 👆 Touch Targets y Accesibilidad

### 📱 Tamaños Mínimos

Todos los elementos interactivos cumplen con **WCAG AA**:

```scss
// Touch targets mínimos
button, a, [role="button"] {
  min-height: 44px;
  min-width: 44px;
  box-sizing: border-box;
}

// Navegación móvil
.mobile-nav-item {
  min-height: 48px; // Más grande en móvil
  min-width: 48px;
}
```

### ♿ Preferencias de Accesibilidad

```scss
// Respeto a preferencias del usuario
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

@media (prefers-reduced-transparency: reduce) {
  .glass-card {
    backdrop-filter: none !important;
    background: var(--glass-bg-solid) !important;
  }
}
```

## 🎭 Animaciones Responsive

### ⚡ GPU Acceleration

Todas las animaciones usan `transform3d` para mejor rendimiento:

```scss
// ✅ Optimizado
.hover-effect {
  transform: translate3d(0, -2px, 0) scale3d(1.02, 1.02, 1);
  will-change: transform;
}

// ❌ No optimizado
.hover-effect-bad {
  top: -2px;
  left: 2px;
  width: 102%;
}
```

### 📱 Optimizaciones Móviles

```scss
// Menos blur en móviles para mejor rendimiento
@media (max-width: 768px) {
  .glass-card {
    backdrop-filter: var(--backdrop-blur-light);
    will-change: transform;
    contain: layout style paint;
  }
}
```

## 🖼️ Imágenes Responsive

### 🚀 Lazy Loading

```html
<!-- Lazy loading con estados -->
<img 
  appLazyLoadImage
  [src]="imageUrl"
  [placeholder]="'assets/images/placeholder.png'"
  alt="Descripción"
  class="responsive-image"
  [loadingClass]="'image-loading'"
  [loadedClass]="'image-loaded'"
  [errorClass]="'image-error'">
```

### 📐 Contenedores Responsive

```scss
.image-container {
  position: relative;
  width: 100%;
  aspect-ratio: 16/9; // Mantiene proporción
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}
```

## 🎨 Componentes Responsive

### 📊 Grid System

```scss
.responsive-grid {
  display: grid;
  gap: var(--spacing-md);
  
  // Mobile: 1 columna
  grid-template-columns: 1fr;
  
  // Tablet: 2 columnas
  @include tablet {
    grid-template-columns: repeat(2, 1fr);
  }
  
  // Desktop: 3 columnas
  @include desktop {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### 🎯 Navegación Adaptativa

```scss
.navigation {
  // Móvil: Bottom navigation
  @media (max-width: 768px) {
    position: fixed;
    bottom: 0;
    width: 100%;
    height: 70px;
  }
  
  // Desktop: Sidebar
  @media (min-width: 769px) {
    position: fixed;
    left: 0;
    top: 0;
    width: 256px;
    height: 100vh;
  }
}
```

## 🛠️ Herramientas y Utilidades

### 📱 Clases Utilitarias

```scss
// Visibilidad responsive
.mobile-only { @include desktop { display: none; } }
.desktop-only { @include mobile { display: none; } }

// Espaciado responsive
.p-responsive { padding: clamp(1rem, 4vw, 2rem); }
.m-responsive { margin: clamp(0.5rem, 2vw, 1rem); }

// Flexbox responsive
.flex-mobile-col {
  @include mobile {
    flex-direction: column;
  }
}
```

### 🔧 Mixins Útiles

```scss
// Container responsive
@mixin responsive-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 clamp(1rem, 4vw, 2rem);
}

// Aspect ratio
@mixin aspect-ratio($width, $height) {
  aspect-ratio: #{$width}/#{$height};
  
  @supports not (aspect-ratio: 1) {
    &::before {
      content: '';
      display: block;
      padding-top: percentage($height / $width);
    }
  }
}
```

## 🧪 Testing Responsive

### 📏 Viewports de Prueba

| Dispositivo | Resolución | Orientación |
|-------------|------------|-------------|
| iPhone SE   | 375x667    | Portrait    |
| iPhone 12   | 390x844    | Portrait    |
| iPad        | 768x1024   | Portrait    |
| iPad Pro    | 1024x1366  | Portrait    |
| Desktop     | 1440x900   | Landscape   |

### 🔍 Herramientas de Debug

```typescript
// Servicio de testing responsive
@Injectable()
export class ResponsiveTestRunnerService {
  runTestsIfDevelopment(): void {
    if (!environment.production) {
      this.testBreakpoints();
      this.testTouchTargets();
      this.testTypography();
    }
  }
}
```

## 📋 Checklist de Implementación

### ✅ Requisitos Básicos

- [ ] Mobile-first approach
- [ ] Touch targets ≥ 44px
- [ ] Tipografía fluida con clamp()
- [ ] Imágenes responsive con lazy loading
- [ ] Navegación adaptativa
- [ ] Animaciones optimizadas

### ♿ Accesibilidad

- [ ] prefers-reduced-motion
- [ ] prefers-reduced-transparency
- [ ] prefers-contrast
- [ ] Focus indicators visibles
- [ ] Contraste WCAG AA

### ⚡ Rendimiento

- [ ] GPU acceleration (transform3d)
- [ ] will-change apropiado
- [ ] Lazy loading implementado
- [ ] Blur reducido en móviles
- [ ] Contain CSS para optimización

## 🚀 Mejores Prácticas

### 📱 Mobile-First

1. **Diseña para móvil primero**
2. **Usa min-width en media queries**
3. **Optimiza touch interactions**
4. **Reduce efectos costosos en móvil**

### 🎨 Glassmorphism

1. **Ajusta blur según dispositivo**
2. **Proporciona fallbacks sólidos**
3. **Respeta preferencias de transparencia**
4. **Optimiza para rendimiento**

### ♿ Accesibilidad

1. **Respeta preferencias del usuario**
2. **Mantén touch targets adecuados**
3. **Proporciona alternativas**
4. **Testa con tecnologías asistivas**

---

## 📚 Referencias

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [CSS Grid Layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout)
- [CSS Flexbox](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Flexible_Box_Layout)
- [Responsive Images](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images)

---

*Documentación actualizada: Diciembre 2024*
*Versión: 1.0.0*
