# Script PowerShell para aplicar la migración de base de datos

Write-Host "🔧 Aplicando migración de base de datos..." -ForegroundColor Yellow
Write-Host ""

# Configuración de la base de datos (ajustar según tu configuración)
$DB_HOST = "localhost"
$DB_PORT = "3306"
$DB_NAME = "concursos_db"
$DB_USER = "root"
$DB_PASSWORD = "root"

try {
    Write-Host "📋 Ejecutando script de corrección de la tabla documents..." -ForegroundColor Cyan
    
    # Ejecutar el script SQL
    $command = "mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD $DB_NAME"
    Get-Content "fix_documents_table.sql" | & mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD $DB_NAME
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Script ejecutado exitosamente" -ForegroundColor Green
        Write-Host "Las columnas processing_status y error_message han sido agregadas" -ForegroundColor Green
        Write-Host ""
        
        Write-Host "🔄 Ahora puedes reiniciar el backend para probar la funcionalidad" -ForegroundColor Yellow
    } else {
        throw "Error al ejecutar el script SQL"
    }
} catch {
    Write-Host ""
    Write-Host "❌ Error al ejecutar el script: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Verifica la configuración de la base de datos" -ForegroundColor Red
    Write-Host ""
}

Write-Host "Presiona cualquier tecla para continuar..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
