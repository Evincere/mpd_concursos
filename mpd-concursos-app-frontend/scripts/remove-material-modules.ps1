# Script para eliminar módulos de Material UI de los imports de los módulos
# Este script analiza los archivos de módulos TypeScript y elimina las importaciones
# de módulos de Material UI que ya no se utilizan después de la refactorización.

Write-Host "Iniciando eliminación de módulos de Material UI no utilizados..." -ForegroundColor Cyan

# Directorios a procesar
$directories = @(
    "src\app\features\admin"
)

# Módulos de Material UI a eliminar
$materialModules = @(
    "MatButtonModule",
    "MatIconModule",
    "MatFormFieldModule",
    "MatInputModule",
    "MatSelectModule",
    "MatCheckboxModule",
    "MatDatepickerModule",
    "MatNativeDateModule",
    "MatTableModule",
    "MatPaginatorModule",
    "MatSortModule",
    "MatDialogModule",
    "MatCardModule",
    "MatTabsModule",
    "MatChipsModule",
    "MatTooltipModule",
    "MatMenuModule",
    "MatProgressSpinnerModule",
    "MatSnackBarModule",
    "MatSlideToggleModule",
    "MatRadioModule",
    "MatAutocompleteModule",
    "MatDividerModule",
    "MatExpansionModule",
    "MatGridListModule",
    "MatListModule",
    "MatProgressBarModule",
    "MatSidenavModule",
    "MatStepperModule",
    "MatToolbarModule"
)

# Contador de archivos procesados
$filesProcessed = 0
$filesModified = 0
$modulesRemoved = 0

foreach ($directory in $directories) {
    Write-Host "Procesando directorio: $directory" -ForegroundColor Yellow
    
    # Obtener todos los archivos de módulos TypeScript en el directorio y subdirectorios
    $moduleFiles = Get-ChildItem -Path $directory -Filter "*.module.ts" -Recurse
    
    foreach ($file in $moduleFiles) {
        $filesProcessed++
        $content = Get-Content -Path $file.FullName -Raw
        $originalContent = $content
        $modified = $false
        
        # Eliminar módulos de Material UI de los imports
        foreach ($module in $materialModules) {
            if ($content -match $module) {
                # Eliminar el módulo de la lista de imports
                $content = $content -replace "$module,\s*", ""
                $content = $content -replace ",\s*$module", ""
                $content = $content -replace "$module", ""
                
                # Eliminar la importación si está vacía
                $content = $content -replace "import\s+\{\s*\}\s+from\s+['\`"]@angular/material/[^'\`"]*['\`"];\s*`n?", ""
                
                $modulesRemoved++
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
Write-Host "Módulos eliminados: $modulesRemoved" -ForegroundColor Green

# Sugerencia para verificar los cambios
Write-Host "`nPara verificar que los cambios son correctos, ejecuta:" -ForegroundColor Yellow
Write-Host "ng build --configuration=development" -ForegroundColor White
