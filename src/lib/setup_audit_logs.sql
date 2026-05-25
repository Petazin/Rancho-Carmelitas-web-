-- Creación de la tabla de bitácora de auditoría histórica
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID,
    action VARCHAR(20) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    old_data JSONB,
    new_data JSONB,
    performed_by_id UUID, -- ID de auth.users si lo hay
    performed_by_email VARCHAR(255), -- Email de auth.users si lo hay
    performed_by_name VARCHAR(255), -- Nombre completo de profiles si lo hay
    user_role VARCHAR(50), -- Rol del usuario que hizo el cambio
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para búsquedas eficientes en el timeline
CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON audit_logs (table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at DESC);

-- Habilitar RLS en audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Política de lectura restringida solo a administradores auténticos
CREATE POLICY "Permitir lectura a administradores autenticados" ON audit_logs
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Crear la función de trigger de auditoría general inteligente
CREATE OR REPLACE FUNCTION process_audit_logging()
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
    -- Capturar el ID de usuario del contexto actual de Supabase
    current_user_id := auth.uid();
    
    -- Si es null, intentar recuperarlo del header HTTP personalizado enviado por la API backend (Next.js)
    IF current_user_id IS NULL THEN
        BEGIN
            current_user_id := (current_setting('request.headers', true)::json->>'x-audit-user-id')::uuid;
        EXCEPTION WHEN OTHERS THEN
            current_user_id := NULL;
        END;
    END IF;
    
    -- Si hay un usuario autenticado, buscar su correo y su perfil
    IF current_user_id IS NOT NULL THEN
        -- Obtener correo desde auth.users
        SELECT email INTO current_user_email FROM auth.users WHERE id = current_user_id;
        
        -- Obtener nombre completo y rol desde profiles
        SELECT full_name, role INTO current_user_name, current_user_role 
        FROM public.profiles 
        WHERE id = current_user_id;
    END IF;

    -- Si no hay rol asignado pero es el usuario del sistema o anónimo, establecer valores por defecto
    IF current_user_role IS NULL THEN
        current_user_role := 'sistema';
    END IF;

    -- Determinar el record_id y los JSON de old_data y new_data
    IF (TG_OP = 'DELETE') THEN
        old_json := to_jsonb(OLD);
        -- Intentar extraer el ID si es un UUID
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

    -- Insertar en la bitácora
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
DROP TRIGGER IF EXISTS audit_bookings_trigger ON bookings;
DROP TRIGGER IF EXISTS audit_cabins_trigger ON cabins;
DROP TRIGGER IF EXISTS audit_cabin_closures_trigger ON cabin_closures;
DROP TRIGGER IF EXISTS audit_profiles_trigger ON profiles;

-- Asociar triggers a las tablas principales
CREATE TRIGGER audit_bookings_trigger
AFTER INSERT OR UPDATE OR DELETE ON bookings
FOR EACH ROW EXECUTE FUNCTION process_audit_logging();

CREATE TRIGGER audit_cabins_trigger
AFTER INSERT OR UPDATE OR DELETE ON cabins
FOR EACH ROW EXECUTE FUNCTION process_audit_logging();

CREATE TRIGGER audit_cabin_closures_trigger
AFTER INSERT OR UPDATE OR DELETE ON cabin_closures
FOR EACH ROW EXECUTE FUNCTION process_audit_logging();

CREATE TRIGGER audit_profiles_trigger
AFTER INSERT OR UPDATE OR DELETE ON profiles
FOR EACH ROW EXECUTE FUNCTION process_audit_logging();
