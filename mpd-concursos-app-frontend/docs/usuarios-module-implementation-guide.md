# 👥 Guía de Implementación - Módulo Usuarios

## 🎯 **Objetivo**
Aplicar la metodología glassmorphism establecida en el módulo configuración al módulo de gestión de usuarios, siguiendo los mismos patrones y estándares de calidad.

---

## 📋 **PASO 1: Auditoría Inicial**

### **Comando de Auditoría**
```bash
# Buscar todos los archivos del módulo usuarios
find src/app/features/admin/components/usuarios -name "*.ts" -o -name "*.html" -o -name "*.scss"

# Buscar dependencias Material UI
grep -r "from '@angular/material" src/app/features/admin/components/usuarios/
```

### **Componentes a Verificar**
```
usuarios/
├── usuarios-admin.component.*           🔍 PRINCIPAL
├── components/
│   ├── usuario-form/                    📝 Formulario
│   ├── usuario-list/                    📊 Lista/Tabla
│   ├── usuario-details/                 👤 Detalles
│   ├── roles-assignment/                🔐 Asignación roles
│   └── permissions-matrix/              ⚙️ Permisos
```

### **Dependencias Material UI Típicas**
- MatTableModule → Tabla custom glassmorphism
- MatPaginatorModule → Paginación custom
- MatFormFieldModule → Form fields glassmorphism
- MatSelectModule → Select custom
- MatCheckboxModule → Checkbox glassmorphism
- MatDialogModule → Modal glassmorphism
- MatSnackBarModule → NotificationService

---

## 🔧 **PASO 2: Implementación Fase 1**

### **2.1 Actualizar usuarios-admin.component.ts**

#### **Eliminar Material UI**
```typescript
// ❌ ELIMINAR
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';

// ✅ AGREGAR
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { NotificationService } from '@core/services/notification/notification.service';
```

#### **Actualizar Constructor**
```typescript
// ❌ ANTES
constructor(
  private fb: FormBuilder,
  private usuariosService: UsuariosService,
  private snackBar: MatSnackBar,
  private dialog: MatDialog
) {}

// ✅ DESPUÉS
constructor(
  private fb: FormBuilder,
  private usuariosService: UsuariosService,
  private notificationService: NotificationService
) {}
```

#### **Agregar Sistema de Tabs**
```typescript
export class UsuariosAdminComponent implements OnInit, OnDestroy {
  // Sistema de tabs
  activeTab: string = 'list';
  
  // Estado de carga
  isLoading = false;
  
  // Datos
  usuarios: Usuario[] = [];
  roles: Rol[] = [];
  
  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }
  
  // Reemplazar MatSnackBar
  showSuccess(message: string): void {
    this.notificationService.showSuccess(message);
  }
  
  showError(message: string): void {
    this.notificationService.showError(message);
  }
}
```

### **2.2 Crear usuarios-admin.component.html**

```html
<div class="usuarios-container">
  <!-- Header glassmorphism -->
  <div class="usuarios-header">
    <h3 class="usuarios-title">Gestión de Usuarios</h3>
    <p class="usuarios-description">
      Administre usuarios, roles y permisos del sistema.
    </p>
  </div>
  
  <!-- Sistema de tabs glassmorphism -->
  <div class="usuarios-tabs-container">
    <div class="usuarios-tabs">
      <button 
        type="button" 
        class="tab-button"
        [class.active]="activeTab === 'list'"
        (click)="setActiveTab('list')">
        <span class="tab-icon">👥</span>
        <span class="tab-label">Lista de Usuarios</span>
      </button>
      
      <button 
        type="button" 
        class="tab-button"
        [class.active]="activeTab === 'roles'"
        (click)="setActiveTab('roles')">
        <span class="tab-icon">🔐</span>
        <span class="tab-label">Gestión de Roles</span>
      </button>
      
      <button 
        type="button" 
        class="tab-button"
        [class.active]="activeTab === 'permissions'"
        (click)="setActiveTab('permissions')">
        <span class="tab-icon">⚙️</span>
        <span class="tab-label">Permisos</span>
      </button>
      
      <button 
        type="button" 
        class="tab-button"
        [class.active]="activeTab === 'config'"
        (click)="setActiveTab('config')">
        <span class="tab-icon">🔧</span>
        <span class="tab-label">Configuración</span>
      </button>
    </div>
    
    <div class="tab-content-container">
      <!-- Lista de Usuarios -->
      <div class="tab-content" *ngIf="activeTab === 'list'">
        <app-usuario-list></app-usuario-list>
      </div>
      
      <!-- Gestión de Roles -->
      <div class="tab-content" *ngIf="activeTab === 'roles'">
        <app-roles-management></app-roles-management>
      </div>
      
      <!-- Matriz de Permisos -->
      <div class="tab-content" *ngIf="activeTab === 'permissions'">
        <app-permissions-matrix></app-permissions-matrix>
      </div>
      
      <!-- Configuración -->
      <div class="tab-content" *ngIf="activeTab === 'config'">
        <app-usuarios-config></app-usuarios-config>
      </div>
    </div>
  </div>
</div>
```

### **2.3 Crear usuarios-admin.component.scss**

```scss
/* ===================================================================
   USUARIOS ADMIN - GLASSMORPHISM PREMIUM DESIGN
   Basado en el design system establecido en configuración
   =================================================================== */

/* Variables del Design System Glassmorphism */
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

/* ===================================================================
   CONTENEDOR PRINCIPAL
   =================================================================== */

.usuarios-container {
  min-height: 100vh;
  padding: clamp(1rem, 2.5vw, 2rem);
  background: transparent;
  animation: fadeIn 0.6s ease-out;
}

/* ===================================================================
   HEADER GLASSMORPHISM
   =================================================================== */

.usuarios-header {
  background: var(--glass-background-primary);
  background-image: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  border: 1px solid var(--border-primary);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 12px;
  padding: clamp(1.5rem, 3vw, 2.5rem);
  margin-bottom: 2rem;
  box-shadow: var(--shadow-md), var(--shadow-inset);
  transition: var(--transition-normal);
  position: relative;
  overflow: hidden;
}

.usuarios-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.8s ease;
}

.usuarios-header:hover::before {
  left: 100%;
}

.usuarios-title {
  margin: 0 0 0.5rem 0;
  font-size: clamp(1.5rem, 4vw, 2.25rem);
  font-weight: 700;
  color: var(--text-primary);
  background: linear-gradient(135deg, var(--text-primary) 0%, var(--focus-light) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.2;
}

.usuarios-description {
  margin: 0;
  font-size: clamp(0.875rem, 2vw, 1rem);
  color: var(--text-secondary);
  font-weight: 400;
  line-height: 1.5;
}

/* ===================================================================
   SISTEMA DE TABS GLASSMORPHISM
   =================================================================== */

.usuarios-tabs-container {
  background: var(--glass-background-primary);
  background-image: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  border: 1px solid var(--border-primary);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 12px;
  box-shadow: var(--shadow-md), var(--shadow-inset);
  overflow: hidden;
  animation: slideIn 0.6s ease-out 0.2s both;
}

.usuarios-tabs {
  display: flex;
  flex-wrap: wrap;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid var(--border-primary);
  padding: 0.5rem;
  gap: 0.25rem;
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-normal);
  position: relative;
  overflow: hidden;
  min-width: fit-content;
  flex: 1;
  justify-content: center;
}

.tab-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.6s ease;
}

.tab-button:hover::before {
  left: 100%;
}

.tab-button:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: var(--border-hover);
  color: var(--text-primary);
  transform: translateY(-1px);
}

.tab-button.active {
  background: var(--glass-background-secondary);
  background-image: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%);
  border-color: var(--focus-color);
  color: var(--text-primary);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2), var(--shadow-inset);
}

.tab-icon {
  font-size: 1rem;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
}

.tab-label {
  font-weight: 600;
  white-space: nowrap;
}

/* ===================================================================
   CONTENIDO DE TABS
   =================================================================== */

.tab-content-container {
  padding: 2rem;
  min-height: 60vh;
}

.tab-content {
  animation: fadeInUp 0.4s ease-out;
}

/* ===================================================================
   ANIMACIONES
   =================================================================== */

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ===================================================================
   RESPONSIVE DESIGN
   =================================================================== */

@media (max-width: 768px) {
  .usuarios-tabs {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .tab-button {
    justify-content: flex-start;
    flex: none;
  }
  
  .tab-content-container {
    padding: 1rem;
  }
}
```

---

## 📊 **PASO 3: Componentes Hijos**

### **3.1 usuario-list Component**
- **Tabla glassmorphism** con filas hover
- **Filtros de búsqueda** glassmorphism
- **Paginación custom** con controles
- **Estados de usuario** con badges de color
- **Acciones** (Ver, Editar, Eliminar, Cambiar Estado)

### **3.2 roles-management Component**
- **Cards de roles** con efectos glassmorphism
- **Asignación de permisos** con checkboxes custom
- **Jerarquía de roles** visual
- **Creación/edición** de roles en modal

### **3.3 permissions-matrix Component**
- **Matriz visual** de permisos
- **Toggle switches** glassmorphism
- **Agrupación por módulos**
- **Herencia de permisos** visual

---

## ✅ **PASO 4: Verificación**

### **Checklist de Completitud**
- [ ] Cero dependencias Material UI
- [ ] Variables CSS del design system utilizadas
- [ ] Efectos glassmorphism implementados
- [ ] Sistema de tabs funcional
- [ ] Responsive design completo
- [ ] Accesibilidad WCAG AA
- [ ] Build exitoso sin errores
- [ ] Funcionalidad CRUD preservada

### **Testing Requerido**
- [ ] Crear usuario nuevo
- [ ] Editar usuario existente
- [ ] Asignar/quitar roles
- [ ] Cambiar permisos
- [ ] Filtrar y buscar usuarios
- [ ] Paginación funcional
- [ ] Responsive en móvil/tablet

---

## 🎯 **Resultado Esperado**

Al completar esta implementación, el módulo usuarios tendrá:

1. **✅ Design glassmorphism premium** consistente con configuración
2. **✅ Funcionalidad completa** de gestión de usuarios
3. **✅ Performance optimizado** sin Material UI
4. **✅ Experiencia de usuario** mejorada
5. **✅ Código mantenible** y documentado

**Tiempo estimado**: 2-3 semanas siguiendo la metodología establecida.

---

**Próximo paso**: Comenzar con la auditoría del módulo usuarios usando los comandos proporcionados.
