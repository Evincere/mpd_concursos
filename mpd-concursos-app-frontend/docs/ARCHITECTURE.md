# Arquitectura de la Aplicación

## Visión General

La aplicación MPD Concursos sigue una arquitectura hexagonal (también conocida como arquitectura de puertos y adaptadores) combinada con principios de diseño modular y patrones de diseño SOLID. Esta arquitectura permite una clara separación de responsabilidades, facilita las pruebas y mejora la mantenibilidad del código.

## Estructura de Carpetas

```
mpd-concursos-app-frontend/
├── src/
│   ├── app/
│   │   ├── core/                  # Funcionalidades centrales de la aplicación
│   │   │   ├── config/            # Configuraciones globales
│   │   │   ├── guards/            # Guards de rutas
│   │   │   ├── interceptors/      # Interceptores HTTP
│   │   │   ├── services/          # Servicios core
│   │   │   └── store/             # Estado global (NgRx)
│   │   ├── features/              # Módulos de características
│   │   │   ├── admin/             # Módulo de administración
│   │   │   │   ├── application/   # Capa de aplicación (casos de uso)
│   │   │   │   ├── domain/        # Capa de dominio (modelos, interfaces)
│   │   │   │   ├── infrastructure/# Capa de infraestructura (adaptadores)
│   │   │   │   └── presentation/  # Capa de presentación (componentes)
│   │   │   ├── auth/              # Módulo de autenticación
│   │   │   ├── home/              # Módulo de inicio
│   │   │   └── ...
│   │   ├── shared/                # Componentes y utilidades compartidas
│   │   │   ├── components/        # Componentes reutilizables
│   │   │   ├── directives/        # Directivas
│   │   │   ├── pipes/             # Pipes
│   │   │   ├── services/          # Servicios compartidos
│   │   │   └── utils/             # Utilidades
│   │   ├── app.component.ts       # Componente raíz
│   │   ├── app.routes.ts          # Rutas principales
│   │   └── app.config.ts          # Configuración de la aplicación
│   ├── assets/                    # Recursos estáticos
│   ├── environments/              # Configuraciones de entorno
│   └── styles/                    # Estilos globales
├── docs/                          # Documentación
└── ...
```

## Arquitectura Hexagonal

La arquitectura hexagonal se implementa en cada módulo de características, con las siguientes capas:

### 1. Capa de Dominio

- **Modelos**: Representan las entidades del dominio y encapsulan la lógica de negocio.
- **Interfaces**: Definen los contratos para los servicios y repositorios.
- **Enums**: Definen los valores constantes del dominio.

### 2. Capa de Aplicación

- **Servicios de Aplicación**: Implementan los casos de uso de la aplicación.
- **DTOs**: Objetos de transferencia de datos para la comunicación entre capas.
- **Mappers**: Transforman objetos entre diferentes representaciones.

### 3. Capa de Infraestructura

- **Repositorios**: Implementan el acceso a datos.
- **Adaptadores**: Conectan la aplicación con servicios externos.
- **Proveedores**: Configuran la inyección de dependencias.

### 4. Capa de Presentación

- **Componentes**: Implementan la interfaz de usuario.
- **Servicios de UI**: Gestionan la lógica específica de la interfaz.
- **Modelos de Vista**: Representan los datos para la interfaz de usuario.

## Patrones de Diseño

### Patrón Repositorio

El patrón repositorio se utiliza para abstraer el acceso a datos y proporcionar una interfaz unificada para interactuar con diferentes fuentes de datos.

```typescript
// Interfaz del repositorio (capa de dominio)
export interface UserRepository {
  getUsers(filter: UserFilter): Observable<PagedResult<User>>;
  getUserById(id: string): Observable<User>;
  createUser(user: CreateUserDTO): Observable<User>;
  updateUser(user: UpdateUserDTO): Observable<User>;
  deleteUser(id: string): Observable<void>;
}

// Implementación del repositorio (capa de infraestructura)
@Injectable()
export class HttpUserRepository implements UserRepository {
  constructor(private http: HttpClient) {}

  getUsers(filter: UserFilter): Observable<PagedResult<User>> {
    // Implementación con HttpClient
  }

  // Otras implementaciones...
}
```

### Patrón Servicio

El patrón servicio se utiliza para encapsular la lógica de negocio y coordinar las operaciones entre diferentes componentes.

```typescript
// Servicio de aplicación
@Injectable()
export class UserService {
  constructor(private userRepository: UserRepository) {}

  getUsers(filter: UserFilter): Observable<PagedResult<User>> {
    return this.userRepository.getUsers(filter);
  }

  // Otros métodos...
}
```

### Patrón Estado

El patrón estado se utiliza para gestionar el estado de la aplicación de forma reactiva utilizando BehaviorSubject.

```typescript
// Servicio de estado
@Injectable()
export class UserStateService {
  private usersSubject = new BehaviorSubject<User[]>([]);
  readonly users$ = this.usersSubject.asObservable();

  constructor(private userService: UserService) {}

  loadUsers(filter: UserFilter): void {
    this.userService.getUsers(filter).subscribe(result => {
      this.usersSubject.next(result.content);
    });
  }

  // Otros métodos...
}
```

### Patrón Fachada

El patrón fachada se utiliza para proporcionar una interfaz simplificada a un subsistema complejo.

```typescript
// Fachada para el módulo de administración
@Injectable()
export class AdminFacade {
  constructor(
    private userStateService: UserStateService,
    private contestStateService: ContestStateService
  ) {}

  loadDashboardData(): void {
    this.userStateService.loadUsers({ page: 0, size: 5 });
    this.contestStateService.loadContests({ page: 0, size: 5 });
  }

  // Otros métodos...
}
```

## Gestión de Estado

La aplicación utiliza diferentes estrategias para la gestión de estado:

### 1. Estado Local de Componentes

Para estado específico de componentes que no necesita ser compartido.

### 2. Servicios con BehaviorSubject

Para estado compartido entre componentes relacionados dentro de un módulo.

### 3. NgRx Store

Para estado global de la aplicación que necesita ser accesible desde múltiples módulos.

## Manejo de Errores

La aplicación implementa un sistema centralizado de manejo de errores:

1. **Interceptor HTTP**: Captura errores de API y los transforma en errores de aplicación.
2. **Servicio de Errores**: Proporciona métodos para manejar diferentes tipos de errores.
3. **Notificaciones**: Muestra mensajes de error al usuario de forma consistente.

## Optimización de Rendimiento

La aplicación implementa varias estrategias para optimizar el rendimiento:

1. **Carga Perezosa**: Los módulos se cargan bajo demanda.
2. **Memorización**: Los resultados de cálculos costosos se almacenan en caché.
3. **Carga Perezosa de Imágenes**: Las imágenes se cargan solo cuando son visibles.
4. **Detección de Cambios OnPush**: Se utiliza para reducir el número de ciclos de detección de cambios.

## Accesibilidad

La aplicación sigue las pautas WCAG 2.1 para garantizar la accesibilidad:

1. **Atributos ARIA**: Se utilizan para mejorar la accesibilidad para lectores de pantalla.
2. **Navegación por Teclado**: Todos los elementos interactivos son accesibles mediante teclado.
3. **Anuncios para Lectores de Pantalla**: Se utilizan para informar a los usuarios sobre cambios importantes.
4. **Contraste de Color**: Se asegura un contraste adecuado para usuarios con discapacidad visual.

## Pruebas

La aplicación implementa diferentes tipos de pruebas:

1. **Pruebas Unitarias**: Prueban componentes y servicios de forma aislada.
2. **Pruebas de Integración**: Prueban la interacción entre componentes.
3. **Pruebas E2E**: Prueban flujos completos de usuario.

## Convenciones de Código

La aplicación sigue las siguientes convenciones de código:

1. **Nomenclatura**: CamelCase para variables y métodos, PascalCase para clases e interfaces.
2. **Organización de Archivos**: Un archivo por clase, con nombres descriptivos.
3. **Comentarios**: Comentarios JSDoc para documentar clases, métodos y propiedades.
4. **Formateo**: Se utiliza Prettier para mantener un estilo consistente.
5. **Linting**: Se utiliza ESLint para detectar problemas de código.

## Conclusión

La arquitectura de la aplicación MPD Concursos está diseñada para ser modular, mantenible y escalable. La separación clara de responsabilidades y la adherencia a principios SOLID facilitan el desarrollo y las pruebas, mientras que las optimizaciones de rendimiento y accesibilidad garantizan una buena experiencia de usuario.
