-- =====================================================
-- SCRIPT PARA CREAR ESCENARIOS COMPLETOS DE CONCURSOS
-- Incluye todos los estados posibles para testing de UI
-- =====================================================

USE mpd_concursos;

-- =====================================================
-- CONCURSOS ABIERTOS PARA INSCRIPCIÓN (ACTUALES)
-- =====================================================

-- Concurso 4: Analista Legal (ABIERTO - Inscripciones hasta fin de mes)
INSERT INTO contests (
    title, department, position, category, class_, functions,
    basesUrl, descriptionUrl, startDate, endDate,
    status, createdAt, updatedAt
) VALUES (
    'Concurso para Analista Legal',
    'Defensoría General',
    'Analista Legal',
    'PROFESIONAL',
    'Clase B',
    'Realizar análisis jurídico de casos complejos. Elaborar dictámenes legales. Asistir en la preparación de recursos y apelaciones.',
    '/assets/bases/analista-legal-2025.pdf',
    '/assets/descripcion/analista-legal-desc.pdf',
    CURDATE(),
    DATE_ADD(CURDATE(), INTERVAL 30 DAY),
    'INSCRIPTION_OPEN',
    NOW(),
    NOW()
);

-- Concurso 5: Asistente Social (ABIERTO - Inscripciones por 3 semanas más)
INSERT INTO contests (
    title, department, position, category, class_, functions,
    basesUrl, descriptionUrl, startDate, endDate,
    status, createdAt, updatedAt
) VALUES (
    'Concurso para Asistente Social',
    'Cuerpo Técnico Auxiliar',
    'Asistente Social',
    'TECNICO',
    'Clase B',
    'Realizar entrevistas sociales. Elaborar informes socio-ambientales. Coordinar con instituciones de asistencia social.',
    '/assets/bases/asistente-social-2025.pdf',
    '/assets/descripcion/asistente-social-desc.pdf',
    DATE_SUB(CURDATE(), INTERVAL 7 DAY),
    DATE_ADD(CURDATE(), INTERVAL 21 DAY),
    'INSCRIPTION_OPEN',
    NOW(),
    NOW()
);

-- =====================================================
-- CONCURSOS FUTUROS (AÚN NO HABILITADOS)
-- =====================================================

-- Concurso 6: Trabajador Social (FUTURO - Inscripciones abren en 2 semanas)
INSERT INTO contests (
    title, department, position, category, class_, functions,
    basesUrl, descriptionUrl, startDate, endDate,
    status, createdAt, updatedAt
) VALUES (
    'Concurso para Trabajador Social',
    'Cuerpo Técnico Auxiliar',
    'Trabajador Social',
    'TECNICO',
    'Clase A',
    'Realizar entrevistas sociales. Elaborar informes socio-ambientales. Coordinar con instituciones de asistencia social.',
    '/assets/bases/trabajador-social-2025.pdf',
    '/assets/descripcion/trabajador-social-desc.pdf',
    DATE_ADD(CURDATE(), INTERVAL 14 DAY),
    DATE_ADD(CURDATE(), INTERVAL 44 DAY),
    'PUBLISHED',
    NOW(),
    NOW()
);

-- Concurso 7: Contador Público (FUTURO - Inscripciones abren el próximo mes)
INSERT INTO contests (
    title, department, position, category, class_, functions,
    basesUrl, descriptionUrl, startDate, endDate,
    status, createdAt, updatedAt
) VALUES (
    'Concurso para Contador Público',
    'Administración General',
    'Contador Público',
    'PROFESIONAL',
    'Clase A',
    'Realizar análisis contable y financiero. Elaborar balances y estados financieros. Supervisar el control de gastos institucionales.',
    '/assets/bases/contador-publico-2025.pdf',
    '/assets/descripcion/contador-publico-desc.pdf',
    DATE_ADD(CURDATE(), INTERVAL 30 DAY),
    DATE_ADD(CURDATE(), INTERVAL 60 DAY),
    'PUBLISHED',
    NOW(),
    NOW()
);

-- =====================================================
-- CONCURSOS CERRADOS (INSCRIPCIONES FINALIZADAS)
-- =====================================================

-- Concurso 8: Personal Administrativo (CERRADO - Inscripciones terminaron la semana pasada)
INSERT INTO contests (
    title, department, position, category, class_, functions,
    basesUrl, descriptionUrl, startDate, endDate,
    status, createdAt, updatedAt
) VALUES (
    'Concurso para Personal Administrativo',
    'Administración General',
    'Personal Administrativo',
    'ADMINISTRATIVO',
    'Clase C',
    'Realizar tareas de gestión documental y atención al público. Organizar archivos y expedientes. Asistir en trámites administrativos.',
    '/assets/bases/personal-administrativo-2025.pdf',
    '/assets/descripcion/personal-administrativo-desc.pdf',
    DATE_SUB(CURDATE(), INTERVAL 45 DAY),
    DATE_SUB(CURDATE(), INTERVAL 7 DAY),
    'CLOSED',
    DATE_SUB(NOW(), INTERVAL 45 DAY),
    DATE_SUB(NOW(), INTERVAL 7 DAY)
);

-- Concurso 9: Auxiliar Contable (CERRADO - Inscripciones terminaron hace un mes)
INSERT INTO contests (
    title, department, position, category, class_, functions,
    basesUrl, descriptionUrl, startDate, endDate,
    status, createdAt, updatedAt
) VALUES (
    'Concurso para Auxiliar Contable',
    'Administración General',
    'Auxiliar Contable',
    'ADMINISTRATIVO',
    'Clase B',
    'Asistir en tareas contables y financieras. Registrar movimientos contables. Preparar documentación para auditorías.',
    '/assets/bases/auxiliar-contable-2025.pdf',
    '/assets/descripcion/auxiliar-contable-desc.pdf',
    DATE_SUB(CURDATE(), INTERVAL 75 DAY),
    DATE_SUB(CURDATE(), INTERVAL 30 DAY),
    'CLOSED',
    DATE_SUB(NOW(), INTERVAL 75 DAY),
    DATE_SUB(NOW(), INTERVAL 30 DAY)
);

-- =====================================================
-- CONCURSO CANCELADO
-- =====================================================

-- Concurso 10: Médico Legista (CANCELADO)
INSERT INTO contests (
    title, department, position, category, class_, functions,
    basesUrl, descriptionUrl, startDate, endDate,
    status, createdAt, updatedAt
) VALUES (
    'Concurso para Médico Legista',
    'Cuerpo Técnico Auxiliar',
    'Médico Legista',
    'PROFESIONAL',
    'Clase A',
    'Realizar pericias médico-legales. Elaborar informes forenses. Participar en autopsias y exámenes médicos judiciales.',
    '/assets/bases/medico-legista-2025.pdf',
    '/assets/descripcion/medico-legista-desc.pdf',
    DATE_SUB(CURDATE(), INTERVAL 60 DAY),
    DATE_ADD(CURDATE(), INTERVAL 15 DAY),
    'CANCELLED',
    DATE_SUB(NOW(), INTERVAL 60 DAY),
    NOW()
);

-- =====================================================
-- VERIFICACIÓN DE LOS DATOS INSERTADOS
-- =====================================================

-- Ver todos los concursos con sus estados y fechas
SELECT
    'RESUMEN DE CONCURSOS CREADOS:' AS info;

SELECT
    title,
    department,
    position,
    status,
    startDate,
    endDate,
    CASE
        WHEN status = 'CANCELLED' THEN 'CANCELADO'
        WHEN status = 'CLOSED' THEN 'INSCRIPCIONES CERRADAS'
        WHEN status = 'INSCRIPTION_OPEN' THEN 'INSCRIPCIONES ABIERTAS'
        WHEN status = 'PUBLISHED' AND CURDATE() < startDate THEN 'PRÓXIMAMENTE'
        WHEN status = 'PUBLISHED' AND CURDATE() BETWEEN startDate AND endDate THEN 'INSCRIPCIONES ABIERTAS'
        WHEN status = 'PUBLISHED' AND CURDATE() > endDate THEN 'INSCRIPCIONES CERRADAS'
        ELSE 'ESTADO DESCONOCIDO'
    END AS estado_para_usuario
FROM contests
ORDER BY
    CASE status
        WHEN 'INSCRIPTION_OPEN' THEN 1
        WHEN 'PUBLISHED' THEN 2
        WHEN 'CLOSED' THEN 3
        WHEN 'CANCELLED' THEN 4
        ELSE 5
    END,
    startDate;

-- Contar concursos por estado
SELECT
    'CONTEO POR ESTADO:' AS info;

SELECT
    CASE
        WHEN status = 'CANCELLED' THEN 'CANCELADO'
        WHEN status = 'CLOSED' THEN 'INSCRIPCIONES CERRADAS'
        WHEN status = 'INSCRIPTION_OPEN' THEN 'INSCRIPCIONES ABIERTAS'
        WHEN status = 'PUBLISHED' AND CURDATE() < startDate THEN 'PRÓXIMAMENTE'
        WHEN status = 'PUBLISHED' AND CURDATE() BETWEEN startDate AND endDate THEN 'INSCRIPCIONES ABIERTAS'
        WHEN status = 'PUBLISHED' AND CURDATE() > endDate THEN 'INSCRIPCIONES CERRADAS'
        ELSE 'ESTADO DESCONOCIDO'
    END AS estado_para_usuario,
    COUNT(*) as cantidad
FROM contests
GROUP BY estado_para_usuario
ORDER BY cantidad DESC;
