# Guía de Estilo y Accesibilidad

## Introducción

Esta guía establece los estándares de estilo y accesibilidad para el desarrollo de la aplicación MPD Concursos. El objetivo es mantener un código coherente, mantenible y accesible para todos los usuarios.

## Índice

1. [Convenciones de Código](#convenciones-de-código)
2. [Estructura de Archivos](#estructura-de-archivos)
3. [Componentes](#componentes)
4. [Servicios](#servicios)
5. [Estilos](#estilos)
6. [Accesibilidad](#accesibilidad)
7. [Rendimiento](#rendimiento)
8. [Pruebas](#pruebas)

## Convenciones de Código

### Nomenclatura

- **Clases**: PascalCase (ej. `UserService`)
- **Interfaces**: PascalCase con prefijo I (ej. `IUserService`)
- **Enums**: PascalCase (ej. `UserStatus`)
- **Variables y métodos**: camelCase (ej. `getUserById`)
- **Constantes**: UPPER_SNAKE_CASE (ej. `MAX_USERS`)
- **Archivos**: kebab-case (ej. `user-service.ts`)

### Formato

- Utilizar 2 espacios para la indentación
- Líneas de máximo 100 caracteres
- Utilizar punto y coma al final de cada sentencia
- Utilizar comillas simples para strings
- Añadir una línea en blanco al final de cada archivo

### Comentarios

- Utilizar JSDoc para documentar clases, interfaces, métodos y propiedades
- Comentar código complejo o no obvio
- Evitar comentarios redundantes o que simplemente repiten el código

```typescript
/**
 * Servicio para gestionar usuarios
 */
@Injectable({
  providedIn: 'root'
})
export class UserService {
  /**
   * Obtiene un usuario por su ID
   * @param id ID del usuario
   * @returns Observable con el usuario
   */
  getUserById(id: string): Observable<User> {
    // Implementación
  }
}
```

## Estructura de Archivos

### Organización de Carpetas

```
feature/
├── application/
│   ├── services/
│   └── facades/
├── domain/
│   ├── models/
│   └── interfaces/
├── infrastructure/
│   ├── repositories/
│   └── adapters/
└── presentation/
    ├── components/
    ├── pages/
    └── directives/
```

### Barrels

Utilizar archivos index.ts (barrels) para exportar múltiples elementos desde un directorio:

```typescript
// models/index.ts
export * from './user.model';
export * from './role.model';
```

## Componentes

### Estructura

- Utilizar componentes standalone cuando sea posible
- Separar la lógica de presentación de la lógica de negocio
- Utilizar OnPush para la detección de cambios
- Implementar OnDestroy para limpiar suscripciones

```typescript
@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    // Otros imports
  ]
})
export class UserListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    // Inicialización
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

### Inputs y Outputs

- Utilizar decoradores @Input() y @Output() para la comunicación entre componentes
- Documentar los inputs y outputs con JSDoc
- Utilizar nombres descriptivos

```typescript
/**
 * Input para el usuario a mostrar
 */
@Input() user!: User;

/**
 * Output para cuando se selecciona un usuario
 */
@Output() userSelected = new EventEmitter<User>();
```

## Servicios

### Responsabilidad Única

- Cada servicio debe tener una única responsabilidad
- Utilizar fachadas para coordinar múltiples servicios

### Gestión de Estado

- Utilizar BehaviorSubject para el estado local
- Exponer el estado como Observable
- No exponer el BehaviorSubject directamente

```typescript
@Injectable({
  providedIn: 'root'
})
export class UserStateService {
  private usersSubject = new BehaviorSubject<User[]>([]);
  readonly users$ = this.usersSubject.asObservable();

  getUsers(): User[] {
    return this.usersSubject.getValue();
  }

  setUsers(users: User[]): void {
    this.usersSubject.next(users);
  }
}
```

## Estilos

### Variables CSS

Utilizar variables CSS para colores, fuentes y espaciado:

```scss
:root {
  --color-primary: #3f51b5;
  --color-accent: #ff4081;
  --color-warn: #f44336;
  --color-success: #4caf50;
  --color-background: #f5f5f5;
  --color-text: #333333;
  --font-family: 'Roboto', sans-serif;
  --spacing-unit: 8px;
}
```

### Nomenclatura BEM

Utilizar la nomenclatura BEM (Block, Element, Modifier) para las clases CSS:

```scss
.user-card {
  // Estilos del bloque

  &__header {
    // Estilos del elemento

    &--highlighted {
      // Estilos del modificador
    }
  }
}
```

### Responsive Design

- Utilizar unidades relativas (rem, em, %) en lugar de píxeles
- Utilizar media queries para adaptar la interfaz a diferentes tamaños de pantalla
- Utilizar flexbox y grid para layouts flexibles

```scss
.user-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}
```

## Accesibilidad

### Semántica HTML

- Utilizar elementos HTML semánticos (header, nav, main, section, article, footer)
- Utilizar encabezados (h1-h6) de forma jerárquica
- Utilizar listas (ul, ol) para grupos de elementos relacionados

### Atributos ARIA

- Utilizar atributos ARIA cuando sea necesario
- Asegurarse de que los elementos interactivos tengan roles adecuados
- Utilizar aria-label para elementos sin texto visible

```html
<button
  aria-label="Cerrar diálogo"
  aria-pressed="false"
  class="close-button">
  <i class="fas fa-times"></i>
</button>
```

### Navegación por Teclado

- Asegurarse de que todos los elementos interactivos sean accesibles mediante teclado
- Mantener un orden de tabulación lógico
- Implementar atajos de teclado para acciones comunes

### Contraste de Color

- Mantener una relación de contraste mínima de 4.5:1 para texto normal
- Mantener una relación de contraste mínima de 3:1 para texto grande
- Proporcionar modos de alto contraste

### Anuncios para Lectores de Pantalla

- Utilizar el servicio ScreenReaderService para anunciar cambios importantes
- Utilizar aria-live para regiones dinámicas

```typescript
// Anunciar un mensaje de forma no intrusiva
this.screenReaderService.announcePolite('Se han cargado 10 usuarios');

// Anunciar un mensaje importante que interrumpe la lectura actual
this.screenReaderService.announceAssertive('Error al guardar el formulario');
```

## Rendimiento

### Detección de Cambios

- Utilizar ChangeDetectionStrategy.OnPush para reducir el número de ciclos de detección de cambios
- Utilizar trackBy en ngFor para mejorar el rendimiento de las listas

```html
<div *ngFor="let user of users; trackBy: trackByUserId">
  {{ user.name }}
</div>
```

```typescript
trackByUserId(index: number, user: User): string {
  return user.id;
}
```

### Memorización

- Utilizar el decorador @Memoize para memorizar resultados de funciones costosas

```typescript
@Memoize()
getFilteredUsers(filter: UserFilter): User[] {
  // Implementación costosa
}
```

### Carga Perezosa

- Utilizar carga perezosa para módulos y componentes
- Utilizar la directiva LazyLoadImageDirective para imágenes

```html
<img
  appLazyLoadImage
  [src]="user.avatarUrl"
  [placeholder]="'assets/images/placeholder.jpg'"
  [alt]="user.name"
/>
```

### Medición de Rendimiento

- Utilizar el decorador @MeasurePerformance para medir el rendimiento de métodos críticos
- Utilizar PerformanceTracker para medir bloques de código

```typescript
@MeasurePerformance({
  name: 'UserService.getUsers',
  slowThreshold: 500
})
getUsers(): Observable<User[]> {
  // Implementación
}
```

## Pruebas

### Pruebas Unitarias

- Escribir pruebas unitarias para todos los componentes y servicios
- Utilizar mocks para dependencias externas
- Probar casos de éxito y error

```typescript
describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService]
    });

    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should get users', () => {
    // Implementación de la prueba
  });
});
```

### Pruebas de Integración

- Escribir pruebas de integración para flujos completos
- Utilizar TestBed para configurar el entorno de prueba
- Probar la interacción entre componentes

### Pruebas E2E

- Escribir pruebas E2E para flujos críticos
- Utilizar Cypress o Playwright para pruebas E2E
- Probar la aplicación en diferentes navegadores y dispositivos
