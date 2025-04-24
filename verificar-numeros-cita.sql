-- Verificar que todas las citas tengan un número de cita asignado
SELECT id, numero_cita FROM citas WHERE numero_cita IS NULL;

-- Actualizar cualquier cita que no tenga número asignado
UPDATE citas
SET numero_cita = LPAD(id::text, 4, '0')
WHERE numero_cita IS NULL;

-- Verificar que todas las citas ahora tengan un número de cita
SELECT id, numero_cita FROM citas ORDER BY id;
