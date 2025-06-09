# MPD Concursos App Frontend

Aplicación frontend para la gestión de concursos del Ministerio Público de la Defensa.

## Características

- **Panel Administrativo**: Gestión completa de usuarios, concursos e inscripciones
- **Gestión de Usuarios**: Creación, edición, cambio de estado y asignación de roles
- **Arquitectura Hexagonal**: Separación clara de capas (dominio, aplicación, infraestructura)
- **Componentes Personalizados**: Interfaz de usuario consistente y personalizada

## Estados de Usuario

La aplicación soporta los siguientes estados de usuario:

- **Activo**: Usuario completamente funcional
- **Inactivo**: Usuario que no está actualmente en uso pero puede ser reactivado
- **Bloqueado**: Usuario permanentemente bloqueado por razones de seguridad o administrativas
- **Bloqueado Temporalmente**: Usuario bloqueado por un período específico
- **Expirado**: Usuario cuya cuenta ha caducado

Los administradores pueden cambiar el estado de un usuario desde:
1. La vista de lista de usuarios (botón de acción rápida)
2. La vista de detalle de usuario (botón junto al estado)

## Desarrollo

### Requisitos previos

- Node.js 18.x o superior
- Angular CLI 18.x

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/mpd-concursos-app-frontend.git

# Instalar dependencias
cd mpd-concursos-app-frontend
npm install

# Iniciar servidor de desarrollo
ng serve
```

### Comandos Disponibles

```bash
# Desarrollo
npm start                 # Servidor de desarrollo
npm run start:dev        # Servidor con proxy configurado
npm run start:clean      # Limpiar cache y iniciar

# Build
npm run build            # Build de producción
npm run build:check      # Verificar build sin generar archivos
npm run watch            # Build en modo watch

# Testing
npm test                 # Ejecutar tests
npm run test:quick       # Tests rápidos sin coverage
npm run test:coverage    # Tests con cobertura

# Linting y Validación
npm run lint             # Verificar código
npm run lint:fix         # Corregir automáticamente
npm run validate         # Validación personalizada de código
npm run quality-check    # Verificación completa de calidad

# Git Hooks
npm run pre-commit       # Hook de pre-commit manual
node scripts/setup-hooks.js  # Configurar hooks automáticos

# Aplicación Web
# La aplicación está optimizada para ejecutarse como webapp
# Se eliminaron las dependencias de Electron para simplificar el proyecto
```

### 🔧 Herramientas de Calidad

#### Validación de Código
El proyecto incluye herramientas personalizadas de validación:

```bash
# Ejecutar validación completa
npm run validate

# Verificar calidad antes de commit
npm run quality-check
```

#### Git Hooks Automáticos
Para configurar hooks automáticos que validen el código en cada commit:

```bash
node scripts/setup-hooks.js
```

Esto configurará:
- **pre-commit**: Valida código antes de cada commit
- **pre-push**: Ejecuta tests completos antes de push
- **commit-msg**: Valida formato de mensajes de commit

#### Estándares de Codificación
Consulta `CODING_STANDARDS.md` para:
- Principios SOLID y Clean Code
- Estándares TypeScript y Angular
- Patrones de diseño recomendados
- Prevención de errores comunes

## Arquitectura

El proyecto sigue una arquitectura hexagonal con las siguientes capas:

- **Domain**: Modelos y lógica de negocio
- **Application**: Casos de uso y servicios de aplicación
- **Infrastructure**: Implementaciones concretas (repositorios, adaptadores)
- **UI**: Componentes de interfaz de usuario

## Contribución

1. Crea un fork del repositorio
2. Crea una rama para tu funcionalidad (`git checkout -b feature/nueva-funcionalidad`)
3. Realiza tus cambios y haz commit (`git commit -am 'Agrega nueva funcionalidad'`)
4. Sube los cambios a tu fork (`git push origin feature/nueva-funcionalidad`)
5. Crea un Pull Request
