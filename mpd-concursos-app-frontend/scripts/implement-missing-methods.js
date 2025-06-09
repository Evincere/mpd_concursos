#!/usr/bin/env node

/**
 * Script para implementar métodos faltantes en componentes
 */

const fs = require('fs');
const path = require('path');

class MissingMethodsImplementer {
  constructor() {
    this.srcPath = path.join(__dirname, '..', 'src');
    this.implementedFiles = [];
    this.errors = [];
  }

  async implement() {
    console.log('🔧 Implementando métodos faltantes en componentes...\n');

    try {
      // Lista de componentes que necesitan métodos setActiveTab
      const componentsNeedingSetActiveTab = [
        'app/features/admin/components/activity/activity-dashboard.component.ts',
        'app/features/admin/components/admin-dashboard/admin-dashboard.component.ts',
        'app/features/admin/components/concursos/components/concurso-detalle/concurso-detalle-admin.component.ts',
        'app/features/admin/components/help-center/admin-help-center.component.ts',
        'app/features/admin/components/inscripciones/components/documents-manager/documents-manager.component.ts',
        'app/features/admin/components/profiles/components/profile-detail-dialog/profile-detail-dialog.component.ts',
        'app/features/admin/components/profiles/components/profile-edit-dialog/profile-edit-dialog.component.ts',
        'app/features/admin/components/profiles/profiles-admin.component.ts'
      ];

      for (const componentPath of componentsNeedingSetActiveTab) {
        await this.implementSetActiveTab(componentPath);
      }

      // Implementar otros métodos específicos
      await this.implementSpecificMethods();
      
      this.printResults();
      
    } catch (error) {
      console.error('❌ Error durante la implementación:', error.message);
      process.exit(1);
    }
  }

  async implementSetActiveTab(componentPath) {
    const fullPath = path.join(this.srcPath, componentPath);
    
    if (!fs.existsSync(fullPath)) {
      this.errors.push(`Archivo no encontrado: ${componentPath}`);
      return;
    }

    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Verificar si ya tiene el método
      if (content.includes('setActiveTab(')) {
        return; // Ya implementado
      }

      // Verificar si tiene la propiedad activeTab
      const hasActiveTabProperty = content.includes('activeTab');
      
      let newContent = content;
      let methodImplementation = '';

      if (hasActiveTabProperty) {
        // Implementar método que acepta el índice del tab
        methodImplementation = `
  /**
   * Establece el tab activo
   */
  setActiveTab(tabIndex: number): void {
    this.activeTab = tabIndex;
  }`;
      } else {
        // Agregar propiedad y método
        const propertyImplementation = `
  /**
   * Índice del tab activo
   */
  activeTab = 0;`;

        methodImplementation = `
  /**
   * Establece el tab activo
   */
  setActiveTab(tabIndex: number): void {
    this.activeTab = tabIndex;
  }`;

        // Buscar el constructor o el primer método para insertar la propiedad
        const constructorMatch = content.match(/constructor\([^)]*\)\s*{/);
        if (constructorMatch) {
          const insertIndex = content.indexOf(constructorMatch[0]) - 1;
          newContent = content.slice(0, insertIndex) + propertyImplementation + '\n' + content.slice(insertIndex);
        }
      }

      // Insertar el método antes del último }
      const lastBraceIndex = newContent.lastIndexOf('}');
      newContent = newContent.slice(0, lastBraceIndex) + methodImplementation + '\n' + newContent.slice(lastBraceIndex);

      fs.writeFileSync(fullPath, newContent, 'utf8');
      this.implementedFiles.push({
        file: componentPath,
        method: 'setActiveTab',
        type: hasActiveTabProperty ? 'method-only' : 'property-and-method'
      });

    } catch (error) {
      this.errors.push(`Error procesando ${componentPath}: ${error.message}`);
    }
  }

  async implementSpecificMethods() {
    // Implementar setSelectedNotification
    await this.implementMethod(
      'app/features/admin/components/messaging/notification-queue/notification-queue.component.ts',
      'setSelectedNotification',
      `
  /**
   * Establece la notificación seleccionada
   */
  setSelectedNotification(notification: any): void {
    this.selectedNotification = notification;
  }`
    );

    // Implementar setRealTimeEvents
    await this.implementMethod(
      'app/features/admin/components/messaging/system-events/system-events.component.ts',
      'setRealTimeEvents',
      `
  /**
   * Limpia los eventos en tiempo real
   */
  setRealTimeEvents(): void {
    this.realTimeEvents = [];
  }`
    );

    // Implementar setActiveStep
    await this.implementMethod(
      'app/features/admin/components/reportes/components/report-builder/report-builder.component.ts',
      'setActiveStep',
      `
  /**
   * Establece el paso activo del wizard
   */
  setActiveStep(stepIndex: number): void {
    this.activeStep = stepIndex;
  }`
    );

    // Implementar setSearchText
    await this.implementMethod(
      'app/features/examenes/components/examenes-list/examenes-list.component.ts',
      'setSearchText',
      `
  /**
   * Limpia el texto de búsqueda
   */
  setSearchText(): void {
    this.searchText = '';
  }`
    );
  }

  async implementMethod(componentPath, methodName, methodImplementation) {
    const fullPath = path.join(this.srcPath, componentPath);
    
    if (!fs.existsSync(fullPath)) {
      this.errors.push(`Archivo no encontrado: ${componentPath}`);
      return;
    }

    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Verificar si ya tiene el método
      if (content.includes(`${methodName}(`)) {
        return; // Ya implementado
      }

      // Insertar el método antes del último }
      const lastBraceIndex = content.lastIndexOf('}');
      const newContent = content.slice(0, lastBraceIndex) + methodImplementation + '\n' + content.slice(lastBraceIndex);

      fs.writeFileSync(fullPath, newContent, 'utf8');
      this.implementedFiles.push({
        file: componentPath,
        method: methodName,
        type: 'method-only'
      });

    } catch (error) {
      this.errors.push(`Error procesando ${componentPath}: ${error.message}`);
    }
  }

  printResults() {
    console.log('\n📊 Resultados de Implementación:\n');
    
    if (this.implementedFiles.length === 0 && this.errors.length === 0) {
      console.log('✅ No se encontraron métodos para implementar.');
      return;
    }
    
    if (this.implementedFiles.length > 0) {
      console.log(`✅ Archivos modificados (${this.implementedFiles.length}):`);
      this.implementedFiles.forEach(({ file, method, type }) => {
        const relativePath = path.relative(this.srcPath, file);
        console.log(`   📄 ${relativePath}`);
        console.log(`      Método: ${method} (${type})`);
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
    console.log('   2. Actualizar los templates HTML para usar los métodos con parámetros');
    console.log('   3. Verificar que la funcionalidad sigue funcionando');
    console.log('   4. Ejecutar tests para validar los cambios');
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const implementer = new MissingMethodsImplementer();
  implementer.implement();
}

module.exports = MissingMethodsImplementer;
