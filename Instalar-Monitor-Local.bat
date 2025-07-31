@echo off
chcp 65001 >nul
title Instalador MPD Monitor Local

:: Configuración
set DESKTOP_PATH=%USERPROFILE%\Desktop
set SCRIPTS_FOLDER=%DESKTOP_PATH%\MPD-Monitor
set SERVER_IP=149.50.132.23

color 0B

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║              INSTALADOR MPD MONITOR LOCAL                   ║
echo ║                    Para Windows Desktop                      ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

echo 🔧 Configurando acceso remoto al servidor MPD Concursos...
echo.

:: Crear carpeta en el escritorio
echo 📁 Creando carpeta en el escritorio...
if not exist "%SCRIPTS_FOLDER%" (
    mkdir "%SCRIPTS_FOLDER%"
    echo ✅ Carpeta creada: %SCRIPTS_FOLDER%
) else (
    echo ℹ️  Carpeta ya existe: %SCRIPTS_FOLDER%
)

:: Copiar scripts a la carpeta del escritorio
echo.
echo 📋 Copiando scripts...
copy "MPD-Monitor-Remoto.bat" "%SCRIPTS_FOLDER%\" >nul 2>&1
if exist "%SCRIPTS_FOLDER%\MPD-Monitor-Remoto.bat" (
    echo ✅ MPD-Monitor-Remoto.bat copiado
) else (
    echo ❌ Error copiando MPD-Monitor-Remoto.bat
)

copy "MPD-Monitor-PowerShell.ps1" "%SCRIPTS_FOLDER%\" >nul 2>&1
if exist "%SCRIPTS_FOLDER%\MPD-Monitor-PowerShell.ps1" (
    echo ✅ MPD-Monitor-PowerShell.ps1 copiado
) else (
    echo ❌ Error copiando MPD-Monitor-PowerShell.ps1
)

:: Crear acceso directo en el escritorio
echo.
echo 🔗 Creando acceso directo en el escritorio...

:: Crear script VBS para crear acceso directo
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%TEMP%\CreateShortcut.vbs"
echo sLinkFile = "%DESKTOP_PATH%\MPD Monitor.lnk" >> "%TEMP%\CreateShortcut.vbs"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%TEMP%\CreateShortcut.vbs"
echo oLink.TargetPath = "%SCRIPTS_FOLDER%\MPD-Monitor-Remoto.bat" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.WorkingDirectory = "%SCRIPTS_FOLDER%" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.Description = "Monitor Remoto MPD Concursos" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.IconLocation = "%%SystemRoot%%\System32\shell32.dll,13" >> "%TEMP%\CreateShortcut.vbs"
echo oLink.Save >> "%TEMP%\CreateShortcut.vbs"

cscript //nologo "%TEMP%\CreateShortcut.vbs"
del "%TEMP%\CreateShortcut.vbs"

if exist "%DESKTOP_PATH%\MPD Monitor.lnk" (
    echo ✅ Acceso directo creado en el escritorio
) else (
    echo ❌ Error creando acceso directo
)

:: Crear script de configuración SSH
echo.
echo 🔐 Configurando SSH...

:: Verificar si SSH está disponible
where ssh >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ SSH no está disponible
    echo.
    echo 💡 OPCIONES PARA INSTALAR SSH:
    echo   1. Instalar Git for Windows (incluye SSH)
    echo   2. Instalar OpenSSH desde Windows Features
    echo   3. Usar Windows Subsystem for Linux (WSL)
    echo.
    echo 🌐 Git for Windows: https://git-scm.com/download/win
    echo.
) else (
    echo ✅ SSH está disponible
    
    :: Crear directorio .ssh si no existe
    if not exist "%USERPROFILE%\.ssh" (
        mkdir "%USERPROFILE%\.ssh"
        echo ✅ Directorio .ssh creado
    )
    
    :: Probar conexión
    echo.
    echo 🔍 Probando conexión al servidor %SERVER_IP%...
    ssh -o ConnectTimeout=5 -o BatchMode=yes root@%SERVER_IP% "echo 'Conexión exitosa'" 2>nul
    if %errorlevel% equ 0 (
        echo ✅ Conexión SSH exitosa
    ) else (
        echo ⚠️  Conexión SSH requiere configuración
        echo.
        echo 💡 CONFIGURACIÓN RECOMENDADA:
        echo   1. Generar clave SSH: ssh-keygen -t rsa -b 4096
        echo   2. Copiar clave al servidor: ssh-copy-id root@%SERVER_IP%
        echo   3. O usar autenticación por contraseña
    )
)

:: Crear archivo de configuración
echo.
echo ⚙️ Creando archivo de configuración...
echo # Configuración MPD Monitor > "%SCRIPTS_FOLDER%\config.txt"
echo SERVER_IP=%SERVER_IP% >> "%SCRIPTS_FOLDER%\config.txt"
echo SERVER_USER=root >> "%SCRIPTS_FOLDER%\config.txt"
echo SSH_KEY=%USERPROFILE%\.ssh\id_rsa >> "%SCRIPTS_FOLDER%\config.txt"
echo ✅ Configuración guardada

:: Crear archivo README
echo.
echo 📖 Creando documentación...
echo # MPD Monitor - Acceso Remoto > "%SCRIPTS_FOLDER%\README.txt"
echo. >> "%SCRIPTS_FOLDER%\README.txt"
echo ## Archivos incluidos: >> "%SCRIPTS_FOLDER%\README.txt"
echo - MPD-Monitor-Remoto.bat: Script principal (doble click) >> "%SCRIPTS_FOLDER%\README.txt"
echo - MPD-Monitor-PowerShell.ps1: Versión PowerShell avanzada >> "%SCRIPTS_FOLDER%\README.txt"
echo - config.txt: Configuración de conexión >> "%SCRIPTS_FOLDER%\README.txt"
echo. >> "%SCRIPTS_FOLDER%\README.txt"
echo ## Uso: >> "%SCRIPTS_FOLDER%\README.txt"
echo 1. Hacer doble click en "MPD Monitor" del escritorio >> "%SCRIPTS_FOLDER%\README.txt"
echo 2. O ejecutar MPD-Monitor-Remoto.bat >> "%SCRIPTS_FOLDER%\README.txt"
echo. >> "%SCRIPTS_FOLDER%\README.txt"
echo ## Servidor: %SERVER_IP% >> "%SCRIPTS_FOLDER%\README.txt"
echo ## Usuario: root >> "%SCRIPTS_FOLDER%\README.txt"
echo ✅ README creado

echo.
echo 🎉 INSTALACIÓN COMPLETADA
echo ═══════════════════════════
echo.
echo 📁 Archivos instalados en: %SCRIPTS_FOLDER%
echo 🔗 Acceso directo creado en el escritorio: "MPD Monitor"
echo.
echo 💡 FORMAS DE USAR:
echo   1. Hacer doble click en "MPD Monitor" del escritorio
echo   2. Ejecutar: %SCRIPTS_FOLDER%\MPD-Monitor-Remoto.bat
echo   3. PowerShell: %SCRIPTS_FOLDER%\MPD-Monitor-PowerShell.ps1
echo.
echo 🔐 CONFIGURACIÓN SSH:
if %errorlevel% equ 0 (
    echo   ✅ SSH configurado y funcionando
) else (
    echo   ⚠️  Requiere configuración adicional de SSH
    echo   💡 Ver README.txt para instrucciones
)
echo.
echo 🌐 Servidor: %SERVER_IP%
echo 👤 Usuario: root
echo.

:: Preguntar si quiere probar ahora
set /p test_now="¿Deseas probar la conexión ahora? (s/N): "
if /i "%test_now%"=="s" (
    echo.
    echo 🚀 Iniciando MPD Monitor...
    start "" "%SCRIPTS_FOLDER%\MPD-Monitor-Remoto.bat"
)

echo.
echo ✅ Instalación completada. Presiona cualquier tecla para salir...
pause >nul
