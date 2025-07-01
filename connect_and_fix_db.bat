@echo off
echo Conectando a la base de datos para aplicar la migración...
echo.

REM Configuración de la base de datos (ajustar según tu configuración)
set DB_HOST=localhost
set DB_PORT=3306
set DB_NAME=concursos_db
set DB_USER=root
set DB_PASSWORD=root

echo Ejecutando script de corrección de la tabla documents...
mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASSWORD% %DB_NAME% < fix_documents_table.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Script ejecutado exitosamente
    echo Las columnas processing_status y error_message han sido agregadas
    echo.
) else (
    echo.
    echo ❌ Error al ejecutar el script
    echo Verifica la configuración de la base de datos
    echo.
)

pause
