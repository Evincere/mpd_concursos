# Core CV Refactoring Module

Este módulo contiene los elementos fundamentales para la refactorización de la funcionalidad de Currículum Vitae del sistema MPD Concursos, implementando la **Fase 1** del plan de refactorización incremental.

## 📁 Estructura del Módulo

```
core/
├── models/cv/              # Modelos estandarizados con terminología en inglés
│   ├── experience.model.ts # Interfaces para experiencia laboral
│   ├── education.model.ts  # Interfaces para educación
│   └── index.ts           # Barrel exports
├── validators/             # Validadores frontend robustos
│   ├── cv-validators.ts   # Validaciones personalizadas con protección XSS
│   ├── cv-validators.spec.ts # Tests unitarios
│   └── index.ts           # Barrel exports
├── mappers/               # Conversores entre modelos legacy y nuevos
│   ├── cv-mappers.ts      # Mappers para compatibilidad hacia atrás
│   ├── cv-mappers.spec.ts # Tests unitarios
│   └── index.ts           # Barrel exports
├── services/              # Servicios core
│   ├── feature-toggle.service.ts     # Sistema de feature flags
│   ├── feature-toggle.service.spec.ts # Tests unitarios
│   └── index.ts           # Barrel exports
├── index.ts               # Barrel exports principal
└── README.md              # Esta documentación
```

## 🎯 Objetivos Implementados

### ✅ 1. Estandarización de Modelos
- **Terminología unificada en inglés** para consistencia con backend
- **Interfaces TypeScript robustas** con tipado estricto
- **Compatibilidad hacia atrás** con modelos legacy
- **Separación clara** entre modelos de dominio, DTOs y formularios

### ✅ 2. Validaciones Frontend Robustas
- **Protección XSS** mediante validación de contenido peligroso
- **Validaciones de negocio** específicas para CV (fechas, rangos, formatos)
- **Sanitización automática** de contenido HTML
- **Mensajes de error descriptivos** y localizados

### ✅ 3. Sistema de Feature Flags
- **Migración gradual** desde servicios mock hacia servicios reales
- **Rollback capability** para revertir cambios problemáticos
- **Gestión de dependencias** entre features
- **Persistencia en localStorage** para configuración por usuario

## 🚀 Uso del Módulo

### Importación de Modelos
```typescript
import { 
  Experience, 
  Education, 
  EducationType, 
  EducationStatus 
} from '@core/models/cv';

// Crear nueva experiencia
const experience: Experience = {
  userId: 'user-123',
  position: 'Senior Developer',
  company: 'Tech Corp',
  startDate: new Date('2020-01-01'),
  isCurrent: true
};
```

### Uso de Validadores
```typescript
import { CvValidators } from '@core/validators';
import { FormControl, Validators } from '@angular/forms';

// Formulario con validaciones robustas
const experienceForm = this.fb.group({
  position: ['', [
    Validators.required,
    Validators.maxLength(100),
    CvValidators.positionTitle,
    CvValidators.noXSS
  ]],
  company: ['', [
    Validators.required,
    CvValidators.companyName,
    CvValidators.noXSS
  ]],
  description: ['', [
    CvValidators.maxWords(200),
    CvValidators.sanitizeHtml
  ]]
});
```

### Gestión de Feature Flags
```typescript
import { FeatureToggleService } from '@core/services';

constructor(private featureToggle: FeatureToggleService) {}

ngOnInit() {
  // Verificar si usar nuevos modelos
  if (this.featureToggle.isEnabled('useStandardizedModels')) {
    this.loadWithNewModels();
  } else {
    this.loadWithLegacyModels();
  }

  // Obtener estrategia de migración
  const strategy = this.featureToggle.getCvMigrationStrategy();
  console.log('Migration strategy:', strategy);
}
```

### Conversión entre Modelos
```typescript
import { CvMappers } from '@core/mappers';

// Convertir datos legacy a nuevos modelos
const legacyData: ExperienciaData = { /* datos legacy */ };
const newExperience = CvMappers.fromLegacyExperience(legacyData);

// Convertir respuesta de API a modelo de dominio
const apiResponse: ExperienceResponse = { /* respuesta API */ };
const experience = CvMappers.fromExperienceResponse(apiResponse);
```

## 🔧 Configuración de Feature Flags

### Features Disponibles

| Feature | Descripción | Default | Dependencias |
|---------|-------------|---------|--------------|
| `useStandardizedModels` | Usar nuevos modelos con terminología inglesa | `true` | - |
| `useEnhancedValidation` | Validaciones robustas con protección XSS | `true` | - |
| `useRealCvServices` | Servicios reales en lugar de mocks | `prod` | - |
| `useInlineEditing` | Edición inline en lugar de wizard | `false` | `useStandardizedModels` |
| `useUnifiedCvComponents` | Nueva arquitectura de componentes | `false` | `useStandardizedModels`, `useRealCvServices` |
| `useLegacyComponents` | Mantener componentes legacy como fallback | `true` | - |

### Configuración Manual
```typescript
// Habilitar feature específico
this.featureToggle.enableFeature('useInlineEditing');

// Deshabilitar feature
this.featureToggle.disableFeature('useWizardFlow');

// Alternar feature
this.featureToggle.toggleFeature('useRealCvServices');

// Resetear a defaults
this.featureToggle.resetToDefaults();
```

## 🧪 Testing

### Ejecutar Tests
```bash
# Tests unitarios para validadores
ng test --include="**/cv-validators.spec.ts"

# Tests unitarios para mappers
ng test --include="**/cv-mappers.spec.ts"

# Tests unitarios para feature toggle
ng test --include="**/feature-toggle.service.spec.ts"

# Todos los tests del core module
ng test --include="**/core/**/*.spec.ts"
```

### Cobertura de Tests
- **CvValidators**: 100% cobertura de funciones de validación
- **CvMappers**: 100% cobertura de conversiones entre modelos
- **FeatureToggleService**: 100% cobertura de gestión de flags

## 📋 Próximos Pasos (Fase 2)

1. **Implementar servicios reales** conectados al backend
2. **Crear componentes de edición inline** para reemplazar wizard
3. **Migrar componentes existentes** para usar nuevos modelos
4. **Configurar lazy loading** para optimizar rendimiento

## 🔍 Validación de Implementación

### Checklist de Verificación
- [ ] ✅ Modelos TypeScript compilando sin errores
- [ ] ✅ Tests unitarios pasando (100% cobertura)
- [ ] ✅ Feature flags funcionando correctamente
- [ ] ✅ Mappers convirtiendo datos correctamente
- [ ] ✅ Validadores previniendo XSS y validando formatos
- [ ] ✅ Documentación completa y actualizada

### Comandos de Verificación
```bash
# Compilar TypeScript
ng build --configuration=development

# Ejecutar tests
ng test --watch=false --browsers=ChromeHeadless

# Verificar linting
ng lint

# Verificar tipos
npx tsc --noEmit
```

## 📚 Referencias

- [Plan de Refactorización Incremental](../../../docs/cv-refactoring-plan.md)
- [Auditoría Técnica CV](../../../docs/cv-technical-audit.md)
- [Guía de Arquitectura Hexagonal](../../../docs/hexagonal-architecture.md)
- [Sistema Glassmorphism](../../../styles/glassmorphism-system.scss)
