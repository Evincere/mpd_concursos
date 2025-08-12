#!/bin/bash

# Script para configurar hooks de seguridad en Git

echo "🔒 Configurando hooks de seguridad para Git..."

# Crear el directorio de hooks si no existe
mkdir -p .git/hooks

# Crear pre-commit hook
cat > .git/hooks/pre-commit << 'EOL'
#!/bin/bash

echo "🔍 Verificando archivos sensibles..."

# Patrones de archivos sensibles
SENSITIVE_PATTERNS=(
    "\\.env"
    "\\.backup"
    "\\.bak"
    "\\.old" 
    "\\.orig"
    "\\.key$"
    "\\.pem$"
    "\\.crt$"
    "backup.*\\.sql"
    "docker-compose\\.ssl\\.yml$"
    "ssl-setup"
    "backup_.*_[0-9]"
    "RECOVERY_.*"
    "recovery_.*"
    "checksums.*\\.md5"
)

# Verificar archivos staged
FOUND_SENSITIVE=0
for pattern in "${SENSITIVE_PATTERNS[@]}"; do
    if git diff --cached --name-only | grep -E "$pattern" > /dev/null; then
        if [ $FOUND_SENSITIVE -eq 0 ]; then
            echo "🚨 ERROR: Intentando commitear archivos sensibles!"
            echo "Archivos detectados:"
            FOUND_SENSITIVE=1
        fi
        git diff --cached --name-only | grep -E "$pattern" | sed 's/^/  - /'
    fi
done

if [ $FOUND_SENSITIVE -eq 1 ]; then
    echo ""
    echo "❌ Commit rechazado por seguridad."
    echo "💡 Para excluir estos archivos:"
    echo "   git reset HEAD <archivo>"
    echo "🔍 Revisa el archivo SECURITY.md para más información"
    exit 1
fi

echo "✅ Verificación de seguridad completada."
EOL

# Hacer ejecutable el hook
chmod +x .git/hooks/pre-commit

echo "✅ Hook de pre-commit configurado"
echo "🔒 Ahora Git verificará automáticamente archivos sensibles antes de cada commit"
echo ""
echo "Para probar el hook:"
echo "  touch test.env && git add test.env && git commit -m 'test'"
echo "  (Debería rechazar el commit)"
echo ""
echo "Para saltarse el hook temporalmente (NO recomendado):"
echo "  git commit --no-verify -m 'mensaje'"
