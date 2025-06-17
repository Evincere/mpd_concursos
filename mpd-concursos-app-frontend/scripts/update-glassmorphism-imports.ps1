# Script para actualizar imports de glassmorphism-system al sistema unificado
# Este script busca y reemplaza todas las importaciones del sistema obsoleto

Write-Host "Iniciando actualización de imports glassmorphism..." -ForegroundColor Cyan

# Directorios a procesar
$directories = @(
    "src\app\features\admin",
    "src\app\features\perfil",
    "src\app\shared"
)

# Patrones de importación a reemplazar
$importPatterns = @(
    @{
        Pattern = "@import\s+['\`"]src/styles/glassmorphism-system['\`"];"
        Replacement = "@import 'src/styles/unified-glassmorphism-system';"
    },
    @{
        Pattern = "@import\s+['\`"]../../../../../styles/glassmorphism-system\.scss['\`"];"
        Replacement = "@import '../../../../../styles/unified-glassmorphism-system';"
    },
    @{
        Pattern = "@import\s+['\`"]../../../../styles/glassmorphism-system['\`"];"
        Replacement = "@import '../../../../styles/unified-glassmorphism-system';"
    },
    @{
        Pattern = "@import\s+['\`"]../../../styles/glassmorphism-system['\`"];"
        Replacement = "@import '../../../styles/unified-glassmorphism-system';"
    },
    @{
        Pattern = "@import\s+['\`"]../../styles/glassmorphism-system['\`"];"
        Replacement = "@import '../../styles/unified-glassmorphism-system';"
    },
    @{
        Pattern = "@import\s+['\`"]../styles/glassmorphism-system['\`"];"
        Replacement = "@import '../styles/unified-glassmorphism-system';"
    }
)

# Contador de archivos procesados
$filesProcessed = 0
$filesModified = 0
$importsUpdated = 0

foreach ($directory in $directories) {
    Write-Host "Procesando directorio: $directory" -ForegroundColor Yellow
    
    # Obtener todos los archivos SCSS en el directorio y subdirectorios
    $scssFiles = Get-ChildItem -Path $directory -Filter "*.scss" -Recurse
    
    foreach ($file in $scssFiles) {
        $filesProcessed++
        $content = Get-Content -Path $file.FullName -Raw
        $originalContent = $content
        $modified = $false
        
        # Aplicar patrones de reemplazo
        foreach ($pattern in $importPatterns) {
            $newContent = $content -replace $pattern.Pattern, $pattern.Replacement
            if ($newContent -ne $content) {
                $content = $newContent
                $importsUpdated++
                $modified = $true
                Write-Host "  Actualizado import en: $($file.FullName)" -ForegroundColor Green
            }
        }
        
        # Guardar el archivo si se modificó
        if ($modified) {
            $filesModified++
            Set-Content -Path $file.FullName -Value $content
        }
    }
}

Write-Host "`nResumen de actualización de imports:" -ForegroundColor Cyan
Write-Host "Archivos procesados: $filesProcessed" -ForegroundColor White
Write-Host "Archivos modificados: $filesModified" -ForegroundColor Green
Write-Host "Imports actualizados: $importsUpdated" -ForegroundColor Green

if ($filesModified -gt 0) {
    Write-Host "`n✅ Actualización completada exitosamente" -ForegroundColor Green
    Write-Host "Todos los imports han sido actualizados al sistema unificado" -ForegroundColor White
} else {
    Write-Host "`n⚠️  No se encontraron imports para actualizar" -ForegroundColor Yellow
}
