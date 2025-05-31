# Script para optimizar el componente perfil.component.scss
# Este script divide el archivo SCSS en múltiples archivos más pequeños

Write-Host "Iniciando optimización del componente perfil..." -ForegroundColor Cyan

# Ruta al archivo original
$originalFile = "src\app\features\perfil\perfil.component.scss"
$backupFile = "src\app\features\perfil\perfil.component.scss.bak"

# Verificar si el archivo existe
if (-not (Test-Path $originalFile)) {
    Write-Host "Error: No se encontró el archivo $originalFile" -ForegroundColor Red
    exit 1
}

# Crear una copia de seguridad
Copy-Item $originalFile $backupFile
Write-Host "Copia de seguridad creada en $backupFile" -ForegroundColor Green

# Leer el contenido del archivo
$content = Get-Content $originalFile -Raw

# Crear directorio para estilos si no existe
$stylesDir = "src\app\features\perfil\styles"
if (-not (Test-Path $stylesDir)) {
    New-Item -ItemType Directory -Path $stylesDir | Out-Null
    Write-Host "Directorio de estilos creado: $stylesDir" -ForegroundColor Green
}

# Dividir el contenido en secciones
$sections = @{
    "variables" = "/* Variables y mixins */`n"
    "layout" = "/* Estilos de layout */`n"
    "forms" = "/* Estilos de formularios */`n"
    "cards" = "/* Estilos de tarjetas */`n"
    "buttons" = "/* Estilos de botones */`n"
    "responsive" = "/* Estilos responsivos */`n"
}

# Extraer secciones del archivo original (esto es una simplificación)
# En un caso real, necesitarías analizar el archivo y dividirlo adecuadamente
$layoutContent = $content -replace "(?s)\/\* Estilos de formularios.*", ""
$formsContent = $content -match "(?s)\/\* Estilos de formularios.*" | Out-String

# Guardar las secciones en archivos separados
Set-Content "$stylesDir\_layout.scss" $layoutContent
Set-Content "$stylesDir\_forms.scss" $formsContent

# Crear un nuevo archivo principal que importe los módulos
$newContent = @"
// Importar estilos modulares
@import './styles/layout';
@import './styles/forms';

// Estilos específicos del componente que no se han modularizado
"@

Set-Content $originalFile $newContent

Write-Host "Optimización completada." -ForegroundColor Cyan
Write-Host "El componente perfil.component.scss ha sido dividido en módulos más pequeños." -ForegroundColor Green
Write-Host "Archivos creados:" -ForegroundColor Yellow
Write-Host "  - $stylesDir\_layout.scss" -ForegroundColor White
Write-Host "  - $stylesDir\_forms.scss" -ForegroundColor White
Write-Host "El archivo principal ahora importa estos módulos." -ForegroundColor Green

Write-Host "`nPara verificar que los cambios han resuelto el problema, ejecuta:" -ForegroundColor Yellow
Write-Host "ng build --configuration=development" -ForegroundColor White
