@echo off
REM Script para ejecutar el backend con configuracion JWT correcta
REM Configuracion necesaria para la integracion con el frontend

echo =================================================================
echo Iniciando backend Spring Boot con configuracion JWT correcta
echo =================================================================

REM Establecer variables de entorno para JWT
set JWT_SECRET=RcmUR2yePNGr5pjZ9bXL_dx7h_xeIliI4iS4ESXDMMs
set JWT_EXPIRATION=86400

REM Variables de base de datos
set DB_HOST=localhost
set DB_PORT=3306
set DB_USERNAME=root
set DB_PASSWORD=root1234
set DB_NAME=mpd_concursos

REM Mostrar configuracion
echo JWT_SECRET configurado: %JWT_SECRET:~0,20%...
echo JWT_EXPIRATION: %JWT_EXPIRATION% segundos
echo Base de datos: %DB_USERNAME%@%DB_HOST%:%DB_PORT%/%DB_NAME%
echo.

REM Ejecutar Maven con perfil dev
echo Ejecutando: mvn spring-boot:run -Dspring-boot.run.profiles=dev
echo.

mvn spring-boot:run -Dspring-boot.run.profiles=dev

echo.
echo =================================================================
echo Backend Spring Boot finalizado
echo =================================================================
pause
