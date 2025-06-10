# 🚨 PLAN DE CORRECCIÓN INMEDIATA - PROBLEMAS CRÍTICOS DE PRODUCCIÓN

## 📋 RESUMEN EJECUTIVO

**Problema identificado:** Inconsistencias entre configuración JPA y esquema SQL causando errores de foreign key constraints  
**Impacto:** Sistema no puede crear usuarios ni autenticar  
**Tiempo estimado:** 2-3 horas  
**Prioridad:** CRÍTICA  

---

## 🎯 ARCHIVOS A CORREGIR

### **1. BACKEND - ENTIDADES JPA**

#### **📁 `concurso-backend/src/main/java/ar/gov/mpd/concursobackend/auth/infrastructure/database/entities/UserEntity.java`**

**PROBLEMA:** Falta @Table annotation y configuración UUID
```java
@Entity  // Sin @Table - Hibernate usa "UserEntity"
public class UserEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)  // Sin especificar tipo
    private UUID id;
```

**SOLUCIÓN:**
```java
@Entity
@Table(name = "user_entity")  // AGREGAR: Especificar nombre exacto
public class UserEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "BINARY(16)")  // AGREGAR: Tipo específico
    private UUID id;
    
    // AGREGAR: Columna status que falta en schema.sql
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private UserStatus status = UserStatus.ACTIVE;
```

#### **📁 `concurso-backend/src/main/java/ar/gov/mpd/concursobackend/auth/infrastructure/database/entities/RoleEntity.java`**

**PROBLEMA:** Falta @Table annotation
```java
@Entity(name = "roles")  // Incorrecto - debería ser @Table
public class RoleEntity {
```

**SOLUCIÓN:**
```java
@Entity
@Table(name = "roles")  // CORREGIR: Usar @Table en lugar de @Entity(name)
public class RoleEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "BINARY(16)")  // AGREGAR: Tipo específico
    private UUID id;
```

### **2. BACKEND - CONFIGURACIÓN**

#### **📁 `concurso-backend/src/main/resources/application.properties`**

**AGREGAR al final del archivo:**
```properties
# Naming Strategy para consistencia con schema.sql
spring.jpa.hibernate.naming.physical-strategy=org.hibernate.boot.model.naming.PhysicalNamingStrategyStandardImpl
spring.jpa.hibernate.naming.implicit-strategy=org.hibernate.boot.model.naming.ImplicitNamingStrategyLegacyJpaImpl

# Configuración UUID para compatibilidad con BINARY(16)
spring.jpa.properties.hibernate.id.new_generator_mappings=false
spring.jpa.properties.hibernate.id.db_structure_naming_strategy=single_table
```

#### **📁 `concurso-backend/src/main/resources/application-prod.properties`**

**CAMBIAR:**
```properties
# ANTES
spring.jpa.hibernate.ddl-auto=none

# DESPUÉS
spring.jpa.hibernate.ddl-auto=none
spring.sql.init.mode=always
spring.sql.init.schema-locations=classpath:schema.sql
spring.sql.init.data-locations=classpath:data.sql
spring.jpa.defer-datasource-initialization=true
```

### **3. BACKEND - ESQUEMA SQL**

#### **📁 `concurso-backend/src/main/resources/schema.sql`**

**AGREGAR columna status a user_entity:**
```sql
CREATE TABLE user_entity (
    id BINARY(16) PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    dni VARCHAR(255) UNIQUE NOT NULL,
    cuit VARCHAR(255) UNIQUE,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    birth_date DATE,
    country VARCHAR(255),
    province VARCHAR(255),
    municipality VARCHAR(255),
    legal_address VARCHAR(255),
    residential_address VARCHAR(255),
    telefono VARCHAR(255),
    direccion VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('ACTIVE', 'INACTIVE', 'BLOCKED') NOT NULL DEFAULT 'ACTIVE',  -- AGREGAR ESTA LÍNEA
    version BIGINT NOT NULL DEFAULT 0
);
```

### **4. DOCKER - CONFIGURACIÓN DE PRODUCCIÓN**

#### **📁 `docker-compose.prod.yml`**

**CAMBIAR en la sección backend > environment:**
```yaml
environment:
  SPRING_PROFILES_ACTIVE: prod
  SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/${MYSQL_DATABASE:-mpd_concursos}?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
  SPRING_DATASOURCE_USERNAME: ${MYSQL_USER:-mpd_user}
  SPRING_DATASOURCE_PASSWORD: ${MYSQL_PASSWORD:-mpd_password}
  SPRING_JPA_HIBERNATE_DDL_AUTO: none  # CAMBIAR: de "validate" a "none"
  SPRING_JPA_SHOW_SQL: "false"
  SPRING_SQL_INIT_MODE: always  # AGREGAR: Para ejecutar scripts SQL
```

---

## 🔄 SECUENCIA DE IMPLEMENTACIÓN

### **PASO 1: Correcciones en Local (30 min)**
1. ✅ Corregir `UserEntity.java`
2. ✅ Corregir `RoleEntity.java`
3. ✅ Actualizar `application.properties`
4. ✅ Actualizar `application-prod.properties`
5. ✅ Corregir `schema.sql`
6. ✅ Actualizar `docker-compose.prod.yml`

### **PASO 2: Testing Local (30 min)**
1. ✅ Ejecutar `mvn clean install`
2. ✅ Levantar base de datos local
3. ✅ Ejecutar backend local
4. ✅ Verificar que superadmin se crea correctamente
5. ✅ Probar login desde frontend

### **PASO 3: Commit y Push (15 min)**
1. ✅ Commit de todos los cambios
2. ✅ Push al repositorio
3. ✅ Verificar que CI/CD pasa

### **PASO 4: Despliegue en Producción (60 min)**
1. ✅ Conectar al servidor Donweb
2. ✅ Pull de los cambios
3. ✅ Reconstruir imágenes Docker
4. ✅ Parar contenedores actuales
5. ✅ Levantar nuevos contenedores
6. ✅ Verificar logs de arranque
7. ✅ Probar login desde navegador

### **PASO 5: Validación Final (15 min)**
1. ✅ Verificar que backend arranca sin errores
2. ✅ Confirmar que superadmin existe en BD
3. ✅ Probar login completo
4. ✅ Verificar que dashboard carga correctamente

---

## 🧪 CRITERIOS DE ÉXITO

### **✅ Backend:**
- Sin errores de foreign key constraints en logs
- Usuario superadmin creado exitosamente
- Todas las tablas con relaciones correctas

### **✅ Frontend:**
- Login exitoso con superadmin/123456
- Redirección al dashboard de administración
- Sin errores 403 en peticiones API

### **✅ Base de Datos:**
- Tablas creadas con nombres correctos
- Foreign keys funcionando
- Datos de prueba insertados correctamente

---

## 🚨 ROLLBACK PLAN

**Si algo falla:**
1. Revertir al commit anterior
2. Reconstruir imágenes con código anterior
3. Redesplegar versión estable
4. Analizar logs de error
5. Aplicar correcciones incrementales

---

## 📞 CONTACTOS DE EMERGENCIA

**Desarrollador Principal:** Disponible para soporte  
**Servidor:** Donweb VPS 149.50.132.23  
**Acceso:** SSH/Web Console  

**Estado:** 🔄 LISTO PARA IMPLEMENTACIÓN  
**Próximo paso:** Comenzar correcciones en local  
