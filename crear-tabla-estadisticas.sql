-- Crear tabla para estadísticas
CREATE TABLE IF NOT EXISTS estadisticas (
  id SERIAL PRIMARY KEY,
  categoria VARCHAR(100) NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  valor NUMERIC NOT NULL,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  periodo VARCHAR(50) NOT NULL -- diario, semanal, mensual, anual
);

-- Insertar algunos datos de ejemplo
INSERT INTO estadisticas (categoria, nombre, valor, periodo) VALUES
('pacientes', 'promedio_diario', 45, 'diario'),
('pacientes', 'total_registrados', 5280, 'total'),
('citas', 'cancelaciones_ultimo_mes', 87, 'mensual'),
('citas', 'tiempo_espera_promedio', 15, 'diario'), -- en minutos
('medicos', 'total_especialistas', 28, 'total'),
('medicos', 'pediatras', 5, 'total'),
('financiero', 'costo_consulta_general', 500, 'actual'), -- en pesos
('operativo', 'horario_apertura', 8, 'actual'), -- hora de apertura
('operativo', 'horario_cierre', 20, 'actual'); -- hora de cierre
