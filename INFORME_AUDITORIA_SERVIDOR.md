# 📊 INFORME DE AUDITORÍA DE REQUERIMIENTOS DEL SERVIDOR
## Sistema de Concursos MPD - Análisis de Capacidad para Producción

**Fecha:** Junio 2025  
**Servidor Actual:** DonWeb VPS - 2 vCPUs, 2 GB RAM, 20 GB SSD  
**Usuarios Estimados:** 300 usuarios en 2 semanas  
**Actividad:** Registro, inscripción y carga de documentación  

---

## 🔍 RESUMEN EJECUTIVO

### Configuración Actual del Servidor
- **Procesamiento:** 2 vCPUs, 2 GB RAM
- **Almacenamiento:** 20 GB SSD (12.05 GB utilizados, 7.95 GB disponibles)
- **Transferencia:** 2000 GB mensuales (0.93 GB utilizados)
- **Software:** Docker/Ubuntu 22.04
- **IP:** 149.50.132.23

### Veredicto General
⚠️ **CAPACIDAD LIMITADA** - El servidor actual puede manejar la carga inicial, pero requiere monitoreo constante y optimizaciones específicas.

---

## 📋 ANÁLISIS DE DOCUMENTACIÓN REQUERIDA

### Tipos de Documentos por Usuario
Según el análisis del código, cada usuario debe cargar:

1. **DNI (Frente)** - Obligatorio
2. **DNI (Dorso)** - Obligatorio  
3. **Título Universitario** - Obligatorio
4. **Constancia de CUIL** - Obligatorio
5. **Certificado de Antecedentes Penales** - Obligatorio
6. **Certificado de Ejercicio Profesional** - Obligatorio
7. **Certificado de Sanciones Disciplinarias** - Obligatorio
8. **Certificado Ley Micaela** - Obligatorio (según configuración)

**Total:** 7-8 documentos obligatorios por usuario

### Límites de Archivos Configurados
- **Tamaño máximo por archivo:** 20 MB (backend) / 10 MB (frontend)
- **Tipos permitidos:** PDF
- **Calidad PDF:** Mínimo 150 DPI
---
## 📊 ESTIMACIÓN DE ALMACENAMIENTO

### Cálculo por Usuario
```
Documentos por usuario: 8 archivos
Tamaño promedio estimado por documento:
- DNI (frente/dorso): 2 MB c/u = 4 MB
- Título universitario: 3 MB
- Constancia CUIL: 1 MB  
- Antecedentes penales: 2 MB
- Certificado profesional: 2 MB
- Certificado sanciones: 2 MB
- Certificado Ley Micaela: 1 MB

Total por usuario: ~15 MB
```

### Proyección para 300 Usuarios
```
300 usuarios × 15 MB = 4.5 GB de documentos
+ Base de datos (~500 MB estimado)
+ Sistema operativo y aplicación (~5 GB)
+ Logs y temporales (~1 GB)
= Total estimado: ~11 GB
```

### Estado Actual vs Requerido
- **Disponible:** 7.95 GB
- **Requerido:** ~11 GB
- **Déficit:** ~3 GB

⚠️ **RIESGO ALTO:** Espacio insuficiente para la carga completa de documentos.

---

## 🚀 ANÁLISIS DE TRÁFICO Y RENDIMIENTO

### Actividad Esperada en 2 Semanas
```
300 usuarios realizando:
1. Registro de cuenta (1 vez)
2. Inscripción a concurso (1 vez)  
3. Carga de 8 documentos (8 uploads)
4. Verificación de estado (5-10 consultas)

Total de operaciones: ~3,500 operaciones
Promedio diario: ~250 operaciones
Pico estimado: ~500 operaciones/día
```

### Análisis de Concurrencia
```
Usuarios simultáneos pico: 20-30 usuarios
Uploads simultáneos máximos: 10-15
Memoria RAM requerida:
- Spring Boot app: ~800 MB
- MySQL: ~400 MB
- Sistema: ~300 MB
- Buffer uploads: ~500 MB
= Total: ~2 GB (límite actual)
```

### Configuración de Pool de Conexiones
```java
spring.datasource.hikari.maximum-pool-size=5
spring.datasource.hikari.minimum-idle=1
```
⚠️ **Pool muy pequeño** para 300 usuarios concurrentes.

---

## ⚡ PUNTOS CRÍTICOS IDENTIFICADOS

### 1. Almacenamiento
- **Problema:** Solo 7.95 GB disponibles vs 11 GB requeridos
- **Impacto:** Fallas en carga de documentos después de ~160 usuarios
- **Solución:** Ampliar a 40-50 GB SSD

### 2. Memoria RAM
- **Problema:** 2 GB justos para la aplicación + uploads concurrentes
- **Impacto:** Lentitud y posibles OutOfMemory errors
- **Solución:** Ampliar a 4 GB RAM mínimo

### 3. Pool de Conexiones DB
- **Problema:** Solo 5 conexiones máximas configuradas
- **Impacto:** Cuellos de botella en operaciones de BD
- **Solución:** Aumentar a 15-20 conexiones

### 4. Límites de Upload
- **Problema:** Inconsistencia entre frontend (10MB) y backend (20MB)
- **Impacto:** Confusión de usuarios y fallos de validación
- **Solución:** Unificar en 15 MB

---

## 📈 RECOMENDACIONES INMEDIATAS

### Nivel 1: CRÍTICO (Implementar antes del lanzamiento)
1. **Ampliar almacenamiento a 40 GB SSD**
2. **Aumentar RAM a 4 GB**
3. **Configurar pool de conexiones a 15**
4. **Unificar límites de archivos en 15 MB**
---

## 💰 ESTIMACIÓN DE COSTOS

### Upgrade Recomendado DonWeb
```
Configuración actual: 2 vCPUs, 2 GB RAM, 20 GB SSD
Configuración recomendada: 2 vCPUs, 4 GB RAM, 40 GB SSD
```

## 📋 PLAN DE CONTINGENCIA

### Si se alcanza el límite de almacenamiento:
1. **Inmediato:** Comprimir documentos existentes
2. **Corto plazo:** Mover documentos antiguos a almacenamiento externo
3. **Emergencia:** Suspender temporalmente nuevas inscripciones

### Si se alcanza el límite de memoria:
1. **Inmediato:** Reiniciar aplicación para liberar memoria
2. **Corto plazo:** Optimizar consultas y reducir cache
3. **Emergencia:** Limitar usuarios concurrentes

---

## ✅ CONCLUSIONES Y PRÓXIMOS PASOS

### Viabilidad del Proyecto
El servidor actual **puede soportar** la carga inicial de 300 usuarios, pero con **riesgos significativos**:

- ✅ **Procesamiento:** Suficiente para la carga esperada
- ⚠️ **Almacenamiento:** Insuficiente, requiere ampliación urgente  
- ⚠️ **Memoria:** Justa, recomendable ampliar
- ⚠️ **Configuración:** Requiere optimizaciones

### Acciones Inmediatas Requeridas
1. **Ampliar almacenamiento a 40 GB** (CRÍTICO)
2. **Aumentar RAM a 4 GB** (IMPORTANTE)
3. **Optimizar configuración de BD** (IMPORTANTE)
4. **Implementar monitoreo** (IMPORTANTE)

### Cronograma Sugerido
- **Semana -1:** Implementar upgrades críticos
- **Día 0:** Lanzamiento con monitoreo intensivo
- **Semana 1:** Ajustes basados en métricas reales
- **Semana 2:** Optimizaciones finales

**El proyecto es viable con las mejoras recomendadas implementadas antes del lanzamiento.**
