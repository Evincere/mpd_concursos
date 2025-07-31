@echo off
title MPD Concursos - Monitor Remoto

:: Configuración del servidor
set SERVER_IP=149.50.132.23
set SERVER_USER=root

:: Configurar codificación UTF-8
chcp 65001 >nul

:: Colores para Windows
color 0A

:MAIN
cls
echo.
echo ================================================================
echo                    MPD CONCURSOS - MONITOR REMOTO
echo                      Servidor: %SERVER_IP%
echo ================================================================
echo.

:: Verificar si SSH está disponible
where ssh >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] SSH no esta disponible en el sistema
    echo [INFO] Instala OpenSSH o Git Bash
    pause
    exit /b 1
)

:MENU
echo.
echo ---- OPCIONES DISPONIBLES ----
echo  1. Monitor de Base de Datos
echo  2. Monitor de Logs
echo  3. Backup Manual
echo  4. Limpieza Docker
echo  5. Estado de Contenedores
echo  6. Estadisticas de Recursos
echo  7. Consola SSH Interactiva
echo  8. Buscar Usuario por DNI
echo  9. Ver Logs de Backup
echo  0. Salir
echo.

set /p choice="Seleccione una opcion: "

if "%choice%"=="1" goto DB_MONITOR
if "%choice%"=="2" goto LOG_MONITOR
if "%choice%"=="3" goto BACKUP
if "%choice%"=="4" goto CLEANUP
if "%choice%"=="5" goto STATUS
if "%choice%"=="6" goto STATS
if "%choice%"=="7" goto SSH_CONSOLE
if "%choice%"=="8" goto SEARCH_USER
if "%choice%"=="9" goto BACKUP_LOGS
if "%choice%"=="0" goto EXIT
echo [ERROR] Opcion invalida
timeout /t 2 /nobreak >nul
goto MENU

:DB_MONITOR
cls
echo.
echo [INFO] Conectando al Monitor de Base de Datos...
echo ===============================================
echo.
ssh -o ConnectTimeout=10 %SERVER_USER%@%SERVER_IP% "db-monitor"
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Error de conexion. Verifica la configuracion.
)
echo.
pause
goto MAIN

:LOG_MONITOR
cls
echo.
echo [INFO] Conectando al Monitor de Logs...
echo =====================================
echo.
ssh -o ConnectTimeout=10 %SERVER_USER%@%SERVER_IP% "log-monitor"
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Error de conexion. Verifica la configuracion.
)
echo.
pause
goto MAIN

:BACKUP
cls
echo.
echo [INFO] Ejecutando Backup Manual...
echo =================================
echo.
ssh -o ConnectTimeout=10 %SERVER_USER%@%SERVER_IP% "backup-db"
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Error de conexion. Verifica la configuracion.
) else (
    echo.
    echo [SUCCESS] Backup completado exitosamente
)
echo.
pause
goto MAIN

:CLEANUP
cls
echo.
echo [INFO] Ejecutando Limpieza Docker...
echo ==================================
echo.
ssh -o ConnectTimeout=10 %SERVER_USER%@%SERVER_IP% "cleanup-docker"
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Error de conexion. Verifica la configuracion.
) else (
    echo.
    echo [SUCCESS] Limpieza completada exitosamente
)
echo.
pause
goto MAIN

:STATUS
cls
echo.
echo [INFO] Verificando Estado de Contenedores...
echo ==========================================
echo.
ssh -o ConnectTimeout=10 %SERVER_USER%@%SERVER_IP% "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep mpd-concursos"
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Error de conexion. Verifica la configuracion.
) else (
    echo.
    echo [SUCCESS] Estado obtenido exitosamente
)
echo.
pause
goto MAIN

:STATS
cls
echo.
echo [INFO] Obteniendo Estadisticas de Recursos...
echo ============================================
echo.
ssh -o ConnectTimeout=10 %SERVER_USER%@%SERVER_IP% "docker stats --no-stream --format 'table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}' | grep mpd-concursos"
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Error de conexion. Verifica la configuracion.
) else (
    echo.
    echo [SUCCESS] Estadisticas obtenidas exitosamente
)
echo.
pause
goto MAIN

:SSH_CONSOLE
cls
echo.
echo [INFO] Abriendo Consola SSH Interactiva...
echo ========================================
echo [TIP] Para salir de la consola SSH, escribe: exit
echo.
ssh %SERVER_USER%@%SERVER_IP%
goto MAIN

:SEARCH_USER
cls
echo.
echo [INFO] Busqueda de Usuario por DNI
echo ================================
echo.
set /p dni="Ingrese el DNI a buscar: "
if "%dni%"=="" (
    echo [ERROR] DNI no puede estar vacio
    pause
    goto MAIN
)

echo.
echo [INFO] Buscando usuario con DNI: %dni%
echo.
ssh -o ConnectTimeout=10 %SERVER_USER%@%SERVER_IP% "docker exec mpd-concursos-mysql-prod mysql -uroot -proot1234 mpd_concursos -e \"SELECT CONCAT(first_name, ' ', last_name) as 'Nombre', dni as 'DNI', telefono as 'Telefono', email as 'Email', status as 'Estado' FROM user_entity WHERE dni = '%dni%';\""
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Error en la busqueda
) else (
    echo.
    echo [SUCCESS] Busqueda completada
)
echo.
pause
goto MAIN

:BACKUP_LOGS
cls
echo.
echo [INFO] Mostrando ultimos logs de backup...
echo =======================================
echo.
ssh -o ConnectTimeout=10 %SERVER_USER%@%SERVER_IP% "tail -20 /var/log/mpd-backup.log"
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Error obteniendo logs
) else (
    echo.
    echo [SUCCESS] Logs obtenidos exitosamente
)
echo.
pause
goto MAIN

:EXIT
cls
echo.
echo [INFO] Hasta luego!
echo.
timeout /t 2 /nobreak >nul
exit /b 0
