-- ====================================================================
-- Script SQL: Incorporación de Control Temporal para Auditoría de Equipos
-- Proyecto: Rancho Carmelitas
-- Objetivo: Añadir de forma defensiva la columna 'updated_at' a la tabla 'profiles'
--           para habilitar el registro de reenvío de invitaciones de correo.
-- ====================================================================

-- 1. Agregar la columna 'updated_at' a la tabla profiles (enfoque defensivo)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- 2. Registrar comentario de base de datos para documentación de desarrollo
COMMENT ON COLUMN profiles.updated_at IS 'Marca de tiempo de la última actualización de datos o reenvío de invitación del colaborador';
