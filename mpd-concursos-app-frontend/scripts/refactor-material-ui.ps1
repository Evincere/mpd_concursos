# Script maestro para refactorizar Material UI a componentes personalizados
# Este script ejecuta todos los scripts de refactorización en el orden correcto

Write-Host "Iniciando refactorización de Material UI a componentes personalizados..." -ForegroundColor Cyan

# Verificar que estamos en el directorio correcto
if (-not (Test-Path ".\angular.json")) {
    Write-Host "Error: Este script debe ejecutarse desde el directorio raíz del proyecto." -ForegroundColor Red
    exit 1
}

# Crear una copia de seguridad del proyecto
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = ".\backup_$timestamp"

Write-Host "Creando copia de seguridad en $backupDir..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path $backupDir | Out-Null
Copy-Item -Path ".\src" -Destination "$backupDir\src" -Recurse | Out-Null
Write-Host "Copia de seguridad creada." -ForegroundColor Green

# Paso 1: Reemplazar componentes de Material UI por componentes personalizados
Write-Host "`nPaso 1: Reemplazando componentes de Material UI..." -ForegroundColor Yellow
& .\scripts\replace-material-components.ps1

# Paso 2: Eliminar módulos de Material UI de los imports de los módulos
Write-Host "`nPaso 2: Eliminando módulos de Material UI..." -ForegroundColor Yellow
& .\scripts\remove-material-modules.ps1

# Paso 3: Eliminar importaciones de Material UI que ya no se utilizan
Write-Host "`nPaso 3: Eliminando importaciones de Material UI no utilizadas..." -ForegroundColor Yellow
& .\scripts\remove-material-imports.ps1

# Verificar que los cambios son correctos
Write-Host "`nVerificando que los cambios son correctos..." -ForegroundColor Yellow
$buildResult = & ng build --configuration=development

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nRefactorización completada con éxito." -ForegroundColor Green
    Write-Host "Se ha creado una copia de seguridad en $backupDir por si necesitas revertir los cambios." -ForegroundColor Yellow
} else {
    Write-Host "`nLa refactorización ha generado errores." -ForegroundColor Red
    Write-Host "Puedes restaurar la copia de seguridad desde $backupDir si es necesario." -ForegroundColor Yellow
}

# Instrucciones finales
Write-Host "`nPara completar la refactorización:" -ForegroundColor Cyan
Write-Host "1. Revisa los archivos modificados para asegurarte de que los cambios son correctos." -ForegroundColor White
Write-Host "2. Ejecuta 'ng serve' para verificar que la aplicación funciona correctamente." -ForegroundColor White
Write-Host "3. Si encuentras problemas, puedes restaurar la copia de seguridad desde $backupDir." -ForegroundColor White
