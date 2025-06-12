# 🚨 CORRECCIÓN CRÍTICA: INCONSISTENCIAS JPA NAMING

**Fecha:** 2025-01-27  
**Prioridad:** CRÍTICA - Errores que causan 500 en producción  
**Tiempo estimado:** 2-3 horas  

---

## 🎯 **CORRECCIONES INMEDIATAS REQUERIDAS**

### 1. ❌ **ExperienceEntity** - CORRECCIÓN CRÍTICA

**Archivo:** `concurso-backend/src/main/java/ar/gov/mpd/concursobackend/experience/infrastructure/persistence/ExperienceEntity.java`

**Problema:** Nombres de columnas en camelCase no coinciden con schema.sql (snake_case)

**Correcciones requeridas:**
```java
// LÍNEA 39: CAMBIAR
@JoinColumn(name = "userId", nullable = false)
// POR:
@JoinColumn(name = "user_id", nullable = false)

// LÍNEA 48: CAMBIAR  
@Column(name = "startDate", nullable = false)
// POR:
@Column(name = "start_date", nullable = false)

// LÍNEA 51: CAMBIAR
@Column(name = "endDate")
// POR:
@Column(name = "end_date")

// LÍNEA 57: CAMBIAR
@Column(name = "documentUrl")
// POR:
@Column(name = "document_url")
```

**Referencia schema.sql:** Líneas 91-102
```sql
CREATE TABLE experience (
    id BINARY(16) PRIMARY KEY,
    user_id BINARY(16) NOT NULL,           -- ← user_id (no userId)
    company VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,              -- ← start_date (no startDate)
    end_date DATE,                         -- ← end_date (no endDate)
    description TEXT,
    comments TEXT,
    document_url VARCHAR(255),             -- ← document_url (no documentUrl)
    CONSTRAINT fk_experience_user FOREIGN KEY (user_id) REFERENCES user_entity(id)
);
```

---

### 2. ❌ **InscriptionEntity** - CORRECCIÓN CRÍTICA

**Archivo:** `concurso-backend/src/main/java/ar/gov/mpd/concursobackend/inscription/infrastructure/persistence/entity/InscriptionEntity.java`

**Problema:** TODAS las columnas están mal mapeadas (camelCase vs snake_case)

**Correcciones requeridas:**
```java
// LÍNEA 22: CAMBIAR
@Column(name = "contestId")
// POR:
@Column(name = "contest_id")

// LÍNEA 25: CAMBIAR
@Column(name = "userId", columnDefinition = "BINARY(16)")
// POR:
@Column(name = "user_id", columnDefinition = "BINARY(16)")

// LÍNEA 32: CAMBIAR
@Column(name = "createdAt")
// POR:
@Column(name = "created_at")

// LÍNEA 35: CAMBIAR
@Column(name = "updatedAt")
// POR:
@Column(name = "updated_at")

// LÍNEA 38: CAMBIAR
@Column(name = "inscriptionDate")
// POR:
@Column(name = "inscription_date")

// LÍNEA 42: CAMBIAR
@Column(name = "currentStep")
// POR:
@Column(name = "current_step")

// LÍNEA 51: CAMBIAR
@Column(name = "acceptedTerms")
// POR:
@Column(name = "accepted_terms")

// LÍNEA 54: CAMBIAR
@Column(name = "confirmedPersonalData")
// POR:
@Column(name = "confirmed_personal_data")

// LÍNEA 57: CAMBIAR
@Column(name = "centroDeVida")
// POR:
@Column(name = "centro_de_vida")

// LÍNEA 60: CAMBIAR
@Column(name = "termsAcceptanceDate")
// POR:
@Column(name = "terms_acceptance_date")

// LÍNEA 63: CAMBIAR
@Column(name = "dataConfirmationDate")
// POR:
@Column(name = "data_confirmation_date")

// LÍNEA 66: CAMBIAR
@Column(name = "documentationDeadline")
// POR:
@Column(name = "documentation_deadline")

// LÍNEA 69: CAMBIAR
@Column(name = "frozenDate")
// POR:
@Column(name = "frozen_date")
```

**Referencia schema.sql:** Líneas 248-268
```sql
CREATE TABLE inscriptions (
    id BINARY(16) NOT NULL,
    contest_id BIGINT,                     -- ← contest_id (no contestId)
    user_id BINARY(16),                    -- ← user_id (no userId)
    created_at DATETIME(6),                -- ← created_at (no createdAt)
    updated_at DATETIME(6),                -- ← updated_at (no updatedAt)
    inscription_date DATETIME(6),          -- ← inscription_date (no inscriptionDate)
    status ENUM(...),
    current_step ENUM(...),                -- ← current_step (no currentStep)
    accepted_terms BOOLEAN DEFAULT FALSE,  -- ← accepted_terms (no acceptedTerms)
    confirmed_personal_data BOOLEAN DEFAULT FALSE, -- ← confirmed_personal_data
    documentos_completos BOOLEAN DEFAULT FALSE,
    centro_de_vida VARCHAR(500),           -- ← centro_de_vida (no centroDeVida)
    terms_acceptance_date DATETIME(6),     -- ← terms_acceptance_date
    data_confirmation_date DATETIME(6),    -- ← data_confirmation_date
    documentation_deadline DATETIME(6),    -- ← documentation_deadline
    frozen_date DATETIME(6),               -- ← frozen_date (no frozenDate)
    PRIMARY KEY (id),
    FOREIGN KEY (contest_id) REFERENCES contests(id),
    FOREIGN KEY (user_id) REFERENCES user_entity(id)
);
```

---

### 3. ❌ **ContestEntity** - CORRECCIÓN MEDIA PRIORIDAD

**Archivo:** `concurso-backend/src/main/java/ar/gov/mpd/concursobackend/contest/infrastructure/database/entities/ContestEntity.java`

**Problema:** Columnas de fecha y URLs mal mapeadas

**Correcciones requeridas:**
```java
// LÍNEA 45: AGREGAR @Column
private LocalDate startDate;
// CAMBIAR POR:
@Column(name = "start_date")
private LocalDate startDate;

// LÍNEA 46: AGREGAR @Column
private LocalDate endDate;
// CAMBIAR POR:
@Column(name = "end_date")
private LocalDate endDate;

// LÍNEA 48: CAMBIAR
@Column(name = "basesUrl")
// POR:
@Column(name = "bases_url")

// LÍNEA 51: CAMBIAR
@Column(name = "descriptionUrl")
// POR:
@Column(name = "description_url")

// LÍNEA 54: CAMBIAR
@Column(name = "createdAt")
// POR:
@Column(name = "created_at")

// LÍNEA 57: CAMBIAR
@Column(name = "updatedAt")
// POR:
@Column(name = "updated_at")
```

**Referencia schema.sql:** Líneas 124-140
```sql
CREATE TABLE contests (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255),
    category VARCHAR(255),
    class_ VARCHAR(255),
    functions TEXT,
    department VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    status ENUM(...) NOT NULL,
    start_date DATE NOT NULL,              -- ← start_date (no startDate)
    end_date DATE NOT NULL,                -- ← end_date (no endDate)
    bases_url VARCHAR(255),                -- ← bases_url (no basesUrl)
    description_url VARCHAR(255),          -- ← description_url (no descriptionUrl)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- ← created_at
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,  -- ← updated_at
    CONSTRAINT check_dates CHECK (end_date >= start_date)
);
```

---

### 4. ❌ **QuestionEntity** - CORRECCIÓN RELACIÓN

**Archivo:** `concurso-backend/src/main/java/ar/gov/mpd/concursobackend/examination/infrastructure/persistence/entity/QuestionEntity.java`

**Problema:** @CollectionTable falta joinColumns

**Corrección requerida:**
```java
// LÍNEA 35-37: CAMBIAR
@ElementCollection
@CollectionTable(name = "question_correct_answers")
private List<String> correctAnswers;

// POR:
@ElementCollection
@CollectionTable(name = "question_correct_answers", 
                 joinColumns = @JoinColumn(name = "questionEntityId"))
private List<String> correctAnswers;
```

**Referencia schema.sql:** Líneas 324-328
```sql
CREATE TABLE question_correct_answers (
    questionEntityId BINARY(16) NOT NULL,  -- ← Nombre específico requerido
    correctAnswers VARCHAR(255),
    FOREIGN KEY (questionEntityId) REFERENCES questions(id)
);
```

---

## 🚀 **ORDEN DE IMPLEMENTACIÓN**

### **PASO 1:** ExperienceEntity (CRÍTICO) ✅ COMPLETADO
- ✅ Causa errores 500 en gestión de experiencia laboral - RESUELTO
- ✅ Afecta funcionalidad de inscripciones - RESUELTO
- ✅ 4 correcciones aplicadas exitosamente
- ✅ Compilación exitosa verificada

### **PASO 2:** InscriptionEntity (CRÍTICO) ✅ COMPLETADO
- ✅ Causa errores 500 en todo el proceso de inscripción - RESUELTO
- ✅ Funcionalidad core del sistema - RESUELTO
- ✅ 13 correcciones aplicadas exitosamente
- ✅ Compilación exitosa verificada

### **PASO 3:** ContestEntity (MEDIO) ⏳ PENDIENTE
- Puede causar problemas en listado de concursos
- Menos crítico pero importante

### **PASO 4:** QuestionEntity (BAJO) ⏳ PENDIENTE
- Solo afecta sistema de exámenes
- Funcionalidad secundaria

---

## ✅ **VERIFICACIÓN POST-CORRECCIÓN**

### **Testing Requerido:**
1. **ExperienceEntity:** Probar CRUD de experiencias laborales
2. **InscriptionEntity:** Probar proceso completo de inscripción
3. **ContestEntity:** Probar listado y detalle de concursos
4. **QuestionEntity:** Probar creación de exámenes con preguntas

### **Comandos de Verificación:**
```bash
# 1. Reiniciar backend para aplicar cambios
cd concurso-backend
./mvnw spring-boot:run

# 2. Verificar logs sin errores "Unknown column"
tail -f logs/application.log | grep -i "unknown column"

# 3. Probar endpoints críticos
curl -X GET http://localhost:8080/api/contests
curl -X GET http://localhost:8080/api/inscriptions
```

---

## 🔒 **BACKUP Y ROLLBACK**

### **Antes de implementar:**
```bash
# Crear backup de archivos a modificar
cp ExperienceEntity.java ExperienceEntity.java.backup
cp InscriptionEntity.java InscriptionEntity.java.backup
cp ContestEntity.java ContestEntity.java.backup
cp QuestionEntity.java QuestionEntity.java.backup
```

### **Plan de Rollback:**
Si algo falla, restaurar archivos desde backup y reiniciar backend.

---

**⚠️ IMPORTANTE:** Estas correcciones son CRÍTICAS para el funcionamiento en producción. Implementar en orden de prioridad y verificar cada paso.
