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