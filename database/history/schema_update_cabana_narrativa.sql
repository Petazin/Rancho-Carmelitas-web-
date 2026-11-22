-- ====================================================================
-- Script SQL: Actualización de Cabañas - Identidad y Storytelling Local (Pullally)
-- Proyecto: Rancho Carmelitas
-- Objetivo: Agregar columnas de narrativa e identidad a la tabla cabins e integrar en auditoría
-- ====================================================================

-- 1. Agregar columnas a la tabla 'cabins'
ALTER TABLE cabins ADD COLUMN IF NOT EXISTS slogan VARCHAR(255);
ALTER TABLE cabins ADD COLUMN IF NOT EXISTS origin_title VARCHAR(150) DEFAULT '¿Por qué este nombre?';
ALTER TABLE cabins ADD COLUMN IF NOT EXISTS origin_description TEXT;
ALTER TABLE cabins ADD COLUMN IF NOT EXISTS fun_fact TEXT;

-- 2. Asegurar que las cabañas existentes tengan valores por defecto consistentes
UPDATE cabins SET origin_title = '¿Por qué este nombre?' WHERE origin_title IS NULL;

-- 3. Confirmar que la auditoría automática registre las nuevas columnas
-- Nota: Si process_audit_logging() está basado en row_to_json(NEW/OLD),
-- registrará las nuevas columnas automáticamente al actualizar filas.

-- 4. Comentario informativo para validación
COMMENT ON COLUMN cabins.slogan IS 'Bajada poética o lema de la cabaña (Ej: Un viaje en el tiempo)';
COMMENT ON COLUMN cabins.origin_title IS 'Título de la sección de conexión histórica/local';
COMMENT ON COLUMN cabins.origin_description IS 'Texto explicativo sobre el origen del nombre o relación con Pullally';
COMMENT ON COLUMN cabins.fun_fact IS 'Recuadro destacado de Dato Curioso o tip local de Pullally';
