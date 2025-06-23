# Plan de Sprints para la Plena Operatividad del Módulo de Usuarios (Administrador)

Este documento detalla los sprints, historias de usuario (HU), tareas y subtareas necesarias para alcanzar la plena operatividad del módulo de usuarios (funcionalidad de administrador), cubriendo tanto frontend como backend, según la auditoría realizada.

---

## Sprint 1: Integración Frontend-Backend y Endpoints Básicos

### HU1: Como administrador, quiero gestionar usuarios reales desde el panel para operar sobre la base de datos real.

#### Tareas:
- [ ] Conectar el frontend con los endpoints reales del backend en `admin-users.service.ts`.
  - [ ] Descomentar y adaptar métodos HTTP.
  - [ ] Probar integración con endpoints existentes (`GET`, `PUT`, `DELETE`).
- [ ] Ajustar modelos y DTOs para compatibilidad entre frontend y backend.
- [ ] Validar feedback de errores y mensajes en la UI.

### HU2: Como administrador, quiero poder crear usuarios desde el panel admin.

#### Tareas:
- [ ] Implementar endpoint `POST /api/users` en el backend (`UserController`).
  - [ ] Reutilizar lógica de `UserService`.
  - [ ] Proteger con rol admin.
- [ ] Adaptar el frontend para consumir el nuevo endpoint.
  - [ ] Ajustar formularios y validaciones.
  - [ ] Probar creación de usuario desde la UI.

---

## Sprint 2: Gestión Avanzada de Roles, Estado y Validaciones

### HU3: Como administrador, quiero poder cambiar roles y estado de los usuarios desde el panel admin.

#### Tareas:
- [ ] Implementar endpoint `PUT /api/users/{userId}/roles` en backend.
- [ ] Implementar endpoint `PUT /api/users/{userId}/status` en backend.
- [ ] Adaptar el frontend para consumir estos endpoints.
  - [ ] Añadir controles en la UI para roles y estado.
  - [ ] Probar flujos completos.

### HU4: Como administrador, quiero validar en tiempo real la unicidad de email, username y DNI al crear/editar usuarios.

#### Tareas:
- [ ] Implementar endpoints rápidos:
  - [ ] `GET /api/users/check-username?value=...`
  - [ ] `GET /api/users/check-email?value=...`
  - [ ] `GET /api/users/check-dni?value=...`
- [ ] Adaptar el frontend para consumir estos endpoints en formularios.
  - [ ] Mostrar mensajes claros de validación.

---

## Sprint 3: Auditoría, Seguridad y Experiencia de Usuario

### HU5: Como administrador, quiero consultar logs/auditoría de acciones de usuario desde el panel admin.

#### Tareas:
- [ ] Implementar endpoint `GET /api/users/{userId}/logs` en backend.
- [ ] Crear vista/componente en frontend para mostrar logs.

### HU6: Como administrador, quiero que todas las rutas y acciones críticas estén protegidas y sólo accesibles por administradores.

#### Tareas:
- [ ] Auditar guards y protección de rutas en frontend.
- [ ] Revisar anotaciones de seguridad en backend.
- [ ] Probar acceso con distintos roles.

### HU7: Como administrador, quiero recibir mensajes claros y útiles ante errores o validaciones fallidas.

#### Tareas:
- [ ] Mejorar feedback de errores en frontend.
- [ ] Revisar y mejorar mensajes de error en backend.

---

## Sprint 4: Pruebas, Documentación y Capacitación

### HU8: Como desarrollador, quiero asegurar la calidad y cobertura de pruebas en ambos lados.

#### Tareas:
- [ ] Revisar y ampliar tests unitarios y de integración en backend.
- [ ] Revisar y ampliar tests en frontend.
- [ ] Probar casos de error, validaciones y flujos completos.

### HU9: Como equipo, quiero que los cambios estén documentados y los administradores capacitados.

#### Tareas:
- [ ] Documentar endpoints, flujos y cambios realizados.
- [ ] Crear manual de usuario administrador actualizado.
- [ ] Realizar capacitación interna si es necesario.

---

# Notas Finales
- Cada sprint puede ajustarse según la velocidad y recursos del equipo.
- Se recomienda revisión continua con usuarios administradores para feedback temprano.
- El cumplimiento de este plan permitirá alcanzar la plena operatividad y robustez del módulo de usuarios.
