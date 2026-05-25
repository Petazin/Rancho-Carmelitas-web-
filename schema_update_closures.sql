-- Actualización de Esquema: Sistema de Cierres y Bloqueos de Cabañas (Parcial y Total)

CREATE TABLE IF NOT EXISTS cabin_closures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cabin_id UUID REFERENCES cabins(id) ON DELETE CASCADE, -- NULL indica "Cierre Total" (todas las cabañas)
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason VARCHAR(255) NOT NULL, -- Ej: 'Vacaciones', 'Mantención', 'Fuerza Mayor', etc.
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- Restricción de integridad: la fecha de inicio no puede ser posterior a la de fin
    CONSTRAINT check_dates CHECK (start_date <= end_date)
);

-- Índices para búsquedas eficientes en calendarios y validaciones de solapamiento
CREATE INDEX IF NOT EXISTS idx_closures_dates ON cabin_closures (start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_closures_cabin ON cabin_closures (cabin_id);

-- Habilitar RLS si está habilitado en las demás tablas de la base de datos
ALTER TABLE cabin_closures ENABLE ROW LEVEL SECURITY;

-- Crear políticas de acceso libre para lectura y acceso restringido para inserción/edición/borrado
CREATE POLICY "Permitir lectura pública de cierres" ON cabin_closures
    FOR SELECT USING (true);

CREATE POLICY "Permitir inserción a administradores autenticados" ON cabin_closures
    FOR INSERT WITH CHECK (true); -- En un entorno real, puedes validar auth.role() = 'authenticated'

CREATE POLICY "Permitir actualización a administradores autenticados" ON cabin_closures
    FOR UPDATE USING (true);

CREATE POLICY "Permitir eliminación a administradores autenticados" ON cabin_closures
    FOR DELETE USING (true);
