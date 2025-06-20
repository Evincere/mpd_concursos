# Componentes de Inscripción

Este directorio contiene los componentes relacionados con el proceso de inscripción a concursos.

## Estructura del Directorio

```
inscripcion/
├── README.md                           # Documentación general
├── components/                         # Componentes reutilizables
│   └── address-selector/               # Componente para selección de dirección
├── continue-inscription-dialog/        # Diálogo para continuar inscripción
├── documentos-embebidos/               # Componente para gestión de documentos
├── inscripcion-button/                 # Botón para iniciar inscripción
├── models/                             # Modelos y tipos específicos
│   └── inscription-form.model.ts       # Modelo para el formulario de inscripción
├── pages/                              # Páginas de la aplicación
│   └── inscripcion-process-page/       # Página del proceso de inscripción
├── routes.ts                           # Configuración de rutas
└── services/                           # Servicios específicos de inscripción
    └── inscription-form.service.ts     # Servicio para manejar el formulario
```

## Componentes Principales

### InscripcionProcessPageComponent

Este es el componente principal para el proceso de inscripción. Implementa una página completa con un flujo de pasos para completar la inscripción a un concurso.

**Características:**
- Interfaz moderna y responsive
- Integración con OpenStreetMap para autocompletado de direcciones
- Validación de datos en cada paso
- Guardado automático del progreso
- Soporte para continuar inscripciones interrumpidas
- Integración con el layout principal de la aplicación

**Uso:**
```typescript
// Navegar a la página de inscripción con parámetros
this.router.navigate(['/dashboard/inscripcion'], {
  queryParams: {
    contestId: contest.id,
    inscriptionId: inscriptionId, // Opcional
    resume: 'true' // Opcional - para retomar proceso interrumpido
  }
});
```

### InscripcionButtonComponent

Componente que muestra un botón para iniciar el proceso de inscripción. Maneja la lógica para determinar si se debe iniciar una nueva inscripción o continuar una existente. Redirige al usuario a la página de inscripción.

**Uso:**
```html
<app-inscripcion-button
  [contest]="contest"
  [userPostulation]="userPostulation"
  (inscripcionClick)="onInscripcionClick($event)"
  (continuarClick)="onContinuarClick($event)">
</app-inscripcion-button>
```

### InscripcionContainerComponent

Componente contenedor que abre el diálogo de inscripción. Útil cuando se necesita embeber el proceso de inscripción en una página en lugar de abrirlo como un diálogo.

**Uso:**
```html
<app-inscripcion-container
  [contest]="contest"
  (inscriptionCompleted)="onInscriptionCompleted()">
</app-inscripcion-container>
```

### DocumentosEmbebidosComponent

Componente que muestra y permite la gestión de documentos requeridos para la inscripción.

**Uso:**
```html
<app-documentos-embebidos
  [concursoId]="concursoId"
  (documentosCompletados)="onDocumentosCompletados($event)">
</app-documentos-embebidos>
```

### CustomAddressAutocompleteComponent

Componente personalizado para seleccionar direcciones con autocompletado.

**Uso:**
```html
<app-custom-address-autocomplete
  [label]="'Domicilio'"
  [placeholder]="'Ingrese su domicilio completo'"
  [required]="true"
  [initialValue]="centroDeVidaControl.value"
  [errorMessage]="'Por favor ingrese una dirección válida'"
  [hint]="'Este domicilio se guardará como su centro de vida'"
  (addressSelected)="onAddressSelected($event)"
></app-custom-address-autocomplete>
```

### StepProgressComponent

Componente para mostrar el progreso de los pasos en un proceso.

**Uso:**
```html
<app-step-progress
  [steps]="steps"
  [currentStep]="currentStep"
  (stepChange)="onStepChange($event)">
</app-step-progress>
```

## Servicios

### InscriptionFormService

Servicio para manejar el estado del formulario de inscripción.

**Uso:**
```typescript
// Cargar estado guardado
this.inscriptionFormService.loadFormState(inscriptionId);

// Guardar estado actual
this.inscriptionFormService.saveFormState(
  inscriptionId,
  contestId,
  currentStep,
  formData,
  contestTitle
);

// Actualizar paso de inscripción en el backend
this.inscriptionFormService.updateInscriptionStep(
  inscriptionId,
  InscriptionStep.COMPLETED,
  formData
).subscribe(/* ... */);
```

## Modelos

### InscriptionFormModel

Contiene las interfaces para los datos del formulario de inscripción:

- `InscriptionFormData`: Datos del formulario
- `InscriptionFormState`: Estado completo del formulario
- `AddressData`: Datos de dirección seleccionada
- `RequiredDocument`: Documento requerido
- `Circunscripcion`: Circunscripción judicial

## Componentes Eliminados

> **NOTA**: Los siguientes componentes han sido eliminados y reemplazados por `InscripcionProcessPageComponent`.

### InscripcionStepperComponent

> **ELIMINADO**: Este componente ha sido eliminado. Utilizar `InscripcionProcessPageComponent` en su lugar.

### NewInscripcionDialogComponent

> **ELIMINADO**: Este componente ha sido eliminado. Utilizar `InscripcionProcessPageComponent` en su lugar.

### InscripcionDialogComponent

> **ELIMINADO**: Este componente ha sido eliminado. Utilizar `InscripcionProcessPageComponent` en su lugar.

### InscripcionProcessComponent

> **✅ ELIMINADO COMPLETAMENTE**: Este componente de diálogo modal ha sido eliminado del sistema.
>
> **Razón**: Conflictaba con la estrategia de eliminación de Material UI y duplicaba funcionalidad.
>
> **Reemplazo**: Utilizar `InscripcionProcessPageComponent` que ofrece mejor UX y diseño glassmorphism.

### InscripcionContainerComponent

> **ELIMINADO**: Este componente ha sido eliminado. Utilizar `InscripcionProcessPageComponent` en su lugar.

## Flujo de Inscripción

1. El usuario hace clic en el botón de inscripción (`InscripcionButtonComponent`)
2. El usuario es redirigido a la página de inscripción (`InscripcionProcessPageComponent`)
3. El usuario completa los pasos:
   - Paso 1: Términos y condiciones
   - Paso 2: Centro de vida y selección de circunscripciones
   - Paso 3: Documentación requerida
   - Paso 4: Confirmación y finalización
4. Al completar la inscripción, el usuario es redirigido a la página de postulaciones

## Notas para Desarrolladores

- La integración con OpenStreetMap no requiere clave de API, pero es necesario configurar correctamente el Content Security Policy para permitir las conexiones
- El componente `AddressSelectorComponent` utiliza el servicio `ArgentinaDataService` para obtener sugerencias de direcciones
- El componente `DocumentosEmbebidosComponent` utiliza el servicio `DocumentosService` para gestionar los documentos
- El estado del formulario se guarda automáticamente en el almacenamiento local del navegador
- Se utiliza un enfoque basado en formularios reactivos para la validación y gestión del estado

## Estados de Inscripción

- `NO_INSCRIPTO`: Estado inicial, el usuario no se ha inscrito al concurso
- `IN_PROCESS`: La inscripción está en proceso pero no se ha completado (interrumpida)
- `PENDIENTE`: El usuario ha completado todos los pasos de la inscripción pero aun no ha sido validada por un administrador
- `INSCRIPTO`: La inscripción ha sido validada por un administrador
- `REJECTED`: La inscripción ha sido rechazada por un administrador
- `CANCELLED`: La inscripción ha sido cancelada por el usuario
