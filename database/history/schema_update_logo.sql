-- ====================================================================
-- Script de Migración SQL: Integración de Logotipo Autogestionable
-- Tabla: landing_settings
-- Proyecto: Rancho Carmelitas
-- ====================================================================

-- 1. Agregar la columna 'logo_url' a la tabla landing_settings (enfoque defensivo)
ALTER TABLE landing_settings ADD COLUMN IF NOT EXISTS logo_url text;

-- 2. Registrar comentario de base de datos para documentación de desarrollo
COMMENT ON COLUMN landing_settings.logo_url IS 'URL pública del logotipo oficial de Rancho Carmelitas subido desde el PMS';
