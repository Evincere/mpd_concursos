# Script para eliminar importaciones de Material UI que ya no se utilizan
# Este script analiza los archivos TypeScript y elimina las importaciones de Material UI
# que no se utilizan en el código después de la refactorización.

Write-Host "Iniciando eliminación de importaciones de Material UI no utilizadas..." -ForegroundColor Cyan

# Directorios a procesar
$directories = @(
    "src\app\features\admin"
)

# Patrones de importación de Material UI
$materialImportPatterns = @(
    "@angular/material/button",
    "@angular/material/icon",
    "@angular/material/form-field",
    "@angular/material/input",
    "@angular/material/select",
    "@angular/material/core",
    "@angular/material/checkbox",
    "@angular/material/datepicker",
    "@angular/material/table",
    "@angular/material/paginator",
    "@angular/material/sort",
    "@angular/material/dialog",
    "@angular/material/card",
    "@angular/material/tabs",
    "@angular/material/chips",
    "@angular/material/tooltip",
    "@angular/material/menu",
    "@angular/material/progress-spinner",
    "@angular/material/snack-bar",
    "@angular/material/slide-toggle",
    "@angular/material/radio",
    "@angular/material/autocomplete",
    "@angular/material/divider",
    "@angular/material/expansion",
    "@angular/material/grid-list",
    "@angular/material/list",
    "@angular/material/progress-bar",
    "@angular/material/sidenav",
    "@angular/material/stepper",
    "@angular/material/toolbar"
)

# Componentes de Material UI a buscar en el código
$materialComponents = @(
    "mat-button",
    "mat-raised-button",
    "mat-flat-button",
    "mat-stroked-button",
    "mat-icon-button",
    "mat-fab",
    "mat-mini-fab",
    "mat-icon",
    "mat-form-field",
    "matInput",
    "mat-label",
    "mat-error",
    "mat-hint",
    "mat-select",
    "mat-option",
    "mat-checkbox",
    "mat-datepicker",
    "mat-table",
    "mat-header-row",
    "mat-row",
    "mat-cell",
    "mat-header-cell",
    "mat-paginator",
    "mat-sort",
    "mat-sort-header",
    "mat-dialog",
    "mat-dialog-title",
    "mat-dialog-content",
    "mat-dialog-actions",
    "mat-card",
    "mat-card-header",
    "mat-card-title",
    "mat-card-subtitle",
    "mat-card-content",
    "mat-card-actions",
    "mat-card-footer",
    "mat-tab",
    "mat-tab-group",
    "mat-chip",
    "mat-chip-list",
    "mat-tooltip",
    "mat-menu",
    "mat-menu-item",
    "mat-progress-spinner",
    "mat-spinner",
    "mat-snack-bar",
    "mat-slide-toggle",
    "mat-radio",
    "mat-radio-group",
    "mat-radio-button",
    "mat-autocomplete",
    "mat-divider",
    "mat-expansion-panel",
    "mat-expansion-panel-header",
    "mat-grid-list",
    "mat-grid-tile",
    "mat-list",
    "mat-list-item",
    "mat-progress-bar",
    "mat-sidenav",
    "mat-sidenav-container",
    "mat-sidenav-content",
    "mat-step",
    "mat-stepper",
    "mat-toolbar"
)

# Clases de Material UI a buscar en el código
$materialClasses = @(
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
    "MatToolbarModule",
    "MatDialog",
    "MatDialogRef",
    "MatDialogConfig",
    "MatTableDataSource",
    "MatPaginator",
    "MatSort",
    "MatSnackBar",
    "MatSnackBarConfig"
)

# Contador de archivos procesados
$filesProcessed = 0
$filesModified = 0
$importsRemoved = 0

foreach ($directory in $directories) {
    Write-Host "Procesando directorio: $directory" -ForegroundColor Yellow
    
    # Obtener todos los archivos TypeScript en el directorio y subdirectorios
    $tsFiles = Get-ChildItem -Path $directory -Filter "*.ts" -Recurse
    
    foreach ($file in $tsFiles) {
        $filesProcessed++
        $content = Get-Content -Path $file.FullName -Raw
        $originalContent = $content
        $modified = $false
        
        # Verificar si el archivo contiene componentes o clases de Material UI
        $containsMaterialComponents = $false
        foreach ($component in $materialComponents) {
            if ($content -match $component) {
                $containsMaterialComponents = $true
                break
            }
        }
        
        if (-not $containsMaterialComponents) {
            foreach ($class in $materialClasses) {
                if ($content -match $class) {
                    $containsMaterialComponents = $true
                    break
                }
            }
        }
        
        # Si el archivo no contiene componentes o clases de Material UI, eliminar las importaciones
        if (-not $containsMaterialComponents) {
            foreach ($pattern in $materialImportPatterns) {
                if ($content -match "import.*from\s+['\`"]$pattern['\`"]") {
                    $content = $content -replace "import\s+\{[^}]*\}\s+from\s+['\`"]$pattern['\`"];\s*`n?", ""
                    $importsRemoved++
                    $modified = $true
                }
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
Write-Host "Importaciones eliminadas: $importsRemoved" -ForegroundColor Green

# Sugerencia para verificar los cambios
Write-Host "`nPara verificar que los cambios son correctos, ejecuta:" -ForegroundColor Yellow
Write-Host "ng build --configuration=development" -ForegroundColor White
