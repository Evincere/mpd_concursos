# Gestión de Migraciones de Base de Datos

## Resumen Ejecutivo

La gestión automática del esquema de base de datos ha sido **CONFIGURADA DE FORMA SEGURA** por entorno:

1. ✅ **Producción**: `ddl-auto=validate` - Solo valida, no modifica
2. ✅ **Desarrollo**: `ddl-auto=update` - Permite cambios controlados
3. ✅ **Testing**: `ddl-auto=create-drop` - Recrea para cada test
4. ✅ **Por defecto**: `ddl-auto=validate` - Configuración segura

## Configuración por Entorno

### Producción (`application-prod.properties`)

```properties
# SEGURO: Solo validar esquema, no modificar
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.generate-ddl=false
```

**Características:**
- ✅ **Seguro**: No modifica el esquema existente
- ✅ **Validación**: Verifica que entidades coincidan con BD
- ✅ **Falla rápido**: Error si hay inconsistencias
- ✅ **Sin riesgo**: Imposible pérdida de datos

### Desarrollo (`application-dev.properties`)

```properties
# DESARROLLO: Permitir cambios controlados
spring.jpa.hibernate.ddl-auto=update
spring.jpa.generate-ddl=true
```

**Características:**
- ⚠️ **Cuidado**: Modifica esquema automáticamente
- ✅ **Conveniente**: Facilita desarrollo rápido
- ⚠️ **Riesgo controlado**: Solo en desarrollo local
- ✅ **Productividad**: Sincroniza entidades con BD

### Testing (`application-test.properties`)

```properties
# TESTING: Recrear para cada test
spring.jpa.hibernate.ddl-auto=create-drop
spring.jpa.generate-ddl=true
```

**Características:**
- ✅ **Limpio**: BD fresca para cada test
- ✅ **Aislamiento**: Tests independientes
- ✅ **Rápido**: No necesita migraciones
- ✅ **Consistente**: Esquema siempre actualizado

### Por Defecto (`application.properties`)

```properties
# SEGURO: Configuración conservadora por defecto
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.generate-ddl=false
```

## Riesgos de Configuraciones Peligrosas

### ❌ `ddl-auto=create`
```properties
# NUNCA USAR EN PRODUCCIÓN
spring.jpa.hibernate.ddl-auto=create
```
- **Riesgo**: Elimina TODOS los datos existentes
- **Cuándo**: Solo para desarrollo inicial
- **Alternativa**: `create-drop` en testing

### ❌ `ddl-auto=create-drop` en Producción
```properties
# NUNCA USAR EN PRODUCCIÓN
spring.jpa.hibernate.ddl-auto=create-drop
```
- **Riesgo**: Elimina datos al cerrar aplicación
- **Cuándo**: Solo para testing
- **Alternativa**: `validate` en producción

### ⚠️ `ddl-auto=update` en Producción
```properties
# EVITAR EN PRODUCCIÓN
spring.jpa.hibernate.ddl-auto=update
```
- **Riesgo**: Cambios automáticos no controlados
- **Problemas**: Pérdida de datos, inconsistencias
- **Alternativa**: Migraciones explícitas

## Mejores Prácticas

### 1. Migraciones Explícitas en Producción

**Usar Flyway o Liquibase:**
```sql
-- V1__Create_user_table.sql
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Ventajas:**
- ✅ Control total sobre cambios
- ✅ Versionado de esquema
- ✅ Rollback posible
- ✅ Auditoría completa

### 2. Validación Antes de Despliegue

```bash
# Validar esquema antes de desplegar
mvn spring-boot:run -Dspring.profiles.active=prod -Dspring.jpa.hibernate.ddl-auto=validate
```

### 3. Backups Antes de Cambios

```bash
# Backup antes de migración
mysqldump -u root -p mpd_concursos > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 4. Testing de Migraciones

```java
@Test
@Sql("/test-migration.sql")
public void testMigration() {
    // Verificar que la migración funciona correctamente
}
```

## Monitoreo y Validación

### Validación Automática

El sistema incluye `DatabaseConfigurationValidationService` que:

```java
@PostConstruct
public void validateDatabaseConfiguration() {
    // Valida configuración por entorno
    // Detecta configuraciones peligrosas
    // Registra advertencias y errores
}
```

### Endpoints de Diagnóstico

Disponibles en desarrollo (`/api/security/diagnostic/`):

- `GET /database-config` - Reporte de configuración
- Validación en tiempo real
- Detección de riesgos

### Logs de Seguridad

```log
✅ DDL Auto configurado correctamente para producción: validate
❌ PELIGRO: DDL Auto en producción debe ser 'validate' o 'none'
⚠️  DDL Auto en desarrollo: update (permitido pero con precaución)
```

## Procedimiento de Cambio de Esquema

### Desarrollo
1. Modificar entidades JPA
2. Reiniciar aplicación (auto-update)
3. Verificar cambios en BD
4. Crear migración explícita

### Producción
1. Crear script de migración
2. Probar en entorno de staging
3. Hacer backup de producción
4. Ejecutar migración
5. Validar resultado

## Configuración de Flyway (Recomendado)

```properties
# application-prod.properties
spring.flyway.enabled=true
spring.flyway.locations=classpath:db/migration
spring.flyway.baseline-on-migrate=true
spring.jpa.hibernate.ddl-auto=validate
```

### Estructura de Migraciones

```
src/main/resources/db/migration/
├── V1__Initial_schema.sql
├── V2__Add_user_roles.sql
├── V3__Add_contest_tables.sql
└── V4__Add_document_tables.sql
```

## Troubleshooting

### Error: "Schema validation failed"

```log
Schema-validation: missing table [users]
```

**Solución:**
1. Verificar que todas las migraciones se ejecutaron
2. Comparar esquema actual con entidades
3. Crear migración para diferencias

### Error: "Table already exists"

```log
Table 'users' already exists
```

**Solución:**
1. Cambiar a `ddl-auto=validate`
2. Usar migraciones incrementales
3. Verificar estado de Flyway

## Referencias

- [Hibernate DDL Auto](https://docs.jboss.org/hibernate/orm/current/userguide/html_single/Hibernate_User_Guide.html#configurations-hbmddl)
- [Spring Boot Database Initialization](https://docs.spring.io/spring-boot/docs/current/reference/html/howto.html#howto.data-initialization)
- [Flyway Documentation](https://flywaydb.org/documentation/)
- [Liquibase Documentation](https://docs.liquibase.com/)

## Contacto

Para preguntas sobre migraciones:
- Equipo de Desarrollo MPD
- Documentación: `DATABASE_MIGRATIONS.md`
- Validación: `DatabaseConfigurationValidationService`
