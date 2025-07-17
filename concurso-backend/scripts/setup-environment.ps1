# Script para configurar el entorno de desarrollo de forma segura
# Fecha: 2025-07-15

Write-Host "=== CONFIGURACIÓN SEGURA DEL ENTORNO ===" -ForegroundColor Green
Write-Host "Configurando variables de entorno para desarrollo" -ForegroundColor Green
Write-Host ""

# Verificar si existe .env
$envFile = ".\.env"
$envExampleFile = ".\.env.example"

if (Test-Path $envFile) {
    Write-Host "⚠️  El archivo .env ya existe" -ForegroundColor Yellow
    $overwrite = Read-Host "¿Deseas sobrescribirlo? (y/N)"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "❌ Operación cancelada" -ForegroundColor Red
        exit 0
    }
}

if (-not (Test-Path $envExampleFile)) {
    Write-Host "❌ No se encontró el archivo .env.example" -ForegroundColor Red
    Write-Host "   Asegúrate de ejecutar este script desde el directorio concurso-backend" -ForegroundColor Yellow
    exit 1
}

Write-Host "📋 Configurando variables de entorno..." -ForegroundColor Yellow
Write-Host ""

# Solicitar credenciales de base de datos
Write-Host "🔐 CONFIGURACIÓN DE BASE DE DATOS" -ForegroundColor Cyan
$dbUsername = Read-Host "Usuario de MySQL (default: root)"
if ([string]::IsNullOrWhiteSpace($dbUsername)) {
    $dbUsername = "root"
}

$dbPassword = Read-Host "Contraseña de MySQL" -AsSecureString
$dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword))

$dbHost = Read-Host "Host de MySQL (default: localhost)"
if ([string]::IsNullOrWhiteSpace($dbHost)) {
    $dbHost = "localhost"
}

$dbPort = Read-Host "Puerto de MySQL (default: 3306)"
if ([string]::IsNullOrWhiteSpace($dbPort)) {
    $dbPort = "3306"
}

$dbName = Read-Host "Nombre de la base de datos (default: mpd_concursos)"
if ([string]::IsNullOrWhiteSpace($dbName)) {
    $dbName = "mpd_concursos"
}

Write-Host ""
Write-Host "🔑 CONFIGURACIÓN DE JWT" -ForegroundColor Cyan

# Generar JWT secret seguro
$jwtSecret = -join ((1..64) | ForEach-Object { Get-Random -InputObject ([char[]]"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789") })
Write-Host "✅ JWT Secret generado automáticamente (64 caracteres)" -ForegroundColor Green

Write-Host ""
Write-Host "📁 CONFIGURACIÓN DE ALMACENAMIENTO" -ForegroundColor Cyan
$storageLocation = Read-Host "Directorio de documentos (default: ./document-storage)"
if ([string]::IsNullOrWhiteSpace($storageLocation)) {
    $storageLocation = "./document-storage"
}

Write-Host ""
Write-Host "🌐 CONFIGURACIÓN DE CORS" -ForegroundColor Cyan
$corsOrigins = Read-Host "Orígenes CORS (default: http://localhost:4200,http://localhost:8000)"
if ([string]::IsNullOrWhiteSpace($corsOrigins)) {
    $corsOrigins = "http://localhost:4200,http://localhost:8000"
}

# Crear archivo .env
Write-Host ""
Write-Host "📝 Creando archivo .env..." -ForegroundColor Yellow

$envContent = @"
# =============================================================================
# VARIABLES DE ENTORNO PARA DESARROLLO
# =============================================================================
# GENERADO AUTOMÁTICAMENTE EL $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# IMPORTANTE: NO COMMITEAR ESTE ARCHIVO AL REPOSITORIO

# =============================================================================
# CONFIGURACIÓN DE BASE DE DATOS
# =============================================================================
DB_USERNAME=$dbUsername
DB_PASSWORD=$dbPasswordPlain
DB_HOST=$dbHost
DB_PORT=$dbPort
DB_NAME=$dbName

# =============================================================================
# CONFIGURACIÓN DE SEGURIDAD JWT
# =============================================================================
JWT_SECRET=$jwtSecret
JWT_EXPIRATION=86400000

# =============================================================================
# CONFIGURACIÓN DE ALMACENAMIENTO
# =============================================================================
DOCUMENT_STORAGE_LOCATION=$storageLocation
MAX_FILE_SIZE=10485760

# =============================================================================
# CONFIGURACIÓN DE CORS
# =============================================================================
CORS_ALLOWED_ORIGINS=$corsOrigins

# =============================================================================
# CONFIGURACIÓN DE DIAGNÓSTICO
# =============================================================================
SECURITY_DIAGNOSTIC_ENABLED=true

# =============================================================================
# CONFIGURACIÓN DE LOGGING
# =============================================================================
LOG_LEVEL=INFO
LOG_DIR=./logs
"@

$envContent | Out-File -FilePath $envFile -Encoding UTF8

Write-Host "✅ Archivo .env creado exitosamente" -ForegroundColor Green
Write-Host ""
Write-Host "🔒 CONFIGURACIÓN DE SEGURIDAD COMPLETADA" -ForegroundColor Green
Write-Host ""
Write-Host "Resumen de la configuracion:" -ForegroundColor Cyan
Write-Host "   - Base de datos: $dbUsername@$dbHost`:$dbPort/$dbName" -ForegroundColor White
Write-Host "   - JWT Secret: Generado automaticamente (64 caracteres)" -ForegroundColor White
Write-Host "   - Almacenamiento: $storageLocation" -ForegroundColor White
Write-Host "   - CORS: $corsOrigins" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  IMPORTANTE:" -ForegroundColor Yellow
Write-Host "   • El archivo .env contiene credenciales sensibles" -ForegroundColor Yellow
Write-Host "   • NO debe ser commiteado al repositorio Git" -ForegroundColor Yellow
Write-Host "   • Está incluido en .gitignore para mayor seguridad" -ForegroundColor Yellow
Write-Host ""
Write-Host "🚀 Ahora puedes ejecutar la aplicación con:" -ForegroundColor Green
Write-Host "   mvn spring-boot:run" -ForegroundColor White
Write-Host ""
Write-Host "=== CONFIGURACIÓN COMPLETADA ===" -ForegroundColor Green
