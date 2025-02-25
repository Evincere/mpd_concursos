# Instrucciones para solucionar el problema de usuarios sin roles

## Pasos para implementar la solución:

### 1. Verificar y ejecutar el script SQL

1. Abre MySQL Workbench y conéctate a tu base de datos.
2. Abre el archivo `assign_roles.sql` que hemos creado.
3. Ejecuta el script para asignar el rol `ROLE_USER` a todos los usuarios que no tienen roles.
4. Verifica el resultado de la consulta que muestra cuántos usuarios se actualizaron.

### 2. Verificar la estructura de las tablas en la base de datos

1. Ejecuta la siguiente consulta para verificar el nombre de las tablas:
   ```sql
   SHOW TABLES;
   ```

2. Asegúrate de que existan las tablas `roles` y `user_roles`.

3. Verifica la estructura de la tabla `roles`:
   ```sql
   DESCRIBE roles;
   ```
   Confirma que tiene las columnas `id` y `name`.

4. Verifica la estructura de la tabla `user_roles`:
   ```sql
   DESCRIBE user_roles;
   ```
   Confirma que tiene las columnas `user_id` y `role_id`.

5. Verifica que los roles existen en la tabla `roles`:
   ```sql
   SELECT * FROM roles;
   ```
   Debe haber al menos `ROLE_USER` y `ROLE_ADMIN`.

### 3. Reiniciar la aplicación

1. Detén la aplicación si está en ejecución.
2. Ejecuta el servidor backend:
   ```bash
   cd concurso-backend
   mvn spring-boot:run
   ```

3. En otra terminal, ejecuta el frontend:
   ```bash
   cd mpd-concursos-app-frontend
   ng serve
   ```

### 4. Probar la solución

1. Abre el navegador y ve a `http://localhost:4200`.
2. Inicia sesión con las credenciales de un usuario existente.
3. Abre la consola del navegador (F12) y verifica los logs:
   - Busca el mensaje `[AuthService] Roles del usuario: Array(...)` 
   - Debe mostrar al menos un rol para el usuario.

4. Intenta acceder a una ruta protegida por roles (por ejemplo, si existe una ruta `/admin` o `/dashboard`).

### 5. Si los problemas persisten

Si después de seguir estos pasos los usuarios siguen sin tener roles, sigue estos pasos adicionales:

1. Verifica los logs del servidor para buscar errores durante el registro de usuarios.
2. Registra un nuevo usuario y verifica inmediatamente si se le asigna un rol.
3. Ejecuta manualmente la siguiente consulta para verificar la relación entre usuarios y roles:
   ```sql
   SELECT u.username, r.name 
   FROM user_entity u 
   JOIN user_roles ur ON u.id = ur.user_id
   JOIN roles r ON r.id = ur.role_id;
   ```
   
4. Si sigues teniendo problemas, considera borrar y recrear la base de datos:
   ```sql
   DROP DATABASE mpd_concursos;
   CREATE DATABASE mpd_concursos;
   ```
   Y luego reinicia la aplicación para que se ejecuten los scripts de inicialización.

### 6. Para el futuro

Considera actualizar los siguientes archivos para mejorar el manejo de errores:

1. `UserMapper.java`: Mejorar el manejo de excepciones al buscar roles.
2. `UserService.java`: Agregar logs adicionales durante la creación de usuarios.
3. `data.sql`: Verificar que los scripts de inicialización se ejecutan correctamente. 