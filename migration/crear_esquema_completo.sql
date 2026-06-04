-- ====================================================================
-- Script SQL Consolidado: Estructura Completa de Base de Datos
-- Proyecto: Rancho Carmelitas Cabañas
-- Objetivo: Inicializar la base de datos de Test con la misma estructura,
--           relaciones, triggers de auditoría, e indexación que Producción.
-- ====================================================================

-- Habilitar la extensión gen_random_uuid si no está habilitada
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- --------------------------------------------------------------------
-- 1. Tabla 'profiles' (Colaboradores / Staff)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY, -- Enlazado con auth.users(id)
    full_name TEXT,
    email TEXT,
    phone TEXT,
    role VARCHAR(50) DEFAULT 'staff',
    banned_until TIMESTAMPTZ DEFAULT NULL,
    block_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- --------------------------------------------------------------------
-- 2. Tabla 'cabins' (Cabañas)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cabins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    capacity INTEGER NOT NULL,
    price_per_night INTEGER NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    is_active BOOLEAN DEFAULT true,
    amenities TEXT[] DEFAULT '{}',
    gallery_urls TEXT[] DEFAULT '{}',
    max_extra_guests INTEGER DEFAULT 0,
    extra_guest_surcharge_percentage INTEGER DEFAULT 100,
    housekeeping_status VARCHAR(50) DEFAULT 'Disponible',
    slogan TEXT,
    origin_title TEXT,
    origin_description TEXT,
    fun_fact TEXT
);

-- --------------------------------------------------------------------
-- 3. Tabla 'plataformas' (Canales de Venta / Booking.com, Airbnb, etc.)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.plataformas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL UNIQUE,
    comision_porcentaje NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- --------------------------------------------------------------------
-- 4. Tabla 'bookings' (Reservas)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cabin_id UUID NOT NULL REFERENCES public.cabins(id) ON DELETE RESTRICT,
    guest_name TEXT NOT NULL,
    guest_email TEXT,
    guest_phone TEXT,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    adults INTEGER NOT NULL DEFAULT 1,
    children INTEGER NOT NULL DEFAULT 0,
    children_ages INTEGER[] DEFAULT '{}',
    travel_reason TEXT,
    special_requests TEXT,
    requires_invoice BOOLEAN DEFAULT false,
    total_price INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'confirmada', -- 'pendiente', 'confirmada', 'cancelada', 'checkin', 'checkout'
    created_at TIMESTAMPTZ DEFAULT now(),
    confirmed_at TIMESTAMPTZ,
    confirmed_by UUID,
    discount_applied INTEGER DEFAULT 0,
    admin_notes TEXT,
    extra_guests_cost INTEGER DEFAULT 0,
    payment_reference VARCHAR(255),
    payment_amount INTEGER DEFAULT 0,
    payment_receipt_url TEXT,
    plataforma_id UUID REFERENCES public.plataformas(id) ON DELETE SET NULL,
    plataforma_comision_aplicada INTEGER DEFAULT 0,
    admin_comision_porcentaje NUMERIC DEFAULT 0,
    admin_notified_conflict BOOLEAN DEFAULT false,
    guest_rut TEXT,
    vehicle_plate TEXT,
    guest_nationality TEXT,
    guest_preferences TEXT,
    guest_birthdate DATE
);

-- --------------------------------------------------------------------
-- 5. Tabla 'booking_payments' (Pagos / Abonos de Reservas)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.booking_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    payment_method VARCHAR(50) NOT NULL, -- 'Transferencia', 'Efectivo', 'Tarjeta', 'Otro'
    reference VARCHAR(255),
    receipt_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices de rendimiento para pagos
CREATE INDEX IF NOT EXISTS idx_payments_booking ON public.booking_payments (booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.booking_payments (created_at DESC);

-- --------------------------------------------------------------------
-- 6. Tabla 'cabin_closures' (Cierres y Bloqueos de Cabañas)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cabin_closures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cabin_id UUID REFERENCES public.cabins(id) ON DELETE CASCADE, -- NULL significa Cierre Global
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT check_dates CHECK (start_date <= end_date)
);

-- Índices de rendimiento para cierres
CREATE INDEX IF NOT EXISTS idx_closures_dates ON public.cabin_closures (start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_closures_cabin ON public.cabin_closures (cabin_id);

-- --------------------------------------------------------------------
-- 7. Tabla 'settings' (Configuraciones Generales del Negocio)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT
);

-- --------------------------------------------------------------------
-- 8. Tabla 'landing_settings' (Ajustes de la Landing Page)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.landing_settings (
    id bigint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    hero_title TEXT NOT NULL,
    hero_subtitle TEXT,
    hero_bg_url TEXT,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- --------------------------------------------------------------------
-- 9. Tabla 'landing_gallery' (Fotos de la Galería pública)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.landing_gallery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url TEXT NOT NULL,
    alt_text TEXT DEFAULT 'Foto de momentos Rancho Carmelitas',
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- --------------------------------------------------------------------
-- 10. Tabla 'audit_logs' (Bitácora de Auditoría Histórica)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID,
    action VARCHAR(20) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    old_data JSONB,
    new_data JSONB,
    performed_by_id UUID,
    performed_by_email VARCHAR(255),
    performed_by_name VARCHAR(255),
    user_role VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices de rendimiento para auditorías
CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON public.audit_logs (table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);

-- ====================================================================
-- RLS (Row Level Security) - Habilitar en todas las tablas
-- ====================================================================
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cabins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cabin_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plataformas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- Políticas RLS (Seguridad)
-- ====================================================================

-- 1. Políticas de bookings
CREATE POLICY "Permitir inserción pública de reservas" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir lectura de reservas por UUID o pública" ON public.bookings FOR SELECT USING (true);
CREATE POLICY "Permitir gestión completa de reservas a personal autenticado" ON public.bookings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. Políticas de cabins
CREATE POLICY "Permitir lectura pública de cabañas" ON public.cabins FOR SELECT USING (true);
CREATE POLICY "Permitir gestión de cabañas a personal autenticado" ON public.cabins FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. Políticas de plataformas
CREATE POLICY "Permitir lectura pública de canales" ON public.plataformas FOR SELECT USING (true);
CREATE POLICY "Permitir gestión de canales a autenticados" ON public.plataformas FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Políticas de cabin_closures
CREATE POLICY "Permitir lectura pública de cierres" ON public.cabin_closures FOR SELECT USING (true);
CREATE POLICY "Permitir gestión de cierres a personal autenticado" ON public.cabin_closures FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. Políticas de profiles
CREATE POLICY "Permitir lectura de perfiles a personal autenticado" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir gestión de perfiles a personal autenticado" ON public.profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. Políticas de settings
CREATE POLICY "Permitir lectura pública de configuraciones globales" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Permitir gestión de configuraciones globales a autenticados" ON public.settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 7. Políticas de booking_payments
CREATE POLICY "Permitir gestión de pagos a personal autenticado" ON public.booking_payments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir lectura pública de pagos" ON public.booking_payments FOR SELECT USING (true);

-- 8. Políticas de landing_settings
CREATE POLICY "Permitir lectura pública de configuraciones" ON public.landing_settings FOR SELECT USING (true);
CREATE POLICY "Permitir gestión completa a usuarios autenticados" ON public.landing_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 9. Políticas de landing_gallery
CREATE POLICY "Permitir lectura pública de galería" ON public.landing_gallery FOR SELECT USING (true);
CREATE POLICY "Permitir gestión completa de galería a autenticados" ON public.landing_gallery FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 10. Políticas de audit_logs
CREATE POLICY "Permitir lectura a administradores autenticados" ON public.audit_logs FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE public.profiles.id = auth.uid() 
            AND public.profiles.role = 'admin'
        )
    );

-- ====================================================================
-- Triggers y Funciones de Auditoría Histórica Automatizada
-- ====================================================================

-- (Cuerpo real de la función de auditoría en producción)
CREATE OR REPLACE FUNCTION public.process_audit_logging()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
    current_user_email VARCHAR(255);
    current_user_name VARCHAR(255);
    current_user_role VARCHAR(50);
    old_json JSONB := NULL;
    new_json JSONB := NULL;
    rec_id UUID := NULL;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        BEGIN
            current_user_id := (current_setting('request.headers', true)::json->>'x-audit-user-id')::uuid;
        EXCEPTION WHEN OTHERS THEN
            current_user_id := NULL;
        END;
    END IF;
    
    IF current_user_id IS NOT NULL THEN
        SELECT email INTO current_user_email FROM auth.users WHERE id = current_user_id;
        SELECT full_name, role INTO current_user_name, current_user_role 
        FROM public.profiles 
        WHERE id = current_user_id;
    END IF;

    IF current_user_role IS NULL THEN
        current_user_role := 'sistema';
    END IF;

    IF (TG_OP = 'DELETE') THEN
        old_json := to_jsonb(OLD);
        BEGIN
            rec_id := OLD.id;
        EXCEPTION WHEN OTHERS THEN
            rec_id := NULL;
        END;
    ELSIF (TG_OP = 'UPDATE') THEN
        old_json := to_jsonb(OLD);
        new_json := to_jsonb(NEW);
        BEGIN
            rec_id := NEW.id;
        EXCEPTION WHEN OTHERS THEN
            rec_id := NULL;
        END;
    ELSIF (TG_OP = 'INSERT') THEN
        new_json := to_jsonb(NEW);
        BEGIN
            rec_id := NEW.id;
        EXCEPTION WHEN OTHERS THEN
            rec_id := NULL;
        END;
    END IF;

    INSERT INTO public.audit_logs (
        table_name,
        record_id,
        action,
        old_data,
        new_data,
        performed_by_id,
        performed_by_email,
        performed_by_name,
        user_role
    ) VALUES (
        TG_TABLE_NAME,
        rec_id,
        TG_OP,
        old_json,
        new_json,
        current_user_id,
        current_user_email,
        current_user_name,
        current_user_role
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar triggers existentes para evitar duplicación al re-ejecutar
DROP TRIGGER IF EXISTS audit_bookings_trigger ON public.bookings;
DROP TRIGGER IF EXISTS audit_cabins_trigger ON public.cabins;
DROP TRIGGER IF EXISTS audit_cabin_closures_trigger ON public.cabin_closures;
DROP TRIGGER IF EXISTS audit_profiles_trigger ON public.profiles;
DROP TRIGGER IF EXISTS audit_payments_trigger ON public.booking_payments;
DROP TRIGGER IF EXISTS audit_landing_settings_trigger ON public.landing_settings;
DROP TRIGGER IF EXISTS audit_landing_gallery_trigger ON public.landing_gallery;
DROP TRIGGER IF EXISTS audit_settings_trigger ON public.settings;
DROP TRIGGER IF EXISTS audit_plataformas_trigger ON public.plataformas;

-- Vincular disparadores a todas las tablas
CREATE TRIGGER audit_bookings_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.process_audit_logging();

CREATE TRIGGER audit_cabins_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.cabins
FOR EACH ROW EXECUTE FUNCTION public.process_audit_logging();

CREATE TRIGGER audit_cabin_closures_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.cabin_closures
FOR EACH ROW EXECUTE FUNCTION public.process_audit_logging();

CREATE TRIGGER audit_profiles_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.process_audit_logging();

CREATE TRIGGER audit_payments_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.booking_payments
FOR EACH ROW EXECUTE FUNCTION public.process_audit_logging();

CREATE TRIGGER audit_landing_settings_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.landing_settings
FOR EACH ROW EXECUTE FUNCTION public.process_audit_logging();

CREATE TRIGGER audit_landing_gallery_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.landing_gallery
FOR EACH ROW EXECUTE FUNCTION public.process_audit_logging();

CREATE TRIGGER audit_settings_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.settings
FOR EACH ROW EXECUTE FUNCTION public.process_audit_logging();

CREATE TRIGGER audit_plataformas_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.plataformas
FOR EACH ROW EXECUTE FUNCTION public.process_audit_logging();
