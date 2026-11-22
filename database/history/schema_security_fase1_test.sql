-- ====================================================================
-- Script SQL: Fase 1 - Blindaje de Seguridad y Privacidad (Entorno Test)
-- Proyecto: Rancho Carmelitas
-- Objetivo: Cerrar la lectura pública de datos personales en 'bookings'
--           y habilitar funciones RPC seguras para el calendario público.
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. Crear función segura para el calendario público (Solo fechas)
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_occupied_dates(p_cabin_id UUID)
RETURNS TABLE (
    check_in DATE,
    check_out DATE
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT check_in, check_out
    FROM bookings
    WHERE cabin_id = p_cabin_id
      AND status != 'Cancelada';
$$;

GRANT EXECUTE ON FUNCTION get_occupied_dates(UUID) TO anon, authenticated;
COMMENT ON FUNCTION get_occupied_dates(UUID) IS 'Retorna exclusivamente fechas ocupadas de una cabaña para el calendario sin exponer nombres, RUTs ni datos de contacto.';

-- --------------------------------------------------------------------
-- 2. Crear función para verificar disponibilidad (Evitar colisiones)
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_dates_overlap(
    p_cabin_id UUID, 
    p_check_in DATE, 
    p_check_out DATE
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM bookings
        WHERE cabin_id = p_cabin_id
          AND status != 'Cancelada'
          AND check_in < p_check_out
          AND check_out > p_check_in
    );
$$;

GRANT EXECUTE ON FUNCTION check_dates_overlap(UUID, DATE, DATE) TO anon, authenticated;
COMMENT ON FUNCTION check_dates_overlap(UUID, DATE, DATE) IS 'Comprueba colisiones de fechas de forma atómica sin dar acceso a la tabla bookings.';

-- --------------------------------------------------------------------
-- 3. Crear función de inserción segura de reservas públicas
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_public_booking(
    p_cabin_id UUID,
    p_guest_name TEXT,
    p_guest_email TEXT,
    p_guest_phone TEXT,
    p_guest_rut TEXT,
    p_vehicle_plate TEXT DEFAULT NULL,
    p_guest_nationality TEXT DEFAULT NULL,
    p_guest_preferences TEXT DEFAULT NULL,
    p_guest_birthdate DATE DEFAULT NULL,
    p_check_in DATE DEFAULT NULL,
    p_check_out DATE DEFAULT NULL,
    p_adults INTEGER DEFAULT 1,
    p_children INTEGER DEFAULT 0,
    p_children_ages TEXT DEFAULT NULL,
    p_travel_reason TEXT DEFAULT NULL,
    p_requires_invoice BOOLEAN DEFAULT FALSE,
    p_total_price NUMERIC DEFAULT 0,
    p_extra_guests_cost NUMERIC DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_booking_id UUID;
    v_children_ages_arr INTEGER[] := NULL;
BEGIN
    -- Validar colisión antes de insertar para evitar overbookings
    IF EXISTS (
        SELECT 1 FROM bookings
        WHERE cabin_id = p_cabin_id
          AND status != 'Cancelada'
          AND check_in < p_check_out
          AND check_out > p_check_in
    ) THEN
        RAISE EXCEPTION 'Fechas no disponibles';
    END IF;

    -- Convertir edades de texto (ej: "5, 8") a array de enteros integer[]
    IF p_children_ages IS NOT NULL AND trim(p_children_ages) != '' THEN
        BEGIN
            v_children_ages_arr := string_to_array(replace(p_children_ages, ' ', ''), ',')::INTEGER[];
        EXCEPTION WHEN OTHERS THEN
            v_children_ages_arr := NULL;
        END;
    END IF;

    -- Inserción segura protegida dentro del servidor
    INSERT INTO bookings (
        cabin_id, guest_name, guest_email, guest_phone, guest_rut,
        vehicle_plate, guest_nationality, guest_preferences, guest_birthdate,
        check_in, check_out, adults, children, children_ages,
        travel_reason, requires_invoice, total_price, extra_guests_cost,
        status
    ) VALUES (
        p_cabin_id, p_guest_name, p_guest_email, p_guest_phone, p_guest_rut,
        p_vehicle_plate, p_guest_nationality, p_guest_preferences, p_guest_birthdate,
        p_check_in, p_check_out, p_adults, p_children, v_children_ages_arr,
        p_travel_reason, p_requires_invoice, p_total_price, p_extra_guests_cost,
        'Pendiente'
    )
    RETURNING id INTO v_booking_id;

    RETURN v_booking_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_public_booking TO anon, authenticated;
COMMENT ON FUNCTION create_public_booking IS 'Permite a los visitantes registrar su reserva de forma segura retornando el identificador sin otorgar permisos de lectura global.';

-- --------------------------------------------------------------------
-- 4. Blindar las Políticas de RLS en 'bookings'
-- --------------------------------------------------------------------
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas antiguas permisivas que exponían los datos
DROP POLICY IF EXISTS "Permitir lectura de reservas por UUID o pública" ON bookings;
DROP POLICY IF EXISTS "Permitir lectura pública de reservas" ON bookings;
DROP POLICY IF EXISTS "Permitir inserción pública de reservas" ON bookings;
DROP POLICY IF EXISTS "Permitir gestión completa de reservas a personal autenticado" ON bookings;

-- Política A: El personal autenticado (Admin y Staff) mantiene control y lectura total
CREATE POLICY "Permitir gestión completa de reservas a personal autenticado"
ON bookings FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Política B: Inserción directa (como respaldo para compatibilidad)
CREATE POLICY "Permitir inserción pública de reservas"
ON bookings FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- NOTA: Al no haber política de SELECT para 'anon', la tabla 'bookings'
-- queda 100% blindada contra consultas no autorizadas desde la consola web.
