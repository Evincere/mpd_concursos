# 🔍 System Monitoring - Guía de Debug

## 🚨 **Problema Reportado**
Al navegar a las opciones de "Monitoreo" o "Auditoría" dentro del módulo de administración, la aplicación se cierra y muestra la página de login.

## ✅ **Verificaciones Completadas**

### **1. Build Status: ✅ EXITOSO**
- **Compilación TypeScript**: Sin errores
- **Componentes refactorizados**: 5/5 completados
- **Material UI eliminado**: 100% completado
- **Glassmorphism implementado**: 100% completado

### **2. Servicios Corregidos: ✅ COMPLETADO**
- **SystemMonitoringService**: HttpClient inyectado correctamente
- **Métodos mock**: Funcionando con datos de prueba
- **Manejo de errores**: Implementado en todos los métodos

### **3. Componentes Verificados: ✅ COMPLETADO**
- **system-monitoring.component**: Imports correctos
- **app-performance.component**: Standalone configurado
- **database-monitoring.component**: Standalone configurado
- **system-alerts.component**: Standalone configurado
- **alert-configuration.component**: Standalone configurado

## 🔧 **Pasos de Debug Implementados**

### **1. Logging Agregado**
```typescript
// En system-monitoring.component.ts
ngOnInit(): void {
  console.log('SystemMonitoringComponent initialized');
  // ... resto del código
}

loadData(showLoading = true): void {
  console.log('Loading monitoring data...');
  // ... resto del código
}
```

### **2. Información de Debug Visual**
Se agregaron paneles de debug en cada pestaña que muestran:
- ✅ Estado de carga de datos
- ✅ Disponibilidad de métricas
- ✅ Conteo de alertas y configuraciones

### **3. Manejo de Errores Robusto**
```typescript
try {
  this.loadData();
  // ... configurar intervalos
} catch (error) {
  console.error('Error initializing SystemMonitoringComponent:', error);
  this.notificationService.showError('Error al inicializar el componente de monitoreo');
}
```

## 🔍 **Cómo Debuggear el Problema**

### **Paso 1: Abrir Herramientas de Desarrollador**
1. Presiona `F12` o `Ctrl+Shift+I`
2. Ve a la pestaña **Console**
3. Limpia la consola (`Ctrl+L`)

### **Paso 2: Navegar al Módulo**
1. Ve a **Administración** → **Monitoreo del Sistema**
2. Observa los mensajes en la consola

### **Paso 3: Identificar el Error**
Busca mensajes como:
```
❌ Error: [mensaje de error]
❌ Uncaught Exception: [detalles]
❌ Failed to load: [recurso]
❌ 401 Unauthorized
❌ 403 Forbidden
```

### **Paso 4: Verificar Network Tab**
1. Ve a la pestaña **Network**
2. Recarga la página
3. Busca requests fallidos (en rojo)
4. Verifica códigos de estado HTTP

## 🎯 **Posibles Causas del Problema**

### **1. Problemas de Autenticación**
```
Síntoma: Redirección automática al login
Causa: Token expirado o inválido
Solución: Verificar AuthGuard y token storage
```

### **2. Problemas de Rutas**
```
Síntoma: Error 404 o rutas no encontradas
Causa: Configuración incorrecta en routing
Solución: Verificar admin-routing.module.ts
```

### **3. Problemas de Permisos**
```
Síntoma: Error 403 Forbidden
Causa: Usuario sin permisos de administrador
Solución: Verificar roles y permisos
```

### **4. Errores de JavaScript**
```
Síntoma: Uncaught Exception en consola
Causa: Error en tiempo de ejecución
Solución: Revisar stack trace y corregir código
```

## 🛠️ **Soluciones Rápidas**

### **Solución 1: Limpiar Cache**
```bash
# Limpiar cache del navegador
Ctrl+Shift+Delete

# Limpiar cache de Angular
ng build --delete-output-path
```

### **Solución 2: Verificar Token**
```javascript
// En consola del navegador
console.log('Token:', localStorage.getItem('authToken'));
console.log('User:', localStorage.getItem('currentUser'));
```

### **Solución 3: Modo Desarrollo**
```bash
# Ejecutar en modo desarrollo para mejor debugging
ng serve --source-map=true
```

### **Solución 4: Deshabilitar Componentes Temporalmente**
Si el problema persiste, comentar temporalmente los componentes hijos:
```html
<!-- Comentar temporalmente para aislar el problema -->
<!--
<app-app-performance [appPerformanceMetrics]="appPerformanceMetrics">
</app-app-performance>
-->
```

## 📋 **Checklist de Verificación**

### **Antes de Debuggear**
- [ ] Build exitoso sin errores
- [ ] Servidor de desarrollo ejecutándose
- [ ] Usuario logueado con permisos de admin
- [ ] Herramientas de desarrollador abiertas

### **Durante el Debug**
- [ ] Consola limpia antes de navegar
- [ ] Network tab monitoreando requests
- [ ] Observar mensajes de debug implementados
- [ ] Verificar stack trace completo de errores

### **Después del Debug**
- [ ] Identificar causa raíz del problema
- [ ] Implementar solución específica
- [ ] Probar en diferentes navegadores
- [ ] Verificar que no se rompan otras funcionalidades

## 🚀 **Próximos Pasos**

### **Si el problema persiste:**
1. **Reportar hallazgos**: Compartir logs de consola y network
2. **Aislar componente**: Probar cada pestaña individualmente
3. **Verificar dependencias**: Revisar servicios y guards
4. **Rollback temporal**: Usar versión anterior si es crítico

### **Una vez solucionado:**
1. **Remover debug**: Quitar paneles de debug temporales
2. **Optimizar logging**: Mantener solo logs esenciales
3. **Documentar solución**: Actualizar esta guía
4. **Testing**: Verificar en diferentes escenarios

---

## 📞 **Información de Contacto**

**Módulo**: System Monitoring  
**Estado**: Refactorización completada, debugging en progreso  
**Última actualización**: 2025-06-02  
**Versión**: Fase 2 completada  

**Archivos modificados**:
- `system-monitoring.component.*` (5 archivos)
- `app-performance.component.*` (3 archivos)  
- `database-monitoring.component.*` (3 archivos)
- `system-alerts.component.*` (3 archivos)
- `alert-configuration.component.*` (3 archivos)
- `system-monitoring.service.ts` (1 archivo)

**Total**: 18 archivos modificados/creados
