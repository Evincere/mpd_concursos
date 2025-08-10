# 🔍 INVESTIGACIÓN: Sistema de Notificaciones para Deploy

## ✅ SISTEMA EXISTENTE ENCONTRADO

### 🎯 **Backend - Sistema Completo de Notificaciones**

#### **1. Endpoints Disponibles**:
- **✅ `/api/v1/notifications/mass`** - Envío masivo de notificaciones
- **✅ Requiere rol ADMIN** - `@PreAuthorize("hasRole('ROLE_ADMIN')")`

#### **2. Servicios Disponibles**:
- **✅ `MassNotificationService`** - Procesamiento asíncrono de notificaciones masivas
- **✅ `NotificationService`** - Envío individual de notificaciones  
- **✅ Soporte para usuarios específicos** - `recipientIds: UUID[]`
- **✅ Soporte para roles** - `recipientRoles: RoleEnum[]` (ROLE_USER, ROLE_ADMIN)

#### **3. Tipos de Notificación**:
- **✅ `SYSTEM`** - Para avisos de mantenimiento
- **✅ `GENERAL`** - Para comunicaciones generales
- **✅ `CONTEST`** - Para concursos  
- **✅ `INSCRIPTION`** - Para inscripciones

#### **4. Niveles de Confirmación**:
- **✅ `NONE`** - Sin confirmación (ideal para mantenimiento)
- **✅ `SIMPLE`** - Confirmación simple
- **✅ `SIGNATURE_BASIC`** - Firma básica
- **✅ `SIGNATURE_ADVANCED`** - Firma avanzada

### 🎯 **Frontend - Sistema WebSocket y UI**

#### **1. Servicios Disponibles**:
- **✅ `WebSocketNotificationsService`** - Notificaciones en tiempo real
- **✅ `MassNotificationsService`** - Interfaz para notificaciones masivas
- **✅ `AdminNotificationsService`** - Administración de notificaciones

#### **2. Templates Existentes**:
- **✅ "Actualización del sistema"** - Template específico para mantenimiento
- **✅ Soporte para variables** - `{{usuario.nombre}}`, `{{sistema.fecha}}`

## 📊 **IDENTIFICACIÓN DE USUARIOS ACTIVOS**

### **❌ Limitación Detectada**:
- **No hay endpoint específico** para usuarios activos
- **Dashboard monitoring** no incluye usuarios activos
- **JWT no trackea sesiones activas** en tiempo real

### **✅ Soluciones Identificadas**:

#### **1. Por Logs (Método Actual)**:
```bash
# Usuarios activos últimos 5 minutos
docker logs mpd-concursos-backend --since="5m" | grep "DEBUG UserMapper.*entity.getId" | cut -d"'" -f2 | sort | uniq
```

#### **2. Por Roles (Método Recomendado)**:
- **`recipientRoles: ["ROLE_USER"]`** - Todos los usuarios registrados
- **Procesamiento asíncrono** - No bloquea el sistema
- **Notificación instantánea** via WebSocket

## 🚀 **ESTRATEGIA DE IMPLEMENTACIÓN**

### **OPCIÓN 1: Notificación Masiva por Rol** ⭐ **RECOMENDADA**
```json
{
  "recipientRoles": ["ROLE_USER"],
  "subject": "⚠️ Mantenimiento Programado - 2 minutos",
  "content": "El sistema estará en mantenimiento por 2-3 minutos. Guarde su trabajo. Disculpe las molestias.",
  "type": "SYSTEM", 
  "acknowledgementLevel": "NONE",
  "metadata": {
    "maintenanceType": "deployment",
    "estimatedDuration": "3 minutes",
    "priority": "HIGH"
  }
}
```

### **OPCIÓN 2: Script para Usuarios Activos Específicos**
1. **Extraer IDs** de usuarios activos desde logs
2. **Convertir a UUIDs** para `recipientIds`  
3. **Enviar notificación** solo a usuarios activos

### **OPCIÓN 3: Crear Endpoint de Usuarios Activos** (Desarrollo futuro)
- **Endpoint**: `/api/admin/users/active`
- **Parámetros**: `?minutes=5` (últimos X minutos)
- **Response**: Lista de UUIDs de usuarios activos

## 📋 **IMPLEMENTACIÓN PRÁCTICA**

### **Script de Notificación Pre-Deploy**:

```bash
#!/bin/bash
# notificar_mantenimiento.sh

# 1. Obtener token admin
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin_password"}' \
  | jq -r '.token')

# 2. Enviar notificación masiva  
curl -X POST http://localhost:8080/api/v1/notifications/mass \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "recipientRoles": ["ROLE_USER"],
    "subject": "⚠️ Mantenimiento del Sistema - 2 minutos",
    "content": "Estimado usuario,\n\nEn 2 minutos realizaremos un mantenimiento del sistema que durará aproximadamente 3 minutos.\n\nPor favor, guarde su trabajo.\n\nDisculpe las molestias.\n\nEquipo Técnico",
    "type": "SYSTEM",
    "acknowledgementLevel": "NONE",
    "metadata": {
      "maintenanceType": "critical_fixes", 
      "estimatedDuration": "3 minutes",
      "priority": "HIGH",
      "autoClose": true
    }
  }'

# 3. Esperar 2 minutos
echo "Notificación enviada. Esperando 2 minutos antes del deploy..."
sleep 120

# 4. Proceder con deploy
echo "Iniciando deployment..."
```

## 📱 **WebSocket y Notificaciones en Tiempo Real**

### **✅ Sistema Funcional**:
- **WebSocket configurado** para notificaciones instantáneas  
- **Reconexión automática** si se desconecta
- **Tipos específicos** de mensaje (`SYSTEM_ALERT`, `REAL_TIME_UPDATE`)
- **Filtrado por módulo** y prioridad

### **Flujo de Notificación**:
1. **Admin envía** notificación masiva via REST API
2. **Backend procesa** asíncronamente y envía a cada usuario
3. **Frontend recibe** via WebSocket instantáneamente
4. **Usuario ve** notificación en tiempo real en la UI

## 💡 **RECOMENDACIÓN FINAL**

### **✅ FACTIBLE**: El sistema permite enviar notificaciones a usuarios activos
### **✅ INMEDIATO**: Se puede implementar en menos de 10 minutos
### **✅ NO INVASIVO**: No requiere cambios en base de datos ni código crítico
### **✅ EFECTIVO**: Notificación instantánea via WebSocket

**PROPUESTA**: Implementar Script de Notificación Pre-Deploy para avisar a usuarios antes del mantenimiento.
