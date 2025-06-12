# 📊 Estado del Esquema de Base de Datos - MPD Concursos

## 📋 Información General

- **Proyecto**: Sistema de Concursos MPD
- **Base de Datos**: MySQL 8.0
- **Esquema**: `mpd_concursos`
- **Última Actualización**: 11 de Junio de 2025
- **Estado**: ✅ **PRODUCCIÓN READY**

---

## 🎯 Resumen Ejecutivo

### Estado Actual
- ✅ **Schema.sql**: Completo y actualizado con todas las modificaciones
- ✅ **Data.sql**: Datos de prueba actualizados
- ⚠️ **Migraciones**: Algunas requieren ejecución manual en producción
- ✅ **Configuración**: Lista para despliegue automático

### Recomendación para Producción
**USAR BASE DE DATOS NUEVA** - El schema.sql actual incluye todas las modificaciones necesarias.

---

## 🗂️ Estructura de Tablas Principales

### 👥 Gestión de Usuarios
```sql
- user_entity          # Usuarios del sistema (UUID)
- roles                # Roles del sistema (UUID)  
- user_roles           # Relación usuarios-roles (Many-to-Many)
```

### 🏆 Gestión de Concursos
```sql
- contests             # Concursos (BIGINT ID)
- contest_dates        # Fechas importantes de concursos
- contest_requirements # Requisitos de concursos
- contest_documents    # Documentos de concursos
```

### 📝 Sistema de Inscripciones
```sql
- inscriptions                    # Inscripciones principales
- inscription_sessions            # Sesiones de inscripción
- inscription_circunscripciones   # Circunscripciones seleccionadas
```

### 📄 Gestión de Documentos
```sql
- document_types       # Tipos de documentos
- documents           # Documentos subidos por usuarios
```

### 🎓 Información Académica y Laboral
```sql
- education           # Formación académica
- experience          # Experiencia laboral (nueva tabla UUID)
- experiencia         # Experiencia laboral (tabla legacy BIGINT)
```

### 📝 Sistema de Exámenes
```sql
- examinations        # Exámenes
- examination_sessions # Sesiones de examen
- questions           # Preguntas
- options            # Opciones de respuesta
- answers            # Respuestas de usuarios
```

### 🔔 Sistema de Notificaciones
```sql
- notifications       # Notificaciones del sistema
```

---

## 🔄 Modificaciones Realizadas

### ✅ Cambios Incluidos en Schema.sql

#### 1. **Tabla user_entity**
```sql
-- AGREGADO: Columna status para gestión de estados de usuario
status ENUM('ACTIVE', 'INACTIVE', 'BLOCKED') NOT NULL DEFAULT 'ACTIVE'
```

#### 2. **Tabla inscriptions**
```sql
-- ESTANDARIZADO: Estados en inglés únicamente
status ENUM('ACTIVE', 'PENDING', 'COMPLETED_WITH_DOCS', 'COMPLETED_PENDING_DOCS', 
           'FROZEN', 'APPROVED', 'REJECTED', 'CANCELLED')

-- AGREGADO: Campos para proceso de inscripción
currentStep ENUM('INITIAL', 'TERMS_ACCEPTANCE', 'LOCATION_SELECTION', 
                'DOCUMENTATION', 'DATA_CONFIRMATION', 'COMPLETED')
acceptedTerms BOOLEAN DEFAULT FALSE
confirmedPersonalData BOOLEAN DEFAULT FALSE
documentosCompletos BOOLEAN DEFAULT FALSE
centroDeVida VARCHAR(500)
termsAcceptanceDate DATETIME(6)
dataConfirmationDate DATETIME(6)
documentationDeadline DATETIME(6)
frozenDate DATETIME(6)
```

#### 3. **Tabla contests**
```sql
-- ACTUALIZADO: Estados completos para gestión de concursos
status ENUM('DRAFT', 'PUBLISHED', 'PAUSED', 'CANCELLED', 'FINISHED', 'ARCHIVED', 
           'INSCRIPTION_PENDING', 'INSCRIPTION_OPEN', 'INSCRIPTION_CLOSED', 
           'IN_EVALUATION', 'RESULTS_PUBLISHED')
```

#### 4. **Nuevas Tablas Agregadas**
```sql
- user_roles                    # Relación Many-to-Many usuarios-roles
- notifications                 # Sistema de notificaciones completo
- contest_documents            # Documentos asociados a concursos
- inscription_sessions         # Sesiones de inscripción
- inscription_circunscripciones # Circunscripciones seleccionadas
- document_types               # Tipos de documentos estandarizados
- documents                    # Documentos subidos por usuarios
- education                    # Formación académica completa
- experience                   # Nueva tabla de experiencia con UUID
```

### 🔧 Configuración de la Aplicación

#### application.properties
```properties
# CONFIGURACIÓN PARA RECREACIÓN AUTOMÁTICA
spring.jpa.hibernate.ddl-auto=none
spring.sql.init.mode=always
spring.sql.init.schema-locations=classpath:schema.sql
spring.sql.init.data-locations=classpath:data.sql
spring.jpa.defer-datasource-initialization=true

# FLYWAY DESHABILITADO (usando schema.sql directo)
spring.flyway.enabled=false
```

---

## 📁 Scripts de Migración

### 🟢 Scripts Seguros para Producción

#### 1. **V3__migrate_legacy_inscription_states.sql**
```sql
-- PROPÓSITO: Migrar estados legacy a estados estándar en inglés
-- CUÁNDO EJECUTAR: Solo si hay datos existentes con estados en español
-- SEGURIDAD: ✅ Seguro - Solo actualiza datos existentes
```

#### 2. **V4__update_inscription_status_enum.sql**
```sql
-- PROPÓSITO: Limpiar ENUM de estados legacy
-- CUÁNDO EJECUTAR: Después de V3, solo si hay datos existentes
-- SEGURIDAD: ✅ Seguro - Limpia definición de ENUM
```

#### 3. **V3__add_contest_documents_data.sql**
```sql
-- PROPÓSITO: Insertar datos iniciales de documentos de concursos
-- CUÁNDO EJECUTAR: Siempre en producción
-- SEGURIDAD: ✅ Seguro - Solo inserta datos
```

### 🔴 Scripts NO Ejecutar en Producción

#### ❌ **V2__add_inscription_steps.sql**
```sql
-- PROBLEMA: Intenta agregar columnas que YA ESTÁN en schema.sql
-- RESULTADO: Error de columnas duplicadas
-- ACCIÓN: NO EJECUTAR
```

#### ❌ **V3__add_user_status_column.sql**
```sql
-- PROBLEMA: Intenta agregar columna status que YA ESTÁ en schema.sql
-- RESULTADO: Error de columna duplicada
-- ACCIÓN: NO EJECUTAR
```

#### ❌ **V3__migrate_contests_to_uuid.sql**
```sql
-- PROBLEMA: Migra contests de BIGINT a UUID, pero schema.sql usa BIGINT
-- RESULTADO: Inconsistencia en tipos de datos
-- ACCIÓN: NO EJECUTAR
```

### 🟡 Scripts de Emergencia

#### **create_missing_tables.sql**
```sql
-- PROPÓSITO: Crear tablas faltantes si schema.sql falla
-- CUÁNDO USAR: Solo si hay errores en creación automática
-- UBICACIÓN: concurso-backend/create_missing_tables.sql
```

#### **create_all_missing_tables.sql**
```sql
-- PROPÓSITO: Recrear todas las tablas desde cero
-- CUÁNDO USAR: Solo en caso de emergencia total
-- UBICACIÓN: concurso-backend/create_all_missing_tables.sql
```

---

## 🚀 Procedimiento de Despliegue

### Opción 1: Base de Datos Nueva (Recomendado)

```bash
# 1. La aplicación creará automáticamente el esquema
# 2. schema.sql se ejecuta automáticamente
# 3. data.sql se ejecuta automáticamente
# 4. ¡Listo para usar!
```

### Opción 2: Base de Datos Existente

```sql
-- 1. Ejecutar solo si hay datos existentes:
SOURCE V3__migrate_legacy_inscription_states.sql;
SOURCE V4__update_inscription_status_enum.sql;

-- 2. Ejecutar siempre:
SOURCE V3__add_contest_documents_data.sql;
```

---

## 🔍 Scripts de Verificación

### Verificación Completa del Sistema
```bash
# Verificar todas las tablas críticas
mysql -u root -p mpd_concursos < system_status_check.sql

# Verificar tablas específicas
mysql -u root -p mpd_concursos < verify_all_tables.sql

# Verificar tipos de documentos
mysql -u root -p mpd_concursos < verify_document_types.sql
```

### Verificación Rápida
```sql
-- Contar tablas totales
SELECT COUNT(*) as total_tablas 
FROM information_schema.tables 
WHERE table_schema = 'mpd_concursos';

-- Verificar tablas críticas
SHOW TABLES LIKE '%user%';
SHOW TABLES LIKE '%contest%';
SHOW TABLES LIKE '%inscription%';
```

---

## ⚠️ Notas Importantes

### Configuración de Producción
1. **Cambiar credenciales de BD** en variables de entorno
2. **Configurar JWT_SECRET** para producción
3. **Ajustar configuración de CORS** para dominio de producción
4. **Configurar logs** para nivel INFO o WARN

### Seguridad
1. **No incluir schema.sql/data.sql en JAR de producción**
2. **Usar Flyway o Liquibase** para migraciones futuras
3. **Configurar spring.jpa.hibernate.ddl-auto=validate** en producción

### Monitoreo
1. **Verificar logs de aplicación** durante el primer arranque
2. **Monitorear creación de tablas** en logs de MySQL
3. **Validar datos de prueba** se insertaron correctamente

---

## 📊 Datos de Prueba Incluidos

### Usuarios de Prueba (data.sql)
```sql
-- Administrador
Username: admin
Password: admin123
Email: admin@mpd.gov.ar
Roles: ROLE_USER, ROLE_ADMIN

-- Usuarios de prueba
Username: usuario1, usuario2, semper
Password: admin123 (para todos)
Roles: ROLE_USER (semper también tiene ROLE_ADMIN)
```

### Concursos de Prueba
- **10 concursos** con diferentes estados para testing completo
- **Estados incluidos**: INSCRIPTION_OPEN, PUBLISHED, INSCRIPTION_PENDING, INSCRIPTION_CLOSED, IN_EVALUATION, RESULTS_PUBLISHED, FINISHED, DRAFT, PAUSED
- **Fechas realistas** para simular cronogramas reales
- **Diferentes categorías**: JURIDICO, TECNICO, ADMINISTRATIVO

### Tipos de Documentos
```sql
- DNI (Frente y Dorso) - REQUERIDO
- Título Universitario - REQUERIDO
- Certificado de Buena Conducta - REQUERIDO
- Constancia de CUIL - REQUERIDO
- Certificado de Antecedentes Penales - REQUERIDO
- Certificado de Ejercicio Profesional - REQUERIDO
- Certificado de Sanciones Disciplinarias - REQUERIDO
- Certificado Ley Micaela - OPCIONAL
- Curriculum Vitae - OPCIONAL
```

---

## 🔧 Configuraciones Específicas

### Variables de Entorno para Producción
```bash
# Base de Datos
DB_HOST=localhost
DB_PORT=3306
DB_NAME=mpd_concursos
DB_USERNAME=root
DB_PASSWORD=your_secure_password

# Seguridad
JWT_SECRET=your_256_bit_secret_key_for_production
JWT_EXPIRATION=86400000

# Logs
LOG_LEVEL=INFO
SECURITY_LOG_LEVEL=WARN
SQL_LOG_LEVEL=WARN
```

### Configuración Docker
```yaml
# docker-compose.yml debe incluir:
- Volúmenes persistentes para MySQL
- Variables de entorno seguras
- Configuración de red interna
- Health checks para todos los servicios
```

---

## 🚨 Troubleshooting

### Problemas Comunes

#### 1. **Error: Table already exists**
```sql
-- Solución: Limpiar base de datos
DROP DATABASE mpd_concursos;
CREATE DATABASE mpd_concursos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### 2. **Error: Foreign key constraint fails**
```sql
-- Solución: Verificar orden de creación de tablas
-- El schema.sql ya tiene el orden correcto
```

#### 3. **Error: Column already exists**
```sql
-- Causa: Intentar ejecutar migraciones V2 o V3__add_user_status_column
-- Solución: NO ejecutar esas migraciones
```

#### 4. **Backend no inicia**
```bash
# Verificar logs
docker-compose logs backend

# Verificar conectividad a MySQL
docker exec -it mpd-concursos-mysql-prod mysql -u root -p
```

### Comandos de Diagnóstico
```sql
-- Verificar estructura de tabla específica
DESCRIBE user_entity;
DESCRIBE inscriptions;
DESCRIBE contests;

-- Verificar datos de prueba
SELECT COUNT(*) FROM user_entity;
SELECT COUNT(*) FROM contests;
SELECT COUNT(*) FROM document_types;

-- Verificar foreign keys
SELECT
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE REFERENCED_TABLE_SCHEMA = 'mpd_concursos';
```

---

## 📈 Historial de Cambios

### Versión 2.0 (11 Jun 2025) - Producción Ready
- ✅ Estandarización de estados de inscripción en inglés
- ✅ Agregado sistema completo de notificaciones
- ✅ Implementado sistema de documentos con tipos estandarizados
- ✅ Agregado gestión de estados de usuario
- ✅ Implementado sistema de sesiones de inscripción
- ✅ Agregado soporte para circunscripciones
- ✅ Mejorado sistema de experiencia laboral (UUID)
- ✅ Agregado sistema completo de educación

### Versión 1.0 (Base)
- ✅ Estructura básica de usuarios y roles
- ✅ Sistema básico de concursos
- ✅ Sistema básico de inscripciones
- ✅ Sistema básico de exámenes

---

## 📞 Contacto y Soporte

**Proyecto**: Sistema de Concursos MPD
**Desarrollador**: Equipo de Desarrollo MPD
**Fecha de Documentación**: 11 de Junio de 2025
**Versión del Schema**: 2.0 (Producción Ready)
**Última Revisión**: Auditoría completa de base de datos

### Archivos de Referencia
- `schema.sql` - Esquema principal (COMPLETO)
- `data.sql` - Datos de prueba (ACTUALIZADO)
- `DATABASE_SCHEMA_STATUS.md` - Este documento
- `system_status_check.sql` - Verificación completa
- `verify_all_tables.sql` - Verificación de tablas

---

*Este documento debe actualizarse con cada modificación significativa del esquema de base de datos.*
