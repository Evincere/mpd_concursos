# 🔧 Referencia Técnica - Sistema Responsive

## 📁 Estructura de Archivos

```
src/styles/
├── unified-glassmorphism-variables.scss    # Variables CSS responsive
├── unified-glassmorphism-mixins.scss       # Mixins y funciones
├── unified-glassmorphism-system.scss       # Sistema de clases
├── _responsive.scss                        # Utilidades responsive
└── _variables.scss                         # Variables SCSS base

src/app/core/services/
└── accessibility/
    └── accessibility-preferences.service.ts # Servicio de accesibilidad
```

## 🎯 Variables CSS Principales

### 📐 Breakpoints

```scss
// _variables.scss
$mobile: 320px;
$tablet: 768px;
$desktop: 1024px;
$large: 1440px;
$xlarge: 1920px;

// Mixins correspondientes
@mixin mobile { @media (min-width: $mobile) { @content; } }
@mixin tablet { @media (min-width: $tablet) { @content; } }
@mixin desktop { @media (min-width: $desktop) { @content; } }
```

### 🎨 Variables Glassmorphism

```scss
// unified-glassmorphism-variables.scss
:root {
  // Backdrop filters adaptativos
  --backdrop-blur-base-light: 8px;
  --backdrop-blur-light: blur(calc(var(--backdrop-blur-base-light) * var(--backdrop-blur-multiplier)));
  
  // Multiplicadores de accesibilidad
  --animation-duration-multiplier: 1;
  --backdrop-blur-multiplier: 1;
  
  // Duraciones accesibles
  --duration-fast-accessible: calc(var(--duration-fast) * var(--animation-duration-multiplier));
}
```

### 🔤 Tipografía Fluida

```scss
// Variables clamp() para escalado suave
--font-size-xs: clamp(0.7rem, 0.65rem + 0.25vw, 0.75rem);
--font-size-sm: clamp(0.8rem, 0.75rem + 0.25vw, 0.875rem);
--font-size-base: clamp(0.9rem, 0.85rem + 0.25vw, 1rem);

// Headings específicos
--heading-h1: clamp(1.75rem, 1.5rem + 1.25vw, 2.5rem);
--heading-h2: clamp(1.5rem, 1.25rem + 1.25vw, 2rem);
```

## 🛠️ Mixins Principales

### 🎨 Glassmorphism Responsive

```scss
// unified-glassmorphism-mixins.scss
@mixin glassmorphism-hover($transform: true, $glow: false, $scale: false) {
  will-change: transform, opacity, box-shadow;
  transition: var(--transition-normal), var(--transition-shadow);
  
  &:hover {
    @if $transform and $scale {
      transform: var(--transform-hover) var(--transform-scale-hover);
    }
  }
  
  &:not(:hover):not(:active) {
    will-change: auto; // Limpia will-change
  }
}
```

### ♿ Accesibilidad

```scss
@mixin glassmorphism-accessibility($include-motion: true, $include-transparency: true) {
  @if $include-motion {
    @media (prefers-reduced-motion: reduce) {
      animation: none !important;
      transition: none !important;
      transform: none !important;
    }
  }
  
  @if $include-transparency {
    @media (prefers-reduced-transparency: reduce) {
      backdrop-filter: none !important;
      background: var(--glass-bg-solid) !important;
    }
  }
}
```

### 📱 Animaciones Optimizadas

```scss
@mixin hover-lift($lift: 2px, $scale: 1.02) {
  will-change: transform;
  transition: transform var(--duration-fast) var(--ease-out-quart);
  
  &:hover {
    transform: translate3d(0, -$lift, 0) scale3d($scale, $scale, 1);
  }
  
  &:active {
    transform: translate3d(0, 0, 0) scale3d(0.98, 0.98, 1);
    transition-duration: var(--duration-instant);
  }
}
```

## 🎭 Sistema de Clases

### 📱 Utilidades Responsive

```scss
// unified-glassmorphism-system.scss

// Visibilidad por dispositivo
.mobile-only {
  @include desktop { display: none !important; }
}

.desktop-only {
  @include mobile { display: none !important; }
}

// Tipografía fluida
.fluid-h1 {
  font-size: var(--heading-h1);
  font-weight: var(--font-weight-bold);
  line-height: 1.2;
}

// Touch targets
.touch-target {
  min-height: 44px;
  min-width: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
```

### 🎨 Animaciones

```scss
// Clases de animación optimizadas
.animate-fade-in {
  animation: fadeIn var(--duration-normal) var(--ease-out-quart) forwards;
  will-change: opacity;
}

.hover-lift {
  @include hover-lift();
}

.gpu-accelerated {
  will-change: transform;
  transform: translate3d(0, 0, 0);
}
```

## 🚀 Servicio de Accesibilidad

### 📋 Interface

```typescript
// accessibility-preferences.service.ts
export interface AccessibilityPreferences {
  reducedMotion: boolean;
  highContrast: boolean;
  reducedTransparency: boolean;
  forcedColors: boolean;
  darkMode: boolean;
}
```

### 🔧 Métodos Principales

```typescript
@Injectable({ providedIn: 'root' })
export class AccessibilityPreferencesService {
  // Signals reactivos
  public readonly reducedMotion = this._reducedMotion.asReadonly();
  public readonly preferences = computed<AccessibilityPreferences>(() => ({...}));
  
  // Métodos de utilidad
  public shouldDisableAnimations(): boolean;
  public shouldReduceBlur(): boolean;
  public getAdjustedAnimationDuration(baseDuration: number): number;
  public applyToElement(element: HTMLElement, options: {...}): void;
}
```

### 🎯 Uso en Componentes

```typescript
// En cualquier componente
export class MyComponent {
  private accessibilityPreferences = inject(AccessibilityPreferencesService);
  
  ngOnInit() {
    // Verificar preferencias
    if (this.accessibilityPreferences.shouldDisableAnimations()) {
      // Deshabilitar animaciones
    }
    
    // Reaccionar a cambios
    effect(() => {
      const prefs = this.accessibilityPreferences.preferences();
      this.updateComponentBasedOnPreferences(prefs);
    });
  }
}
```

## 📱 Navegación Responsive

### 🎯 Estructura Adaptativa

```scss
// Navegación que se adapta al dispositivo
.navigation {
  // Base: Mobile bottom navigation
  position: fixed;
  bottom: 0;
  width: 100%;
  height: var(--mobile-nav-height, 70px);
  
  // Tablet y Desktop: Sidebar
  @include tablet {
    position: fixed;
    left: 0;
    top: 0;
    width: var(--nav-width, 256px);
    height: 100vh;
    bottom: auto;
  }
}
```

### 👆 Touch Optimization

```scss
.mobile-nav-item {
  min-height: 44px;
  min-width: 44px;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  
  // Área de toque expandida
  &::before {
    content: '';
    position: absolute;
    top: -8px;
    left: -8px;
    right: -8px;
    bottom: -8px;
  }
}
```

## 🖼️ Imágenes Responsive

### 🚀 Lazy Loading Directive

```typescript
// lazy-load-image.directive.ts
@Directive({
  selector: '[appLazyLoadImage]'
})
export class LazyLoadImageDirective implements OnInit {
  @Input() src!: string;
  @Input() placeholder?: string;
  @Input() loadingClass = 'image-loading';
  @Input() loadedClass = 'image-loaded';
  @Input() errorClass = 'image-error';
}
```

### 🎨 Estados CSS

```scss
.lazy-image {
  transition: all 0.3s ease;
  
  &.image-loading {
    opacity: 0.6;
    filter: blur(2px);
    background: linear-gradient(90deg, 
      rgba(255, 255, 255, 0.1) 25%, 
      rgba(255, 255, 255, 0.2) 50%, 
      rgba(255, 255, 255, 0.1) 75%);
    animation: shimmer 1.5s infinite;
  }
  
  &.image-loaded {
    opacity: 1;
    filter: none;
    animation: fadeIn 0.3s ease-in;
  }
}
```

## 🧪 Testing y Debug

### 📏 Responsive Test Runner

```typescript
// responsive-test-runner.service.ts
@Injectable()
export class ResponsiveTestRunnerService {
  private readonly testViewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1440, height: 900 }
  ];
  
  runTestsIfDevelopment(): void {
    if (!environment.production) {
      this.testBreakpoints();
      this.testTouchTargets();
      this.testAccessibility();
    }
  }
}
```

### 🔍 Debug Utilities

```scss
// Debug mode para desarrollo
.debug-responsive {
  &::before {
    content: 'Mobile';
    position: fixed;
    top: 0;
    right: 0;
    background: red;
    color: white;
    padding: 4px 8px;
    z-index: 9999;
    
    @include tablet {
      content: 'Tablet';
      background: orange;
    }
    
    @include desktop {
      content: 'Desktop';
      background: green;
    }
  }
}
```

## ⚡ Optimizaciones de Rendimiento

### 🎭 GPU Acceleration

```scss
// Siempre usar transform3d para GPU
.optimized-animation {
  transform: translate3d(0, 0, 0); // Fuerza GPU layer
  will-change: transform; // Prepara para animación
  
  &:hover {
    transform: translate3d(0, -2px, 0) scale3d(1.02, 1.02, 1);
  }
  
  &:not(:hover) {
    will-change: auto; // Limpia después de usar
  }
}
```

### 📱 Mobile Optimizations

```scss
// Optimizaciones específicas para móvil
@media (max-width: 768px) {
  .glass-card {
    // Menos blur para mejor rendimiento
    backdrop-filter: var(--backdrop-blur-light);
    // Contención para optimización
    contain: layout style paint;
    // Scroll nativo en iOS
    -webkit-overflow-scrolling: touch;
  }
}
```

## 📋 Checklist de Implementación

### ✅ Componente Nuevo

```typescript
// Template para nuevo componente responsive
@Component({
  selector: 'app-my-component',
  template: `
    <div class="component-container">
      <h2 class="fluid-h2">{{ title }}</h2>
      <img 
        appLazyLoadImage
        [src]="imageUrl"
        class="responsive-image"
        alt="Description">
    </div>
  `,
  styleUrls: ['./my-component.scss']
})
export class MyComponent {
  private accessibilityPreferences = inject(AccessibilityPreferencesService);
  
  // Implementación...
}
```

### 🎨 SCSS Template

```scss
.component-container {
  @include glassmorphism-card;
  @include glassmorphism-accessibility;
  
  // Mobile first
  padding: var(--spacing-md);
  
  @include tablet {
    padding: var(--spacing-lg);
  }
  
  @include desktop {
    padding: var(--spacing-xl);
  }
}

.responsive-image {
  @extend .lazy-image;
  width: 100%;
  aspect-ratio: 16/9;
  object-fit: cover;
}
```

---

## 🔗 Enlaces Útiles

- [Documentación de Variables CSS](./unified-glassmorphism-variables.scss)
- [Mixins Disponibles](./unified-glassmorphism-mixins.scss)
- [Sistema de Clases](./unified-glassmorphism-system.scss)
- [Servicio de Accesibilidad](../src/app/core/services/accessibility/)

## 📚 Ejemplos Prácticos

### 🎯 Card Component Responsive

```typescript
// card.component.ts
@Component({
  selector: 'app-responsive-card',
  template: `
    <article class="responsive-card" [class.reduced-motion]="shouldReduceMotion()">
      <header class="card-header">
        <h3 class="fluid-h3">{{ title }}</h3>
        <button class="card-action touch-target" (click)="onAction()">
          <i class="icon" [class]="iconClass"></i>
        </button>
      </header>

      <div class="card-content">
        <img
          appLazyLoadImage
          [src]="imageUrl"
          [placeholder]="placeholderUrl"
          class="card-image"
          [alt]="imageAlt">

        <p class="text-base">{{ description }}</p>
      </div>

      <footer class="card-footer">
        <button class="btn-primary touch-target">Acción Principal</button>
        <button class="btn-secondary touch-target">Secundaria</button>
      </footer>
    </article>
  `,
  styleUrls: ['./card.component.scss']
})
export class ResponsiveCardComponent {
  private accessibilityPreferences = inject(AccessibilityPreferencesService);

  shouldReduceMotion = computed(() =>
    this.accessibilityPreferences.reducedMotion()
  );
}
```

```scss
// card.component.scss
.responsive-card {
  @include glassmorphism-card;
  @include glassmorphism-accessibility;
  @include hover-lift(4px, 1.02);

  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);

  // Mobile: Full width
  width: 100%;

  // Tablet: Grid layout
  @include tablet {
    display: grid;
    grid-template-areas:
      "header header"
      "content content"
      "footer footer";
    grid-template-rows: auto 1fr auto;
  }

  // Desktop: Horizontal layout
  @include desktop {
    flex-direction: row;
    grid-template-areas:
      "content header"
      "content footer";
    grid-template-columns: 2fr 1fr;
  }
}

.card-header {
  grid-area: header;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .card-action {
    @include glassmorphism-button('secondary', 'small');
    min-width: 44px;
    min-height: 44px;
  }
}

.card-image {
  @extend .lazy-image;
  width: 100%;
  aspect-ratio: 16/9;
  border-radius: var(--radius-md);
  object-fit: cover;
}

.card-footer {
  grid-area: footer;
  display: flex;
  gap: var(--spacing-sm);

  // Mobile: Stack buttons
  flex-direction: column;

  // Tablet+: Horizontal buttons
  @include tablet {
    flex-direction: row;
  }
}
```

### 🎨 Navigation Component

```typescript
// navigation.component.ts
@Component({
  selector: 'app-responsive-navigation',
  template: `
    <nav class="responsive-nav" [class.collapsed]="isCollapsed()">
      <!-- Desktop Sidebar -->
      <div class="nav-sidebar desktop-only">
        <div class="nav-header">
          <img src="assets/logo.svg" alt="Logo" class="nav-logo">
          <button
            class="nav-toggle touch-target"
            (click)="toggleCollapsed()"
            [attr.aria-label]="isCollapsed() ? 'Expandir menú' : 'Colapsar menú'">
            <i [class]="isCollapsed() ? 'icon-expand' : 'icon-collapse'"></i>
          </button>
        </div>

        <ul class="nav-menu">
          <li *ngFor="let item of menuItems" class="nav-item">
            <a
              [routerLink]="item.route"
              class="nav-link touch-target"
              routerLinkActive="active">
              <i [class]="item.icon" class="nav-icon"></i>
              <span class="nav-text" [class.hidden]="isCollapsed()">
                {{ item.label }}
              </span>
            </a>
          </li>
        </ul>
      </div>

      <!-- Mobile Bottom Navigation -->
      <div class="nav-mobile mobile-only">
        <a
          *ngFor="let item of mobileMenuItems"
          [routerLink]="item.route"
          class="mobile-nav-item touch-target"
          routerLinkActive="active">
          <i [class]="item.icon" class="mobile-nav-icon"></i>
          <span class="mobile-nav-text">{{ item.label }}</span>
        </a>
      </div>
    </nav>
  `,
  styleUrls: ['./navigation.component.scss']
})
export class ResponsiveNavigationComponent {
  private isCollapsed = signal(false);

  toggleCollapsed() {
    this.isCollapsed.update(collapsed => !collapsed);
  }
}
```

---

*Referencia técnica actualizada: Diciembre 2024*
