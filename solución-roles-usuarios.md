# Plan para resolver el problema de usuarios sin roles

## Diagnóstico
Hemos identificado que los usuarios registrados no están recibiendo sus roles correctamente, lo que impide el acceso a rutas protegidas. Aunque la asignación de roles está implementada en el método `createUser` del `UserService`, estos roles no se están guardando correctamente en la base de datos.

## Causas Identificadas

1. **En `UserMapper.toEntity`**: Al mapear los roles de dominio a entidades, se busca en la base de datos cada rol, pero si hay problemas con la búsqueda (nombre de tabla incorrecto, consulta mal formada), la asignación fallará.

2. **Nombres de tabla incorrectos**: 
   - La entidad `RoleEntity` está configurada con nombre `roles`, pero la tabla podría tener otro nombre.
   - La relación muchos a muchos usa `user_roles` en la configuración JPA, pero podría ser diferente en la base de datos.

3. **Posible problema en el script de inicialización**: El archivo `data.sql` crea roles y asigna el rol `ROLE_ADMIN` al usuario administrador, pero podría haber problemas al ejecutarse.

## Solución

### 1. Ejecutar script para asignar roles a usuarios existentes
El script `assign_roles.sql` asigna el rol `ROLE_USER` a todos los usuarios que actualmente no tienen roles:

```sql
INSERT INTO user_roles (user_id, role_id)
SELECT user_entity.id, roles.id
FROM user_entity
CROSS JOIN roles
WHERE roles.name = 'ROLE_USER'
AND NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = user_entity.id
);
```

### 2. Verificar las definiciones de tablas
- Confirmar que el nombre de la tabla de roles en la base de datos es `roles` (como se define en `RoleEntity`)
- Confirmar que la tabla de relación se llama `user_roles` (como se define en `UserEntity`)

### 3. Reiniciar la aplicación
Después de aplicar estos cambios, reiniciar la aplicación para que las modificaciones surtan efecto.

## Verificación
1. Después de aplicar estos cambios, intentar iniciar sesión con un usuario existente.
2. Verificar en la consola del navegador si ahora se muestran roles en: `[AuthService] Roles del usuario: Array(...)`.
3. Intentar acceder a rutas protegidas por roles para confirmar que el acceso funciona correctamente.

## Solución a largo plazo
1. Mejorar el manejo de excepciones en el proceso de registro de usuarios.
2. Agregar tests automatizados que verifiquen la correcta asignación de roles.
3. Implementar logs adicionales para facilitar la detección de problemas similares en el futuro. 