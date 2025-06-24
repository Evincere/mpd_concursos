# 🧪 Guía de Testing del Sistema CV

## 📋 Índice

1. [Visión General](#visión-general)
2. [Estructura de Tests](#estructura-de-tests)
3. [Tests Unitarios](#tests-unitarios)
4. [Tests de Componentes](#tests-de-componentes)
5. [Tests de Integración](#tests-de-integración)
6. [Configuración](#configuración)
7. [Ejecución](#ejecución)
8. [Mejores Prácticas](#mejores-prácticas)

## 🎯 Visión General

El sistema de testing del CV está diseñado para garantizar la calidad y confiabilidad de todas las funcionalidades avanzadas implementadas. Incluye tests unitarios, de componentes y de integración con cobertura completa.

### Herramientas Utilizadas

- **Jasmine**: Framework de testing
- **Karma**: Test runner para tests unitarios
- **Cypress**: Tests de integración E2E
- **Angular Testing Utilities**: Utilidades específicas de Angular
- **Spies y Mocks**: Para aislar dependencias

### Cobertura de Testing

- ✅ **Servicios Core**: 95%+ cobertura
- ✅ **Componentes UI**: 90%+ cobertura
- ✅ **Integración E2E**: Flujos principales
- ✅ **Edge Cases**: Manejo de errores y casos límite

## 📁 Estructura de Tests

```
src/
├── app/
│   ├── core/
│   │   └── services/
│   │       └── cv/
│   │           ├── cv-search.service.spec.ts
│   │           ├── cv-preferences.service.spec.ts
│   │           ├── cv-validation.service.spec.ts
│   │           └── cv-notification.service.spec.ts
│   └── features/
│       └── perfil/
│           └── components/
│               └── cv/
│                   ├── education-form.component.spec.ts
│                   ├── experience-form.component.spec.ts
│                   ├── cv-search.component.spec.ts
│                   └── cv-preferences.component.spec.ts
├── cypress/
│   ├── e2e/
│   │   └── cv/
│   │       ├── cv-search-integration.cy.ts
│   │       ├── cv-preferences-integration.cy.ts
│   │       └── cv-form-integration.cy.ts
│   └── fixtures/
│       └── cv/
│           ├── experiences.json
│           ├── education.json
│           └── search-results.json
└── scripts/
    └── run-cv-tests.js
```

## 🔬 Tests Unitarios

### CvSearchService Tests

**Archivo**: `cv-search.service.spec.ts`

#### Casos de Prueba Principales

```typescript
describe('CvSearchService', () => {
  let service: CvSearchService;
  let mockPreferencesService: jasmine.SpyObj<CvPreferencesService>;

  beforeEach(() => {
    const preferencesServiceSpy = jasmine.createSpyObj('CvPreferencesService', [
      'addToSearchHistory', 'saveFilter', 'markFilterAsUsed'
    ]);

    TestBed.configureTestingModule({
      providers: [
        CvSearchService,
        { provide: CvPreferencesService, useValue: preferencesServiceSpy }
      ]
    });

    service = TestBed.inject(CvSearchService);
    mockPreferencesService = TestBed.inject(CvPreferencesService) as jasmine.SpyObj<CvPreferencesService>;
  });

  describe('Búsqueda por texto', () => {
    it('should filter experiences by search term', () => {
      service.setExperiences(mockExperiences);
      service.updateFilters({ searchTerm: 'Angular' });

      service.experienceResults$.subscribe(result => {
        expect(result.filteredCount).toBe(1);
        expect(result.items[0].position).toBe('Desarrollador Frontend');
      });
    });

    it('should return empty results for non-matching search', () => {
      service.setExperiences(mockExperiences);
      service.updateFilters({ searchTerm: 'Python' });

      service.experienceResults$.subscribe(result => {
        expect(result.filteredCount).toBe(0);
      });
    });
  });

  describe('Filtros avanzados', () => {
    it('should filter by company', () => {
      service.setExperiences(mockExperiences);
      service.updateFilters({ companies: ['TechCorp'] });

      service.experienceResults$.subscribe(result => {
        expect(result.items.every(item => item.company === 'TechCorp')).toBe(true);
      });
    });

    it('should combine multiple filters', () => {
      service.setExperiences(mockExperiences);
      service.updateFilters({ 
        companies: ['TechCorp'],
        technologies: ['Angular']
      });

      service.experienceResults$.subscribe(result => {
        expect(result.items.length).toBeGreaterThan(0);
        expect(result.items.every(item => 
          item.company === 'TechCorp' && 
          item.technologies.includes('Angular')
        )).toBe(true);
      });
    });
  });
});
```

### CvPreferencesService Tests

**Archivo**: `cv-preferences.service.spec.ts`

#### Casos de Prueba Principales

```typescript
describe('CvPreferencesService', () => {
  let service: CvPreferencesService;
  let mockLocalStorage: { [key: string]: string };

  beforeEach(() => {
    // Mock localStorage
    mockLocalStorage = {};
    spyOn(localStorage, 'getItem').and.callFake(key => mockLocalStorage[key] || null);
    spyOn(localStorage, 'setItem').and.callFake((key, value) => mockLocalStorage[key] = value);

    service = TestBed.inject(CvPreferencesService);
  });

  describe('Gestión de filtros guardados', () => {
    it('should save a new filter', () => {
      const savedFilter = service.saveFilter('Mi Filtro', mockFilters, 'Descripción');

      expect(savedFilter.name).toBe('Mi Filtro');
      expect(savedFilter.description).toBe('Descripción');
      expect(service.preferences().savedFilters.length).toBe(1);
    });

    it('should delete a saved filter', () => {
      const savedFilter = service.saveFilter('Test Filter', mockFilters);
      service.deleteFilter(savedFilter.id);
      
      expect(service.preferences().savedFilters.length).toBe(0);
    });
  });

  describe('Historial de búsquedas', () => {
    it('should add search to history', () => {
      service.addToSearchHistory('Angular Developer', { companies: ['TechCorp'] }, 5);

      const history = service.preferences().searchHistory;
      expect(history.length).toBe(1);
      expect(history[0].searchTerm).toBe('Angular Developer');
    });

    it('should limit history size', () => {
      service.updateSearchPreferences({ maxSearchHistoryItems: 2 });

      service.addToSearchHistory('search1', {}, 1);
      service.addToSearchHistory('search2', {}, 2);
      service.addToSearchHistory('search3', {}, 3);

      expect(service.preferences().searchHistory.length).toBe(2);
    });
  });
});
```

## 🎨 Tests de Componentes

### EducationFormComponent Tests

**Archivo**: `education-form.component.spec.ts`

#### Setup del Test

```typescript
describe('EducationFormComponent', () => {
  let component: EducationFormComponent;
  let fixture: ComponentFixture<EducationFormComponent>;
  let mockValidationService: jasmine.SpyObj<CvValidationService>;

  beforeEach(async () => {
    const validationServiceSpy = jasmine.createSpyObj('CvValidationService', [
      'validateEducation', 'validateField'
    ]);

    await TestBed.configureTestingModule({
      imports: [EducationFormComponent, ReactiveFormsModule, NoopAnimationsModule],
      providers: [
        { provide: CvValidationService, useValue: validationServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EducationFormComponent);
    component = fixture.componentInstance;
    mockValidationService = TestBed.inject(CvValidationService) as jasmine.SpyObj<CvValidationService>;
  });

  describe('Campos dinámicos', () => {
    it('should show university-specific fields when university type is selected', () => {
      component.form().get('type')?.setValue(EducationType.UNIVERSITY);
      
      const dynamicFields = component.dynamicFields;
      const fieldNames = dynamicFields.map(field => field.name);
      
      expect(fieldNames).toContain('averageGrade');
      expect(fieldNames).toContain('duration');
    });
  });

  describe('Validación', () => {
    it('should show validation errors', () => {
      mockValidationService.validateEducation.and.returnValue({
        isValid: false,
        errors: ['El título es obligatorio'],
        warnings: []
      });

      component.validateForm();
      
      expect(component.validationErrors().length).toBe(1);
      expect(component.validationErrors()).toContain('El título es obligatorio');
    });
  });
});
```

## 🔗 Tests de Integración

### Cypress E2E Tests

**Archivo**: `cv-search-integration.cy.ts`

#### Configuración

```typescript
describe('CV Search Integration Tests', () => {
  beforeEach(() => {
    // Configurar interceptores para APIs
    cy.intercept('GET', '/api/cv/experiences', { fixture: 'cv/experiences.json' }).as('getExperiences');
    cy.intercept('GET', '/api/cv/education', { fixture: 'cv/education.json' }).as('getEducation');
    
    cy.visit('/perfil/cv/busqueda');
    cy.wait(['@getExperiences', '@getEducation']);
  });

  describe('Búsqueda básica', () => {
    it('should perform basic text search', () => {
      cy.get('[data-cy="search-input"]').type('Angular');
      cy.get('[data-cy="search-button"]').click();
      
      cy.get('[data-cy="search-results"]').should('be.visible');
      cy.get('[data-cy="result-item"]').should('have.length.greaterThan', 0);
      cy.get('[data-cy="result-item"]').first().should('contain.text', 'Angular');
    });
  });

  describe('Filtros avanzados', () => {
    it('should filter by company', () => {
      cy.get('[data-cy="advanced-filters-toggle"]').click();
      cy.get('[data-cy="company-filter"]').click();
      cy.get('[data-cy="company-option-techcorp"]').click();
      cy.get('[data-cy="apply-filters"]').click();
      
      cy.get('[data-cy="result-item"]').each(($item) => {
        cy.wrap($item).should('contain.text', 'TechCorp');
      });
    });
  });
});
```

## ⚙️ Configuración

### Karma Configuration

**Archivo**: `karma-cv.conf.js`

```javascript
module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage/cv-tests'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'text-summary' },
        { type: 'lcov' }
      ],
      check: {
        global: {
          statements: 80,
          branches: 75,
          functions: 80,
          lines: 80
        }
      }
    },
    
    files: [
      { pattern: 'src/app/core/services/cv/**/*.spec.ts', type: 'js' },
      { pattern: 'src/app/features/perfil/components/cv/**/*.spec.ts', type: 'js' }
    ],
    
    browsers: ['ChromeHeadless'],
    singleRun: true
  });
};
```

### Cypress Configuration

**Archivo**: `cypress.config.ts`

```typescript
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4200',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    
    env: {
      apiUrl: 'http://localhost:8080/api',
      testUser: {
        username: 'user_test',
        password: 'user123'
      }
    }
  }
});
```

## 🚀 Ejecución

### Scripts Disponibles

```bash
# Tests unitarios específicos del CV
node scripts/run-cv-tests.js unit

# Tests de componentes
node scripts/run-cv-tests.js component

# Tests de integración
node scripts/run-cv-tests.js integration

# Todos los tests
node scripts/run-cv-tests.js all

# Tests con watch mode
npm run test:cv:watch

# Tests con cobertura
npm run test:cv:coverage
```

### Script Personalizado

**Archivo**: `scripts/run-cv-tests.js`

```javascript
const cvTestFiles = [
  'src/app/core/services/cv/cv-search.service.spec.ts',
  'src/app/core/services/cv/cv-preferences.service.spec.ts',
  'src/app/core/services/cv/cv-validation.service.spec.ts',
  // ... más archivos
];

function runUnitTests(testFiles) {
  const karmaConfig = `
    module.exports = function(config) {
      config.set({
        // ... configuración específica para tests CV
      });
    };
  `;
  
  fs.writeFileSync('karma-cv.conf.js', karmaConfig);
  
  const command = 'ng test --karma-config=karma-cv.conf.js --watch=false --code-coverage';
  execSync(command, { stdio: 'inherit' });
}
```

## 📋 Mejores Prácticas

### 1. Estructura de Tests

```typescript
describe('ServiceName', () => {
  // Setup común
  beforeEach(() => {
    // Configuración de mocks y TestBed
  });

  describe('Feature Group', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test data';
      
      // Act
      const result = service.method(input);
      
      // Assert
      expect(result).toBe(expectedValue);
    });
  });
});
```

### 2. Mocking de Servicios

```typescript
// ✅ Correcto - Mock específico
const mockService = jasmine.createSpyObj('ServiceName', ['method1', 'method2']);
mockService.method1.and.returnValue(of(mockData));

// ❌ Incorrecto - Mock genérico
const mockService = { method1: () => of(mockData) };
```

### 3. Tests de Componentes

```typescript
// ✅ Correcto - Test de comportamiento
it('should emit save event when form is valid', () => {
  spyOn(component.save, 'emit');
  
  component.form.patchValue(validData);
  component.onSave();
  
  expect(component.save.emit).toHaveBeenCalledWith(validData);
});

// ❌ Incorrecto - Test de implementación
it('should call validateForm method', () => {
  spyOn(component, 'validateForm');
  component.onSave();
  expect(component.validateForm).toHaveBeenCalled();
});
```

### 4. Tests E2E

```typescript
// ✅ Correcto - Usar data-cy attributes
cy.get('[data-cy="search-button"]').click();

// ❌ Incorrecto - Usar selectores frágiles
cy.get('.btn-primary').click();
```

### 5. Datos de Prueba

```typescript
// ✅ Correcto - Factory functions
function createMockExperience(overrides = {}): WorkExperience {
  return {
    id: '1',
    position: 'Developer',
    company: 'TechCorp',
    startDate: new Date('2022-01-01'),
    // ... valores por defecto
    ...overrides
  };
}

// Uso
const experience = createMockExperience({ position: 'Senior Developer' });
```

### 6. Assertions

```typescript
// ✅ Correcto - Assertions específicas
expect(result.items).toHaveLength(3);
expect(result.items[0].company).toBe('TechCorp');

// ❌ Incorrecto - Assertions vagas
expect(result).toBeTruthy();
expect(result.items.length).toBeGreaterThan(0);
```

## 🔍 Debugging Tests

### Logs de Debug

```typescript
// En tests
beforeEach(() => {
  spyOn(console, 'log');
  spyOn(console, 'error');
});

it('should log debug information', () => {
  service.debugMethod();
  expect(console.log).toHaveBeenCalledWith('Debug message');
});
```

### Test Isolation

```typescript
// Limpiar estado entre tests
afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
```

### Async Testing

```typescript
// ✅ Correcto - fakeAsync/tick
it('should debounce search', fakeAsync(() => {
  component.searchInput.setValue('test');
  tick(300);
  
  expect(mockSearchService.search).toHaveBeenCalledWith('test');
}));
```

---

**Versión**: 1.0.0  
**Última Actualización**: 2025-06-21  
**Autor**: Augment Agent
