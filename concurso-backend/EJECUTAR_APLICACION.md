# 🚀 Cómo Ejecutar la Aplicación con Credenciales Seguras

## 📋 Descripción

Después de externalizar las credenciales por seguridad, la aplicación requiere variables de entorno para funcionar correctamente.

## ⚡ Ejecución Rápida

### **Opción 1: Script Automatizado (Recomendado)**

#### **Para Git Bash / Linux / macOS:**
```bash
cd concurso-backend
./run-dev.sh
```

#### **Para PowerShell / Windows:**
```powershell
cd concurso-backend
.\run-dev.ps1
```

### **Opción 2: Configuración Manual**

#### **Para Git Bash / Linux / macOS:**
```bash
cd concurso-backend

# Configurar variables de entorno
export DB_USERNAME="root"
export DB_PASSWORD="root1234"
export SPRING_PROFILES_ACTIVE="dev"

# Ejecutar aplicación
mvn spring-boot:run
```

#### **Para PowerShell / Windows:**
```powershell
cd concurso-backend

# Configurar variables de entorno
$env:DB_USERNAME="root"
$env:DB_PASSWORD="root1234"
$env:SPRING_PROFILES_ACTIVE="dev"

# Ejecutar aplicación
mvn spring-boot:run
```

#### **Para CMD / Windows:**
```cmd
cd concurso-backend

# Configurar variables de entorno
set DB_USERNAME=root
set DB_PASSWORD=root1234
set SPRING_PROFILES_ACTIVE=dev

# Ejecutar aplicación
mvn spring-boot:run
```

## 🔧 Variables de Entorno Requeridas

### **Variables Obligatorias:**
| Variable | Valor por Defecto | Descripción |
|----------|-------------------|-------------|
| `DB_USERNAME` | `root` | Usuario de MySQL |
| `DB_PASSWORD` | `root1234` | Contraseña de MySQL |
| `SPRING_PROFILES_ACTIVE` | `dev` | Perfil de Spring Boot |

### **Variables Opcionales:**
| Variable | Valor por Defecto | Descripción |
|----------|-------------------|-------------|
| `DB_HOST` | `localhost` | Host de MySQL |
| `DB_PORT` | `3306` | Puerto de MySQL |
| `DB_NAME` | `mpd_concursos` | Nombre de la base de datos |
| `JWT_SECRET` | (generado) | Clave secreta para JWT |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:4200,http://localhost:8000` | Orígenes CORS permitidos |

## ✅ Verificación de Éxito

### **Logs Esperados:**
```
The following 1 profile is active: "dev"
HikariPool-1 - Start completed.
Clave JWT inicializada con HMAC-SHA256
Initialized JPA EntityManagerFactory
Tomcat started on port 8080 (http)
```

### **Indicadores de Éxito:**
- ✅ **Perfil activo**: `"dev"`
- ✅ **Conexión MySQL**: `HikariPool-1 - Start completed`
- ✅ **JWT inicializado**: `Clave JWT inicializada`
- ✅ **Tomcat iniciado**: `port 8080 (http)`

## ❌ Solución de Problemas

### **Error: `Access denied for user 'root'@'localhost' (using password: NO)`**

**Causa**: Variables de entorno no configuradas

**Solución**:
1. Usar los scripts automatizados (`run-dev.sh` o `run-dev.ps1`)
2. O configurar manualmente las variables antes de ejecutar `mvn spring-boot:run`

### **Error: `No active profile set, falling back to 1 default profile: "default"`**

**Causa**: Variable `SPRING_PROFILES_ACTIVE` no configurada

**Solución**:
```bash
export SPRING_PROFILES_ACTIVE="dev"  # Git Bash/Linux/macOS
$env:SPRING_PROFILES_ACTIVE="dev"    # PowerShell
set SPRING_PROFILES_ACTIVE=dev       # CMD
```

### **Error: `Could not obtain connection to query metadata`**

**Causa**: MySQL no está ejecutándose o credenciales incorrectas

**Solución**:
1. Verificar que MySQL esté ejecutándose
2. Verificar credenciales en las variables de entorno
3. Crear la base de datos si no existe:
   ```sql
   CREATE DATABASE IF NOT EXISTS mpd_concursos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

## 🔒 Seguridad

### **✅ Buenas Prácticas Implementadas:**
- ✅ **Sin credenciales hardcodeadas** en el código
- ✅ **Variables de entorno** para configuración sensible
- ✅ **Archivos .env excluidos** del repositorio
- ✅ **Configuración específica** por entorno

### **⚠️ Importante:**
- **NO commitear** archivos con credenciales reales
- **Cambiar credenciales** en producción
- **Usar gestores de secretos** en entornos productivos

## 📚 Documentación Adicional

- **Configuración completa**: `SECURITY_CREDENTIALS.md`
- **Script de configuración**: `setup-environment.ps1`
- **Archivo de ejemplo**: `.env.example`

## 🎯 Resumen

**Para ejecutar rápidamente:**
```bash
cd concurso-backend
./run-dev.sh
```

**La aplicación estará disponible en:** `http://localhost:8080`
