# Patrones de Diseño

Este documento describe los patrones de diseño utilizados en la aplicación MPD Concursos.

## Patrones Creacionales

### Factory Method

El patrón Factory Method se utiliza para crear objetos sin especificar la clase exacta del objeto que se creará.

**Ejemplo de implementación:**

```typescript
// Interfaz para el producto
export interface Dialog {
  open(): void;
  close(): void;
}

// Implementaciones concretas
export class AlertDialog implements Dialog {
  open(): void { /* ... */ }
  close(): void { /* ... */ }
}

export class ConfirmDialog implements Dialog {
  open(): void { /* ... */ }
  close(): void { /* ... */ }
}

// Factory Method
export class DialogFactory {
  createDialog(type: 'alert' | 'confirm'): Dialog {
    switch (type) {
      case 'alert':
        return new AlertDialog();
      case 'confirm':
        return new ConfirmDialog();
      default:
        throw new Error(`Dialog type ${type} not supported`);
    }
  }
}
```

### Singleton

El patrón Singleton se utiliza para garantizar que una clase tenga una única instancia y proporcionar un punto de acceso global a ella.

**Ejemplo de implementación:**

En Angular, los servicios proporcionados en el nivel de raíz son singletons por defecto:

```typescript
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Esta clase será un singleton
}
```

## Patrones Estructurales

### Adapter

El patrón Adapter se utiliza para permitir que interfaces incompatibles trabajen juntas.

**Ejemplo de implementación:**

```typescript
// Interfaz esperada por la aplicación
export interface UserRepository {
  getUsers(): Observable<User[]>;
  getUserById(id: string): Observable<User>;
}

// Adaptador para la API externa
@Injectable()
export class ApiUserRepositoryAdapter implements UserRepository {
  constructor(private apiClient: ApiClient) {}

  getUsers(): Observable<User[]> {
    return this.apiClient.get('/users').pipe(
      map(response => this.mapToUsers(response))
    );
  }

  getUserById(id: string): Observable<User> {
    return this.apiClient.get(`/users/${id}`).pipe(
      map(response => this.mapToUser(response))
    );
  }

  private mapToUsers(response: any): User[] {
    // Mapeo de la respuesta de la API al modelo de dominio
  }

  private mapToUser(response: any): User {
    // Mapeo de la respuesta de la API al modelo de dominio
  }
}
```

### Composite

El patrón Composite se utiliza para componer objetos en estructuras de árbol para representar jerarquías parte-todo.

**Ejemplo de implementación:**

```typescript
// Componente base
export interface FormComponent {
  render(): string;
  validate(): boolean;
}

// Componente hoja
export class InputField implements FormComponent {
  constructor(private name: string, private value: string) {}

  render(): string {
    return `<input name="${this.name}" value="${this.value}" />`;
  }

  validate(): boolean {
    return this.value.length > 0;
  }
}

// Componente compuesto
export class FormGroup implements FormComponent {
  private components: FormComponent[] = [];

  add(component: FormComponent): void {
    this.components.push(component);
  }

  render(): string {
    return this.components.map(component => component.render()).join('');
  }

  validate(): boolean {
    return this.components.every(component => component.validate());
  }
}
```

### Decorator

El patrón Decorator se utiliza para añadir responsabilidades a objetos dinámicamente.

**Ejemplo de implementación:**

En Angular, los decoradores son una característica clave:

```typescript
@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent {
  // El decorador @Component añade metadatos a la clase
}

// Decorador personalizado
export function Memoize() {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const cache = new Map();

    descriptor.value = function(...args: any[]) {
      const key = JSON.stringify(args);
      if (cache.has(key)) {
        return cache.get(key);
      }
      const result = originalMethod.apply(this, args);
      cache.set(key, result);
      return result;
    };

    return descriptor;
  };
}
```

### Facade

El patrón Facade se utiliza para proporcionar una interfaz unificada a un conjunto de interfaces en un subsistema.

**Ejemplo de implementación:**

```typescript
@Injectable()
export class UserFacade {
  constructor(
    private userService: UserService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  createUser(userData: UserData): Observable<User> {
    return this.userService.createUser(userData).pipe(
      tap(user => {
        this.notificationService.success('Usuario creado correctamente');
        this.authService.setCurrentUser(user);
      }),
      catchError(error => {
        this.notificationService.error('Error al crear usuario');
        return throwError(() => error);
      })
    );
  }
}
```

## Patrones de Comportamiento

### Observer

El patrón Observer se utiliza para definir una dependencia uno a muchos entre objetos, de modo que cuando un objeto cambia de estado, todos sus dependientes son notificados y actualizados automáticamente.

**Ejemplo de implementación:**

En Angular, RxJS proporciona una implementación del patrón Observer:

```typescript
@Injectable()
export class UserStateService {
  private usersSubject = new BehaviorSubject<User[]>([]);
  readonly users$ = this.usersSubject.asObservable();

  loadUsers(): void {
    this.userService.getUsers().subscribe(users => {
      this.usersSubject.next(users);
    });
  }

  addUser(user: User): void {
    const currentUsers = this.usersSubject.getValue();
    this.usersSubject.next([...currentUsers, user]);
  }
}
```

### Strategy

El patrón Strategy se utiliza para definir una familia de algoritmos, encapsular cada uno de ellos y hacerlos intercambiables.

**Ejemplo de implementación:**

```typescript
// Interfaz de estrategia
export interface SortStrategy<T> {
  sort(items: T[]): T[];
}

// Implementaciones concretas
export class AlphabeticalSortStrategy<T> implements SortStrategy<T> {
  constructor(private property: keyof T) {}

  sort(items: T[]): T[] {
    return [...items].sort((a, b) => {
      const valueA = String(a[this.property]);
      const valueB = String(b[this.property]);
      return valueA.localeCompare(valueB);
    });
  }
}

export class NumericalSortStrategy<T> implements SortStrategy<T> {
  constructor(private property: keyof T) {}

  sort(items: T[]): T[] {
    return [...items].sort((a, b) => {
      const valueA = Number(a[this.property]);
      const valueB = Number(b[this.property]);
      return valueA - valueB;
    });
  }
}

// Contexto
export class SortableList<T> {
  private strategy: SortStrategy<T>;

  constructor(private items: T[]) {}

  setStrategy(strategy: SortStrategy<T>): void {
    this.strategy = strategy;
  }

  sort(): T[] {
    return this.strategy.sort(this.items);
  }
}
```

### Command

El patrón Command se utiliza para encapsular una solicitud como un objeto, permitiendo parametrizar clientes con diferentes solicitudes, encolar o registrar solicitudes, y soportar operaciones que pueden deshacerse.

**Ejemplo de implementación:**

```typescript
// Interfaz de comando
export interface Command {
  execute(): void;
  undo(): void;
}

// Implementación concreta
export class AddUserCommand implements Command {
  constructor(
    private userService: UserService,
    private user: User,
    private onSuccess?: (user: User) => void,
    private onError?: (error: any) => void
  ) {}

  execute(): void {
    this.userService.addUser(this.user).subscribe({
      next: user => {
        if (this.onSuccess) {
          this.onSuccess(user);
        }
      },
      error: error => {
        if (this.onError) {
          this.onError(error);
        }
      }
    });
  }

  undo(): void {
    this.userService.deleteUser(this.user.id).subscribe();
  }
}

// Invocador
export class CommandInvoker {
  private history: Command[] = [];

  execute(command: Command): void {
    command.execute();
    this.history.push(command);
  }

  undo(): void {
    const command = this.history.pop();
    if (command) {
      command.undo();
    }
  }
}
```

### State

El patrón State se utiliza para permitir que un objeto altere su comportamiento cuando su estado interno cambia.

**Ejemplo de implementación:**

```typescript
// Interfaz de estado
export interface UserState {
  canEdit(): boolean;
  canDelete(): boolean;
  canActivate(): boolean;
  canDeactivate(): boolean;
}

// Implementaciones concretas
export class ActiveUserState implements UserState {
  canEdit(): boolean { return true; }
  canDelete(): boolean { return true; }
  canActivate(): boolean { return false; }
  canDeactivate(): boolean { return true; }
}

export class InactiveUserState implements UserState {
  canEdit(): boolean { return true; }
  canDelete(): boolean { return true; }
  canActivate(): boolean { return true; }
  canDeactivate(): boolean { return false; }
}

export class BlockedUserState implements UserState {
  canEdit(): boolean { return false; }
  canDelete(): boolean { return true; }
  canActivate(): boolean { return true; }
  canDeactivate(): boolean { return false; }
}

// Contexto
export class UserContext {
  private state: UserState;

  constructor(private user: User) {
    this.setState(user.status);
  }

  setState(status: UserStatus): void {
    switch (status) {
      case UserStatus.ACTIVE:
        this.state = new ActiveUserState();
        break;
      case UserStatus.INACTIVE:
        this.state = new InactiveUserState();
        break;
      case UserStatus.BLOCKED:
        this.state = new BlockedUserState();
        break;
      default:
        throw new Error(`Status ${status} not supported`);
    }
  }

  canEdit(): boolean {
    return this.state.canEdit();
  }

  canDelete(): boolean {
    return this.state.canDelete();
  }

  canActivate(): boolean {
    return this.state.canActivate();
  }

  canDeactivate(): boolean {
    return this.state.canDeactivate();
  }
}
```

## Patrones Arquitectónicos

### Modelo-Vista-Presentador (MVP)

El patrón MVP se utiliza para separar la lógica de presentación de la vista.

**Ejemplo de implementación:**

```typescript
// Modelo
export interface UserModel {
  id: string;
  name: string;
  email: string;
}

// Vista
export interface UserView {
  displayUsers(users: UserViewModel[]): void;
  showLoading(): void;
  hideLoading(): void;
  showError(message: string): void;
}

// Modelo de vista
export interface UserViewModel {
  id: string;
  displayName: string;
  email: string;
}

// Presentador
export class UserPresenter {
  constructor(
    private view: UserView,
    private userService: UserService
  ) {}

  loadUsers(): void {
    this.view.showLoading();
    this.userService.getUsers().subscribe({
      next: users => {
        const viewModels = users.map(user => this.mapToViewModel(user));
        this.view.displayUsers(viewModels);
        this.view.hideLoading();
      },
      error: error => {
        this.view.hideLoading();
        this.view.showError('Error al cargar usuarios');
      }
    });
  }

  private mapToViewModel(user: UserModel): UserViewModel {
    return {
      id: user.id,
      displayName: `${user.name} (${user.email})`,
      email: user.email
    };
  }
}
```

### Repositorio

El patrón Repositorio se utiliza para mediar entre el dominio y las capas de mapeo de datos.

**Ejemplo de implementación:**

```typescript
// Interfaz del repositorio
export interface UserRepository {
  getAll(): Observable<User[]>;
  getById(id: string): Observable<User>;
  create(user: User): Observable<User>;
  update(user: User): Observable<User>;
  delete(id: string): Observable<void>;
}

// Implementación concreta
@Injectable()
export class HttpUserRepository implements UserRepository {
  constructor(private http: HttpClient) {}

  getAll(): Observable<User[]> {
    return this.http.get<User[]>('/api/users');
  }

  getById(id: string): Observable<User> {
    return this.http.get<User>(`/api/users/${id}`);
  }

  create(user: User): Observable<User> {
    return this.http.post<User>('/api/users', user);
  }

  update(user: User): Observable<User> {
    return this.http.put<User>(`/api/users/${user.id}`, user);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/api/users/${id}`);
  }
}
```

### Inyección de Dependencias

El patrón de Inyección de Dependencias se utiliza para implementar la inversión de control.

**Ejemplo de implementación:**

En Angular, la inyección de dependencias es un patrón fundamental:

```typescript
// Definición de token
export const USER_REPOSITORY = new InjectionToken<UserRepository>('UserRepository');

// Proveedor
export const userRepositoryProvider = {
  provide: USER_REPOSITORY,
  useClass: HttpUserRepository
};

// Uso
@Injectable()
export class UserService {
  constructor(@Inject(USER_REPOSITORY) private userRepository: UserRepository) {}

  getUsers(): Observable<User[]> {
    return this.userRepository.getAll();
  }
}
```

## Conclusión

La aplicación MPD Concursos utiliza una variedad de patrones de diseño para resolver problemas comunes de manera elegante y mantenible. Estos patrones ayudan a estructurar el código, mejorar la reutilización y facilitar las pruebas.
