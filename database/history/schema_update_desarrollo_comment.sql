-- ====================================================================
-- Script SQL: Ampliación del Módulo de Desarrollo (Roadmap)
-- Tabla: desarrollo_ideas
-- Proyecto: Rancho Carmelitas
-- Objetivo: Agregar columna para registrar comentarios del desarrollador
-- ====================================================================

-- 1. Agregar la columna developer_comment a la tabla desarrollo_ideas
ALTER TABLE desarrollo_ideas 
ADD COLUMN IF NOT EXISTS developer_comment text;

COMMENT ON COLUMN desarrollo_ideas.developer_comment IS 'Explicación del desarrollador sobre los cambios realizados y guía de interacción para usuarios no técnicos.';
