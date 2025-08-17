# Script para ejecutar el backend con configuracion JWT correcta
# Configuracion necesaria para la integracion con el frontend

Write-Host "=================================================================" -ForegroundColor Green
Write-Host "Iniciando backend Spring Boot con configuracion JWT correcta" -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Green

# Establecer variables de entorno para JWT
$env:JWT_SECRET = "RcmUR2yePNGr5pjZ9bXL_dx7h_xeIliI4iS4ESXDMMs"
$env:JWT_EXPIRATION = "86400"

# Variables de base de datos
$env:DB_HOST = "localhost"
$env:DB_PORT = "3306"  
$env:DB_USERNAME = "root"
$env:DB_PASSWORD = "root1234"
$env:DB_NAME = "mpd_concursos"

# Mostrar configuracion
Write-Host "JWT_SECRET configurado: $($env:JWT_SECRET.Substring(0, 20))..." -ForegroundColor Yellow
Write-Host "JWT_EXPIRATION: $env:JWT_EXPIRATION segundos" -ForegroundColor Yellow
Write-Host "Base de datos: $env:DB_USERNAME@$env:DB_HOST`:$env:DB_PORT/$env:DB_NAME" -ForegroundColor Yellow
Write-Host ""

# Ejecutar Maven con perfil dev
Write-Host "Ejecutando: mvn spring-boot:run -Dspring-boot.run.profiles=dev" -ForegroundColor Cyan
Write-Host ""

try {
    mvn spring-boot:run -D"spring-boot.run.profiles=dev"
} catch {
    Write-Host "Error ejecutando Maven: $_" -ForegroundColor Red
} finally {
    Write-Host ""
    Write-Host "=================================================================" -ForegroundColor Green
    Write-Host "Backend Spring Boot finalizado" -ForegroundColor Green  
    Write-Host "=================================================================" -ForegroundColor Green
    
    Read-Host "Presione Enter para continuar..."
}
