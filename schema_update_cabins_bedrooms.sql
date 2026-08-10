-- ====================================================================
-- Script SQL: Actualización de Cabañas - Número de Habitaciones Configurable
-- Proyecto: Rancho Carmelitas
-- Objetivo: Agregar la columna bedrooms (entero parametrizable) a la tabla cabins
-- ====================================================================

-- 1. Agregar la columna bedrooms a la tabla cabins
ALTER TABLE cabins ADD COLUMN IF NOT EXISTS bedrooms integer;

-- 2. Comentario informativo para la base de datos
COMMENT ON COLUMN cabins.bedrooms IS 'Número real de habitaciones de la cabaña, configurable por el administrador. Si está vacío (NULL), se aplica fallback de Math.floor(capacidad / 2).';
