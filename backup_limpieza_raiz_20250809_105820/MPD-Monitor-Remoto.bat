@echo off
chcp 65001 >nul
title MPD Concursos - Monitor Remoto

:: Configuración del servidor
set SERVER_IP=149.50.132.23
set SERVER_USER=root
set SSH_KEY_PATH=%USERPROFILE%\.ssh\id_rsa

:: Colores para Windows
color 0A

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    MPD CONCURSOS - MONITOR REMOTO            ║
echo ║                      Conexión desde Windows                  ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

:: Verificar si SSH está disponible
where ssh >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ SSH no está disponible en el sistema
    echo 💡 Instala OpenSSH o Git Bash
    pause
    exit /b 1
)

:: Menú principal
:MENU
cls
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    MPD CONCURSOS - MONITOR REMOTO            ║
echo ║                      Servidor: %SERVER_IP%                ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo ┌─ OPCIONES DISPONIBLES ─────────────────────────────────────┐
echo │  1. 🔍 Monitor de Base de Datos                            │
echo │  2. 📋 Monitor de Logs                                     │
echo │  3. 💾 Backup Manual                                       │
echo │  4. 🧹 Limpieza Docker                                     │
echo │  5. 📊 Estado de Contenedores                              │
echo │  6. 🔧 Consola SSH Interactiva                             │
echo │  7. ⚙️  Configurar Conexión                                │
echo │  0. ❌ Salir                                               │
echo └────────────────────────────────────────────────────────────┘
echo.

set /p choice="Seleccione una opción: "

if "%choice%"=="1" goto DB_MONITOR
if "%choice%"=="2" goto LOG_MONITOR
if "%choice%"=="3" goto BACKUP
if "%choice%"=="4" goto CLEANUP
if "%choice%"=="5" goto STATUS
if "%choice%"=="6" goto SSH_CONSOLE
if "%choice%"=="7" goto CONFIG
if "%choice%"=="0" goto EXIT
goto MENU

:DB_MONITOR
cls
echo.
echo 🔍 Conectando al Monitor de Base de Datos...
echo ═══════════════════════════════════════════
echo.
ssh -o ConnectTimeout=10 %SERVER_USER%@%SERVER_IP% "db-monitor"
if %errorlevel% neq 0 (
    echo.
    echo ❌ Error de conexión. Verifica la configuración.
    pause
)
goto MENU

:LOG_MONITOR
cls
echo.
echo 📋 Conectando al Monitor de Logs...
echo ═══════════════════════════════════
echo.
ssh -o ConnectTimeout=10 %SERVER_USER%@%SERVER_IP% "log-monitor"
if %errorlevel% neq 0 (
    echo.
    echo ❌ Error de conexión. Verifica la configuración.
    pause
)
goto MENU

:BACKUP
cls
echo.
echo 💾 Ejecutando Backup Manual...
echo ═══════════════════════════════
echo.
ssh -o ConnectTimeout=10 %SERVER_USER%@%SERVER_IP% "backup-db"
if %errorlevel% neq 0 (
    echo.
    echo ❌ Error de conexión. Verifica la configuración.
    pause
) else (
    echo.
    echo ✅ Backup completado exitosamente
    pause
)
goto MENU

:CLEANUP
cls
echo.
echo 🧹 Ejecutando Limpieza Docker...
echo ═══════════════════════════════════
echo.
ssh -o ConnectTimeout=10 %SERVER_USER%@%SERVER_IP% "cleanup-docker"
if %errorlevel% neq 0 (
    echo.
    echo ❌ Error de conexión. Verifica la configuración.
    pause
) else (
    echo.
    echo ✅ Limpieza completada exitosamente
    pause
)
goto MENU

:STATUS
cls
echo.
echo 📊 Verificando Estado de Contenedores...
echo ═══════════════════════════════════════════
echo.
ssh -o ConnectTimeout=10 %SERVER_USER%@%SERVER_IP% "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep mpd-concursos"
if %errorlevel% neq 0 (
    echo.
    echo ❌ Error de conexión. Verifica la configuración.
    pause
) else (
    echo.
    echo ✅ Estado obtenido exitosamente
    pause
)
goto MENU

:SSH_CONSOLE
cls
echo.
echo 🔧 Abriendo Consola SSH Interactiva...
echo ═══════════════════════════════════════
echo 💡 Para salir de la consola SSH, escribe: exit
echo.
ssh %SERVER_USER%@%SERVER_IP%
goto MENU

:CONFIG
cls
echo.
echo ⚙️ CONFIGURACIÓN DE CONEXIÓN
echo ═══════════════════════════════
echo.
echo Configuración actual:
echo   Servidor: %SERVER_IP%
echo   Usuario:  %SERVER_USER%
echo.
echo ¿Deseas cambiar la configuración? (s/N)
set /p config_change=""
if /i "%config_change%"=="s" (
    echo.
    set /p new_ip="Nueva IP del servidor [%SERVER_IP%]: "
    if not "%new_ip%"=="" set SERVER_IP=%new_ip%
    
    set /p new_user="Nuevo usuario [%SERVER_USER%]: "
    if not "%new_user%"=="" set SERVER_USER=%new_user%
    
    echo.
    echo ✅ Configuración actualizada:
    echo   Servidor: %SERVER_IP%
    echo   Usuario:  %SERVER_USER%
    echo.
)

echo 🔍 Probando conexión...
ssh -o ConnectTimeout=5 -o BatchMode=yes %SERVER_USER%@%SERVER_IP% "echo 'Conexión exitosa'" 2>nul
if %errorlevel% equ 0 (
    echo ✅ Conexión SSH exitosa
) else (
    echo ❌ Error de conexión SSH
    echo.
    echo 💡 Posibles soluciones:
    echo   1. Verifica que la IP sea correcta: %SERVER_IP%
    echo   2. Asegúrate de que el usuario sea correcto: %SERVER_USER%
    echo   3. Configura autenticación por clave SSH
    echo   4. Verifica que el puerto 22 esté abierto
)
echo.
pause
goto MENU

:EXIT
cls
echo.
echo 👋 ¡Hasta luego!
echo.
timeout /t 2 /nobreak >nul
exit /b 0
