#!/usr/bin/env node

/**
 * Script para corregir llamadas a métodos en templates HTML
 */

const fs = require('fs');
const path = require('path');

class TemplateMethodCallsFixer {
  constructor() {
    this.srcPath = path.join(__dirname, '..', 'src');
    this.fixedFiles = [];
    this.errors = [];
  }

  async fix() {
    console.log('🔧 Corrigiendo llamadas a métodos en templates HTML...\n');

    try {
      // Mapeo de archivos y sus correcciones específicas
      const fixes = [
        // setActiveTab fixes
        {
          file: 'app/features/admin/components/activity/activity-dashboard.component.html',
          fixes: [
            { from: '(click)="setActiveTab()"', to: '(click)="setActiveTab(0)"', context: 'activeTab = 0' },
            { from: '(click)="setActiveTab()"', to: '(click)="setActiveTab(1)"', context: 'activeTab = 1' }
          ]
        },
        {
          file: 'app/features/admin/components/admin-dashboard/admin-dashboard.component.html',
          fixes: [
            { from: '(click)="setActiveTab()"', to: '(click)="setActiveTab(0)"', context: 'activeTab = 0' },
            { from: '(click)="setActiveTab()"', to: '(click)="setActiveTab(1)"', context: 'activeTab = 1' },
            { from: '(click)="setActiveTab()"', to: '(click)="setActiveTab(2)"', context: 'activeTab = 2' }
          ]
        },
        {
          file: 'app/features/admin/components/concursos/components/concurso-detalle/concurso-detalle-admin.component.html',
          fixes: [
            { from: '(click)="setActiveTab()"', to: '(click)="setActiveTab(0)"', context: 'activeTab = 0' },
            { from: '(click)="setActiveTab()"', to: '(click)="setActiveTab(1)"', context: 'activeTab = 1' },
            { from: '(click)="setActiveTab()"', to: '(click)="setActiveTab(2)"', context: 'activeTab = 2' },
            { from: '(click)="setActiveTab()"', to: '(click)="setActiveTab(3)"', context: 'activeTab = 3' }
          ]
        },
        {
          file: 'app/features/admin/components/help-center/admin-help-center.component.html',
          fixes: [
            { from: '(click)="setActiveTab()"', to: '(click)="setActiveTab(0)"', context: 'activeTab = 0' },
            { from: '(click)="setActiveTab()"', to: '(click)="setActiveTab(1)"', context: 'activeTab = 1' },
            { from: '(click)="setActiveTab()"', to: '(click)="setActiveTab(2)"', context: 'activeTab = 2' }
          ]
        },
        {
          file: 'app/features/admin/components/inscripciones/components/documents-manager/documents-manager.component.html',
          fixes: [
            { from: '(click)="setActiveTab()"', to: '(click)="setActiveTab(0)"', context: 'activeTab = 0' },
            { from: '(click)="setActiveTab()"', to: '(click)="setActiveTab(1)"', context: 'activeTab = 1' }
          ]
        },
        {
          file: 'app/features/admin/components/profiles/components/profile-detail-dialog/profile-detail-dialog.component.html',
          fixes: [
            { from: '(click)="setActiveTab()"', to: '(click)="setActiveTab(0)"', context: 'activeTab = 0' },
            { from: '(click)="setActiveTab()"', to: '(click)="setActiveTab(1)"', context: 'activeTab = 1' },
            { from: '(click)="setActiveTab()"', to: '(click)="setActiveTab(2)"', context: 'activeTab = 2' },
            { from: '(click)="setActiveTab()"', to: '(click)="setActiveTab(3)"', context: 'activeTab = 3' }
          ]
        },
        {
          file: 'app/features/admin/components/profiles/components/profile-edit-dialog/profile-edit-dialog.component.html',
          fixes: [
            { from: '(click)="setActiveTab()"', to: '(click)="setActiveTab(0)"', context: 'activeTab = 0' },
            { from: '(click)="setActiveTab()"', to: '(click)="setActiveTab(1)"', context: 'activeTab = 1' },
            { from: '(click)="setActiveTab()"', to: '(click)="setActiveTab(2)"', context: 'activeTab = 2' },
            { from: '(click)="setActiveTab()"', to: '(click)="setActiveTab(3)"', context: 'activeTab = 3' }
          ]
        },
        {
          file: 'app/features/admin/components/profiles/profiles-admin.component.html',
          fixes: [
            { from: '(click)="setActiveTab()"', to: '(click)="setActiveTab(0)"', context: 'activeTab = 0' },
            { from: '(click)="setActiveTab()"', to: '(click)="setActiveTab(1)"', context: 'activeTab = 1' }
          ]
        },
        // Otros métodos específicos
        {
          file: 'app/features/admin/components/messaging/notification-queue/notification-queue.component.html',
          fixes: [
            { from: '(click)="setSelectedNotification()"', to: '(click)="setSelectedNotification(notification)"', context: 'notification' }
          ]
        },
        {
          file: 'app/features/admin/components/reportes/components/report-builder/report-builder.component.html',
          fixes: [
            { from: '(click)="setActiveStep()"', to: '(click)="setActiveStep(1)"', context: 'activeStep = 1' },
            { from: '(click)="setActiveStep()"', to: '(click)="setActiveStep(0)"', context: 'activeStep = 0' }
          ]
        }
      ];

      for (const fileConfig of fixes) {
        await this.fixFile(fileConfig);
      }
      
      this.printResults();
      
    } catch (error) {
      console.error('❌ Error durante la corrección:', error.message);
      process.exit(1);
    }
  }

  async fixFile(fileConfig) {
    const fullPath = path.join(this.srcPath, fileConfig.file);
    
    if (!fs.existsSync(fullPath)) {
      this.errors.push(`Archivo no encontrado: ${fileConfig.file}`);
      return;
    }

    try {
      let content = fs.readFileSync(fullPath, 'utf8');
      const originalContent = content;
      let appliedFixes = [];

      // Aplicar correcciones inteligentes basadas en contexto
      for (let i = 0; i < fileConfig.fixes.length; i++) {
        const fix = fileConfig.fixes[i];
        
        // Para setActiveTab, necesitamos encontrar el contexto correcto
        if (fix.from.includes('setActiveTab()')) {
          const tabIndex = this.extractTabIndex(fix.context);
          const replacement = `(click)="setActiveTab(${tabIndex})"`;
          
          // Buscar el primer occurrence que no haya sido reemplazado
          const regex = /\(click\)="setActiveTab\(\)"/;
          if (regex.test(content)) {
            content = content.replace(regex, replacement);
            appliedFixes.push({
              from: fix.from,
              to: replacement,
              context: fix.context
            });
          }
        } else {
          // Para otros métodos, reemplazar directamente
          if (content.includes(fix.from)) {
            content = content.replace(fix.from, fix.to);
            appliedFixes.push(fix);
          }
        }
      }

      // Solo escribir si hay cambios
      if (content !== originalContent && appliedFixes.length > 0) {
        fs.writeFileSync(fullPath, content, 'utf8');
        this.fixedFiles.push({
          file: fileConfig.file,
          fixes: appliedFixes
        });
      }

    } catch (error) {
      this.errors.push(`Error procesando ${fileConfig.file}: ${error.message}`);
    }
  }

  extractTabIndex(context) {
    const match = context.match(/activeTab = (\d+)/);
    return match ? match[1] : '0';
  }

  printResults() {
    console.log('\n📊 Resultados de Corrección:\n');
    
    if (this.fixedFiles.length === 0 && this.errors.length === 0) {
      console.log('✅ No se encontraron llamadas a métodos para corregir.');
      return;
    }
    
    if (this.fixedFiles.length > 0) {
      console.log(`✅ Archivos corregidos (${this.fixedFiles.length}):`);
      this.fixedFiles.forEach(({ file, fixes }) => {
        const relativePath = path.relative(this.srcPath, file);
        console.log(`\n   📄 ${relativePath} (${fixes.length} correcciones):`);
        
        fixes.forEach((fix, index) => {
          console.log(`      ${index + 1}. ${fix.from} -> ${fix.to}`);
          if (fix.context) {
            console.log(`         Contexto: ${fix.context}`);
          }
        });
      });
      console.log();
    }
    
    if (this.errors.length > 0) {
      console.log(`❌ Errores (${this.errors.length}):`);
      this.errors.forEach(error => console.log(`   ${error}`));
      console.log();
    }
    
    console.log('📝 Próximos pasos:');
    console.log('   1. Revisar los archivos modificados');
    console.log('   2. Verificar que la funcionalidad sigue funcionando');
    console.log('   3. Ejecutar tests para validar los cambios');
    console.log('   4. Probar la aplicación manualmente');
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const fixer = new TemplateMethodCallsFixer();
  fixer.fix();
}

module.exports = TemplateMethodCallsFixer;
