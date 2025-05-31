# Script para corregir automáticamente los warnings NG8107 en los componentes
# Este script busca patrones como "objeto?.propiedad" y los reemplaza por "objeto.propiedad"
# o por "objeto && objeto.propiedad" según corresponda

Write-Host "Iniciando corrección de warnings NG8107..." -ForegroundColor Cyan

# Directorios a procesar
$directories = @(
    "src\app\features\admin\components\roles",
    "src\app\features\admin\components\system-monitoring",
    "src\app\features\admin\components\user-behavior",
    "src\app\features\admin\components\users",
    "src\app\features\admin\components\profiles"
)

# Contador de archivos procesados
$filesProcessed = 0
$filesModified = 0

foreach ($directory in $directories) {
    Write-Host "Procesando directorio: $directory" -ForegroundColor Yellow

    # Obtener todos los archivos HTML en el directorio y subdirectorios
    $htmlFiles = Get-ChildItem -Path $directory -Filter "*.html" -Recurse

    foreach ($file in $htmlFiles) {
        $filesProcessed++
        $content = Get-Content -Path $file.FullName -Raw
        $originalContent = $content

        # Patrones a reemplazar
        $patterns = @(
            # Patrón 1: objeto?.propiedad en expresiones simples
            @{
                Pattern = '(\{\{[^}]*?)(\w+)(\?\.)(\w+)([^}]*?\}\})'
                Replacement = '$1$2.$4$5'
            },
            # Patrón 2: objeto?.propiedad en atributos ngClass
            @{
                Pattern = '(\[ngClass\]="[^"]*?)(\w+)(\?\.)(\w+)([^"]*?")'
                Replacement = '$1$2.$4$5'
            },
            # Patrón 3: objeto?.propiedad en expresiones de formato
            @{
                Pattern = '(\{\{[^}]*?formatUptime\()(\w+)(\?\.)(\w+)([^}]*?\}\})'
                Replacement = '$1$2.$4$5'
            },
            # Patrón 4: objeto?.propiedad?.subpropiedad en expresiones anidadas
            @{
                Pattern = '(\{\{[^}]*?)(\w+)(\?\.)(\w+)(\?\.)(\w+)([^}]*?\}\})'
                Replacement = '$1$2.$4.$6$7'
            },
            # Patrón 5: objeto?.propiedad?.subpropiedad en atributos
            @{
                Pattern = '(\[ngClass\]="[^"]*?)(\w+)(\?\.)(\w+)(\?\.)(\w+)([^"]*?")'
                Replacement = '$1$2.$4.$6$7'
            },
            # Patrón 6: objeto?.propiedad en expresiones de array
            @{
                Pattern = '(\[\w+\]\[\w+\.\w+\s*-\s*\d+\])(\?\.)(\w+)'
                Replacement = '$1.$3'
            }
        )

        $modified = $false

        foreach ($pattern in $patterns) {
            $newContent = $content -replace $pattern.Pattern, $pattern.Replacement
            if ($newContent -ne $content) {
                $content = $newContent
                $modified = $true
            }
        }

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

# Sugerencia para ejecutar ng build después de las correcciones
Write-Host "`nPara verificar que los warnings han sido corregidos, ejecuta:" -ForegroundColor Yellow
Write-Host "ng build --configuration=development" -ForegroundColor White
