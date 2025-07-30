# ADMIN GLASSMORPHISM IMPLEMENTATION GUIDE

## 📋 Resumen Ejecutivo

### Estado Actual del Proyecto MPD Concursos

| Módulo | Estado | Completado |
|--------|--------|------------|
| **Usuario Común** | ✅ COMPLETADO | 100% |
| **Administrador** | ❌ PENDIENTE | 0% |

### Objetivo de Implementación

Extender el **sistema glassmorphism unificado** ya implementado en la plataforma de usuario común a todos los módulos de administrador, garantizando **consistencia visual absoluta** y manteniendo los estándares de accesibilidad WCAG AA.

### Beneficios Esperados

- **🎯 Consistencia Visual**: Interface unificada entre usuario común y administrador
- **🔧 Mantenibilidad**: Reutilización del sistema CSS existente
- **⚡ Performance**: Sin duplicación de código CSS
- **♿ Accesibilidad**: Mantenimiento de estándares WCAG AA
- **📱 Responsive**: Diseño móvil optimizado

---

## 🎨 Especificaciones Técnicas del Sistema Existente

### Variables CSS Globales Disponibles

El sistema glassmorphism cuenta con **263 líneas de variables CSS** centralizadas en `src/styles/glassmorphism-variables.scss`:

```scss
/* === BACKGROUNDS GLASSMORPHISM === */
:root {
  /* Backgrounds principales */
  --glass-background-primary: rgba(55, 65, 81, 0.8);
  --glass-background-secondary: rgba(75, 85, 99, 0.85);
  --glass-background-tertiary: rgba(31, 41, 55, 0.9);
  --glass-background-hover: rgba(75, 85, 99, 0.9);
  --glass-background-active: rgba(55, 65, 81, 0.95);
  
  /* Gradientes glassmorphism */
  --glass-gradient-primary: linear-gradient(135deg, 
    var(--glass-background-primary) 0%, 
    var(--glass-background-secondary) 100%);
  --glass-gradient-overlay: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.12) 0%, 
    rgba(255, 255, 255, 0.06) 100%);
  
  /* Backdrop filters */
  --backdrop-filter-light: blur(8px);
  --backdrop-filter-medium: blur(12px);
  --backdrop-filter-strong: blur(16px);
}
```

### Colores Semánticos Establecidos

```scss
/* === COLORES SEMÁNTICOS WCAG AA COMPLIANT === */
:root {
  /* Texto (4.5:1 contrast ratio) */
  --text-primary: #f9fafb;
  --text-secondary: #d1d5db;
  --text-tertiary: #9ca3af;
  --text-muted: #6b7280;
  
  /* Estados semánticos */
  --color-success: #4CAF50;     /* Verde para activo/positivo */
  --color-warning: #f59e0b;     /* Naranja para advertencia */
  --color-danger: #ef4444;      /* Rojo para destructivo */
  --color-info: #3b82f6;        /* Azul para informativo */
  --color-primary: #3b82f6;     /* Azul para acciones principales */
  
  /* Bordes */
  --border-primary: rgba(249, 250, 251, 0.1);
  --border-hover: rgba(249, 250, 251, 0.2);
  --border-focus: rgba(59, 130, 246, 0.3);
}
```

### Mixins SCSS Disponibles

El sistema cuenta con **336 líneas de mixins** en `src/styles/glassmorphism-mixins.scss`:

```scss
/* === MIXINS PRINCIPALES === */

/* Base glassmorphism */
@mixin glassmorphism-base($variant: 'primary') {
  background: var(--glass-background-primary);
  background-image: var(--glass-gradient-overlay);
  border: 1px solid var(--border-primary);
  backdrop-filter: var(--backdrop-filter-medium);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md), var(--shadow-inset);
  transition: var(--transition-normal);
}

/* Cards */
@mixin glassmorphism-card($variant: 'primary', $padding: 'normal') {
  @include glassmorphism-base($variant);
  @include glassmorphism-hover;
  padding: var(--card-padding);
  margin-bottom: var(--spacing-lg);
}

/* Botones */
@mixin glassmorphism-button($variant: 'primary', $size: 'normal') {
  padding: var(--button-padding);
  border-radius: var(--border-radius-md);
  font-weight: 600;
  transition: var(--transition-normal);
  cursor: pointer;
}

/* Formularios */
@mixin glassmorphism-form-field {
  background-color: var(--input-background);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--border-radius-md);
  padding: var(--input-padding);
  transition: var(--transition-normal);
}

/* Tablas */
@mixin glassmorphism-table {
  @include glassmorphism-base;
  overflow: hidden;
}
```

---

## 🚀 Plan de Implementación por Fases

### Fase 1: Layout Components (Prioridad Alta - 2-3 días)

#### Componentes a Refactorizar
- ✅ **Admin Sidebar**: Navegación lateral administrativa
- ✅ **Admin Header**: Cabecera con navegación y usuario
- ✅ **Admin Navigation**: Menús y breadcrumbs

#### Implementación Recomendada

**Admin Sidebar:**
```scss
// src/app/features/admin/layout/admin-sidebar.component.scss
@import 'src/styles/glassmorphism-system';

.admin-sidebar {
  @include glassmorphism-base('primary');
  width: var(--sidebar-width);
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  z-index: var(--z-fixed);
  
  .sidebar-header {
    @include glassmorphism-base('secondary');
    padding: var(--spacing-lg);
    border-bottom: 1px solid var(--border-primary);
  }
  
  .nav-item {
    @include glassmorphism-hover;
    padding: var(--spacing-md) var(--spacing-lg);
    color: var(--text-primary);
    transition: var(--transition-normal);
    
    &.active {
      background: var(--glass-background-active);
      border-left: 3px solid var(--color-primary);
    }
    
    &:hover {
      background: var(--glass-background-hover);
      transform: translateX(2px);
    }
  }
}
```

**Admin Header:**
```scss
// src/app/features/admin/layout/admin-header.component.scss
@import 'src/styles/glassmorphism-system';

.admin-header {
  @include glassmorphism-base('secondary');
  height: var(--header-height);
  position: fixed;
  top: 0;
  left: var(--sidebar-width);
  right: 0;
  z-index: var(--z-sticky);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-xl);
  
  .header-title {
    color: var(--text-primary);
    font-size: 1.25rem;
    font-weight: 600;
  }
  
  .header-actions {
    display: flex;
    gap: var(--spacing-md);
    
    .action-button {
      @include glassmorphism-button('secondary', 'small');
    }
  }
  
  .user-menu {
    @include glassmorphism-base('light');
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--border-radius-full);
  }
}
```

### Fase 2: Admin Dashboard (Prioridad Alta - 3-4 días)

#### Componentes a Implementar
- ✅ **Dashboard Overview**: Vista principal con métricas
- ✅ **Stats Cards**: Tarjetas de estadísticas
- ✅ **Charts Container**: Contenedores para gráficos
- ✅ **Quick Actions**: Acciones rápidas administrativas

#### Implementación Recomendada

**Dashboard Container:**
```scss
// src/app/features/admin/dashboard/admin-dashboard.component.scss
@import 'src/styles/glassmorphism-system';

.admin-dashboard {
  margin-left: var(--sidebar-width);
  margin-top: var(--header-height);
  padding: var(--spacing-xl);
  min-height: calc(100vh - var(--header-height));
  background: transparent;
  
  .dashboard-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--spacing-xl);
    margin-bottom: var(--spacing-2xl);
  }
  
  .stats-card {
    @include glassmorphism-card('primary', 'normal');
    
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--spacing-md);
      
      .card-title {
        color: var(--text-primary);
        font-size: 1rem;
        font-weight: 600;
      }
      
      .card-icon {
        color: var(--color-primary);
        font-size: 1.5rem;
      }
    }
    
    .card-value {
      color: var(--text-primary);
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: var(--spacing-sm);
    }
    
    .card-change {
      font-size: 0.875rem;
      
      &.positive {
        color: var(--color-success);
      }
      
      &.negative {
        color: var(--color-danger);
      }
    }
  }
}
```

### Fase 3: Contest Management (Prioridad Media - 4-5 días)

#### Componentes a Refactorizar
- ✅ **Contest List Admin**: Listado administrativo de concursos
- ✅ **Contest Form**: Formularios de creación/edición
- ✅ **Contest Status Management**: Gestión de estados
- ✅ **Applicant Management**: Gestión de postulantes

### Fase 4: User Management y System Administration (Prioridad Baja - 5-6 días)

#### Componentes a Implementar
- ✅ **User Administration**: Gestión de usuarios
- ✅ **Permission Management**: Gestión de permisos
- ✅ **System Settings**: Configuración del sistema
- ✅ **Audit Logs**: Logs de auditoría

---

## 💡 Ejemplos de Código Específicos

### Aplicación de Variables CSS Globales

```scss
/* ✅ CORRECTO - Usar variables CSS existentes */
.admin-component {
  background: var(--glass-background-primary);
  border: 1px solid var(--border-primary);
  backdrop-filter: var(--backdrop-filter-medium);
  color: var(--text-primary);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
  transition: var(--transition-normal);
}

/* ❌ INCORRECTO - Valores hardcodeados */
.admin-component {
  background: rgba(55, 65, 81, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  color: #f9fafb;
  border-radius: 8px;
}
```

### Uso Correcto de Mixins Glassmorphism

```scss
/* ✅ CORRECTO - Reutilizar mixins existentes */
@import 'src/styles/glassmorphism-system';

.admin-card {
  @include glassmorphism-card('primary', 'normal');

  .card-header {
    @include glassmorphism-base('secondary');
    padding: var(--spacing-md);
  }

  .action-button {
    @include glassmorphism-button('primary', 'normal');
  }
}

/* ❌ INCORRECTO - Recrear estilos manualmente */
.admin-card {
  background: rgba(55, 65, 81, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  /* ... más código duplicado */
}
```

### Patrones de Estados Visuales para Admin

```scss
/* === ESTADOS ADMINISTRATIVOS === */
.admin-status-indicator {
  @include glassmorphism-badge;

  &.status-active {
    background: rgba(76, 175, 80, 0.15);
    color: var(--color-success);
    border-color: rgba(76, 175, 80, 0.3);
  }

  &.status-pending {
    background: rgba(245, 158, 11, 0.15);
    color: var(--color-warning);
    border-color: rgba(245, 158, 11, 0.3);
  }

  &.status-error {
    background: rgba(239, 68, 68, 0.15);
    color: var(--color-danger);
    border-color: rgba(239, 68, 68, 0.3);
  }
}
```

### Contest Admin Table Implementation

```scss
// src/app/features/admin/contest-management/contest-list.component.scss
@import 'src/styles/glassmorphism-system';

.contest-admin-container {
  @include glassmorphism-card;

  .table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-lg);

    .header-title {
      color: var(--text-primary);
      font-size: 1.25rem;
      font-weight: 600;
    }

    .header-actions {
      display: flex;
      gap: var(--spacing-md);

      .action-button {
        @include glassmorphism-button('primary', 'normal');
      }
    }
  }

  .contest-table {
    @include glassmorphism-table;

    .table-row {
      &:hover {
        background: var(--glass-background-hover);
      }

      .status-cell {
        .status-badge {
          @include glassmorphism-badge('success');
        }
      }

      .actions-cell {
        display: flex;
        gap: var(--spacing-sm);

        .action-btn {
          @include glassmorphism-button('secondary', 'small');
        }
      }
    }
  }
}
```

### Responsive Design para Admin

```scss
/* === RESPONSIVE ADMIN LAYOUT === */
.admin-layout {
  @include glassmorphism-responsive;

  @media (max-width: 768px) {
    .admin-sidebar {
      transform: translateX(-100%);
      transition: transform var(--transition-normal);

      &.mobile-open {
        transform: translateX(0);
      }
    }

    .admin-content {
      margin-left: 0;
      padding: var(--spacing-md);
    }

    .dashboard-grid {
      grid-template-columns: 1fr;
      gap: var(--spacing-md);
    }
  }
}
```

---

## ✅ Checklist de Verificación

### Antes de Implementar
- [ ] **Auditar componente existente**: Identificar estilos hardcodeados
- [ ] **Verificar variables disponibles**: Revisar `glassmorphism-variables.scss`
- [ ] **Identificar mixins aplicables**: Consultar `glassmorphism-mixins.scss`
- [ ] **Planificar estructura responsive**: Definir breakpoints necesarios

### Durante la Implementación
- [ ] **Importar sistema glassmorphism**: `@import 'src/styles/glassmorphism-system';`
- [ ] **Usar variables CSS**: Evitar valores hardcodeados
- [ ] **Aplicar mixins apropiados**: Reutilizar patrones existentes
- [ ] **Implementar estados hover**: Usar `@include glassmorphism-hover;`
- [ ] **Verificar accesibilidad**: Mantener contraste 4.5:1 mínimo

### Después de Implementar
- [ ] **Verificar consistencia visual**: Comparar con componentes de usuario
- [ ] **Probar responsive design**: Verificar en móvil y tablet
- [ ] **Validar accesibilidad**: Probar navegación por teclado
- [ ] **Verificar performance**: Sin errores de compilación
- [ ] **Documentar cambios**: Actualizar documentación si es necesario

### Criterios de Aceptación
- [ ] **Visual**: Idéntico al sistema glassmorphism de usuario común
- [ ] **Funcional**: Todas las funcionalidades admin preservadas
- [ ] **Responsive**: Optimizado para móvil y tablet
- [ ] **Accesible**: WCAG AA compliance mantenido
- [ ] **Performance**: Sin degradación en tiempo de carga

---

## 🚫 Anti-Patrones a Evitar

### ❌ Override por Componente

```scss
/* ❌ NO HACER ESTO - Overrides específicos */
html body app-admin-component {
  app-custom-dialog .dialog-container {
    background: rgba(55, 65, 81, 0.9) !important;
    backdrop-filter: blur(16px) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
  }
}
```

### ❌ Duplicación de Variables

```scss
/* ❌ NO HACER ESTO - Variables locales duplicadas */
$admin-background: rgba(55, 65, 81, 0.8);
$admin-text: #f9fafb;
$admin-border: rgba(255, 255, 255, 0.1);

.admin-component {
  background: $admin-background;
  color: $admin-text;
  border: 1px solid $admin-border;
}
```

### ❌ Uso Excesivo de !important

```scss
/* ❌ NO HACER ESTO - Rompe la cascada CSS */
.admin-component {
  background: rgba(55, 65, 81, 0.9) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(8px) !important;
}
```

### ❌ Hardcodeo de Valores

```scss
/* ❌ NO HACER ESTO - Valores hardcodeados */
.admin-card {
  background: rgba(55, 65, 81, 0.8);
  border-radius: 8px;
  padding: 24px;
  color: #f9fafb;
}
```

### ✅ Patrón Correcto

```scss
/* ✅ HACER ESTO - Variables CSS con fallbacks */
.admin-component {
  background: var(--glass-background-primary);
  border: 1px solid var(--border-primary);
  backdrop-filter: var(--backdrop-filter-medium);
  color: var(--text-primary);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  transition: var(--transition-normal);
}
```

---

## 📚 Referencias y Documentación

### Archivos del Sistema Glassmorphism

| Archivo | Descripción | Líneas |
|---------|-------------|--------|
| `src/styles/glassmorphism-variables.scss` | Variables CSS unificadas | 263 |
| `src/styles/glassmorphism-mixins.scss` | Mixins SCSS consolidados | 336 |
| `src/styles/glassmorphism-system.scss` | Punto de entrada principal | 295 |
| `src/styles/GLASSMORPHISM_SYSTEM_GUIDE.md` | Documentación del sistema | 247 |

### Documentación Relacionada

- **`glassmorphism-design-system-guide.md`**: Especificaciones completas del sistema (839 líneas)
- **`docs/user-glassmorphism-refactoring-plan.md`**: Plan de refactoring de usuario común
- **`mpd-concursos-app-frontend/docs/glassmorphism-maintenance-guide.md`**: Guía de mantenimiento

### Componentes de Referencia Implementados

**Componentes de Usuario Común (Para Referencia):**
- `src/app/features/dashboard/dashboard.component.scss`
- `src/app/features/concursos/concursos.component.scss`
- `src/app/shared/components/custom-button/custom-button.component.scss`
- `src/app/shared/components/contest-status-badge/contest-status-badge.component.scss`

### Importación del Sistema

```scss
/* === IMPORTACIÓN ESTÁNDAR === */
@import 'src/styles/glassmorphism-system';

/* === IMPORTACIONES ESPECÍFICAS (si es necesario) === */
@import 'src/styles/glassmorphism-variables';
@import 'src/styles/glassmorphism-mixins';
```

### Variables CSS Principales

```scss
/* === VARIABLES MÁS UTILIZADAS === */
--glass-background-primary
--glass-background-secondary
--glass-background-hover
--text-primary
--text-secondary
--color-primary
--color-success
--color-warning
--color-danger
--border-primary
--border-hover
--border-focus
--backdrop-filter-medium
--border-radius-lg
--spacing-lg
--spacing-xl
--transition-normal
--shadow-md
```

---

## 🎯 Objetivos de Calidad

### Consistencia Visual (100%)
- **Colores**: Idénticos a la plataforma de usuario común
- **Efectos**: Mismo glassmorphism y hover effects
- **Tipografía**: Misma jerarquía y pesos de fuente
- **Espaciado**: Mismo sistema de spacing

### Performance (Optimizado)
- **CSS Bundle**: Sin incremento significativo de tamaño
- **Render**: Sin degradación en tiempo de renderizado
- **Animaciones**: 60fps en todas las transiciones
- **Memory**: Sin memory leaks en componentes

### Accesibilidad (WCAG AA)
- **Contraste**: Mínimo 4.5:1 en todos los textos
- **Navegación**: 100% accesible por teclado
- **Screen Readers**: Compatibilidad completa
- **Motion**: Respeto a `prefers-reduced-motion`

### Mantenibilidad (Máxima)
- **DRY**: Cero duplicación de código CSS
- **Variables**: 100% uso de variables CSS globales
- **Mixins**: Máxima reutilización de mixins existentes
- **Documentación**: Código auto-documentado

---

## 🏆 Criterios de Éxito

### Técnicos
- ✅ **Build exitoso**: Sin errores de compilación
- ✅ **Linting**: Sin warnings de CSS o SCSS
- ✅ **Bundle size**: Incremento < 5% del CSS total
- ✅ **Performance**: Lighthouse score mantenido

### Visuales
- ✅ **Consistencia**: 100% alineación con usuario común
- ✅ **Responsive**: Perfecto en móvil, tablet y desktop
- ✅ **Animaciones**: Smooth y profesionales
- ✅ **Estados**: Todos los estados visuales implementados

### Funcionales
- ✅ **Funcionalidad**: 100% de features admin preservadas
- ✅ **Navegación**: Flujos de trabajo sin interrupciones
- ✅ **Formularios**: Validación y UX mantenidos
- ✅ **Tablas**: Sorting, filtering y paginación funcionales

### Accesibilidad
- ✅ **WCAG AA**: 100% compliance
- ✅ **Keyboard**: Navegación completa por teclado
- ✅ **Screen readers**: Compatibilidad total
- ✅ **Color**: Información no dependiente solo del color

---

## 🎓 Patrones de Implementación Específicos

### Admin User Management

```scss
// src/app/features/admin/user-management/user-list.component.scss
@import 'src/styles/glassmorphism-system';

.user-management-container {
  @include glassmorphism-card;

  .user-filters {
    @include glassmorphism-base('light');
    padding: var(--spacing-lg);
    margin-bottom: var(--spacing-lg);
    display: flex;
    gap: var(--spacing-md);
    flex-wrap: wrap;

    .filter-input {
      @include glassmorphism-form-field;
      min-width: 200px;
    }

    .filter-select {
      @include glassmorphism-form-field;
      min-width: 150px;
    }
  }

  .user-table {
    @include glassmorphism-table;

    .user-row {
      &:hover {
        background: var(--glass-background-hover);
      }

      .user-avatar {
        width: 40px;
        height: 40px;
        border-radius: var(--border-radius-full);
        border: 2px solid var(--border-primary);
      }

      .user-status {
        .status-badge {
          @include glassmorphism-badge('success');

          &.inactive {
            @include glassmorphism-badge('warning');
          }

          &.blocked {
            @include glassmorphism-badge('danger');
          }
        }
      }

      .user-actions {
        display: flex;
        gap: var(--spacing-sm);

        .action-btn {
          @include glassmorphism-button('secondary', 'small');

          &.edit {
            @include glassmorphism-button('primary', 'small');
          }

          &.delete {
            @include glassmorphism-button('danger', 'small');
          }
        }
      }
    }
  }
}
```

### Admin System Settings

```scss
// src/app/features/admin/system-settings/settings.component.scss
@import 'src/styles/glassmorphism-system';

.system-settings {
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: var(--spacing-xl);

  .settings-sidebar {
    @include glassmorphism-card('secondary', 'normal');
    height: fit-content;

    .settings-nav {
      list-style: none;
      padding: 0;
      margin: 0;

      .nav-item {
        @include glassmorphism-hover(false);
        padding: var(--spacing-md);
        cursor: pointer;
        border-radius: var(--border-radius-md);
        margin-bottom: var(--spacing-sm);

        &.active {
          background: var(--glass-background-active);
          border-left: 3px solid var(--color-primary);
        }

        &:hover {
          background: var(--glass-background-hover);
        }
      }
    }
  }

  .settings-content {
    @include glassmorphism-card;

    .settings-section {
      margin-bottom: var(--spacing-2xl);

      .section-title {
        color: var(--text-primary);
        font-size: 1.25rem;
        font-weight: 600;
        margin-bottom: var(--spacing-lg);
        padding-bottom: var(--spacing-md);
        border-bottom: 1px solid var(--border-primary);
      }

      .form-group {
        margin-bottom: var(--spacing-lg);

        .form-label {
          color: var(--text-secondary);
          font-weight: 500;
          margin-bottom: var(--spacing-sm);
          display: block;
        }

        .form-input {
          @include glassmorphism-form-field;
          width: 100%;
        }

        .form-help {
          color: var(--text-muted);
          font-size: 0.875rem;
          margin-top: var(--spacing-xs);
        }
      }
    }

    .settings-actions {
      display: flex;
      gap: var(--spacing-md);
      justify-content: flex-end;
      padding-top: var(--spacing-lg);
      border-top: 1px solid var(--border-primary);

      .save-btn {
        @include glassmorphism-button('primary', 'normal');
      }

      .cancel-btn {
        @include glassmorphism-button('secondary', 'normal');
      }
    }
  }
}
```

---

## 🔧 Herramientas de Desarrollo

### Extensiones VSCode Recomendadas

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-css-peek",
    "zignd.html-css-class-completion",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

### Scripts de Verificación

```json
// package.json
{
  "scripts": {
    "lint:scss": "stylelint 'src/**/*.scss' --fix",
    "build:check": "ng build --configuration production",
    "test:a11y": "pa11y http://localhost:4200",
    "analyze:bundle": "ng build --stats-json && webpack-bundle-analyzer dist/stats.json"
  }
}
```

### Configuración Stylelint

```javascript
// .stylelintrc.js
module.exports = {
  extends: [
    'stylelint-config-standard-scss',
    'stylelint-config-prettier-scss'
  ],
  rules: {
    'custom-property-pattern': '^[a-z][a-z0-9]*(-[a-z0-9]+)*$',
    'selector-class-pattern': '^[a-z][a-z0-9]*(-[a-z0-9]+)*$',
    'scss/at-mixin-pattern': '^[a-z][a-z0-9]*(-[a-z0-9]+)*$',
    'scss/dollar-variable-pattern': '^[a-z][a-z0-9]*(-[a-z0-9]+)*$'
  }
};
```

---

## 📋 Template de Implementación

### Estructura de Archivos Recomendada

```
src/app/features/admin/
├── layout/
│   ├── admin-sidebar/
│   │   ├── admin-sidebar.component.ts
│   │   ├── admin-sidebar.component.html
│   │   └── admin-sidebar.component.scss
│   ├── admin-header/
│   │   ├── admin-header.component.ts
│   │   ├── admin-header.component.html
│   │   └── admin-header.component.scss
│   └── admin-layout/
│       ├── admin-layout.component.ts
│       ├── admin-layout.component.html
│       └── admin-layout.component.scss
├── dashboard/
│   ├── admin-dashboard.component.ts
│   ├── admin-dashboard.component.html
│   └── admin-dashboard.component.scss
├── contest-management/
│   ├── contest-list/
│   ├── contest-form/
│   └── applicant-management/
└── user-management/
    ├── user-list/
    ├── user-form/
    └── permission-management/
```

### Template Base de Componente

```scss
// Template base para cualquier componente admin
@import 'src/styles/glassmorphism-system';

.admin-component-name {
  @include glassmorphism-card;

  .component-header {
    @include glassmorphism-base('secondary');
    padding: var(--spacing-lg);
    margin-bottom: var(--spacing-lg);

    .header-title {
      color: var(--text-primary);
      font-size: 1.25rem;
      font-weight: 600;
    }

    .header-actions {
      display: flex;
      gap: var(--spacing-md);

      .action-btn {
        @include glassmorphism-button('primary', 'normal');
      }
    }
  }

  .component-content {
    padding: var(--spacing-lg);

    .content-section {
      margin-bottom: var(--spacing-xl);

      .section-title {
        color: var(--text-secondary);
        font-weight: 600;
        margin-bottom: var(--spacing-md);
      }
    }
  }

  .component-footer {
    padding: var(--spacing-lg);
    border-top: 1px solid var(--border-primary);
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-md);

    .footer-btn {
      @include glassmorphism-button('secondary', 'normal');

      &.primary {
        @include glassmorphism-button('primary', 'normal');
      }
    }
  }

  // Responsive
  @media (max-width: 768px) {
    margin: var(--spacing-md);

    .component-header {
      padding: var(--spacing-md);

      .header-actions {
        flex-direction: column;
        gap: var(--spacing-sm);
      }
    }

    .component-content {
      padding: var(--spacing-md);
    }

    .component-footer {
      padding: var(--spacing-md);
      flex-direction: column;

      .footer-btn {
        width: 100%;
      }
    }
  }
}
```

---

**📝 Nota Final**: Esta guía garantiza que la implementación del sistema glassmorphism en los módulos de administrador mantenga la misma calidad, consistencia y estándares establecidos en la plataforma de usuario común. Seguir estos patrones asegura una experiencia de usuario unificada y un código mantenible a largo plazo.

**🎯 Meta**: Lograr **consistencia visual absoluta** entre las plataformas de usuario común y administrador, utilizando el sistema glassmorphism unificado ya establecido y documentado.
```
