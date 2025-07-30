# 🔒 Gestión Segura de Credenciales

## 📋 Descripción

Este documento describe cómo gestionar de forma segura las credenciales y configuraciones sensibles en el proyecto MPD Concursos.

## 🚨 Problema Resuelto

**Antes (INSEGURO):**
```properties
# ❌ VULNERABILIDAD: Contraseñas hardcodeadas en el código
spring.datasource.username=root
spring.datasource.password=root1234
```

**Después (SEGURO):**
```properties
# ✅ SEGURO: Variables de entorno
spring.datasource.username=${DB_USERNAME:root}
spring.datasource.password=${DB_PASSWORD:}
```

## 🛡️ Configuración Segura

### **1. Variables de Entorno**

Las credenciales sensibles se configuran mediante variables de entorno:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DB_USERNAME` | Usuario de base de datos | `root` |
| `DB_PASSWORD` | Contraseña de base de datos | `mi_password_seguro` |
| `DB_HOST` | Host de base de datos | `localhost` |
| `DB_PORT` | Puerto de base de datos | `3306` |
| `DB_NAME` | Nombre de base de datos | `mpd_concursos` |
| `JWT_SECRET` | Clave secreta JWT | `clave_muy_larga_y_segura` |

### **2. Archivo .env (Desarrollo)**

Para desarrollo local, crear un archivo `.env` en el directorio raíz:

```bash
# Ejecutar script de configuración automática
.\scripts\setup-environment.ps1

# O crear manualmente
cp .env.example .env
# Editar .env con valores reales
```

### **3. Configuración por Entorno**

#### **Desarrollo (`application-dev.properties`):**
```properties
spring.datasource.username=${DB_USERNAME:root}
spring.datasource.password=${DB_PASSWORD:}  # Sin valor por defecto
```

#### **Producción (`application-prod.properties`):**
```properties
spring.datasource.username=${DB_USERNAME}  # Obligatorio
spring.datasource.password=${DB_PASSWORD}  # Obligatorio
```

## 🔐 Mejores Prácticas de Seguridad

### **✅ Hacer:**
1. **Usar variables de entorno** para todas las credenciales
2. **Generar JWT secrets únicos** para cada entorno
3. **Rotar credenciales regularmente**
4. **Usar contraseñas fuertes** (mínimo 12 caracteres)
5. **Verificar .gitignore** incluye archivos sensibles
6. **Documentar variables requeridas**

### **❌ NO Hacer:**
1. **Hardcodear contraseñas** en el código fuente
2. **Commitear archivos .env** al repositorio
3. **Usar contraseñas por defecto** en producción
4. **Compartir credenciales** por medios inseguros
5. **Reutilizar credenciales** entre entornos

## 🚀 Configuración Rápida

### **Paso 1: Configurar Entorno**
```powershell
cd concurso-backend
.\scripts\setup-environment.ps1
```

### **Paso 2: Verificar Configuración**
```bash
# Verificar que no hay contraseñas hardcodeadas
grep -r "password.*=" src/main/resources/ --exclude-dir=.git

# Verificar variables de entorno
echo $DB_USERNAME
echo $DB_PASSWORD  # No mostrar en logs reales
```

### **Paso 3: Ejecutar Aplicación**
```bash
mvn spring-boot:run
```

## 🔍 Verificación de Seguridad

### **Comando para Detectar Credenciales Hardcodeadas:**
```powershell
# Buscar posibles credenciales hardcodeadas
Get-ChildItem -Recurse -Include "*.properties", "*.yml", "*.yaml" | 
    Select-String -Pattern "(password|secret|key).*=.*[^$]" |
    Where-Object { $_.Line -notmatch "^\s*#" }
```

### **Verificar .gitignore:**
```bash
# Verificar que .env está ignorado
git check-ignore .env
# Debe retornar: .env
```

## 🌍 Configuración por Entorno

### **Desarrollo Local:**
```bash
export DB_USERNAME=root
export DB_PASSWORD=mi_password_local
export JWT_SECRET=clave_desarrollo_muy_larga
```

### **Testing:**
```bash
export DB_USERNAME=test_user
export DB_PASSWORD=test_password
export JWT_SECRET=clave_testing_diferente
```

### **Producción:**
```bash
# Configurar en el servidor/contenedor
export DB_USERNAME=prod_user
export DB_PASSWORD=contraseña_super_segura_produccion
export JWT_SECRET=clave_produccion_ultra_segura_256_bits
```

## 📚 Referencias

- [OWASP - Credential Management](https://owasp.org/www-community/vulnerabilities/Use_of_hard-coded_credentials)
- [Spring Boot - External Configuration](https://docs.spring.io/spring-boot/docs/current/reference/html/features.html#features.external-config)
- [12 Factor App - Config](https://12factor.net/config)

## ⚠️ Notas Importantes

1. **Nunca commitear credenciales** al repositorio Git
2. **Rotar credenciales** si se comprometen
3. **Usar gestores de secretos** en producción (AWS Secrets Manager, Azure Key Vault, etc.)
4. **Auditar acceso** a credenciales regularmente
5. **Implementar principio de menor privilegio**
