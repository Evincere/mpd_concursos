# Script de configuración para desarrollo
# Configura las variables de entorno necesarias para ejecutar el proyecto en desarrollo

Write-Host "🔧 Configurando entorno de desarrollo..." -ForegroundColor Green

# Verificar si existe el archivo .env.development
if (Test-Path ".env.development") {
    Write-Host "✅ Archivo .env.development encontrado" -ForegroundColor Green
    
    # Leer variables del archivo .env.development
    Get-Content ".env.development" | ForEach-Object {
        if ($_ -match "^([^#][^=]+)=(.*)$") {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            
            # Establecer variable de entorno
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
            Write-Host "  ✓ $name configurado" -ForegroundColor Gray
        }
    }
    
    Write-Host "✅ Variables de entorno configuradas" -ForegroundColor Green
} else {
    Write-Host "❌ Archivo .env.development no encontrado" -ForegroundColor Red
    Write-Host "   Creando archivo .env.development con valores por defecto..." -ForegroundColor Yellow
    
    # Crear archivo .env.development básico
    @"
# ARCHIVO DE VARIABLES DE ENTORNO PARA DESARROLLO
JWT_SECRET=dev_jwt_secret_key_for_development_only_minimum_256_bits_required_do_not_use_in_production_environment
JWT_EXPIRATION=86400000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=mpd_concursos
DB_USERNAME=root
DB_PASSWORD=root
LOG_LEVEL=DEBUG
DDL_AUTO=create-drop
CORS_ALLOWED_ORIGINS=http://localhost:4200
"@ | Out-File -FilePath ".env.development" -Encoding UTF8
    
    Write-Host "✅ Archivo .env.development creado" -ForegroundColor Green
}

# Verificar conexión a MySQL
Write-Host "🔍 Verificando conexión a MySQL..." -ForegroundColor Yellow

try {
    # Intentar conectar a MySQL (requiere mysql client)
    $mysqlTest = mysql -h localhost -u root -p"root" -e "SELECT 1;" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Conexión a MySQL exitosa" -ForegroundColor Green
    } else {
        Write-Host "⚠️  No se pudo verificar MySQL (cliente no disponible)" -ForegroundColor Yellow
        Write-Host "   Asegúrese de que MySQL esté ejecutándose en localhost:3306" -ForegroundColor Gray
    }
} catch {
    Write-Host "⚠️  No se pudo verificar MySQL" -ForegroundColor Yellow
    Write-Host "   Asegúrese de que MySQL esté ejecutándose en localhost:3306" -ForegroundColor Gray
}

# Mostrar configuración actual
Write-Host "`n📋 Configuración actual:" -ForegroundColor Cyan
Write-Host "  JWT_SECRET: $(if ($env:JWT_SECRET) { '***configurado***' } else { 'NO CONFIGURADO' })" -ForegroundColor Gray
Write-Host "  DB_HOST: $($env:DB_HOST)" -ForegroundColor Gray
Write-Host "  DB_PORT: $($env:DB_PORT)" -ForegroundColor Gray
Write-Host "  DB_NAME: $($env:DB_NAME)" -ForegroundColor Gray
Write-Host "  DB_USERNAME: $($env:DB_USERNAME)" -ForegroundColor Gray
Write-Host "  LOG_LEVEL: $($env:LOG_LEVEL)" -ForegroundColor Gray

Write-Host "`n🚀 Configuración completada. Puede ejecutar:" -ForegroundColor Green
Write-Host "   mvn spring-boot:run" -ForegroundColor White
Write-Host "   o" -ForegroundColor Gray
Write-Host "   ./mvnw spring-boot:run" -ForegroundColor White

Write-Host "`n⚠️  IMPORTANTE:" -ForegroundColor Yellow
Write-Host "   - Este archivo .env.development es SOLO para desarrollo" -ForegroundColor Red
Write-Host "   - NO usar estas credenciales en producción" -ForegroundColor Red
Write-Host "   - En producción usar variables de entorno del sistema" -ForegroundColor Red
