# PLAN DE RECUPERACIÓN MANUAL - OPCIÓN INMEDIATA

## 🎯 Objetivo
Recuperar documentos críticos mediante contacto directo con usuarios afectados.

## 👥 Usuarios Críticos a Contactar (28 usuarios)
23520516, 24467884, 26569905, 27544194, 27651864, 27931606, 28226117, 28511308, 29267571, 29277615, 30108615, 30724462, 30984162, 31432016, 31737951, 31821855, 31854739, 32161223, 33579011, 33583216, 36746208, 36859594, 37002217, 37513884, 38207799, 39238641, 40787955, 41991997

## 📧 Proceso de Contacto

### 1. Obtener emails de usuarios
```sql
SELECT u.email, u.first_name, u.last_name, u.dni 
FROM user_entity u 
WHERE u.dni IN ('23520516', '24467884', '26569905', ...);
```

### 2. Crear mensaje personalizado
```
Estimado/a [NOMBRE],

Le escribimos para informarle sobre un inconveniente técnico que afectó 
la visualización de documentos subidos entre el 4 y 5 de agosto de 2025.

DOCUMENTOS AFECTADOS:
- Sus documentos subidos el [FECHA] no son visibles actualmente
- El problema técnico ha sido resuelto completamente
- Necesitamos que vuelva a subir los siguientes documentos:

[LISTA DE DOCUMENTOS ESPECÍFICOS DEL USUARIO]

ACCIONES REQUERIDAS:
1. Ingresar a la plataforma: https://vps-4778464-x.dattaweb.com/login
2. Ir a la sección de documentos
3. Volver a subir los documentos indicados

El sistema ahora funciona correctamente y sus documentos serán 
procesados sin problemas.

Disculpe las molestias ocasionadas.

Atentamente,
Equipo Técnico MPD Concursos
```

### 3. Implementar seguimiento
- Lista de usuarios contactados
- Confirmación de re-subida
- Soporte técnico para dudas

## 📊 Ventajas de esta Opción
- ✅ Sin riesgo técnico
- ✅ Mantiene 180+ documentos recuperados
- ✅ Proceso controlado y supervisado
- ✅ Comunicación directa con usuarios
- ✅ Ejecutable inmediatamente

## ⏱️ Tiempo Estimado
- Preparación de emails: 2 horas
- Envío masivo: 1 hora
- Seguimiento: 1-2 semanas
- Recuperación gradual: 70-80% esperado
