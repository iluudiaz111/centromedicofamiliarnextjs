-- Actualizar o agregar información sobre precios
INSERT INTO info_medica (titulo, contenido)
VALUES ('Precios', 'Todos nuestros precios están expresados en quetzales (Q). La consulta de medicina general tiene un costo de Q150.00, pediatría Q200.00, ginecología Q250.00, cardiología Q300.00. Para ver la lista completa de precios, visite la sección de Precios en nuestra página web o consulte con nuestro personal.')
ON CONFLICT (titulo) WHERE titulo = 'Precios'
DO UPDATE SET contenido = EXCLUDED.contenido;
