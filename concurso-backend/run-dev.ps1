# Script para ejecutar la aplicación en modo desarrollo con variables de entorno
# Fecha: 2025-07-15

Write-Host "=== INICIANDO APLICACIÓN EN MODO DESARROLLO ===" -ForegroundColor Green
Write-Host ""

# Verificar si estamos en el directorio correcto
if (-not (Test-Path "pom.xml")) {
    Write-Host "❌ Error: No se encontró pom.xml" -ForegroundColor Red
    Write-Host "   Ejecuta este script desde el directorio concurso-backend" -ForegroundColor Yellow
    exit 1
}

# Configurar variables de entorno para la sesión actual
Write-Host "🔧 Configurando variables de entorno..." -ForegroundColor Yellow

# Variables de base de datos
$env:DB_USERNAME = "root"
$env:DB_PASSWORD = "root1234"
$env:DB_HOST = "localhost"
$env:DB_PORT = "3306"
$env:DB_NAME = "mpd_concursos"

# Variables de Spring
$env:SPRING_PROFILES_ACTIVE = "dev"

# Variables de JWT (generar una clave temporal para desarrollo)
$env:JWT_SECRET = "desarrollo_jwt_secret_muy_largo_y_seguro_para_testing_local_solamente_no_usar_en_produccion_256_bits_minimo"
$env:JWT_EXPIRATION = "86400000"

# Variables de almacenamiento
$env:DOCUMENT_STORAGE_LOCATION = "./document-storage"
$env:MAX_FILE_SIZE = "10485760"

# Variables de CORS
$env:CORS_ALLOWED_ORIGINS = "http://localhost:4200,http://localhost:8000"

# Variables de diagnóstico
$env:SECURITY_DIAGNOSTIC_ENABLED = "true"

# Variables de logging
$env:LOG_LEVEL = "INFO"
$env:LOG_DIR = "./logs"

Write-Host "✅ Variables de entorno configuradas:" -ForegroundColor Green
Write-Host "   DB_USERNAME: $env:DB_USERNAME" -ForegroundColor White
Write-Host "   DB_HOST: $env:DB_HOST" -ForegroundColor White
Write-Host "   SPRING_PROFILES_ACTIVE: $env:SPRING_PROFILES_ACTIVE" -ForegroundColor White
Write-Host ""

# Verificar conexión a MySQL
Write-Host "🔍 Verificando conexión a MySQL..." -ForegroundColor Yellow
try {
    $testConnection = mysql -u $env:DB_USERNAME -p$env:DB_PASSWORD -e "SELECT 1;" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Conexión a MySQL exitosa" -ForegroundColor Green
    } else {
        Write-Host "⚠️  No se pudo verificar la conexión a MySQL" -ForegroundColor Yellow
        Write-Host "   La aplicación intentará conectarse de todas formas" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  No se pudo verificar la conexión a MySQL (mysql command no encontrado)" -ForegroundColor Yellow
    Write-Host "   La aplicación intentará conectarse de todas formas" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🚀 Iniciando aplicación Spring Boot..." -ForegroundColor Green
Write-Host "   Perfil activo: $env:SPRING_PROFILES_ACTIVE" -ForegroundColor White
Write-Host "   Puerto: 8080" -ForegroundColor White
Write-Host ""
Write-Host "📝 Para detener la aplicación, presiona Ctrl+C" -ForegroundColor Cyan
Write-Host ""

# Ejecutar la aplicación
mvn spring-boot:run

Write-Host ""
Write-Host "=== APLICACIÓN DETENIDA ===" -ForegroundColor Yellow
