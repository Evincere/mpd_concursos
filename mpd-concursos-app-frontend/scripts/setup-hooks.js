#!/usr/bin/env node

/**
 * Script para configurar Git hooks automáticamente
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class HookSetup {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.hooksDir = path.join(this.projectRoot, '.git', 'hooks');
  }

  setup() {
    console.log('🔧 Configurando Git hooks...\n');

    try {
      this.ensureHooksDirectory();
      this.createPreCommitHook();
      this.createPrePushHook();
      this.createCommitMsgHook();
      
      console.log('✅ Git hooks configurados exitosamente!\n');
      console.log('📝 Los siguientes hooks están activos:');
      console.log('   • pre-commit: Valida código antes de commit');
      console.log('   • pre-push: Ejecuta tests antes de push');
      console.log('   • commit-msg: Valida formato de mensajes de commit\n');
      
    } catch (error) {
      console.error('❌ Error configurando hooks:', error.message);
      process.exit(1);
    }
  }

  ensureHooksDirectory() {
    if (!fs.existsSync(this.hooksDir)) {
      console.log('📁 Creando directorio de hooks...');
      fs.mkdirSync(this.hooksDir, { recursive: true });
    }
  }

  createPreCommitHook() {
    const hookPath = path.join(this.hooksDir, 'pre-commit');
    const hookContent = `#!/bin/sh
# Pre-commit hook para validación de código

echo "🚀 Ejecutando pre-commit hook..."

# Ejecutar validación de código
node scripts/pre-commit.js

if [ $? -ne 0 ]; then
  echo "❌ Pre-commit hook falló. Commit cancelado."
  exit 1
fi

echo "✅ Pre-commit hook completado exitosamente!"
exit 0
`;

    fs.writeFileSync(hookPath, hookContent);
    this.makeExecutable(hookPath);
    console.log('   ✅ pre-commit hook creado');
  }

  createPrePushHook() {
    const hookPath = path.join(this.hooksDir, 'pre-push');
    const hookContent = `#!/bin/sh
# Pre-push hook para ejecutar tests completos

echo "🧪 Ejecutando tests antes de push..."

# Ejecutar tests completos
npm run test:coverage

if [ $? -ne 0 ]; then
  echo "❌ Tests fallaron. Push cancelado."
  exit 1
fi

# Verificar build de producción
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build de producción falló. Push cancelado."
  exit 1
fi

echo "✅ Pre-push hook completado exitosamente!"
exit 0
`;

    fs.writeFileSync(hookPath, hookContent);
    this.makeExecutable(hookPath);
    console.log('   ✅ pre-push hook creado');
  }

  createCommitMsgHook() {
    const hookPath = path.join(this.hooksDir, 'commit-msg');
    const hookContent = `#!/bin/sh
# Commit message hook para validar formato

commit_regex='^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\\(.+\\))?: .{1,50}'

if ! grep -qE "$commit_regex" "$1"; then
  echo "❌ Formato de commit inválido!"
  echo ""
  echo "El mensaje debe seguir el formato:"
  echo "tipo(scope): descripción"
  echo ""
  echo "Tipos válidos:"
  echo "  feat:     Nueva funcionalidad"
  echo "  fix:      Corrección de bug"
  echo "  docs:     Documentación"
  echo "  style:    Formato, espacios, etc."
  echo "  refactor: Refactorización de código"
  echo "  test:     Agregar o modificar tests"
  echo "  chore:    Tareas de mantenimiento"
  echo "  perf:     Mejoras de performance"
  echo "  ci:       Integración continua"
  echo "  build:    Sistema de build"
  echo "  revert:   Revertir cambios"
  echo ""
  echo "Ejemplos:"
  echo "  feat(auth): agregar login con OAuth"
  echo "  fix(ui): corregir alineación de botones"
  echo "  docs: actualizar README"
  echo ""
  exit 1
fi

exit 0
`;

    fs.writeFileSync(hookPath, hookContent);
    this.makeExecutable(hookPath);
    console.log('   ✅ commit-msg hook creado');
  }

  makeExecutable(filePath) {
    try {
      if (process.platform !== 'win32') {
        execSync(`chmod +x "${filePath}"`);
      }
    } catch (error) {
      console.warn(`⚠️  No se pudo hacer ejecutable ${filePath}: ${error.message}`);
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const setup = new HookSetup();
  setup.setup();
}

module.exports = HookSetup;
