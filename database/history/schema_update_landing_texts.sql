-- ====================================================================
-- Script SQL: Ampliación del Módulo de Landing Page Autogestionable
-- Tabla: landing_settings
-- Proyecto: Rancho Carmelitas
-- Objetivo: Agregar columnas para gestionar textos anteriormente en duro
-- ====================================================================

-- 1. Ampliar la tabla landing_settings con los nuevos campos de textos
ALTER TABLE landing_settings 
ADD COLUMN IF NOT EXISTS cabins_title text DEFAULT 'Nuestras Cabañas',
ADD COLUMN IF NOT EXISTS cabins_subtitle text DEFAULT 'Espacios diseñados para tu confort. Cabañas con cocina equipada, aire acondicionado y todo lo necesario para tu descanso en Rancho Carmelitas.',
ADD COLUMN IF NOT EXISTS gallery_title text DEFAULT 'Galería de Momentos',
ADD COLUMN IF NOT EXISTS gallery_subtitle text DEFAULT 'Vistas reales de nuestro entorno, piscina y confortables interiores.',
ADD COLUMN IF NOT EXISTS sernatur_title text DEFAULT 'Servicio Turístico Registrado',
ADD COLUMN IF NOT EXISTS sernatur_subtitle text DEFAULT 'Vigencia hasta Enero 2026 • Registro № 71034',
ADD COLUMN IF NOT EXISTS sernatur_badge text DEFAULT 'Calidad y Confianza',
ADD COLUMN IF NOT EXISTS rules_title text DEFAULT 'Reglas de Convivencia',
ADD COLUMN IF NOT EXISTS rules_list text[] DEFAULT ARRAY[
    'Check-in: 15:00 hrs. Check-out: 11:00 hrs.',
    'Prohibido fumar: Por seguridad forestal, no se permite fumar dentro de las cabañas.',
    'Mascotas: Aceptamos amigos peludos con previo aviso y bajo responsabilidad del dueño.',
    'Silencio nocturno: Respetamos la paz del bosque después de las 23:00 hrs.'
];

-- 2. Inicializar o actualizar los valores por defecto en la fila existente (ID 1)
-- Esto asegura que no queden valores NULL y se apliquen los valores por defecto
UPDATE landing_settings
SET 
    cabins_title = COALESCE(cabins_title, 'Nuestras Cabañas'),
    cabins_subtitle = COALESCE(cabins_subtitle, 'Espacios diseñados para tu confort. Cabañas con cocina equipada, aire acondicionado y todo lo necesario para tu descanso en Rancho Carmelitas.'),
    gallery_title = COALESCE(gallery_title, 'Galería de Momentos'),
    gallery_subtitle = COALESCE(gallery_subtitle, 'Vistas reales de nuestro entorno, piscina y confortables interiores.'),
    sernatur_title = COALESCE(sernatur_title, 'Servicio Turístico Registrado'),
    sernatur_subtitle = COALESCE(sernatur_subtitle, 'Vigencia hasta Enero 2026 • Registro № 71034'),
    sernatur_badge = COALESCE(sernatur_badge, 'Calidad y Confianza'),
    rules_title = COALESCE(rules_title, 'Reglas de Convivencia'),
    rules_list = COALESCE(rules_list, ARRAY[
        'Check-in: 15:00 hrs. Check-out: 11:00 hrs.',
        'Prohibido fumar: Por seguridad forestal, no se permite fumar dentro de las cabañas.',
        'Mascotas: Aceptamos amigos peludos con previo aviso y bajo responsabilidad del dueño.',
        'Silencio nocturno: Respetamos la paz del bosque después de las 23:00 hrs.'
    ])
WHERE id = 1;
