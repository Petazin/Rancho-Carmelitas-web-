-- ====================================================================
-- Script SQL: Módulo de Equipo de Trabajo y Hospitalidad (Landing Page)
-- Tablas: landing_settings (ampliación) y landing_team (nueva)
-- Proyecto: Rancho Carmelitas
-- Objetivo: Permitir la gestión autónoma del equipo de trabajo en la web
-- ====================================================================

-- 1. Ampliar landing_settings con títulos configurables para la sección
ALTER TABLE landing_settings
ADD COLUMN IF NOT EXISTS team_title text DEFAULT 'Nuestro Equipo',
ADD COLUMN IF NOT EXISTS team_subtitle text DEFAULT 'Conoce a las personas dedicadas a cuidar cada detalle de tu descanso y estadía en Rancho Carmelitas.';

UPDATE landing_settings
SET 
    team_title = COALESCE(team_title, 'Nuestro Equipo'),
    team_subtitle = COALESCE(team_subtitle, 'Conoce a las personas dedicadas a cuidar cada detalle de tu descanso y estadía en Rancho Carmelitas.')
WHERE id = 1;

-- 2. Crear tabla landing_team
CREATE TABLE IF NOT EXISTS landing_team (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Habilitar Seguridad por Filas (RLS)
ALTER TABLE landing_team ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Seguridad RLS
-- Permitir lectura pública a cualquier visitante (anon y authenticated)
DROP POLICY IF EXISTS "Permitir lectura publica de equipo de trabajo" ON landing_team;
CREATE POLICY "Permitir lectura publica de equipo de trabajo"
ON landing_team FOR SELECT
TO anon, authenticated
USING (true);

-- Permitir gestión completa a administradores y personal autenticado
DROP POLICY IF EXISTS "Permitir gestion completa de equipo a usuarios autenticados" ON landing_team;
CREATE POLICY "Permitir gestion completa de equipo a usuarios autenticados"
ON landing_team FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 5. Vincular a la bitácora de auditoría histórica (si existe la función)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'process_audit_logging') THEN
        DROP TRIGGER IF EXISTS audit_landing_team_trigger ON landing_team;
        CREATE TRIGGER audit_landing_team_trigger
        AFTER INSERT OR UPDATE OR DELETE ON landing_team
        FOR EACH ROW EXECUTE FUNCTION process_audit_logging();
    END IF;
END $$;

-- 6. Insertar integrantes provisionales de prueba de Rancho Carmelitas (si la tabla está vacía)
INSERT INTO landing_team (name, role, description, image_url, order_index)
SELECT 
    'Carmen Gloria Morales',
    'Anfitriona & Administración',
    'Encargada de brindar una cálida bienvenida a cada familia y coordinar estadías memorables en el corazón de Pullally.',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
    0
WHERE NOT EXISTS (SELECT 1 FROM landing_team LIMIT 1);

INSERT INTO landing_team (name, role, description, image_url, order_index)
SELECT 
    'Rodrigo Morales',
    'Operaciones & Entorno Natural',
    'Dedicado al cuidado de nuestros senderos, jardines y a mantener las instalaciones del rancho en óptimas condiciones.',
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=80',
    1
WHERE NOT EXISTS (SELECT 1 FROM landing_team WHERE order_index = 1);

INSERT INTO landing_team (name, role, description, image_url, order_index)
SELECT 
    'Patricia Valenzuela',
    'Hospitalidad & Housekeeping',
    'Comprometida con la máxima pulcritud, confort y detalles acogedores que hacen sentir a nuestros huéspedes como en casa.',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80',
    2
WHERE NOT EXISTS (SELECT 1 FROM landing_team WHERE order_index = 2);

INSERT INTO landing_team (name, role, description, image_url, order_index)
SELECT 
    'Ignacio Soto',
    'Experiencia & Guía Local',
    'Apasionado por la naturaleza de Pullally y Papudo, siempre dispuesto a asistirte y recomendarte los mejores panoramas.',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80',
    3
WHERE NOT EXISTS (SELECT 1 FROM landing_team WHERE order_index = 3);
