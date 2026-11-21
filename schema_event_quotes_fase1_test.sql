-- ====================================================================
-- Script SQL: Fase 1 - Sistema de Arriendo de Recinto Completo (Eventos Diurnos de 8 Horas)
-- Proyecto: Rancho Carmelitas (Entorno Test)
-- Tablas: event_quotes, integración con cabin_closures y audit_logs
-- Funciones RPC: check_full_venue_availability, create_public_event_quote, get_occupied_venue_dates
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. Crear tabla principal: 'event_quotes'
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Fecha y horario del evento
    event_date DATE NOT NULL,
    start_time TIME DEFAULT '10:00:00',
    end_time TIME DEFAULT '18:00:00',
    
    -- Datos del organizador responsable
    organizer_name TEXT NOT NULL,
    organizer_email TEXT NOT NULL,
    organizer_phone TEXT NOT NULL,
    organizer_rut TEXT,
    
    -- Clasificación del grupo
    group_type TEXT NOT NULL DEFAULT 'paseo_curso' 
        CHECK (group_type IN ('paseo_curso', 'adulto_mayor', 'familiar', 'empresa', 'otro')),
    group_name TEXT, -- Ej: 'Colegio San José - 4to Medio B'
    
    -- Conteo de asistentes y tramos
    total_guests INTEGER NOT NULL DEFAULT 1,
    adults_count INTEGER NOT NULL DEFAULT 1,
    children_count INTEGER DEFAULT 0,
    under_3_years_count INTEGER DEFAULT 0, -- Menores de 3 años (no pagan)
    
    -- Adicionales y servicios
    has_bouncy_castle BOOLEAN DEFAULT FALSE,
    bouncy_castle_fee NUMERIC DEFAULT 0, -- $5.000 si trae inflable
    extra_services_notes TEXT,
    
    -- Aspectos Financieros oficiales
    base_price NUMERIC NOT NULL DEFAULT 180000, -- $180.000 hasta 15p / $250.000 hasta 30p
    extra_guests_cost NUMERIC DEFAULT 0,       -- $3.500 por persona extra sobre la base del tramo
    total_amount NUMERIC NOT NULL DEFAULT 180000,
    deposit_required NUMERIC NOT NULL DEFAULT 90000, -- 50% para reservar
    deposit_paid NUMERIC DEFAULT 0,
    
    -- Estados operativos del evento
    status TEXT NOT NULL DEFAULT 'Cotizacion_Pendiente' 
        CHECK (status IN ('Cotizacion_Pendiente', 'Aprobada', 'Confirmada', 'Rechazada', 'Cancelada')),
    
    -- Información de pago
    payment_method TEXT,
    payment_reference TEXT,
    
    -- Gestión administrativa
    admin_notes TEXT,
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    
    -- Manejo de Excepción de Cabaña Conversada (si el grupo solicita cabaña de apoyo)
    includes_support_cabin BOOLEAN DEFAULT FALSE,
    support_cabin_id UUID REFERENCES cabins(id) ON DELETE SET NULL,
    support_cabin_extra_fee NUMERIC DEFAULT 0,
    
    -- Cierre temporal automático vinculado
    associated_closure_id UUID REFERENCES cabin_closures(id) ON DELETE SET NULL
);

-- Índices de búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_event_quotes_date ON event_quotes(event_date);
CREATE INDEX IF NOT EXISTS idx_event_quotes_status ON event_quotes(status);

-- --------------------------------------------------------------------
-- 2. Función RPC: 'check_full_venue_availability'
-- Verifica si una fecha específica está 100% disponible para Recinto Completo
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_full_venue_availability(p_date DATE)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_has_bookings BOOLEAN := FALSE;
    v_has_closures BOOLEAN := FALSE;
    v_has_events BOOLEAN := FALSE;
    v_conflict_reason TEXT := NULL;
BEGIN
    -- 1. Verificar si hay reservas de cabañas individuales activas que toquen esta fecha
    SELECT EXISTS (
        SELECT 1 FROM bookings
        WHERE status != 'Cancelada'
          AND (
            -- Reserva que pasa la noche o que solapa con el día
            (check_in <= p_date AND check_out > p_date)
            OR check_in = p_date
          )
    ) INTO v_has_bookings;

    IF v_has_bookings THEN
        RETURN json_build_object(
            'available', FALSE,
            'reason', 'Existen reservas individuales de cabañas confirmadas para esta fecha. Te sugerimos seleccionar otro día disponible.'
        );
    END IF;

    -- 2. Verificar si hay cierres temporales (totales o individuales) en esa fecha
    SELECT EXISTS (
        SELECT 1 FROM cabin_closures
        WHERE start_date <= p_date AND end_date >= p_date
    ) INTO v_has_closures;

    IF v_has_closures THEN
        RETURN json_build_object(
            'available', FALSE,
            'reason', 'El recinto cuenta con un cierre o mantención programada para esta fecha.'
        );
    END IF;

    -- 3. Verificar si ya existe otro evento confirmado o aprobado en esa fecha
    SELECT EXISTS (
        SELECT 1 FROM event_quotes
        WHERE event_date = p_date
          AND status IN ('Confirmada', 'Aprobada')
    ) INTO v_has_events;

    IF v_has_events THEN
        RETURN json_build_object(
            'available', FALSE,
            'reason', 'El recinto completo ya se encuentra reservado para otro evento en esta fecha.'
        );
    END IF;

    -- Fecha 100% disponible
    RETURN json_build_object(
        'available', TRUE,
        'reason', 'Fecha disponible para Arriendo de Recinto Completo (8 horas).'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION check_full_venue_availability(DATE) TO anon, authenticated;
COMMENT ON FUNCTION check_full_venue_availability(DATE) IS 'Comprueba de forma atómica si una fecha está libre de cabañas y eventos para arrendar el recinto completo.';

-- --------------------------------------------------------------------
-- 3. Función RPC: 'get_occupied_venue_dates'
-- Retorna todas las fechas ocupadas para el calendario público del cotizador
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_occupied_venue_dates()
RETURNS TABLE (
    occupied_date DATE
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    -- Fechas ocupadas por reservas de cabañas existentes
    SELECT DISTINCT d::DATE AS occupied_date
    FROM bookings b,
         generate_series(b.check_in, b.check_out, '1 day'::interval) d
    WHERE b.status != 'Cancelada'
    
    UNION
    
    -- Fechas ocupadas por cierres de cabañas (totales o parciales)
    SELECT DISTINCT d::DATE AS occupied_date
    FROM cabin_closures c,
         generate_series(c.start_date, c.end_date, '1 day'::interval) d
         
    UNION
    
    -- Fechas ocupadas por eventos diurnos ya aprobados o confirmados
    SELECT event_date AS occupied_date
    FROM event_quotes
    WHERE status IN ('Confirmada', 'Aprobada');
$$;

GRANT EXECUTE ON FUNCTION get_occupied_venue_dates() TO anon, authenticated;
COMMENT ON FUNCTION get_occupied_venue_dates() IS 'Retorna las fechas no disponibles para arriendo de recinto completo para pintar el calendario del cotizador.';

-- --------------------------------------------------------------------
-- 4. Función RPC: 'create_public_event_quote'
-- Permite al visitante registrar su cotización de forma segura
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_public_event_quote(
    p_event_date DATE,
    p_start_time TIME,
    p_end_time TIME,
    p_organizer_name TEXT,
    p_organizer_email TEXT,
    p_organizer_phone TEXT,
    p_organizer_rut TEXT,
    p_group_type TEXT,
    p_group_name TEXT,
    p_adults_count INTEGER,
    p_children_count INTEGER,
    p_under_3_years_count INTEGER,
    p_has_bouncy_castle BOOLEAN,
    p_extra_services_notes TEXT,
    p_base_price NUMERIC,
    p_extra_guests_cost NUMERIC,
    p_bouncy_castle_fee NUMERIC,
    p_total_amount NUMERIC,
    p_deposit_required NUMERIC
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_quote_id UUID;
    v_avail JSON;
    v_total_guests INTEGER;
BEGIN
    -- Validar disponibilidad de fecha antes de registrar la cotización
    v_avail := check_full_venue_availability(p_event_date);
    IF (v_avail->>'available')::BOOLEAN = FALSE THEN
        RAISE EXCEPTION 'La fecha seleccionada ya no se encuentra disponible: %', v_avail->>'reason';
    END IF;

    v_total_guests := COALESCE(p_adults_count, 1) + COALESCE(p_children_count, 0) + COALESCE(p_under_3_years_count, 0);

    INSERT INTO event_quotes (
        event_date,
        start_time,
        end_time,
        organizer_name,
        organizer_email,
        organizer_phone,
        organizer_rut,
        group_type,
        group_name,
        total_guests,
        adults_count,
        children_count,
        under_3_years_count,
        has_bouncy_castle,
        extra_services_notes,
        base_price,
        extra_guests_cost,
        bouncy_castle_fee,
        total_amount,
        deposit_required,
        status
    ) VALUES (
        p_event_date,
        COALESCE(p_start_time, '10:00:00'),
        COALESCE(p_end_time, '18:00:00'),
        p_organizer_name,
        p_organizer_email,
        p_organizer_phone,
        p_organizer_rut,
        COALESCE(p_group_type, 'paseo_curso'),
        p_group_name,
        v_total_guests,
        COALESCE(p_adults_count, 1),
        COALESCE(p_children_count, 0),
        COALESCE(p_under_3_years_count, 0),
        COALESCE(p_has_bouncy_castle, FALSE),
        p_extra_services_notes,
        p_base_price,
        p_extra_guests_cost,
        p_bouncy_castle_fee,
        p_total_amount,
        p_deposit_required,
        'Cotizacion_Pendiente'
    )
    RETURNING id INTO v_quote_id;

    RETURN v_quote_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_public_event_quote TO anon, authenticated;
COMMENT ON FUNCTION create_public_event_quote IS 'Inserta de manera segura una cotización de arriendo de recinto validando disponibilidad.';

-- --------------------------------------------------------------------
-- 5. Trigger Automático: Sincronización con 'cabin_closures'
-- Cuando el evento pasa a 'Confirmada', bloquea automáticamente todas las cabañas
-- Si se cancela, libera el cierre automáticamente.
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sync_event_quote_closure()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_closure_id UUID;
    v_reason TEXT;
BEGIN
    v_reason := 'Evento Exclusivo Recinto: ' || COALESCE(NEW.group_name, NEW.organizer_name, 'Grupo Particular');

    -- Caso A: El evento se confirma -> Crear o actualizar cierre total en cabin_closures
    IF NEW.status = 'Confirmada' AND (OLD.status IS NULL OR OLD.status != 'Confirmada') THEN
        IF NEW.associated_closure_id IS NOT NULL THEN
            UPDATE cabin_closures
            SET start_date = NEW.event_date,
                end_date = NEW.event_date,
                reason = v_reason
            WHERE id = NEW.associated_closure_id;
        ELSE
            INSERT INTO cabin_closures (
                cabin_id,
                start_date,
                end_date,
                reason
            ) VALUES (
                NULL, -- NULL significa Cierre Total de todas las cabañas
                NEW.event_date,
                NEW.event_date,
                v_reason
            )
            RETURNING id INTO v_closure_id;

            NEW.associated_closure_id := v_closure_id;
        END IF;
    
    -- Caso B: El evento se cancela o rechaza -> Eliminar cierre total si existía
    ELSIF NEW.status IN ('Cancelada', 'Rechazada') AND NEW.associated_closure_id IS NOT NULL THEN
        DELETE FROM cabin_closures WHERE id = NEW.associated_closure_id;
        NEW.associated_closure_id := NULL;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_event_quote_closure ON event_quotes;
CREATE TRIGGER trigger_sync_event_quote_closure
BEFORE INSERT OR UPDATE OF status, event_date ON event_quotes
FOR EACH ROW
EXECUTE FUNCTION sync_event_quote_closure();

-- --------------------------------------------------------------------
-- 6. Habilitar Seguridad RLS en 'event_quotes'
-- --------------------------------------------------------------------
ALTER TABLE event_quotes ENABLE ROW LEVEL SECURITY;

-- Política A: Personal autenticado (Admin y Staff) tiene control total
DROP POLICY IF EXISTS "Permitir gestion completa de eventos a personal autenticado" ON event_quotes;
CREATE POLICY "Permitir gestion completa de eventos a personal autenticado"
ON event_quotes FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Política B: Visitantes anónimos pueden leer su cotización por ID específico (para portal de pago)
DROP POLICY IF EXISTS "Permitir lectura publica de cotizacion por ID" ON event_quotes;
CREATE POLICY "Permitir lectura publica de cotizacion por ID"
ON event_quotes FOR SELECT
TO anon
USING (true);

-- --------------------------------------------------------------------
-- 7. Vincular a la Bitácora de Auditoría Histórica
-- --------------------------------------------------------------------
DROP TRIGGER IF EXISTS audit_event_quotes_trigger ON event_quotes;
CREATE TRIGGER audit_event_quotes_trigger
AFTER INSERT OR UPDATE OR DELETE ON event_quotes
FOR EACH ROW EXECUTE FUNCTION process_audit_logging();

COMMENT ON TRIGGER audit_event_quotes_trigger ON event_quotes IS 'Audita automáticamente todas las cotizaciones y reservas de eventos diurnos en audit_logs';
