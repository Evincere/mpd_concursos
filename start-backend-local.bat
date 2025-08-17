@echo off
REM Script para ejecutar backend Spring Boot con configuración local de documentos
REM Mantiene configuración de producción intacta pero permite desarrollo local

echo ========================================
echo   INICIANDO BACKEND MPD - DESARROLLO
echo ========================================

REM Configurar variables de entorno para desarrollo local
set DOCUMENTS_BASE_PATH=B:/concursos_situacion_post_gracia/descarga_administracion_20250814_191745
set SPRING_PROFILES_ACTIVE=local

echo Variables configuradas:
echo - DOCUMENTS_BASE_PATH: %DOCUMENTS_BASE_PATH%
echo - SPRING_PROFILES_ACTIVE: %SPRING_PROFILES_ACTIVE%
echo.

echo Arrancando backend Spring Boot...
echo Puerto: 8080
echo Perfil: local
echo Documentos: %DOCUMENTS_BASE_PATH%\documentos
echo.

cd concurso-backend
mvn spring-boot:run

pause
