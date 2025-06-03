# Guía de Mantenimiento - Glassmorphism Design System

## 🎨 **Variables CSS del Design System**

### **Ubicación de Variables**
Las variables del design system están definidas en `:root` en cada componente. Para mantener consistencia:

```scss
:root {
  --glass-background-primary: rgba(55, 65, 81, 0.8);
  --glass-background-secondary: rgba(75, 85, 99, 0.9);
  --text-primary: #f9fafb;
  --text-secondary: #d1d5db;
  --text-muted: #6b7280;
  --focus-color: #3b82f6;
  --focus-light: #60a5fa;
  --success-color: #22c55e;
  --warning-color: #f59e0b;
  --error-color: #ef4444;
  --input-background: #4b5563;
  --border-primary: rgba(255, 255, 255, 0.1);
  --border-hover: rgba(255, 255, 255, 0.2);
  --border-focus: rgba(59, 130, 246, 0.3);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.2), 0 2px 8px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.3), 0 4px 12px rgba(0, 0, 0, 0.2);
  --shadow-inset: inset 0 1px 0 rgba(255, 255, 255, 0.1);
  --transition-normal: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### **Reglas de Modificación**
1. **NO modificar** variables existentes sin revisar impacto global
2. **Crear nuevas variables** para nuevos componentes siguiendo naming convention
3. **Mantener consistencia** en valores de transparencia y colores
4. **Documentar cambios** en este archivo

## 🏗️ **Estructura de Componentes Glassmorphism**

### **Patrón Base para Contenedores**
```scss
.component-container {
  background: var(--glass-background-primary);
  background-image: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  border: 1px solid var(--border-primary);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 12px;
  box-shadow: var(--shadow-md), var(--shadow-inset);
  transition: var(--transition-normal);
  position: relative;
  overflow: hidden;
}
```

### **Patrón de Efectos Hover**
```scss
.component-container:hover {
  border-color: var(--border-hover);
  box-shadow: var(--shadow-lg), var(--shadow-inset);
  transform: translateY(-1px);
}
```

### **Patrón de Brillo Deslizante**
```scss
.component-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.8s ease;
}

.component-container:hover::before {
  left: 100%;
}
```

## 🎯 **Mejores Prácticas**

### **1. Formularios Glassmorphism**
```scss
.form-input {
  background-color: var(--input-background);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  transition: var(--transition-normal);
}

.form-input:focus {
  border-color: var(--focus-color);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  background-color: rgba(75, 85, 99, 0.95);
}
```

### **2. Botones Semánticos**
```scss
.btn-primary {
  background: var(--focus-color);
  background-image: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  border-color: var(--focus-color);
  color: white;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.btn-secondary {
  background: transparent;
  border-color: var(--border-primary);
  color: var(--text-secondary);
}
```

### **3. Toggle Switches Custom**
```scss
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--input-background);
  border: 1px solid var(--border-primary);
  transition: var(--transition-normal);
  border-radius: 24px;
  box-shadow: var(--shadow-inset);
}

input:checked + .toggle-slider {
  background: var(--focus-color);
  border-color: var(--focus-color);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}
```

## 📱 **Responsive Design**

### **Breakpoints Estándar**
```scss
// Desktop
@media (min-width: 1024px) {
  // Estilos desktop
}

// Tablet
@media (max-width: 1024px) {
  // Estilos tablet
}

// Mobile
@media (max-width: 768px) {
  // Estilos mobile
}

// Small Mobile
@media (max-width: 480px) {
  // Estilos mobile pequeño
}
```

### **Técnicas Recomendadas**
1. **CSS Grid**: `repeat(auto-fit, minmax(250px, 1fr))`
2. **Flexbox**: Para layouts flexibles
3. **Clamp()**: Para tipografía fluida
4. **Viewport units**: Para espaciado adaptativo

## ⚡ **Optimización de Performance**

### **Animaciones Eficientes**
```scss
// ✅ CORRECTO - GPU accelerated
.element {
  transform: translateY(-1px);
  transition: transform 0.3s ease;
}

// ❌ INCORRECTO - Causa reflow
.element {
  top: -1px;
  transition: top 0.3s ease;
}
```

### **Selectores Optimizados**
```scss
// ✅ CORRECTO - Específico y eficiente
.component-container .form-input {
  // estilos
}

// ❌ INCORRECTO - Demasiado genérico
input {
  // estilos
}
```

## 🔧 **Debugging y Troubleshooting**

### **Problemas Comunes**

#### **1. Backdrop-filter no funciona**
```scss
// Solución: Agregar prefijo webkit
backdrop-filter: blur(8px);
-webkit-backdrop-filter: blur(8px);
```

#### **2. Animaciones lentas**
```scss
// Solución: Usar transform en lugar de propiedades que causan reflow
transform: translateY(-1px);
// En lugar de: top, left, width, height
```

#### **3. Contraste insuficiente**
```scss
// Verificar que los contrastes cumplan WCAG AA (4.5:1)
color: var(--text-primary); // #f9fafb
background: var(--glass-background-primary); // rgba(55, 65, 81, 0.8)
```

### **Herramientas de Verificación**
1. **Chrome DevTools**: Lighthouse para accessibility
2. **Contrast Checker**: WebAIM contrast checker
3. **Performance**: Chrome DevTools Performance tab
4. **Responsive**: Chrome DevTools Device Mode

## 📋 **Checklist de Nuevos Componentes**

### **Antes de Implementar**
- [ ] Revisar si existe patrón similar
- [ ] Definir variables CSS necesarias
- [ ] Planificar responsive behavior
- [ ] Considerar accesibilidad

### **Durante Implementación**
- [ ] Usar variables CSS del design system
- [ ] Implementar efectos glassmorphism estándar
- [ ] Agregar estados hover y focus
- [ ] Incluir animaciones apropiadas
- [ ] Implementar responsive design

### **Después de Implementar**
- [ ] Verificar contrastes WCAG AA
- [ ] Probar navegación por teclado
- [ ] Verificar en diferentes dispositivos
- [ ] Optimizar performance
- [ ] Documentar patrones nuevos

## 🚀 **Extensión a Nuevos Módulos**

### **Pasos para Refactorizar Módulo**
1. **Auditoría**: Identificar dependencias Material UI
2. **Planificación**: Mapear componentes a refactorizar
3. **Eliminación**: Remover imports Material UI
4. **Implementación**: Aplicar patrones glassmorphism
5. **Verificación**: Testing y optimización
6. **Documentación**: Actualizar guías

### **Orden Recomendado**
1. Componentes principales (containers)
2. Formularios y inputs
3. Botones y controles
4. Tablas y listas
5. Modales y overlays
6. Navegación y menús

## 📚 **Referencias**

- **Glassmorphism Design System Guide**: `glassmorphism-design-system-guide.md`
- **Phase 3 Verification**: `glassmorphism-refactor-phase3-verification.md`
- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **CSS Variables**: https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties

---

**Última actualización**: 2025-06-02  
**Versión**: 1.0.0  
**Mantenido por**: Equipo de Desarrollo Frontend
