# 📧 TEMPLATE DE EMAIL - CORRECCIÓN DE CIRCUNSCRIPCIONES

## 📋 INFORMACIÓN DEL ENVÍO MASIVO

**Archivo CSV generado:** `usuarios_sin_circunscripciones_gmail.csv`  
**Total destinatarios:** 215 usuarios  
**Campos incluidos:** Nombre, DNI, Centro de Vida, Email, Teléfono  

---

## 📩 TEMPLATE SUGERIDO PARA GMAIL

### **ASUNTO:**
```
🚨 ACCIÓN REQUERIDA - Concurso Multifuero: Complete su inscripción
```

### **CUERPO DEL EMAIL:**
```
Estimado/a {{Nombre Completo}},

Esperamos que se encuentre bien. Nos contactamos desde el MINISTERIO PÚBLICO FISCAL DE MENDOZA respecto a su inscripción al CONCURSO MULTIFUERO para Co-Defensor/Co-Asesor Multifuero - Clase 03.

🔍 SITUACIÓN DETECTADA:
Su inscripción está técnicamente completa y su documentación ha sido recibida correctamente. Sin embargo, detectamos que falta completar la SELECCIÓN DE CIRCUNSCRIPCIONES, paso obligatorio para validar su participación en el concurso.

📋 DATOS DE SU INSCRIPCIÓN:
• DNI: {{DNI}}
• Centro de vida registrado: {{Centro de Vida}}
• Estado actual: Pendiente de selección de circunscripciones

⚠️ ACCIÓN REQUERIDA:
Debe ingresar al sistema de inscripciones y completar la selección de circunscripciones donde desea participar. Este paso es OBLIGATORIO y su inscripción no será válida sin esta información.

🖥️ CÓMO COMPLETAR:
1. Ingrese a: [URL del sistema de inscripciones]
2. Inicie sesión con su usuario y contraseña
3. En su panel principal verá una notificación para completar circunscripciones
4. Seleccione las circunscripciones de su interés
5. Guarde los cambios

⏰ TIEMPO LÍMITE:
Tiene hasta el 13 de agosto de 2025 a las 23:59 horas para completar este paso. Pasada esta fecha, su inscripción podría quedar sin efecto.

📞 SOPORTE TÉCNICO:
Si tiene dificultades técnicas para completar este paso, puede contactarnos:
• Email: [email de soporte]
• Teléfono: [teléfono de soporte]
• Horarios: Lunes a viernes de 8:00 a 18:00

✅ CONFIRMACIÓN:
Una vez completada la selección de circunscripciones, recibirá un email de confirmación automático del sistema.

Agradecemos su atención y esperamos su pronta acción para completar su inscripción.

Saludos cordiales,

MINISTERIO PÚBLICO FISCAL DE MENDOZA
Área de Concursos
```

---

## 🔧 INSTRUCCIONES DE USO EN GMAIL

### **PASO 1: PREPARAR GMAIL**
1. Acceder a Gmail con cuenta institucional
2. Habilitar "Envío masivo" si no está activado
3. Verificar límites de envío diario (500-2000 según tipo de cuenta)

### **PASO 2: IMPORTAR CONTACTOS**
1. Ir a Google Contacts
2. Importar el archivo `usuarios_sin_circunscripciones_gmail.csv`
3. Verificar que los campos se mapeen correctamente:
   - Nombre → Nombre
   - Email → Email
   - DNI, Centro de Vida, Teléfono → Campos personalizados

### **PASO 3: CREAR CAMPAÑA DE EMAIL**
1. Usar extensión como "Mail Merge" o "Yet Another Mail Merge"
2. Crear plantilla con variables:
   - `{{Nombre Completo}}` → Campo Nombre
   - `{{DNI}}` → Campo personalizado DNI
   - `{{Centro de Vida}}` → Campo personalizado Centro de Vida

### **PASO 4: CONFIGURAR ENVÍO**
- **Frecuencia:** Máximo 50 emails por lote (para evitar spam)
- **Intervalo:** 30 segundos entre lotes
- **Seguimiento:** Habilitar recibo de lectura
- **Reply-to:** Configurar email de soporte

### **PASO 5: MONITOREO**
- **Emails enviados:** Verificar en "Enviados"
- **Rebotes:** Revisar emails devueltos
- **Respuestas:** Monitorear consultas en bandeja de entrada

---

## 📊 SEGMENTACIÓN RECOMENDADA

### **OPCIÓN A: ENVÍO COMPLETO (215 usuarios)**
- Ventaja: Notificación simultánea
- Desventaja: Posible saturación del sistema de soporte

### **OPCIÓN B: ENVÍO ESCALONADO**
```
Lote 1 (50 usuarios): Casos más antiguos (>10 días)
Lote 2 (50 usuarios): Casos intermedios (5-10 días)  
Lote 3 (50 usuarios): Casos recientes (1-5 días)
Lote 4 (65 usuarios): Resto de usuarios
```

### **OPCIÓN C: ENVÍO POR URGENCIA**
```
CRÍTICO (62 usuarios): Más de 5 días → Envío inmediato
NORMAL (153 usuarios): Menos de 5 días → Envío mañana
```

---

## 🎯 MÉTRICAS DE SEGUIMIENTO

### **KPIs A MONITOREAR:**
- **Emails enviados exitosamente:** Objetivo 100%
- **Tasa de apertura:** Objetivo >80%
- **Respuestas recibidas:** Esperado ~10-20%
- **Correcciones completadas:** Objetivo >90% en 48h

### **DASHBOARD RECOMENDADO:**
```
📈 Emails enviados: XXX/215 (XX%)
📬 Emails abiertos: XXX (XX%)
💬 Respuestas: XXX 
✅ Correcciones completadas: XXX/215 (XX%)
⏱️ Tiempo promedio de corrección: XX horas
```

---

## ⚠️ CONSIDERACIONES IMPORTANTES

### **TÉCNICAS:**
- **Límites Gmail:** No exceder 500 emails/día para cuentas normales
- **Deliverability:** Usar servidor SMTP institucional si es posible
- **Personalización:** Gmail detecta emails masivos no personalizados

### **LEGALES:**
- **GDPR/Protección de datos:** Los emails son de usuarios registrados voluntariamente
- **Opt-out:** Incluir opción de darse de baja si corresponde
- **Registro:** Mantener logs de envío para auditoría

### **OPERATIVAS:**
- **Soporte técnico:** Preparar equipo para aumento de consultas
- **Respuestas tipo:** Crear templates para consultas frecuentes
- **Escalación:** Definir proceso para casos complejos

---

## 📁 ARCHIVOS RELACIONADOS

1. **`usuarios_sin_circunscripciones_gmail.csv`** → Lista de destinatarios
2. **`plan_correccion_circunscripciones_usuarios.md`** → Plan técnico de implementación
3. **`auditoria_usuarios_completed_with_docs_20250812.md`** → Auditoría completa del problema

---

**Template preparado para envío masivo**  
**Estado:** ✅ Listo para usar  
**Destinatarios verificados:** 215 usuarios sin circunscripciones  
**Impacto esperado:** >90% de corrección en 48 horas
