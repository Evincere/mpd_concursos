# Estándares de Codificación - MPD Concursos App

## 📋 Tabla de Contenidos

1. [Principios Generales](#principios-generales)
2. [Estándares TypeScript](#estándares-typescript)
3. [Estándares Angular](#estándares-angular)
4. [Estándares HTML/Templates](#estándares-htmltemplates)
5. [Estándares SCSS](#estándares-scss)
6. [Testing](#testing)
7. [Arquitectura](#arquitectura)
8. [Prevención de Errores Comunes](#prevención-de-errores-comunes)

## 🎯 Principios Generales

### SOLID y Clean Code
- **S**ingle Responsibility: Cada clase/función debe tener una sola responsabilidad
- **O**pen/Closed: Abierto para extensión, cerrado para modificación
- **L**iskov Substitution: Los objetos derivados deben ser sustituibles por sus bases
- **I**nterface Segregation: Interfaces específicas mejor que una general
- **D**ependency Inversion: Depender de abstracciones, no de concreciones

### Patrones de Diseño
- Utilizar patrones de https://refactoring.guru/es/design-patterns/catalog
- Implementar Repository Pattern para acceso a datos
- Usar Observer Pattern para comunicación entre componentes
- Aplicar Factory Pattern para creación de objetos complejos

## 🔧 Estándares TypeScript

### Tipos y Interfaces
```typescript
// ✅ CORRECTO: Tipos explícitos
interface User {
  id: string;
  name: string;
  email: string;
  lastLogin?: Date; // Usar Date, no null
}

// ❌ INCORRECTO: Tipos implícitos
const user = {
  id: '1',
  name: 'John',
  lastLogin: null // Evitar null, usar undefined
};
```

### Manejo de Errores
```typescript
// ✅ CORRECTO: Manejo explícito de errores
try {
  const result = await this.service.getData();
  return result;
} catch (error) {
  console.error('Error loading data:', error);
  this.notificationService.showError('Error al cargar datos');
  throw error;
}

// ❌ INCORRECTO: Sin manejo de errores
const result = await this.service.getData();
```

### Formularios Reactivos
```typescript
// ✅ CORRECTO: Validación explícita
this.form = this.fb.group({
  name: ['', [Validators.required, Validators.maxLength(100)]],
  email: ['', [Validators.required, Validators.email]]
});

// Método auxiliar para validación
isFieldInvalid(fieldName: string): boolean {
  const field = this.form.get(fieldName);
  return !!(field && field.invalid && (field.dirty || field.touched));
}
```

## 🅰️ Estándares Angular

### Componentes
```typescript
// ✅ CORRECTO: Estructura de componente
@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserListComponent implements OnInit, OnDestroy {
  // 1. Propiedades públicas
  users: User[] = [];
  loading = false;
  
  // 2. Propiedades privadas
  private destroy$ = new Subject<void>();
  
  // 3. Constructor
  constructor(
    private userService: UserService,
    private notificationService: NotificationService
  ) {}
  
  // 4. Lifecycle hooks
  ngOnInit(): void {
    this.loadUsers();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  // 5. Métodos públicos
  loadUsers(): void {
    // Implementación
  }
  
  // 6. Métodos privados
  private handleError(error: any): void {
    // Implementación
  }
}
```

### Servicios
```typescript
// ✅ CORRECTO: Servicio con manejo de errores
@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly apiUrl = `${environment.apiUrl}/users`;
  
  constructor(private http: HttpClient) {}
  
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl).pipe(
      catchError(this.handleError<User[]>('getUsers', []))
    );
  }
  
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      return of(result as T);
    };
  }
}
```

## 📄 Estándares HTML/Templates

### Binding Seguro
```html
<!-- ✅ CORRECTO: Safe navigation operator -->
<div *ngIf="user?.profile?.name">
  {{ user.profile.name }}
</div>

<!-- ✅ CORRECTO: Métodos auxiliares para lógica compleja -->
<div [class.active]="isUserActive(user)">
  {{ getUserDisplayName(user) }}
</div>

<!-- ❌ INCORRECTO: Lógica compleja en template -->
<div [class.active]="user && user.status === 'active' && user.lastLogin && new Date(user.lastLogin) > new Date(Date.now() - 30*24*60*60*1000)">
  {{ user?.firstName + ' ' + user?.lastName }}
</div>
```

### Eventos
```html
<!-- ✅ CORRECTO: Métodos específicos -->
<button (click)="saveUser()" [disabled]="saving">
  {{ saving ? 'Guardando...' : 'Guardar' }}
</button>

<!-- ❌ INCORRECTO: Lógica en template -->
<button (click)="user.status = 'active'; saveUser(); showNotification('User activated')">
  Activar
</button>
```

## 🎨 Estándares SCSS

### Importaciones
```scss
// ✅ CORRECTO: Importación relativa correcta
@import '../../../../../styles/variables';

// Variables locales
$component-padding: 1rem;
$component-border-radius: 8px;

.component-container {
  padding: $component-padding;
  border-radius: $component-border-radius;
  background-color: $color-surface;
}
```

### Nomenclatura BEM
```scss
// ✅ CORRECTO: Metodología BEM
.user-card {
  &__header {
    display: flex;
    justify-content: space-between;
  }
  
  &__title {
    font-size: $font-size-lg;
    color: $color-text-primary;
  }
  
  &--active {
    border-color: $color-success;
  }
}
```

## 🧪 Testing

### Estructura de Tests
```typescript
describe('UserComponent', () => {
  let component: UserComponent;
  let fixture: ComponentFixture<UserComponent>;
  let mockUserService: jasmine.SpyObj<UserService>;

  beforeEach(async () => {
    const userServiceSpy = jasmine.createSpyObj('UserService', ['getUsers', 'createUser']);

    await TestBed.configureTestingModule({
      declarations: [UserComponent],
      providers: [
        { provide: UserService, useValue: userServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserComponent);
    component = fixture.componentInstance;
    mockUserService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load users on init', () => {
    mockUserService.getUsers.and.returnValue(of([]));
    
    component.ngOnInit();
    
    expect(mockUserService.getUsers).toHaveBeenCalled();
  });
});
```

## 🏗️ Arquitectura

### Arquitectura Hexagonal (Backend)
```
src/
├── domain/
│   ├── entities/
│   ├── repositories/
│   └── services/
├── application/
│   ├── use-cases/
│   └── services/
├── infrastructure/
│   ├── adapters/
│   ├── repositories/
│   └── external/
└── presentation/
    ├── controllers/
    └── dto/
```

### Arquitectura por Features (Frontend)
```
src/app/features/
├── user-management/
│   ├── components/
│   ├── services/
│   ├── models/
│   └── user-management.module.ts
├── shared/
│   ├── components/
│   ├── services/
│   └── models/
└── core/
    ├── services/
    ├── guards/
    └── interceptors/
```

## ⚠️ Prevención de Errores Comunes

### 1. Bindings en Templates
```html
<!-- ❌ EVITAR: Assignments en bindings -->
<button (click)="user.status = 'active'">

<!-- ✅ USAR: Métodos específicos -->
<button (click)="activateUser(user)">
```

### 2. Tipos Seguros
```typescript
// ❌ EVITAR: any y casting inseguro
const data = response as any;

// ✅ USAR: Tipos específicos
interface ApiResponse {
  data: User[];
  total: number;
}
const response: ApiResponse = await this.api.getUsers();
```

### 3. Manejo de Observables
```typescript
// ❌ EVITAR: Memory leaks
ngOnInit() {
  this.userService.getUsers().subscribe(users => {
    this.users = users;
  });
}

// ✅ USAR: Unsubscribe automático
ngOnInit() {
  this.userService.getUsers().pipe(
    takeUntil(this.destroy$)
  ).subscribe(users => {
    this.users = users;
  });
}
```

### 4. Formularios
```typescript
// ❌ EVITAR: Validación manual
if (!this.form.get('name')?.value) {
  this.showError('Name is required');
  return;
}

// ✅ USAR: Validadores Angular
this.form = this.fb.group({
  name: ['', Validators.required]
});

if (this.form.invalid) {
  this.markFormGroupTouched(this.form);
  return;
}
```

## 📝 Checklist de Revisión

### Antes de Commit
- [ ] Código compila sin errores ni warnings
- [ ] Tests pasan exitosamente
- [ ] Seguimiento de estándares de nomenclatura
- [ ] Documentación actualizada
- [ ] Sin console.log en producción
- [ ] Manejo adecuado de errores
- [ ] Tipos TypeScript explícitos
- [ ] Unsubscribe de observables

### Antes de PR
- [ ] Código revisado por pares
- [ ] Tests de integración pasan
- [ ] Performance verificada
- [ ] Accesibilidad validada
- [ ] Responsive design verificado
- [ ] Documentación técnica actualizada

---

**Nota**: Estos estándares deben ser seguidos consistentemente en todo el proyecto para mantener la calidad y mantenibilidad del código.
