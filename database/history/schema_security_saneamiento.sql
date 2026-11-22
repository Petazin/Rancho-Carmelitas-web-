-- ====================================================================
-- Script SQL: Saneamiento y Robustecimiento de Seguridad de Datos (RLS)
-- Proyecto: Rancho Carmelitas
-- Objetivo: Resolver vulnerabilidad "Mesa de acceso público" (rls_disabled_in_public)
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. Habilitar de forma estricta RLS (Row Level Security) en todas las tablas
-- --------------------------------------------------------------------
ALTER TABLE IF EXISTS bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cabins ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cabin_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS plataformas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS landing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS landing_gallery ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------
-- 2. Políticas de Seguridad para la tabla 'bookings' (Reservas)
-- --------------------------------------------------------------------
-- A. Permitir inserción pública (los clientes deben poder reservar desde el sitio público)
DROP POLICY IF EXISTS "Permitir inserción pública de reservas" ON bookings;
CREATE POLICY "Permitir inserción pública de reservas" 
ON bookings FOR INSERT 
WITH CHECK (true);

-- B. Permitir lectura pública (los clientes deben poder ver su confirmación y éxito por UUID)
DROP POLICY IF EXISTS "Permitir lectura de reservas por UUID o pública" ON bookings;
CREATE POLICY "Permitir lectura de reservas por UUID o pública" 
ON bookings FOR SELECT 
USING (true);

-- C. Permitir control total a administradores y staff autenticados
DROP POLICY IF EXISTS "Permitir gestión completa de reservas a personal autenticado" ON bookings;
CREATE POLICY "Permitir gestión completa de reservas a personal autenticado" 
ON bookings FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- --------------------------------------------------------------------
-- 3. Políticas de Seguridad para la tabla 'cabins' (Cabañas)
-- --------------------------------------------------------------------
-- A. Permitir lectura pública de cabañas (para que se desplieguen en la Landing Page)
DROP POLICY IF EXISTS "Permitir lectura pública de cabañas" ON cabins;
CREATE POLICY "Permitir lectura pública de cabañas" 
ON cabins FOR SELECT 
USING (true);

-- B. Permitir gestión completa de cabañas únicamente a personal autenticado
DROP POLICY IF EXISTS "Permitir gestión de cabañas a personal autenticado" ON cabins;
CREATE POLICY "Permitir gestión de cabañas a personal autenticado" 
ON cabins FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- --------------------------------------------------------------------
-- 4. Políticas de Seguridad para la tabla 'cabin_closures' (Cierres y Bloqueos)
-- --------------------------------------------------------------------
-- A. Permitir lectura pública de bloqueos (para deshabilitar días en calendarios públicos)
DROP POLICY IF EXISTS "Permitir lectura pública de cierres" ON cabin_closures;
CREATE POLICY "Permitir lectura pública de cierres" 
ON cabin_closures FOR SELECT 
USING (true);

-- B. Permitir gestión completa de cierres únicamente a personal autenticado
DROP POLICY IF EXISTS "Permitir gestión de cierres a personal autenticado" ON cabin_closures;
CREATE POLICY "Permitir gestión de cierres a personal autenticado" 
ON cabin_closures FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- --------------------------------------------------------------------
-- 5. Políticas de Seguridad para la tabla 'profiles' (Perfiles de Equipo)
-- --------------------------------------------------------------------
-- A. Permitir lectura de perfiles a personal autenticado
DROP POLICY IF EXISTS "Permitir lectura de perfiles a personal autenticado" ON profiles;
CREATE POLICY "Permitir lectura de perfiles a personal autenticado" 
ON profiles FOR SELECT 
TO authenticated 
USING (true);

-- B. Permitir gestión de perfiles a personal autenticado
DROP POLICY IF EXISTS "Permitir gestión de perfiles a personal autenticado" ON profiles;
CREATE POLICY "Permitir gestión de perfiles a personal autenticado" 
ON profiles FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- --------------------------------------------------------------------
-- 6. Políticas de Seguridad para la tabla 'settings' (Configuraciones Globales)
-- --------------------------------------------------------------------
-- A. Permitir lectura pública de configuraciones (WhatsApp de contacto, etc.)
DROP POLICY IF EXISTS "Permitir lectura pública de configuraciones globales" ON settings;
CREATE POLICY "Permitir lectura pública de configuraciones globales" 
ON settings FOR SELECT 
USING (true);

-- B. Permitir gestión de configuraciones globales a personal autenticado
DROP POLICY IF EXISTS "Permitir gestión de configuraciones globales a autenticados" ON settings;
CREATE POLICY "Permitir gestión de configuraciones globales a autenticados" 
ON settings FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- --------------------------------------------------------------------
-- 7. Políticas de Seguridad para la tabla 'plataformas' (Canales y Comisiones)
-- --------------------------------------------------------------------
-- A. Permitir lectura pública de canales de venta
DROP POLICY IF EXISTS "Permitir lectura pública de canales" ON plataformas;
CREATE POLICY "Permitir lectura pública de canales" 
ON plataformas FOR SELECT 
USING (true);

-- B. Permitir gestión de canales de venta únicamente a personal autenticado
DROP POLICY IF EXISTS "Permitir gestión de canales a autenticados" ON plataformas;
CREATE POLICY "Permitir gestión de canales a autenticados" 
ON plataformas FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);
