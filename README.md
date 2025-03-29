# Defensa Mendoza - Sistema de Concursos

Sistema de gestión de concursos para el Ministerio Público de la Defensa de Mendoza. Esta plataforma permite la gestión integral del proceso de concursos, desde la publicación hasta la evaluación y selección de candidatos.

## 🚀 Características Principales

- **Gestión de Concursos**: Publicación, seguimiento y administración de concursos públicos
- **Portal del Postulante**: Interfaz intuitiva para la inscripción y seguimiento de postulaciones
- **Gestión Documental**: Sistema de carga y validación de documentación requerida
- **Panel Administrativo**: Herramientas completas para la gestión del proceso
- **Sistema de Notificaciones**: Alertas y comunicaciones automáticas
- **Seguimiento de Estados**: Control del progreso de cada concurso y postulación

## 🛠️ Tecnologías Utilizadas

### Frontend
- Angular
- Material Design
- SCSS
- TypeScript
- Electron (para versión de escritorio)

### Backend
- Spring Boot
- Java 17
- MySQL
- JWT para autenticación
- Maven

## 📦 Estructura del Proyecto

```
├── concurso-backend/           # Backend en Spring Boot
│   ├── src/                    
│   │   ├── main/              
│   │   │   ├── java/          # Código fuente Java
│   │   │   └── resources/     # Configuraciones
│   │   └── test/              # Tests
│   └── pom.xml                # Dependencias Maven
│
└── mpd-concursos-app-frontend/ # Frontend en Angular
    ├── src/
    │   ├── app/               # Código fuente Angular
    │   ├── assets/            # Recursos estáticos
    │   └── environments/      # Configuraciones por ambiente
    ├── electron/              # Configuración Electron
    └── package.json           # Dependencias npm
```

## 🏗️ Arquitectura del Sistema

```mermaid
flowchart TD

    %% Frontend Subgraph
    subgraph "Frontend (Angular + Electron)"
        F1["Angular App"]:::frontend
        F2["User Interface (Portal, Admin, Exams)"]:::frontend
        F3["Core Services (Auth, Contest, Document, Notification)"]:::frontend
        F4["Electron Integration"]:::frontend
    end

    %% Backend Subgraph
    subgraph "Backend (Spring Boot)"
        B0["Spring Boot Application"]:::backend
        subgraph "Controllers"
            BC1["AuthController"]:::controller
            BC2["ContestController"]:::controller
            BC3["DocumentController"]:::controller
            BC4["NotificationController"]:::controller
        end
        B2["Application/Service Layer"]:::backend
        B3["Domain Layer"]:::backend
        B4["Infrastructure/Repository Layer"]:::backend
        subgraph "Security Components"
            S1["JwtTokenFilter"]:::security
            S2["SecurityConfig"]:::security
        end
    end

    %% Database and Document Storage
    DB["MySQL Database"]:::database
    DS["Document Storage"]:::doc

    %% Deployment & Build Subgraph
    subgraph "Deployment & Build"
        D1["Docker & Deployment"]:::deploy
        D2["Maven Build Files"]:::deploy
        D3["npm Build Files"]:::deploy
        DScr["MySQL Scripts"]:::deploy
    end

    %% Connections for Frontend
    F1 -->|"includes"| F2
    F1 -->|"includes"| F3
    F1 -->|"packagedBy"| F4
    F1 -->|"HTTP"| B0

    %% Backend internal flow
    B0 -->|"calls"| BC1
    B0 -->|"calls"| BC2
    B0 -->|"calls"| BC3
    B0 -->|"calls"| BC4
    BC1 -->|"calls"| B2
    BC2 -->|"calls"| B2
    BC3 -->|"calls"| B2
    BC4 -->|"calls"| B2
    B2 -->|"processes"| B3
    B3 -->|"invokes"| B4
    B4 -->|"persistsTo"| DB
    B4 -->|"storesDocs"| DS

    %% Security flow
    S1 ---|"validates"| BC1
    S1 ---|"validates"| BC2
    S1 ---|"validates"| BC3
    S1 ---|"validates"| BC4
    S2 ---|"configures"| B0

    %% Deployment & Build connections
    B0 -->|"Dockerize"| D1
    B0 -->|"builtWith"| D2
    F1 -->|"builtWith"| D3

    %% Styles
    classDef frontend fill:#AED6F1,stroke:#1F618D,stroke-width:2px;
    classDef backend fill:#FCF3CF,stroke:#B7950B,stroke-width:2px;
    classDef controller fill:#D6EAF8,stroke:#2874A6,stroke-width:2px;
    classDef security fill:#FADBD8,stroke:#C0392B,stroke-width:2px;
    classDef database fill:#F9E79F,stroke:#B7950B,stroke-width:2px;
    classDef doc fill:#EBDEF0,stroke:#AF7AC5,stroke-width:2px;
    classDef deploy fill:#D5F5E3,stroke:#28B463,stroke-width:2px;
```

## 🚀 Instalación y Configuración

### Requisitos Previos
- Java 17 o superior
- Node.js 18 o superior
- MySQL 8.0
- Maven 3.8+

### Backend
1. Configurar variables de entorno:
   ```properties
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=mpd_concursos
   DB_USERNAME=your_username
   DB_PASSWORD=your_password
   JWT_SECRET=your_secret
   ```

2. Ejecutar:
   ```bash
   cd concurso-backend
   mvn clean install
   mvn spring-boot:run
   ```

### Frontend
1. Instalar dependencias:
   ```bash
   cd mpd-concursos-app-frontend
   npm install
   ```

2. Ejecutar en modo desarrollo:
   ```bash
   npm run start
   ```

3. Para compilar versión de escritorio:
   ```bash
   npm run electron:build
   ```

## 🔐 Seguridad

- Autenticación mediante JWT
- Roles y permisos granulares
- Encriptación de datos sensibles
- Validación de documentos
- Control de sesiones

## 👥 Roles del Sistema

- **Administrador**: Gestión completa del sistema
- **Evaluador**: Revisión de postulaciones y documentación
- **Postulante**: Inscripción y seguimiento de concursos
- **Auditor**: Monitoreo y reportes del sistema

## 📄 Licencia

Este proyecto es propiedad del Ministerio Público de la Defensa de Mendoza.

## 🤝 Contacto

Para soporte o consultas, contactar al equipo de desarrollo del Ministerio Público de la Defensa de Mendoza.

## 📊 Flujos de Datos Principales

### 1. Proceso de Postulación
```mermaid
sequenceDiagram
    actor Postulante
    participant Frontend
    participant AuthController
    participant ContestController
    participant DocumentController
    participant DB
    
    Postulante->>Frontend: Inicia postulación
    Frontend->>AuthController: Valida sesión
    AuthController-->>Frontend: Sesión válida
    Frontend->>ContestController: Solicita datos del concurso
    ContestController-->>Frontend: Devuelve requisitos
    Postulante->>Frontend: Carga documentos
    Frontend->>DocumentController: Envía documentos
    DocumentController->>DB: Almacena documentos
    DB-->>DocumentController: Confirma almacenamiento
    DocumentController-->>Frontend: Confirma carga
    Frontend->>ContestController: Finaliza postulación
    ContestController->>DB: Registra postulación
    DB-->>ContestController: Confirma registro
    ContestController-->>Frontend: Confirma postulación
    Frontend-->>Postulante: Muestra confirmación
```

### 2. Proceso de Evaluación
```mermaid
sequenceDiagram
    actor Evaluador
    participant Frontend
    participant AuthController
    participant ContestController
    participant NotificationController
    participant DB
    
    Evaluador->>Frontend: Accede a evaluaciones
    Frontend->>AuthController: Valida permisos
    AuthController-->>Frontend: Confirma permisos
    Frontend->>ContestController: Solicita postulaciones
    ContestController->>DB: Consulta postulaciones
    DB-->>ContestController: Devuelve datos
    ContestController-->>Frontend: Lista postulaciones
    Evaluador->>Frontend: Evalúa postulación
    Frontend->>ContestController: Envía evaluación
    ContestController->>DB: Guarda evaluación
    ContestController->>NotificationController: Solicita notificación
    NotificationController->>DB: Registra notificación
    DB-->>NotificationController: Confirma registro
    NotificationController-->>Frontend: Confirma proceso
    Frontend-->>Evaluador: Muestra confirmación
```

## 📱 Ejemplos de Uso

### 1. Creación de un Nuevo Concurso
```typescript
// Ejemplo de payload para crear un concurso
const nuevoConcurso = {
  titulo: "Defensor/a Penal - Primera C.J.",
  descripcion: "Concurso para cargo de Defensor Penal",
  fechaInicio: "2024-03-28T00:00:00Z",
  fechaFin: "2024-04-28T23:59:59Z",
  requisitos: [
    "Título de Abogado",
    "5 años de experiencia",
    "Matrícula activa"
  ],
  documentosRequeridos: [
    {
      tipo: "TITULO_GRADO",
      descripcion: "Título de Abogado",
      obligatorio: true
    },
    {
      tipo: "CURRICULUM",
      descripcion: "Curriculum Vitae actualizado",
      obligatorio: true
    }
  ],
  cargo: {
    nombre: "Defensor Penal",
    categoria: "Primera",
    circunscripcion: "Primera"
  }
};
```

### 2. Gestión de Documentos
```java
@PostMapping("/documentos")
public ResponseEntity<DocumentoResponse> cargarDocumento(
    @RequestParam("archivo") MultipartFile archivo,
    @RequestParam("tipo") TipoDocumento tipo,
    @RequestParam("postulacionId") Long postulacionId
) {
    try {
        // Validación de formato y tamaño
        validarDocumento(archivo);
        
        // Procesamiento y almacenamiento
        String rutaArchivo = documentoService.almacenar(archivo);
        
        // Registro en base de datos
        Documento documento = documentoService.registrar(
            Documento.builder()
                .tipo(tipo)
                .ruta(rutaArchivo)
                .postulacionId(postulacionId)
                .estado(EstadoDocumento.PENDIENTE_REVISION)
                .build()
        );
        
        return ResponseEntity.ok(documentoMapper.toResponse(documento));
    } catch (Exception e) {
        log.error("Error al procesar documento", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }
}
```

## 🔄 Ciclo de Vida de un Concurso

```mermaid
stateDiagram-v2
    [*] --> Borrador
    Borrador --> Publicado: Aprobar y Publicar
    Publicado --> EnProceso: Iniciar Evaluación
    EnProceso --> Finalizado: Completar Evaluación
    EnProceso --> Cancelado: Cancelar
    Publicado --> Cancelado: Cancelar
    Finalizado --> [*]
    Cancelado --> [*]

    state Publicado {
        [*] --> RecibiendoPostulaciones
        RecibiendoPostulaciones --> PostulacionesCerradas: Fecha Límite
        PostulacionesCerradas --> [*]
    }

    state EnProceso {
        [*] --> EvaluacionDocumental
        EvaluacionDocumental --> EvaluacionTecnica: Aprobar Documentación
        EvaluacionTecnica --> EntrevistaPersonal: Aprobar Evaluación
        EntrevistaPersonal --> [*]: Completar Entrevistas
    }
```

## 🔐 Detalles de Seguridad

### Estructura de JWT
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "1234567890",
    "name": "Juan Pérez",
    "roles": ["ROLE_POSTULANTE"],
    "permisos": [
      "ver_concursos",
      "postular_concursos",
      "ver_documentos"
    ],
    "iat": 1516239022,
    "exp": 1516242622
  }
}
```

### Niveles de Acceso
```mermaid
graph TD
    A[Roles del Sistema] --> B[Administrador]
    A --> C[Evaluador]
    A --> D[Postulante]
    A --> E[Auditor]

    B --> B1[Gestión de Usuarios]
    B --> B2[Gestión de Concursos]
    B --> B3[Configuración Sistema]
    B --> B4[Reportes Completos]

    C --> C1[Ver Postulaciones]
    C --> C2[Evaluar Documentos]
    C --> C3[Gestionar Entrevistas]
    C --> C4[Emitir Resultados]

    D --> D1[Ver Concursos]
    D --> D2[Postular]
    D --> D3[Cargar Documentos]
    D --> D4[Ver Estado]

    E --> E1[Ver Auditoría]
    E --> E2[Generar Reportes]
    E --> E3[Verificar Procesos]
```

## 📊 Modelo de Base de Datos

```mermaid
erDiagram
    CONCURSO ||--o{ POSTULACION : tiene
    CONCURSO {
        int id PK
        string titulo
        string descripcion
        date fechaInicio
        date fechaFin
        string estado
        string cargo
        string requisitos
    }
    POSTULACION ||--o{ DOCUMENTO : contiene
    POSTULACION {
        int id PK
        int concursoId FK
        int usuarioId FK
        date fechaPostulacion
        string estado
    }
    DOCUMENTO {
        int id PK
        int postulacionId FK
        string tipo
        string ruta
        string estado
    }
    USUARIO ||--o{ POSTULACION : realiza
    USUARIO {
        int id PK
        string nombre
        string email
        string[] roles
        boolean activo
    }
    EVALUACION ||--o{ POSTULACION : evalua
    EVALUACION {
        int id PK
        int postulacionId FK
        int evaluadorId FK
        string tipo
        float puntaje
        string observaciones
    }
```

## 🔄 Flujos de Datos Detallados

### Autenticación y Autorización
```mermaid
sequenceDiagram
    participant Cliente
    participant AuthController
    participant JwtService
    participant UserService
    participant Database

    Cliente->>AuthController: POST /auth/login {credentials}
    AuthController->>UserService: validateCredentials()
    UserService->>Database: findByUsername()
    Database-->>UserService: UserEntity
    UserService->>UserService: validatePassword()
    UserService-->>AuthController: ValidationResult
    AuthController->>JwtService: generateToken()
    JwtService-->>AuthController: JWT
    AuthController-->>Cliente: {token, user}

    Note over Cliente,AuthController: Protocolo: HTTPS
    Note over AuthController,Database: Validación: BCrypt
    Note over JwtService: Algoritmo: HS256
```

### Gestión de Documentos
```mermaid
sequenceDiagram
    participant Cliente
    participant DocumentController
    participant StorageService
    participant ValidationService
    participant Database
    participant FileSystem

    Cliente->>DocumentController: POST /documents/upload
    Note over Cliente,DocumentController: Multipart/form-data
    DocumentController->>ValidationService: validateFile()
    ValidationService-->>DocumentController: ValidationResult
    DocumentController->>StorageService: storeFile()
    StorageService->>FileSystem: saveFile()
    FileSystem-->>StorageService: filePath
    StorageService->>Database: saveMetadata()
    Database-->>StorageService: documentId
    StorageService-->>DocumentController: DocumentDTO
    DocumentController-->>Cliente: UploadResponse

    Note over Cliente,DocumentController: Max File Size: 10MB
    Note over StorageService,FileSystem: Storage: Encrypted
```

## 🧩 Componentes Internos

### Frontend Modules
```mermaid
graph TD
    subgraph "Core Module"
        A[AuthService]
        B[HttpInterceptor]
        C[ErrorHandler]
        D[GuardService]
    end

    subgraph "Shared Module"
        E[Components]
        F[Directives]
        G[Pipes]
        H[Models]
    end

    subgraph "Feature Modules"
        subgraph "Contest Module"
            I[ContestList]
            J[ContestDetail]
            K[ContestForm]
            L[ContestService]
        end

        subgraph "Profile Module"
            M[UserProfile]
            N[DocumentUpload]
            O[ProfileService]
        end

        subgraph "Admin Module"
            P[UserManagement]
            Q[SystemConfig]
            R[AdminService]
        end
    end

    A --> I
    A --> M
    A --> P
    B --> A
    L --> B
    O --> B
    R --> B
```

### Backend Components
```mermaid
graph TD
    subgraph "Web Layer"
        A[Controllers]
        B[Filters]
        C[Interceptors]
        D[ExceptionHandlers]
    end

    subgraph "Service Layer"
        E[Services]
        F[DTOs]
        G[Mappers]
        H[Validators]
    end

    subgraph "Domain Layer"
        I[Entities]
        J[ValueObjects]
        K[Aggregates]
        L[DomainEvents]
    end

    subgraph "Infrastructure Layer"
        M[Repositories]
        N[ExternalServices]
        O[Security]
        P[Persistence]
    end

    A --> E
    E --> I
    I --> M
    M --> P
```

## 🔌 Interfaces y Protocolos

### API Endpoints
```yaml
auth:
  login:
    path: /api/auth/login
    method: POST
    content-type: application/json
    body: {username: string, password: string}
    response: {token: string, user: UserDTO}

contests:
  list:
    path: /api/contests
    method: GET
    headers: {Authorization: Bearer token}
    query-params: {
      status: string,
      page: number,
      size: number,
      sort: string
    }
    response: {
      content: Contest[],
      totalElements: number,
      totalPages: number
    }

documents:
  upload:
    path: /api/documents/upload
    method: POST
    headers: {
      Authorization: Bearer token,
      Content-Type: multipart/form-data
    }
    body: FormData
    response: {
      documentId: string,
      url: string,
      status: string
    }
```

### Protocolos de Comunicación
```mermaid
graph TD
    subgraph "Cliente-Servidor"
        A[Cliente] -->|HTTPS| B[API Gateway]
        B -->|HTTP/2| C[Microservicios]
    end

    subgraph "Seguridad"
        D[JWT] -->|HS256| E[Auth]
        F[SSL/TLS] -->|2048-bit| G[Encryption]
    end

    subgraph "Datos"
        H[REST] -->|JSON| I[API]
        J[WebSocket] -->|Events| K[Notifications]
    end

    subgraph "Storage"
        L[MySQL] -->|TCP/IP| M[Database]
        N[File System] -->|NFS| O[Documents]
    end
```

### Interfaces de Servicios
```typescript
interface IAuthService {
    login(credentials: LoginDTO): Promise<AuthResponse>;
    logout(): Promise<void>;
    refreshToken(): Promise<string>;
    validateToken(token: string): boolean;
}

interface IContestService {
    create(contest: ContestDTO): Promise<Contest>;
    update(id: string, contest: ContestDTO): Promise<Contest>;
    delete(id: string): Promise<void>;
    findById(id: string): Promise<Contest>;
    findAll(params: FilterParams): Promise<PagedResponse<Contest>>;
}

interface IDocumentService {
    upload(file: File, metadata: DocumentMetadata): Promise<Document>;
    download(id: string): Promise<Blob>;
    validate(document: Document): Promise<ValidationResult>;
    delete(id: string): Promise<void>;
}

interface INotificationService {
    send(notification: NotificationDTO): Promise<void>;
    subscribe(userId: string): Observable<Notification>;
    markAsRead(notificationId: string): Promise<void>;
    getUnreadCount(): Promise<number>;
}
``` 