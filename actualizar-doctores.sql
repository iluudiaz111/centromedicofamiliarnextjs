-- Actualizar las contraseñas de los doctores para asegurarnos de que sean correctas
UPDATE doctores SET password = 'password123';

-- Verificar los doctores actualizados
SELECT * FROM doctores;
