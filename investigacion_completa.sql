-- Investigación completa del usuario María Jimena Nieto - DNI 28542331

-- 1. Información completa del usuario
SELECT 
    'DATOS DEL USUARIO' as seccion,
    HEX(id) as id_hex, 
    username, 
    dni, 
    first_name, 
    last_name, 
    email, 
    status, 
    created_at,
    birth_date,
    telefono,
    direccion,
    provincia,
    cuit
FROM user_entity 
WHERE dni = '28542331';

-- 2. Intentos de login fallidos relacionados
SELECT 
    'INTENTOS DE LOGIN FALLIDOS' as seccion,
    timestamp,
    username,
    event_type,
    description,
    ip_address,
    outcome
FROM audit_logs 
WHERE username LIKE '%mjnieto%' 
ORDER BY timestamp DESC 
LIMIT 10;

-- 3. Verificar inscripciones del usuario
SELECT 
    'INSCRIPCIONES' as seccion,
    i.id as inscription_id,
    i.created_at as inscription_date,
    i.status as inscription_status,
    c.name as contest_name,
    c.id as contest_id
FROM inscriptions i
JOIN contests c ON i.contest_id = c.id
WHERE i.user_id = (SELECT id FROM user_entity WHERE dni = '28542331')
LIMIT 10;

-- 4. Verificar documentos del usuario
SELECT 
    'DOCUMENTOS' as seccion,
    d.id as document_id,
    d.file_name,
    d.file_path,
    d.uploaded_at,
    d.status as document_status,
    dt.name as document_type_name
FROM documents d
JOIN document_types dt ON d.document_type_id = dt.id
WHERE d.user_id = (SELECT id FROM user_entity WHERE dni = '28542331')
LIMIT 10;

-- 5. Verificar si hay otros usuarios similares
SELECT 
    'USUARIOS SIMILARES' as seccion,
    username,
    dni,
    first_name,
    last_name,
    email,
    status
FROM user_entity 
WHERE (first_name LIKE '%Maria%' OR first_name LIKE '%Jimena%')
AND last_name LIKE '%Nieto%'
LIMIT 5;
