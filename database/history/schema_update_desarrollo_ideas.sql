-- ====================================================================
-- Script SQL: Inicialización del Módulo de Desarrollo y Mejoras (Roadmap)
-- Tabla: desarrollo_ideas
-- Proyecto: Rancho Carmelitas
-- Objetivo: Almacenar ideas de mejoras y reportes de bugs con evidencias
-- ====================================================================

-- 1. Crear tabla desarrollo_ideas
CREATE TABLE IF NOT EXISTS desarrollo_ideas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idea TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'idea',
    description TEXT,
    evidence_urls TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
    priority INTEGER NOT NULL DEFAULT 0,
    completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- 2. Habilitar RLS (Row Level Security)
ALTER TABLE desarrollo_ideas ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas de seguridad
-- A. Permitir lectura únicamente a usuarios autenticados (staff/admin)
DROP POLICY IF EXISTS "Permitir lectura de ideas a usuarios autenticados" ON desarrollo_ideas;
CREATE POLICY "Permitir lectura de ideas a usuarios autenticados" 
ON desarrollo_ideas FOR SELECT 
TO authenticated 
USING (true);

-- B. Permitir gestión completa únicamente a usuarios autenticados (staff/admin)
DROP POLICY IF EXISTS "Permitir gestion completa de ideas a usuarios autenticados" ON desarrollo_ideas;
CREATE POLICY "Permitir gestion completa de ideas a usuarios autenticados" 
ON desarrollo_ideas FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 4. Crear índice sobre priority para búsquedas y ordenamientos rápidos
CREATE INDEX IF NOT EXISTS idx_desarrollo_ideas_priority ON desarrollo_ideas(priority);

-- 5. Vincular el disparador de auditoría inteligente (process_audit_logging)
DROP TRIGGER IF EXISTS audit_desarrollo_ideas_trigger ON desarrollo_ideas;
CREATE TRIGGER audit_desarrollo_ideas_trigger
AFTER INSERT OR UPDATE OR DELETE ON desarrollo_ideas
FOR EACH ROW EXECUTE FUNCTION process_audit_logging();

COMMENT ON TRIGGER audit_desarrollo_ideas_trigger ON desarrollo_ideas IS 'Registra adición, edición, reordenamiento, completado o eliminación de ideas y bugs en el roadmap';
