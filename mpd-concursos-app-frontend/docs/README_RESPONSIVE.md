# 📱 Sistema Responsive - MPD Concursos

## 🚀 Inicio Rápido

### 📋 Requisitos Previos

- Angular 17+
- SCSS habilitado
- Conocimientos básicos de CSS Grid y Flexbox

### 🛠️ Instalación

El sistema responsive ya está integrado en la aplicación. Para usar en nuevos componentes:

```typescript
// 1. Importar el servicio de accesibilidad
import { AccessibilityPreferencesService } from '@core/services/accessibility/accessibility-preferences.service';

// 2. Inyectar en el componente
export class MyComponent {
  private accessibilityPreferences = inject(AccessibilityPreferencesService);
}
```

```scss
// 3. Usar mixins en SCSS
.my-component {
  @include glassmorphism-card;
  @include glassmorphism-accessibility;
  @include hover-lift();
}
```

## 🎯 Conceptos Clave

### 📱 Mobile-First

**Siempre diseña para móvil primero**, luego escala hacia arriba:

```scss
// ✅ Correcto
.component {
  padding: 1rem; // Mobile base
  
  @include tablet {
    padding: 1.5rem; // Tablet
  }
  
  @include desktop {
    padding: 2rem; // Desktop
  }
}

// ❌ Incorrecto
.component {
  padding: 2rem; // Desktop first
  
  @media (max-width: 768px) {
    padding: 1rem; // Mobile override
  }
}
```

### 🎨 Glassmorphism Adaptativo

El sistema glassmorphism se optimiza automáticamente:

```scss
.glass-card {
  // Automáticamente usa menos blur en móviles
  backdrop-filter: var(--backdrop-blur-medium);
  
  // Se convierte en fondo sólido si el usuario prefiere
  @media (prefers-reduced-transparency: reduce) {
    backdrop-filter: none;
    background: var(--glass-bg-solid);
  }
}
```

### 👆 Touch Targets

Todos los elementos interactivos tienen **mínimo 44px**:

```html
<!-- Automático con clases -->
<button class="touch-target">Botón Accesible</button>

<!-- Manual en CSS -->
<style>
.my-button {
  min-height: 44px;
  min-width: 44px;
}
</style>
```

## 🔧 Uso Básico

### 📐 Breakpoints

```scss
.responsive-component {
  // Mobile (320px+)
  display: block;
  
  // Tablet (768px+)
  @include tablet {
    display: flex;
  }
  
  // Desktop (1024px+)
  @include desktop {
    display: grid;
    grid-template-columns: 1fr 2fr;
  }
  
  // Large (1440px+)
  @include large {
    max-width: 1200px;
    margin: 0 auto;
  }
}
```

### 🔤 Tipografía Fluida

```html
<!-- Usar clases predefinidas -->
<h1 class="fluid-h1">Título que escala</h1>
<h2 class="fluid-h2">Subtítulo responsive</h2>
<p class="text-base">Texto base fluido</p>

<!-- O usar variables CSS -->
<style>
.custom-title {
  font-size: var(--heading-h1); /* clamp(1.75rem, 1.5rem + 1.25vw, 2.5rem) */
}
</style>
```

### 🖼️ Imágenes Responsive

```html
<!-- Lazy loading automático -->
<img 
  appLazyLoadImage
  [src]="imageUrl"
  [placeholder]="'assets/images/placeholder.png'"
  alt="Descripción"
  class="responsive-image">

<!-- Con estados personalizados -->
<img 
  appLazyLoadImage
  [src]="imageUrl"
  [loadingClass]="'my-loading'"
  [loadedClass]="'my-loaded'"
  [errorClass]="'my-error'"
  alt="Descripción">
```

### 🎭 Animaciones Optimizadas

```scss
.animated-element {
  // Usa mixins optimizados
  @include hover-lift(4px, 1.02);
  
  // O clases predefinidas
  &.bounce-effect {
    @extend .animate-bounce;
  }
  
  // Respeta preferencias automáticamente
  @include glassmorphism-accessibility;
}
```

## 🎨 Componentes Comunes

### 📊 Grid Responsive

```html
<div class="responsive-grid">
  <div class="grid-item">Item 1</div>
  <div class="grid-item">Item 2</div>
  <div class="grid-item">Item 3</div>
</div>
```

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

### 🎯 Card Responsive

```html
<article class="responsive-card">
  <header class="card-header">
    <h3 class="fluid-h3">{{ title }}</h3>
    <button class="card-action touch-target">
      <i class="icon-more"></i>
    </button>
  </header>
  
  <div class="card-content">
    <img appLazyLoadImage [src]="imageUrl" class="card-image">
    <p class="text-base">{{ description }}</p>
  </div>
  
  <footer class="card-footer">
    <button class="btn-primary touch-target">Acción</button>
  </footer>
</article>
```

```scss
.responsive-card {
  @include glassmorphism-card;
  @include glassmorphism-accessibility;
  @include hover-lift();
  
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  
  @include tablet {
    flex-direction: row;
  }
}
```

## ♿ Accesibilidad

### 🎛️ Preferencias del Usuario

El sistema respeta automáticamente:

- **prefers-reduced-motion**: Deshabilita animaciones
- **prefers-reduced-transparency**: Elimina blur effects
- **prefers-contrast**: Aumenta contraste
- **forced-colors**: Usa colores del sistema

### 🔍 Verificar Preferencias

```typescript
export class MyComponent {
  private accessibilityPreferences = inject(AccessibilityPreferencesService);
  
  ngOnInit() {
    // Verificar preferencias específicas
    if (this.accessibilityPreferences.shouldDisableAnimations()) {
      // Lógica sin animaciones
    }
    
    if (this.accessibilityPreferences.shouldReduceBlur()) {
      // Usar fondos sólidos
    }
    
    // Reaccionar a cambios
    effect(() => {
      const prefs = this.accessibilityPreferences.preferences();
      this.updateUI(prefs);
    });
  }
}
```

## 🧪 Testing

### 📱 Viewports de Prueba

Testa en estos tamaños mínimos:

- **Mobile**: 375x667 (iPhone SE)
- **Tablet**: 768x1024 (iPad)
- **Desktop**: 1440x900 (Laptop estándar)

### 🔧 Debug Mode

```scss
// Agregar para ver breakpoint actual
body {
  @extend .debug-responsive;
}
```

### ✅ Checklist

- [ ] Touch targets ≥ 44px
- [ ] Texto legible en todos los tamaños
- [ ] Navegación funcional en móvil
- [ ] Imágenes responsive
- [ ] Animaciones optimizadas
- [ ] Preferencias de accesibilidad respetadas

## 🚨 Errores Comunes

### ❌ Desktop-First

```scss
// MAL
.component {
  width: 1200px; // Fijo para desktop
  
  @media (max-width: 768px) {
    width: 100%; // Override para móvil
  }
}

// BIEN
.component {
  width: 100%; // Mobile first
  
  @include desktop {
    max-width: 1200px; // Limitación para desktop
  }
}
```

### ❌ Touch Targets Pequeños

```scss
// MAL
.small-button {
  width: 32px;
  height: 32px; // Muy pequeño para touch
}

// BIEN
.accessible-button {
  min-width: 44px;
  min-height: 44px; // Tamaño mínimo accesible
}
```

### ❌ Animaciones No Optimizadas

```scss
// MAL
.bad-animation {
  transition: top 0.3s, left 0.3s; // Causa reflow
}

// BIEN
.good-animation {
  transition: transform 0.3s; // GPU accelerated
  
  &:hover {
    transform: translate3d(0, -2px, 0); // 3D para GPU
  }
}
```

## 📚 Recursos

### 📖 Documentación

- [Guía Completa](./RESPONSIVE_DESIGN_GUIDE.md)
- [Referencia Técnica](./RESPONSIVE_TECHNICAL_REFERENCE.md)

### 🔗 Enlaces Útiles

- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [CSS Grid Guide](https://css-tricks.com/snippets/css/complete-guide-grid/)
- [Flexbox Guide](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)

### 🛠️ Herramientas

- Chrome DevTools (Device Mode)
- Firefox Responsive Design Mode
- Accessibility Insights

---

## 🆘 Soporte

¿Problemas con el sistema responsive?

1. **Revisa la documentación técnica**
2. **Verifica que uses mobile-first**
3. **Comprueba touch targets**
4. **Testa en dispositivos reales**

---

*README actualizado: Diciembre 2024*
