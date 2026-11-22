-- ====================================================================
-- Script SQL: Inicialización del Módulo de Landing Page Autogestionable
-- Tablas: landing_settings y landing_gallery
-- Proyecto: Rancho Carmelitas
-- ====================================================================

-- 1. Crear tabla landing_settings (Configuración general del Hero y Logo)
CREATE TABLE IF NOT EXISTS landing_settings (
    id bigint PRIMARY KEY DEFAULT 1,
    hero_title text NOT NULL,
    hero_subtitle text,
    hero_bg_url text,
    logo_url text,
    created_at timestamp with time zone DEFAULT now()
);

-- Asegurar que la restricción de ID único de configuración se cumpla (solo una fila con ID 1)
ALTER TABLE landing_settings DROP CONSTRAINT IF EXISTS only_one_row;
ALTER TABLE landing_settings ADD CONSTRAINT only_one_row CHECK (id = 1);

-- 2. Crear tabla landing_gallery (Fotos de la Galería de Momentos)
CREATE TABLE IF NOT EXISTS landing_gallery (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url text NOT NULL,
    alt_text text DEFAULT 'Foto de momentos Rancho Carmelitas',
    order_index integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);

-- 3. Insertar la configuración inicial del Hero Banner y Logo (Fila por defecto)
INSERT INTO landing_settings (id, hero_title, hero_subtitle, hero_bg_url, logo_url)
VALUES (
    1,
    'Escapa a la naturaleza, con total comodidad.',
    'Descubre nuestras exclusivas cabañas totalmente equipadas en el corazón de Pullally, Papudo. Tu refugio perfecto entre el bosque y el mar.',
    '/gallery/hero.png',
    ''
)
ON CONFLICT (id) DO UPDATE 
SET 
    hero_title = EXCLUDED.hero_title,
    hero_subtitle = EXCLUDED.hero_subtitle,
    hero_bg_url = EXCLUDED.hero_bg_url,
    logo_url = COALESCE(landing_settings.logo_url, EXCLUDED.logo_url);

-- 4. Habilitar RLS (Row Level Security) en ambas tablas
ALTER TABLE landing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_gallery ENABLE ROW LEVEL SECURITY;

-- 5. Crear políticas de acceso para 'landing_settings'
-- A. Lectura Pública para cualquier visitante (Anónimos y Autenticados)
DROP POLICY IF EXISTS "Permitir lectura pública de configuraciones" ON landing_settings;
CREATE POLICY "Permitir lectura pública de configuraciones" 
ON landing_settings FOR SELECT 
USING (true);

-- B. Control Total para administradores (Usuarios Autenticados)
DROP POLICY IF EXISTS "Permitir gestión completa a usuarios autenticados" ON landing_settings;
CREATE POLICY "Permitir gestión completa a usuarios autenticados" 
ON landing_settings FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 6. Crear políticas de acceso para 'landing_gallery'
-- A. Lectura Pública para la galería de fotos
DROP POLICY IF EXISTS "Permitir lectura pública de galería" ON landing_gallery;
CREATE POLICY "Permitir lectura pública de galería" 
ON landing_gallery FOR SELECT 
USING (true);

-- B. Control Total de galería para administradores (Usuarios Autenticados)
DROP POLICY IF EXISTS "Permitir gestión completa de galería a autenticados" ON landing_gallery;
CREATE POLICY "Permitir gestión completa de galería a autenticados" 
ON landing_gallery FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);
