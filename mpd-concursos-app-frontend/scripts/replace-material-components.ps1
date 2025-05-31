# Script para reemplazar componentes de Material UI por componentes personalizados
# Este script analiza los archivos HTML y reemplaza los componentes de Material UI
# por los componentes personalizados equivalentes.

Write-Host "Iniciando reemplazo de componentes de Material UI..." -ForegroundColor Cyan

# Directorios a procesar
$directories = @(
    "src\app\features\admin"
)

# Patrones de reemplazo para componentes de Material UI
$replacementPatterns = @(
    # Botones
    @{
        Pattern = '<button\s+mat-raised-button\s+color="primary"([^>]*)>(.*?)<\/button>'
        Replacement = '<app-custom-button [color]="''primary''"$1>$2</app-custom-button>'
    },
    @{
        Pattern = '<button\s+mat-raised-button\s+color="accent"([^>]*)>(.*?)<\/button>'
        Replacement = '<app-custom-button [color]="''accent''"$1>$2</app-custom-button>'
    },
    @{
        Pattern = '<button\s+mat-raised-button\s+color="warn"([^>]*)>(.*?)<\/button>'
        Replacement = '<app-custom-button [color]="''warn''"$1>$2</app-custom-button>'
    },
    @{
        Pattern = '<button\s+mat-raised-button([^>]*)>(.*?)<\/button>'
        Replacement = '<app-custom-button$1>$2</app-custom-button>'
    },
    @{
        Pattern = '<button\s+mat-stroked-button([^>]*)>(.*?)<\/button>'
        Replacement = '<app-custom-button [variant]="''stroked''"$1>$2</app-custom-button>'
    },
    @{
        Pattern = '<button\s+mat-icon-button([^>]*)>(.*?)<\/button>'
        Replacement = '<app-custom-button [variant]="''icon''"$1>$2</app-custom-button>'
    },
    
    # Iconos
    @{
        Pattern = '<mat-icon([^>]*)>(.*?)<\/mat-icon>'
        Replacement = '<i class="fas fa-$2"$1></i>'
    },
    
    # Campos de formulario
    @{
        Pattern = '<mat-form-field([^>]*)>\s*<mat-label>(.*?)<\/mat-label>\s*<input\s+matInput([^>]*)>\s*<mat-error[^>]*>(.*?)<\/mat-error>\s*<\/mat-form-field>'
        Replacement = '<app-custom-form-field [label]="''$2''" [errorMessage]="''$4''"$1$3></app-custom-form-field>'
    },
    @{
        Pattern = '<mat-form-field([^>]*)>\s*<mat-label>(.*?)<\/mat-label>\s*<input\s+matInput([^>]*)>\s*<\/mat-form-field>'
        Replacement = '<app-custom-form-field [label]="''$2''"$1$3></app-custom-form-field>'
    },
    
    # Selectores
    @{
        Pattern = '<mat-form-field([^>]*)>\s*<mat-label>(.*?)<\/mat-label>\s*<mat-select([^>]*)>(.*?)<\/mat-select>\s*<\/mat-form-field>'
        Replacement = '<app-custom-select [label]="''$2''"$1$3>$4</app-custom-select>'
    },
    
    # Tarjetas
    @{
        Pattern = '<mat-card([^>]*)>\s*<mat-card-header>\s*<mat-card-title>(.*?)<\/mat-card-title>\s*<mat-card-subtitle>(.*?)<\/mat-card-subtitle>\s*<\/mat-card-header>\s*<mat-card-content>(.*?)<\/mat-card-content>\s*<mat-card-actions>(.*?)<\/mat-card-actions>\s*<\/mat-card>'
        Replacement = '<app-custom-card [title]="''$1''" [subtitle]="''$2''" [hasFooter]="true"$1>$3<ng-container card-footer>$4</ng-container></app-custom-card>'
    },
    @{
        Pattern = '<mat-card([^>]*)>\s*<mat-card-header>\s*<mat-card-title>(.*?)<\/mat-card-title>\s*<\/mat-card-header>\s*<mat-card-content>(.*?)<\/mat-card-content>\s*<\/mat-card>'
        Replacement = '<app-custom-card [title]="''$1''"$1>$2</app-custom-card>'
    },
    @{
        Pattern = '<mat-card([^>]*)>\s*<mat-card-content>(.*?)<\/mat-card-content>\s*<\/mat-card>'
        Replacement = '<app-custom-card$1>$2</app-custom-card>'
    }
)

# Contador de archivos procesados
$filesProcessed = 0
$filesModified = 0
$componentsReplaced = 0

foreach ($directory in $directories) {
    Write-Host "Procesando directorio: $directory" -ForegroundColor Yellow
    
    # Obtener todos los archivos HTML en el directorio y subdirectorios
    $htmlFiles = Get-ChildItem -Path $directory -Filter "*.html" -Recurse
    
    foreach ($file in $htmlFiles) {
        $filesProcessed++
        $content = Get-Content -Path $file.FullName -Raw
        $originalContent = $content
        $modified = $false
        
        # Aplicar patrones de reemplazo
        foreach ($pattern in $replacementPatterns) {
            $newContent = $content -replace $pattern.Pattern, $pattern.Replacement
            if ($newContent -ne $content) {
                $content = $newContent
                $componentsReplaced++
                $modified = $true
            }
        }
        
        # Guardar el archivo si se modificó
        if ($modified) {
            $filesModified++
            Set-Content -Path $file.FullName -Value $content
            Write-Host "  Modificado: $($file.FullName)" -ForegroundColor Green
        }
    }
}

Write-Host "Proceso completado." -ForegroundColor Cyan
Write-Host "Archivos procesados: $filesProcessed" -ForegroundColor White
Write-Host "Archivos modificados: $filesModified" -ForegroundColor Green
Write-Host "Componentes reemplazados: $componentsReplaced" -ForegroundColor Green

# Sugerencia para verificar los cambios
Write-Host "`nPara verificar que los cambios son correctos, ejecuta:" -ForegroundColor Yellow
Write-Host "ng build --configuration=development" -ForegroundColor White
