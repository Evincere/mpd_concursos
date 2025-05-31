# Guía de Accesibilidad

## Introducción

Esta guía establece los estándares de accesibilidad para el desarrollo de la aplicación MPD Concursos. El objetivo es garantizar que la aplicación sea accesible para todos los usuarios, incluidos aquellos con discapacidades.

## Principios WCAG 2.1

La aplicación debe cumplir con los criterios de conformidad de nivel AA de las Pautas de Accesibilidad para el Contenido Web (WCAG) 2.1:

1. **Perceptible**: La información y los componentes de la interfaz de usuario deben ser presentables a los usuarios de manera que puedan percibirlos.
2. **Operable**: Los componentes de la interfaz de usuario y la navegación deben ser operables.
3. **Comprensible**: La información y el manejo de la interfaz de usuario deben ser comprensibles.
4. **Robusto**: El contenido debe ser lo suficientemente robusto como para ser interpretado de forma fiable por una amplia variedad de agentes de usuario, incluidas las tecnologías de asistencia.

## Implementación

### 1. Estructura Semántica

#### HTML Semántico

Utilizar elementos HTML semánticos para proporcionar significado y estructura al contenido:

```html
<header>
  <h1>MPD Concursos</h1>
  <nav>
    <!-- Navegación principal -->
  </nav>
</header>

<main>
  <section aria-labelledby="section-title">
    <h2 id="section-title">Listado de Usuarios</h2>
    <!-- Contenido de la sección -->
  </section>
</main>

<footer>
  <!-- Pie de página -->
</footer>
```

#### Encabezados

Utilizar encabezados (h1-h6) de forma jerárquica para estructurar el contenido:

- `<h1>` para el título principal de la página
- `<h2>` para los títulos de sección
- `<h3>` para los subtítulos dentro de una sección
- Y así sucesivamente

#### Landmarks

Utilizar landmarks ARIA para definir regiones importantes de la página:

```html
<header role="banner">
  <!-- Encabezado -->
</header>

<nav role="navigation">
  <!-- Navegación -->
</nav>

<main role="main">
  <!-- Contenido principal -->
</main>

<aside role="complementary">
  <!-- Contenido complementario -->
</aside>

<footer role="contentinfo">
  <!-- Pie de página -->
</footer>
```

### 2. Navegación por Teclado

#### Orden de Tabulación

Mantener un orden de tabulación lógico que siga el flujo natural de la página:

- Utilizar un orden de tabulación de izquierda a derecha y de arriba a abajo
- Evitar cambiar el orden de tabulación con `tabindex` positivo
- Utilizar `tabindex="0"` para elementos no focusables que deben ser accesibles mediante teclado
- Utilizar `tabindex="-1"` para elementos que deben ser focusables programáticamente pero no mediante tabulación

#### Indicadores de Foco

Proporcionar indicadores visuales claros para el foco del teclado:

```scss
:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

Utilizar la directiva A11yFocusDirective para mejorar los indicadores de foco:

```html
<button appA11yFocus>Botón accesible</button>
```

#### Atajos de Teclado

Implementar atajos de teclado para acciones comunes:

- Utilizar teclas estándar cuando sea posible (Enter para activar, Espacio para seleccionar, Escape para cancelar)
- Documentar los atajos de teclado en una sección de ayuda
- Permitir a los usuarios personalizar o desactivar los atajos de teclado

### 3. Formularios Accesibles

#### Etiquetas

Asociar etiquetas con campos de formulario:

```html
<label for="username">Nombre de usuario</label>
<input id="username" type="text" />
```

#### Mensajes de Error

Proporcionar mensajes de error claros y accesibles:

```html
<div class="form-field">
  <label for="email">Email</label>
  <input
    id="email"
    type="email"
    aria-describedby="email-error"
    aria-invalid="true"
  />
  <div id="email-error" class="error-message" role="alert">
    Por favor, ingrese un email válido
  </div>
</div>
```

#### Agrupación

Agrupar campos relacionados con `<fieldset>` y `<legend>`:

```html
<fieldset>
  <legend>Información de contacto</legend>
  <!-- Campos de contacto -->
</fieldset>
```

### 4. Imágenes y Multimedia

#### Texto Alternativo

Proporcionar texto alternativo para imágenes:

```html
<img src="logo.png" alt="Logo de MPD Concursos" />
```

Para imágenes decorativas, utilizar un alt vacío:

```html
<img src="decorative.png" alt="" role="presentation" />
```

#### Subtítulos y Transcripciones

Proporcionar subtítulos para videos y transcripciones para audio:

```html
<video controls>
  <source src="video.mp4" type="video/mp4" />
  <track kind="subtitles" src="subtitles.vtt" srclang="es" label="Español" />
</video>
```

### 5. Color y Contraste

#### Contraste

Mantener una relación de contraste adecuada:

- 4.5:1 para texto normal (menos de 18pt)
- 3:1 para texto grande (18pt o más) o texto en negrita (14pt o más)
- 3:1 para componentes de interfaz y gráficos informativos

#### No Depender Solo del Color

No utilizar el color como único medio para transmitir información:

```html
<!-- Incorrecto -->
<div class="status status--error">Error</div>

<!-- Correcto -->
<div class="status status--error" role="alert">
  <i class="fas fa-exclamation-circle" aria-hidden="true"></i>
  Error: El formulario contiene errores
</div>
```

### 6. Contenido Dinámico

#### Anuncios para Lectores de Pantalla

Utilizar el servicio ScreenReaderService para anunciar cambios importantes:

```typescript
// Anunciar un mensaje de forma no intrusiva
this.screenReaderService.announcePolite('Se han cargado 10 usuarios');

// Anunciar un mensaje importante que interrumpe la lectura actual
this.screenReaderService.announceAssertive('Error al guardar el formulario');
```

#### Regiones Live

Utilizar atributos `aria-live` para regiones dinámicas:

```html
<div aria-live="polite" aria-atomic="true">
  <!-- Contenido que cambia dinámicamente -->
</div>
```

#### Diálogos Modales

Implementar diálogos modales accesibles:

```html
<div
  role="dialog"
  aria-labelledby="dialog-title"
  aria-describedby="dialog-description"
  aria-modal="true"
>
  <h2 id="dialog-title">Título del diálogo</h2>
  <p id="dialog-description">Descripción del diálogo</p>
  <!-- Contenido del diálogo -->
  <button aria-label="Cerrar diálogo">×</button>
</div>
```

### 7. Responsive Design

#### Zoom

Asegurarse de que la aplicación sea utilizable con zoom de hasta 200%:

- Utilizar unidades relativas (rem, em, %) en lugar de píxeles
- Evitar contenido que se desborde o se oculte al hacer zoom
- Probar la aplicación con diferentes niveles de zoom

#### Orientación

Asegurarse de que la aplicación sea utilizable en diferentes orientaciones:

- No restringir la visualización a una sola orientación
- Adaptar el diseño para orientación vertical y horizontal

#### Tamaño de Toque

Proporcionar áreas de toque suficientemente grandes para elementos interactivos:

- Mínimo 44x44 píxeles para elementos táctiles
- Espacio adecuado entre elementos interactivos

### 8. Pruebas de Accesibilidad

#### Herramientas Automatizadas

Utilizar herramientas automatizadas para detectar problemas de accesibilidad:

- Lighthouse
- axe DevTools
- WAVE

#### Pruebas Manuales

Realizar pruebas manuales para verificar la accesibilidad:

- Navegación por teclado
- Lectores de pantalla (NVDA, JAWS, VoiceOver)
- Zoom y alto contraste
- Diferentes dispositivos y navegadores

#### Lista de Verificación

Utilizar una lista de verificación para cada componente:

- ¿El componente es operable mediante teclado?
- ¿El componente tiene etiquetas y descripciones adecuadas?
- ¿El componente mantiene un contraste adecuado?
- ¿El componente funciona correctamente con lectores de pantalla?
- ¿El componente es responsive y se adapta a diferentes tamaños de pantalla?

## Implementación en el Proyecto

### Directivas de Accesibilidad

Utilizar las directivas de accesibilidad proporcionadas:

- `A11yFocusDirective`: Mejora los indicadores de foco
- `LazyLoadImageDirective`: Carga perezosa de imágenes con soporte para texto alternativo

### Servicios de Accesibilidad

Utilizar los servicios de accesibilidad proporcionados:

- `ScreenReaderService`: Anuncios para lectores de pantalla

### Componentes Accesibles

Utilizar los componentes accesibles proporcionados:

- `CustomButtonComponent`: Botones accesibles
- `CustomFormFieldComponent`: Campos de formulario accesibles
- `CustomSelectComponent`: Selects accesibles
- `CustomCheckboxComponent`: Checkboxes accesibles
- `CustomDialogComponent`: Diálogos modales accesibles

## Recursos

- [WCAG 2.1](https://www.w3.org/TR/WCAG21/)
- [WAI-ARIA](https://www.w3.org/TR/wai-aria/)
- [MDN: Accesibilidad](https://developer.mozilla.org/es/docs/Web/Accessibility)
- [Angular: Accesibilidad](https://angular.io/guide/accessibility)
