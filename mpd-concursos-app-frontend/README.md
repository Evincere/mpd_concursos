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

### Comandos útiles

- `ng serve`: Inicia el servidor de desarrollo
- `ng build`: Compila la aplicación para producción
- `ng test`: Ejecuta las pruebas unitarias
- `ng lint`: Verifica el código según las reglas de linting

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
