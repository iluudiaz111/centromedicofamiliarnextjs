-- Actualizar las descripciones que mencionan pesos a quetzales
UPDATE estadisticas 
SET descripcion = REPLACE(descripcion, 'en pesos', 'en quetzales') 
WHERE descripcion LIKE '%en pesos%';

-- Actualizar nombres específicos que puedan contener referencias a pesos
UPDATE estadisticas 
SET nombre = REPLACE(nombre, 'pesos', 'quetzales') 
WHERE nombre LIKE '%pesos%';
