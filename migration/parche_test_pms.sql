-- ====================================================================
-- Script SQL: Parche de Compatibilidad para el Entorno de Test (Ultra-Defensivo)
-- Proyecto: Rancho Carmelitas
-- Objetivo: Eliminar claves foráneas preventivas, corregir tipo de columna
--           confirmed_by a TEXT y aprovisionar el bucket de storage en Test.
-- ====================================================================

-- 1. Eliminar de forma defensiva cualquier restricción de clave foránea sobre confirmed_by.
-- Si existe una relación de clave foránea, PostgreSQL impedirá alterar el tipo de columna.
-- Botamos las combinaciones de nombres de restricción más probables utilizando CASCADE.
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_confirmed_by_fkey CASCADE;
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_confirmed_by_profiles_fkey CASCADE;
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_confirmed_by_users_fkey CASCADE;
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS fk_bookings_confirmed_by CASCADE;

-- 2. Alterar la columna confirmed_by de la tabla bookings a TEXT
-- Usamos USING para forzar el casting explícito del tipo UUID a TEXT
ALTER TABLE public.bookings ALTER COLUMN confirmed_by TYPE TEXT USING confirmed_by::text;

-- 3. Registrar el bucket 'payment-receipts' en la tabla de almacenamiento
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-receipts', 'payment-receipts', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Crear políticas de seguridad RLS para el bucket de comprobantes en Storage
DROP POLICY IF EXISTS "Permitir lectura pública de comprobantes" ON storage.objects;
CREATE POLICY "Permitir lectura pública de comprobantes"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-receipts');

DROP POLICY IF EXISTS "Permitir gestión completa de comprobantes a autenticados" ON storage.objects;
CREATE POLICY "Permitir gestión completa de comprobantes a autenticados"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'payment-receipts')
WITH CHECK (bucket_id = 'payment-receipts');
