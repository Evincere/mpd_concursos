# 🧪 Testing de Seguridad - Punto 12: Validación de Período de Inscripción

## 📋 Descripción

Este documento describe cómo probar la corrección implementada para el **Punto 12** de la auditoría de seguridad: "Falla en la Lógica de Negocio: Inscripción Fuera de Término".

## 🎯 Objetivo de la Prueba

Verificar que el sistema **rechaza correctamente** los intentos de inscripción en concursos que tienen el período de inscripción cerrado, tanto por fechas como por estado.

## 🧪 Concurso de Prueba Creado

Se agregó un cuarto concurso específicamente para testing:

### **Concurso de Prueba - Características:**
- **Título**: "🧪 CONCURSO DE PRUEBA - Secretario/a Judicial Clase 02 (PERÍODO CERRADO)"
- **Estado**: `INSCRIPTION_CLOSED`
- **Período de Inscripción**: Cerrado (hace 15 días)
- **Fechas de Inscripción**: 
  - Inicio: Hace 45 días
  - Fin: Hace 15 días (CERRADO)

### **Fechas del Concurso de Prueba:**
1. **Inscripción**: ❌ CERRADA (hace 15 días)
2. **Evaluación**: ✅ FINALIZADA (hace 5 días)
3. **Examen**: ✅ FINALIZADO (hace 3 días)
4. **Entrevista**: 🔄 PRÓXIMAMENTE (en 5 días)
5. **Resultados**: ⏳ PENDIENTE (en 10 días)

## 🔧 Métodos de Prueba

### **Método 1: Script Automatizado**

```powershell
# Ejecutar desde el directorio concurso-backend
.\scripts\test-security-point-12.ps1
```

**Resultado Esperado:**
```
✅ ÉXITO: Inscripción rechazada correctamente (403 Forbidden)
```

### **Método 2: Prueba Manual con cURL**

```bash
# 1. Obtener lista de concursos
curl -X GET http://localhost:8080/api/contests

# 2. Identificar el concurso de prueba (buscar "PERÍODO CERRADO")

# 3. Intentar inscripción (debe fallar con 403)
curl -X POST http://localhost:8080/api/inscriptions \
  -H "Content-Type: application/json" \
  -d '{
    "contestId": [ID_DEL_CONCURSO_DE_PRUEBA],
    "userId": "123e4567-e89b-12d3-a456-426614174000"
  }'
```

### **Método 3: Prueba desde Frontend**

1. **Acceder a la lista de concursos** en el frontend
2. **Localizar el concurso de prueba** (marcado con 🧪)
3. **Verificar que el botón de inscripción esté deshabilitado**
4. **Verificar que se muestre el mensaje**: "Las inscripciones cerraron el [fecha]"

## ✅ Criterios de Éxito

### **Backend (Validación Autoritativa):**
- ✅ **HTTP 403 Forbidden** cuando se intenta inscripción
- ✅ **Mensaje específico** sobre período cerrado
- ✅ **Log de auditoría** registra el intento
- ✅ **No se crea inscripción** en la base de datos

### **Frontend (Validación Preventiva):**
- ✅ **Botón deshabilitado** para concursos cerrados
- ✅ **Mensaje informativo** sobre el estado
- ✅ **Estilo visual apropiado** (amber/warning)
- ✅ **Manejo de error 403** si se intenta por API

## 🚨 Indicadores de Falla

### **❌ Vulnerabilidad Presente Si:**
- La inscripción se crea exitosamente (HTTP 200/201)
- No se valida el período de inscripción
- No se registra el intento en logs
- El frontend permite la inscripción

### **⚠️ Problemas Parciales Si:**
- Error diferente a 403 (ej: 401, 500)
- Mensaje de error genérico
- Falta de logging de auditoría

## 📊 Escenarios de Prueba

### **Escenario 1: Concurso con Período Cerrado por Fechas**
- **Estado**: `PUBLISHED`
- **Fecha Fin Inscripción**: En el pasado
- **Resultado Esperado**: 403 Forbidden

### **Escenario 2: Concurso con Estado Cerrado**
- **Estado**: `INSCRIPTION_CLOSED`
- **Resultado Esperado**: 403 Forbidden

### **Escenario 3: Concurso con Período No Iniciado**
- **Estado**: `PUBLISHED`
- **Fecha Inicio Inscripción**: En el futuro
- **Resultado Esperado**: 403 Forbidden

### **Escenario 4: Concurso Abierto (Control)**
- **Estado**: `INSCRIPTION_OPEN` o `PUBLISHED` con fechas válidas
- **Resultado Esperado**: Inscripción exitosa

## 🔍 Verificación de Logs

Buscar en los logs del backend:

```
WARN - Intento de inscripción rechazado - Concurso [ID] ('[TÍTULO]') no está abierto para inscripciones. Usuario: [USER_ID]
```

## 📝 Notas Importantes

1. **El concurso de prueba es permanente** - se crea automáticamente al iniciar la aplicación
2. **Las fechas son relativas** - siempre estarán cerradas independientemente de cuándo se ejecute
3. **Es seguro para producción** - claramente marcado como concurso de prueba
4. **No interfiere con concursos reales** - tiene identificadores únicos

## 🎯 Conclusión

Si todas las pruebas pasan exitosamente, la corrección del **Punto 12** está funcionando correctamente y la vulnerabilidad de lógica de negocio ha sido cerrada.
