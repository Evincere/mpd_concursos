# 📋 Proyecto MPD Concursos

## 🎯 Propósito del Proyecto

Sistema de gestión de concursos para el Ministerio Público de la Defensa de Mendoza. Esta plataforma permite la gestión integral del proceso de concursos públicos, desde la publicación hasta la evaluación y selección de candidatos.

## 🏗️ Arquitectura

### Arquitectura General
El proyecto sigue una arquitectura cliente-servidor con:
- **Frontend**: Aplicación Angular con Material Design
- **Backend**: API RESTful desarrollada con Spring Boot
- **Base de datos**: MySQL

### Arquitectura del Backend
El backend está estructurado siguiendo los principios de **Arquitectura Hexagonal** (también conocida como Ports and Adapters) y **Domain-Driven Design (DDD)**:

1. **Capa de Dominio**:
   - Contiene las entidades principales (Contest, Inscription, User, etc.)
   - Modelos de valor (ValueObjects)
   - Enumeraciones y reglas de negocio
   - Puertos (interfaces) que definen las operaciones

2. **Capa de Aplicación**:
   - Casos de uso (UseCases)
   - Servicios de aplicación
   - DTOs para transferencia de datos
   - Implementación de la lógica de negocio

3. **Capa de Infraestructura**:
   - Adaptadores para persistencia (JPA)
   - Controladores REST
   - Configuración de seguridad
   - Implementaciones concretas de los puertos

### Arquitectura del Frontend
El frontend sigue una arquitectura modular basada en Angular:

1. **Core Module**:
   - Servicios principales
   - Modelos
   - Interceptores HTTP
   - Configuración global

2. **Shared Module**:
   - Componentes reutilizables
   - Pipes
   - Directivas
   - Interfaces compartidas

3. **Feature Modules**:
   - Módulos funcionales (auth, concursos, dashboard, etc.)
   - Componentes específicos de cada funcionalidad
   - Rutas y navegación

## 🛠️ Stack Tecnológico

### Backend
- **Lenguaje**: Java 17
- **Framework**: Spring Boot
- **Persistencia**: Spring Data JPA
- **Base de datos**: MySQL 8
- **Seguridad**: JWT (JSON Web Tokens)
- **Gestión de dependencias**: Maven
- **Documentación API**: Swagger/OpenAPI

### Frontend
- **Framework**: Angular 18
- **UI Components**: Angular Material
- **Estilos**: SCSS
- **Gestión de estado**: RxJS (Observables, BehaviorSubject)
- **Iconos**: Font Awesome
- **Versión de escritorio**: Electron

### DevOps
- **Contenedores**: Docker y Docker Compose
- **Control de versiones**: Git

## 🧩 Patrones de Diseño Implementados

### Backend
1. **Repository Pattern**: Abstracción de acceso a datos
2. **Dependency Injection**: Inyección de dependencias con Spring
3. **DTO Pattern**: Objetos de transferencia de datos
4. **Adapter Pattern**: Adaptadores para persistencia y servicios externos
5. **Command Pattern**: Comandos para operaciones específicas
6. **Factory Pattern**: Creación de objetos complejos
7. **Builder Pattern**: Construcción de objetos complejos (usando Lombok)

### Frontend
1. **Service Pattern**: Servicios para lógica de negocio y comunicación con API
2. **Observable Pattern**: Uso de RxJS para manejo de estado y eventos
3. **Presentational/Container Components**: Separación de componentes de presentación y lógica
4. **Interceptor Pattern**: Interceptores HTTP para manejo de tokens y errores
5. **Guard Pattern**: Protección de rutas basada en autenticación y roles

## 📦 Módulos Principales

### Concursos
- Gestión de concursos públicos
- Filtrado y búsqueda
- Estados del concurso (Borrador, Publicado, En Proceso, Finalizado, Cancelado)

### Inscripciones
- Proceso de inscripción en pasos
- Gestión de documentación
- Estados de inscripción (Pendiente, Activa, Cancelada, Rechazada)

### Autenticación y Usuarios
- Registro y login
- Gestión de perfiles
- Roles y permisos

### Exámenes
- Creación y gestión de exámenes
- Proceso de evaluación
- Calificación y resultados

### Documentos
- Carga y validación de documentos
- Almacenamiento seguro
- Verificación de requisitos

## 🔄 Flujo de Datos Principal

1. **Publicación de Concursos**:
   - Administrador crea y publica concursos
   - Se definen requisitos, fechas y documentación necesaria

2. **Inscripción de Postulantes**:
   - Usuario se registra/inicia sesión
   - Selecciona concurso y comienza proceso de inscripción
   - Completa pasos: aceptación de términos, selección de circunscripciones, confirmación de datos
   - Carga documentación requerida

3. **Evaluación**:
   - Evaluadores revisan postulaciones y documentación
   - Administran exámenes y entrevistas
   - Califican y registran resultados

4. **Notificaciones**:
   - Sistema envía notificaciones automáticas
   - Usuarios reciben actualizaciones sobre estado de postulaciones

## 🔐 Seguridad

- **Autenticación**: JWT (JSON Web Tokens)
- **Autorización**: Basada en roles (ROLE_USER, ROLE_ADMIN, ROLE_EVALUATOR)
- **Protección de rutas**: Guards en frontend, anotaciones @PreAuthorize en backend
- **Validación de datos**: En ambos lados (cliente y servidor)

## 📊 Estructura de Base de Datos

Las principales entidades en la base de datos son:
- **contests**: Concursos disponibles
- **users**: Usuarios del sistema
- **inscriptions**: Inscripciones a concursos
- **documents**: Documentos cargados
- **examinations**: Exámenes asociados a concursos
- **education**: Información educativa de usuarios
- **experience**: Experiencia laboral de usuarios

## 🔍 Observaciones y Patrones de Implementación

1. **Manejo de Estado**:
   - El frontend utiliza BehaviorSubject de RxJS para mantener estado local
   - Servicios como InscriptionService mantienen colecciones observables

2. **Manejo de Errores**:
   - Interceptores HTTP para capturar y procesar errores
   - Manejo centralizado de errores en servicios

3. **Validación**:
   - Validación en cliente y servidor
   - Mensajes de error descriptivos

4. **Logging**:
   - Uso extensivo de logging para depuración
   - Niveles de log diferenciados

5. **Transacciones**:
   - Uso de @Transactional en servicios críticos

## 📝 Conclusión

El proyecto MPD Concursos es una aplicación robusta que sigue buenas prácticas de arquitectura y diseño. Utiliza una arquitectura hexagonal en el backend que facilita la separación de responsabilidades y el testing, mientras que el frontend implementa una estructura modular con Angular que promueve la reutilización y mantenibilidad del código.

La aplicación está diseñada para gestionar todo el ciclo de vida de los concursos públicos, desde su creación hasta la selección final de candidatos, con un enfoque en la seguridad, trazabilidad y experiencia de usuario.
