-- Agregar columna numero_cita a la tabla citas si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'citas' AND column_name = 'numero_cita'
    ) THEN
        ALTER TABLE citas ADD COLUMN numero_cita VARCHAR(10);
        
        -- Actualizar las citas existentes con números secuenciales
        WITH citas_numeradas AS (
            SELECT id, LPAD(ROW_NUMBER() OVER (ORDER BY id), 4, '0') as nuevo_numero
            FROM citas
        )
        UPDATE citas c
        SET numero_cita = cn.nuevo_numero
        FROM citas_numeradas cn
        WHERE c.id = cn.id;
        
        -- Crear una secuencia para generar números de cita
        CREATE SEQUENCE IF NOT EXISTS cita_numero_seq START 1;
        
        -- Actualizar la secuencia al valor máximo actual
        SELECT setval('cita_numero_seq', (SELECT COALESCE(MAX(CAST(numero_cita AS INTEGER)), 0) FROM citas), true);
    END IF;
END $$;

-- Verificar que la columna se haya agregado correctamente
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'citas' AND column_name = 'numero_cita';
