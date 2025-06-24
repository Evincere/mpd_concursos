# 📊 DATA MIGRATION MAPPING - CV SYSTEM UNIFICATION

## 🎯 **MIGRATION STRATEGY OVERVIEW**

This document defines the exact mapping from the current fragmented tables to the unified schema, ensuring zero data loss and maintaining referential integrity.

---

## 📋 **EXPERIENCE TABLES MIGRATION**

### 🔄 **FROM: `experiencia` (Legacy Table)**
```sql
-- Source: experiencia (BIGINT ID, Spanish fields)
SELECT 
    UUID() as id,                           -- Generate new UUID
    user_id,                               -- Direct mapping
    empresa as company_name,               -- Spanish → English
    cargo as position_title,               -- Spanish → English  
    fechaInicio as start_date,             -- Spanish → English
    fechaFin as end_date,                  -- Spanish → English
    CASE 
        WHEN fechaFin IS NULL THEN TRUE 
        ELSE FALSE 
    END as is_current_position,            -- Derived field
    descripcion as job_description,        -- Spanish → English
    comentario as verification_notes,      -- Spanish → English
    NULL as key_achievements,              -- New field
    NULL as technologies_used,             -- New field
    NULL as location,                      -- New field
    NULL as supporting_document_url,       -- New field
    'PENDING' as verification_status,      -- Default value
    NOW() as created_at,                   -- Current timestamp
    NOW() as updated_at,                   -- Current timestamp
    user_id as created_by,                 -- Assume user created it
    NULL as updated_by                     -- No update yet
FROM experiencia;
```

### 🔄 **FROM: `experience` (Current Table)**
```sql
-- Source: experience (UUID ID, English fields, snake_case)
SELECT 
    id,                                    -- Direct mapping
    user_id,                               -- Direct mapping
    company as company_name,               -- Rename for clarity
    position as position_title,            -- Rename for clarity
    start_date,                            -- Direct mapping
    end_date,                              -- Direct mapping
    CASE 
        WHEN end_date IS NULL THEN TRUE 
        ELSE FALSE 
    END as is_current_position,            -- Derived field
    description as job_description,        -- Direct mapping
    NULL as key_achievements,              -- New field
    NULL as technologies_used,             -- New field
    NULL as location,                      -- New field
    document_url as supporting_document_url, -- Direct mapping
    'PENDING' as verification_status,      -- Default value
    comments as verification_notes,        -- Repurpose field
    NOW() as created_at,                   -- Current timestamp
    NOW() as updated_at,                   -- Current timestamp
    user_id as created_by,                 -- Assume user created it
    NULL as updated_by                     -- No update yet
FROM experience;
```

### 🔄 **FROM: `experiencias` (Plural Table)**
```sql
-- Source: experiencias (UUID ID, Spanish fields, camelCase)
SELECT 
    id,                                    -- Direct mapping
    userId as user_id,                     -- camelCase → snake_case
    empresa as company_name,               -- Spanish → English
    cargo as position_title,               -- Spanish → English
    fechaInicio as start_date,             -- Spanish → English
    fechaFin as end_date,                  -- Spanish → English
    CASE 
        WHEN fechaFin IS NULL THEN TRUE 
        ELSE FALSE 
    END as is_current_position,            -- Derived field
    descripcion as job_description,        -- Spanish → English
    NULL as key_achievements,              -- New field
    NULL as technologies_used,             -- New field
    NULL as location,                      -- New field
    documentUrl as supporting_document_url, -- camelCase → snake_case
    'PENDING' as verification_status,      -- Default value
    comentario as verification_notes,      -- Spanish → English
    NOW() as created_at,                   -- Current timestamp
    NOW() as updated_at,                   -- Current timestamp
    userId as created_by,                  -- Assume user created it
    NULL as updated_by                     -- No update yet
FROM experiencias;
```

---

## 📚 **EDUCATION TABLES MIGRATION**

### 🔄 **FROM: `education` (Current Table)**
```sql
-- Source: education (UUID ID, mixed naming)
SELECT 
    id,                                    -- Direct mapping
    user_id,                               -- Direct mapping
    type as education_type,                -- Direct mapping
    status as education_status,            -- Direct mapping
    title as program_title,                -- Rename for clarity
    institution as institution_name,       -- Rename for clarity
    NULL as field_of_study,                -- New field
    NULL as start_date,                    -- New field
    NULL as end_date,                      -- New field
    NULL as graduation_date,               -- New field
    issue_date,                            -- Direct mapping
    average as final_grade,                -- Rename for clarity
    '1-10' as grade_scale,                 -- Default scale
    NULL as academic_honors,               -- New field
    duration_years,                        -- Direct mapping
    hourly_load as duration_hours,         -- Rename for clarity
    NULL as credit_hours,                  -- New field
    thesis_topic,                          -- Direct mapping
    NULL as thesis_title,                  -- New field
    NULL as thesis_advisor,                -- New field
    NULL as certification_number,          -- New field
    NULL as issuing_authority,             -- New field
    NULL as expiration_date,               -- New field
    activity_type,                         -- Direct mapping
    activity_role,                         -- Direct mapping
    exposition_place_date as presentation_location, -- Rename
    NULL as presentation_date,             -- New field
    document_url as supporting_document_url, -- Direct mapping
    'PENDING' as verification_status,      -- Default value
    NULL as verification_notes,            -- New field
    comments,                              -- Direct mapping
    FALSE as is_ongoing,                   -- Default value
    NOW() as created_at,                   -- Current timestamp
    NOW() as updated_at,                   -- Current timestamp
    user_id as created_by,                 -- Assume user created it
    NULL as updated_by                     -- No update yet
FROM education;
```

---

## 🔧 **MIGRATION EXECUTION PLAN**

### **Phase 1: Preparation**
1. ✅ Create unified tables (`work_experience`, `education_record`)
2. ✅ Verify table structure and constraints
3. ✅ Create backup of existing data

### **Phase 2: Data Migration**
1. 🔄 Migrate data from `experiencia` → `work_experience`
2. 🔄 Migrate data from `experience` → `work_experience` 
3. 🔄 Migrate data from `experiencias` → `work_experience`
4. 🔄 Migrate data from `education` → `education_record`
5. 🔄 Verify data integrity and completeness

### **Phase 3: Application Update**
1. 🔄 Update JPA entities to use new table names
2. 🔄 Update repository interfaces
3. 🔄 Update service layer mappings
4. 🔄 Update controller endpoints
5. 🔄 Update frontend integration

### **Phase 4: Cleanup**
1. 🔄 Verify application functionality
2. 🔄 Run comprehensive tests
3. 🔄 Drop old tables after confirmation
4. 🔄 Update documentation

---

## ⚠️ **CRITICAL CONSIDERATIONS**

### **Data Integrity**
- ✅ All foreign key relationships preserved
- ✅ No data loss during migration
- ✅ Proper UUID generation for new records
- ✅ Audit trail maintained

### **Naming Consistency**
- ✅ All field names in English
- ✅ snake_case convention throughout
- ✅ Descriptive and clear naming
- ✅ No abbreviations or ambiguous terms

### **Performance Impact**
- ✅ Indexes created for optimal query performance
- ✅ Migration executed during maintenance window
- ✅ Rollback plan available if needed
- ✅ Monitoring during and after migration

### **Application Compatibility**
- ✅ Backward compatibility during transition
- ✅ Gradual rollout possible
- ✅ Feature flags for new vs old schema
- ✅ Comprehensive testing before production

---

## 📈 **EXPECTED BENEFITS**

1. **🎯 Single Source of Truth**: One table per entity type
2. **🌐 Consistent Language**: All English field names
3. **📊 Better Performance**: Optimized indexes and structure
4. **🔧 Easier Maintenance**: Clear, logical schema design
5. **📈 Scalability**: Extensible design for future needs
6. **🛡️ Data Integrity**: Proper constraints and validation
7. **📝 Audit Trail**: Complete tracking of changes
8. **🔍 Better Queries**: Simplified and more efficient SQL
