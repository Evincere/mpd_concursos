-- Verificar estructura de la tabla contests
USE mpd_concursos;

-- Mostrar estructura de la tabla contests
DESCRIBE contests;

-- Verificar restricciones NOT NULL
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE, 
    COLUMN_DEFAULT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'contests' 
AND TABLE_SCHEMA = 'mpd_concursos'
ORDER BY ORDINAL_POSITION;
