-- Verificar si la columna numero_cita existe en la tabla citas
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'citas' AND column_name = 'numero_cita'
    ) INTO column_exists;

    IF NOT column_exists THEN
        -- La columna no existe, agregarla
        EXECUTE 'ALTER TABLE citas ADD COLUMN numero_cita VARCHAR(10)';
        
        -- Actualizar las citas existentes con números secuenciales
        WITH citas_numeradas AS (
            SELECT id, LPAD(id::text, 4, '0') as nuevo_numero
            FROM citas
        )
        UPDATE citas c
        SET numero_cita = cn.nuevo_numero
        FROM citas_numeradas cn
        WHERE c.id = cn.id;
        
        RAISE NOTICE 'Columna numero_cita agregada y actualizada con éxito';
    ELSE
        RAISE NOTICE 'La columna numero_cita ya existe en la tabla citas';
    END IF;
END $$;

-- Verificar que la columna se haya agregado correctamente
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'citas' AND column_name = 'numero_cita';
