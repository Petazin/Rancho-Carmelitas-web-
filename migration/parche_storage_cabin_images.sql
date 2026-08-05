-- ====================================================================
-- Script SQL: Políticas de Seguridad RLS para el Bucket 'cabin-images'
-- Proyecto: Rancho Carmelitas
-- Objetivo: Permitir la lectura pública de las imágenes y la gestión
--           completa (subida, edición y borrado) por parte de usuarios
--           autenticados en el PMS.
-- ====================================================================

-- 1. Permitir lectura pública de objetos en el bucket 'cabin-images'
DROP POLICY IF EXISTS "Permitir lectura pública de cabin-images" ON storage.objects;
CREATE POLICY "Permitir lectura pública de cabin-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'cabin-images');

-- 2. Permitir gestión completa de objetos (inserción, actualización, borrado)
--    en el bucket 'cabin-images' solo a usuarios autenticados
DROP POLICY IF EXISTS "Permitir gestión completa de cabin-images a autenticados" ON storage.objects;
CREATE POLICY "Permitir gestión completa de cabin-images a autenticados"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'cabin-images')
WITH CHECK (bucket_id = 'cabin-images');
