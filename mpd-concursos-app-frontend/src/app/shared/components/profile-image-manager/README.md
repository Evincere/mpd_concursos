# ProfileImageManagerComponent

## 📋 Descripción

Componente unificado para gestión de imágenes de perfil que reemplaza todos los componentes anteriores de upload de imagen. Implementa el glassmorphism design system y mejores prácticas de UX/UI.

## 🔄 Componentes Reemplazados

Este componente unifica y reemplaza:
- `ProfileImageUploadComponent`
- `ProfileImageManagerComponent` (versión anterior)
- `PerfilPersonalInfoComponent` (funcionalidad de imagen)

## ✨ Características

- ✅ **Glassmorphism Design System**: Implementa el sistema de diseño unificado
- ✅ **Notificaciones Toast**: Integración con UnifiedNotificationService
- ✅ **Responsive Design**: Adaptable a diferentes tamaños de pantalla
- ✅ **Accesibilidad WCAG AA**: Cumple estándares de accesibilidad
- ✅ **Validaciones Robustas**: Tipo, tamaño y dimensiones de imagen
- ✅ **Estados de Carga**: Feedback visual durante uploads
- ✅ **Manejo de Errores**: Gestión elegante de errores sin popups
- ✅ **Múltiples Tamaños**: Configuraciones small, medium, large
- ✅ **Signals**: Implementación moderna con Angular Signals

## 🚀 Uso Básico

```typescript
import { ProfileImageManagerComponent } from '@shared/components/profile-image-manager/profile-image-manager.component';

@Component({
  imports: [ProfileImageManagerComponent],
  template: `
    <app-profile-image-manager
      (imageUploaded)="onImageUploaded($event)"
      (imageRemoved)="onImageRemoved()"
      (uploadError)="onUploadError($event)">
    </app-profile-image-manager>
  `
})
export class MyComponent {
  onImageUploaded(imageUrl: string): void {
    console.log('Nueva imagen:', imageUrl);
  }
  
  onImageRemoved(): void {
    console.log('Imagen eliminada');
  }
  
  onUploadError(error: string): void {
    console.error('Error:', error);
  }
}
```

## 📝 API del Componente

### Inputs

| Propiedad | Tipo | Valor por defecto | Descripción |
|-----------|------|-------------------|-------------|
| `initialImageUrl` | `string \| null` | `null` | URL inicial de la imagen |
| `showRemoveButton` | `boolean` | `true` | Mostrar botón de eliminar |
| `showUploadInfo` | `boolean` | `true` | Mostrar información de upload |
| `imageAlt` | `string` | `'Imagen de perfil'` | Texto alternativo para la imagen |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Tamaño del componente |

### Outputs

| Evento | Tipo | Descripción |
|--------|------|-------------|
| `imageUploaded` | `EventEmitter<string>` | Se emite cuando se sube una imagen exitosamente |
| `imageRemoved` | `EventEmitter<void>` | Se emite cuando se elimina la imagen |
| `uploadError` | `EventEmitter<string>` | Se emite cuando ocurre un error en el upload |

## 🎨 Configuraciones de Tamaño

### Small (80px)
```html
<app-profile-image-manager 
  size="small"
  [showUploadInfo]="false">
</app-profile-image-manager>
```

### Medium (120px) - Por defecto
```html
<app-profile-image-manager>
</app-profile-image-manager>
```

### Large (160px)
```html
<app-profile-image-manager 
  size="large"
  [showUploadInfo]="true">
</app-profile-image-manager>
```

## 🔧 Configuraciones Avanzadas

### Solo Upload (sin eliminar)
```html
<app-profile-image-manager 
  [showRemoveButton]="false"
  [showUploadInfo]="false">
</app-profile-image-manager>
```

### Con Imagen Inicial
```html
<app-profile-image-manager 
  [initialImageUrl]="user.profileImage"
  imageAlt="Foto de perfil del usuario">
</app-profile-image-manager>
```

### Manejo Completo de Eventos
```html
<app-profile-image-manager 
  (imageUploaded)="handleImageUpload($event)"
  (imageRemoved)="handleImageRemoval()"
  (uploadError)="handleUploadError($event)">
</app-profile-image-manager>
```

## 📱 Responsive Design

El componente se adapta automáticamente a diferentes tamaños de pantalla:

- **Desktop**: Diseño completo con todos los elementos
- **Tablet**: Botones apilados verticalmente
- **Mobile**: Componente optimizado para touch

## ♿ Accesibilidad

- **ARIA Labels**: Etiquetas descriptivas para lectores de pantalla
- **Keyboard Navigation**: Navegación completa por teclado
- **Focus Management**: Gestión adecuada del foco
- **High Contrast**: Soporte para modo de alto contraste
- **Reduced Motion**: Respeta preferencias de movimiento reducido

## 🔒 Validaciones

### Frontend
- Tipo de archivo: Solo imágenes (JPG, PNG, GIF)
- Tamaño máximo: 5MB
- Extensiones permitidas: .jpg, .jpeg, .png, .gif

### Backend
- Validación real de imagen con ImageIO
- Redimensionamiento automático a 256x256px (mantiene proporción)
- Rate limiting: 5 uploads por minuto
- Path traversal protection
- Sanitización de nombres de archivo
- Procesamiento de alta calidad con Graphics2D

## 🎯 Migración desde Componentes Anteriores

### Desde ProfileImageUploadComponent
```typescript
// ANTES
<app-profile-image-upload 
  (imageUploaded)="onUpload($event)">
</app-profile-image-upload>

// DESPUÉS
<app-profile-image-manager 
  (imageUploaded)="onUpload($event)"
  [showRemoveButton]="false">
</app-profile-image-manager>
```

### Desde PerfilPersonalInfoComponent
```typescript
// ANTES
<div class="profile-photo-section">
  <!-- Lógica compleja de upload -->
</div>

// DESPUÉS
<app-profile-image-manager 
  [initialImageUrl]="userProfile.profileImageUrl"
  (imageUploaded)="updateUserProfile($event)">
</app-profile-image-manager>
```

## 🚨 Notas Importantes

1. **Dependencias**: Requiere UnifiedNotificationService para notificaciones
2. **Estilos**: Usa el sistema glassmorphism unificado
3. **Servicios**: Integrado con UserProfileService y AuthService
4. **Signals**: Implementación moderna con Angular Signals

## 🔍 Troubleshooting

### Error: "Cannot resolve UnifiedNotificationService"
Asegúrate de que el servicio esté disponible en el injector:
```typescript
providers: [UnifiedNotificationService]
```

### Estilos no se aplican correctamente
Verifica que el sistema glassmorphism esté importado:
```scss
@import 'src/styles/unified-glassmorphism-system';
```

### Imágenes no se cargan
Verifica la configuración del proxy y las URLs del backend.

## 📚 Ejemplos Adicionales

Ver `profile-image-manager-demo.component.ts` para ejemplos completos de uso.
