# 🖥️ MPD Monitor Local - Acceso Remoto desde Windows

## 📋 Descripción
Scripts para acceder remotamente al sistema de monitoreo MPD Concursos desde tu escritorio Windows mediante SSH.

## 🎯 ¿Qué hace?
Te permite ejecutar el monitor de MPD Concursos desde tu PC local con **doble click**, conectándose automáticamente al servidor y ejecutando las herramientas de monitoreo.

## 📦 Archivos Incluidos

### 1. **MPD-Monitor-Remoto.bat** 
- Script principal para Windows
- Menú interactivo con todas las opciones
- Ejecutable con doble click

### 2. **MPD-Monitor-PowerShell.ps1**
- Versión avanzada en PowerShell
- Interfaz más moderna con colores
- Funciones adicionales

### 3. **Instalar-Monitor-Local.bat**
- Instalador automático
- Crea acceso directo en el escritorio
- Configura todo automáticamente

## 🚀 Instalación Rápida

### Opción 1: Instalación Automática
```bash
# 1. Ejecutar el instalador
doble click en "Instalar-Monitor-Local.bat"

# 2. ¡Listo! Usar el acceso directo del escritorio
doble click en "MPD Monitor"
```

### Opción 2: Instalación Manual
```bash
# 1. Crear carpeta en el escritorio
mkdir "%USERPROFILE%\Desktop\MPD-Monitor"

# 2. Copiar archivos a la carpeta
copy MPD-Monitor-Remoto.bat "%USERPROFILE%\Desktop\MPD-Monitor\"

# 3. Ejecutar
doble click en MPD-Monitor-Remoto.bat
```

## 🔐 Configuración SSH

### Prerequisitos
- **SSH disponible** (Git Bash, OpenSSH, o WSL)
- **Acceso al servidor** 149.50.132.23
- **Usuario root** con permisos

### Configurar Autenticación SSH

#### Opción A: Clave SSH (Recomendado)
```bash
# 1. Generar clave SSH (si no tienes una)
ssh-keygen -t rsa -b 4096 -C "tu-email@ejemplo.com"

# 2. Copiar clave al servidor
ssh-copy-id root@149.50.132.23

# 3. Probar conexión
ssh root@149.50.132.23
```

#### Opción B: Contraseña
- Los scripts pedirán la contraseña cada vez
- Menos seguro pero más simple

## 🎮 Uso del Monitor

### Desde el Escritorio
1. **Doble click** en "MPD Monitor" del escritorio
2. Seleccionar opción del menú
3. ¡Listo!

### Opciones Disponibles

```
┌─ OPCIONES DISPONIBLES ─────────────────────────────────────┐
│  1. 🔍 Monitor de Base de Datos                            │
│  2. 📋 Monitor de Logs                                     │
│  3. 💾 Backup Manual                                       │
│  4. 🧹 Limpieza Docker                                     │
│  5. 📊 Estado de Contenedores                              │
│  6. 🔧 Consola SSH Interactiva                             │
│  7. ⚙️  Configurar Conexión                                │
│  0. ❌ Salir                                               │
└────────────────────────────────────────────────────────────┘
```

### Funciones Principales

#### 1. Monitor de Base de Datos
- Ejecuta `db-monitor` remotamente
- 12 funciones de consulta
- Estadísticas, búsquedas, reportes

#### 2. Monitor de Logs
- Ejecuta `log-monitor` remotamente
- Logs en tiempo real
- Búsqueda en logs

#### 3. Backup Manual
- Ejecuta backup inmediato
- Confirma resultado
- Muestra estado

#### 4. Estado de Contenedores
- Verifica contenedores Docker
- Estado de servicios
- Puertos y recursos

## 🔧 Configuración Avanzada

### Cambiar Servidor/Usuario
```bash
# Editar en el script o usar opción 7 del menú
set SERVER_IP=tu-nueva-ip
set SERVER_USER=tu-usuario
```

### Usar Clave SSH Personalizada
```bash
# Editar ruta de la clave
set SSH_KEY_PATH=C:\ruta\a\tu\clave\privada
```

### Configurar Puerto SSH Personalizado
```bash
# Agregar puerto en comandos SSH
ssh -p 2222 root@149.50.132.23
```

## 📊 Ejemplos de Uso

### Buscar Usuario por DNI
```bash
1. Ejecutar MPD Monitor
2. Opción 1 (Monitor de Base de Datos)
3. Opción 2 (Buscar Usuario por DNI)
4. Ingresar DNI
```

### Ver Logs en Tiempo Real
```bash
1. Ejecutar MPD Monitor
2. Opción 2 (Monitor de Logs)
3. Opción 1 (Logs Backend)
```

### Backup de Emergencia
```bash
1. Ejecutar MPD Monitor
2. Opción 3 (Backup Manual)
3. Confirmar resultado
```

## 🚨 Solución de Problemas

### Error: SSH no encontrado
```bash
# Instalar una de estas opciones:
1. Git for Windows: https://git-scm.com/download/win
2. OpenSSH desde Windows Features
3. Windows Subsystem for Linux (WSL)
```

### Error: Conexión rechazada
```bash
# Verificar:
1. IP del servidor: 149.50.132.23
2. Puerto SSH abierto (22)
3. Usuario correcto (root)
4. Firewall/antivirus
```

### Error: Autenticación fallida
```bash
# Opciones:
1. Configurar clave SSH
2. Usar autenticación por contraseña
3. Verificar permisos de usuario
```

### Error: Comando no encontrado
```bash
# En el servidor, verificar:
1. Scripts instalados: which db-monitor
2. Enlaces simbólicos: ls -la /usr/local/bin/
3. Reinstalar: cd /root/concursos/mpd_concursos/scripts/monitor && ./install-monitor.sh
```

## 📁 Estructura de Archivos

```
%USERPROFILE%\Desktop\
├── MPD Monitor.lnk              # Acceso directo
└── MPD-Monitor\                 # Carpeta de scripts
    ├── MPD-Monitor-Remoto.bat   # Script principal
    ├── MPD-Monitor-PowerShell.ps1 # Versión PowerShell
    ├── config.txt               # Configuración
    └── README.txt               # Documentación
```

## 🔄 Actualización

Para actualizar los scripts:
```bash
1. Descargar nuevas versiones
2. Ejecutar nuevamente "Instalar-Monitor-Local.bat"
3. O reemplazar archivos manualmente
```

## 📞 Información del Servidor

- **Servidor**: 149.50.132.23 (vps-4778464-x)
- **Usuario**: root
- **Puerto SSH**: 22
- **Servicios**:
  - Backend: mpd-concursos-backend-prod:8080
  - Frontend: mpd-concursos-frontend-prod:8000
  - Database: mpd-concursos-mysql-prod:3307

## ✅ Verificación

Después de la instalación:
```bash
1. Verificar acceso directo en el escritorio
2. Probar conexión SSH
3. Ejecutar monitor y probar una función
4. Verificar que los comandos remotos funcionan
```

---

**¡Ahora puedes monitorear MPD Concursos desde tu escritorio con un simple doble click!** 🎉
