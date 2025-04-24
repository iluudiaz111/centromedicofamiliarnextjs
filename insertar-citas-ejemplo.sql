-- Insertar algunas citas de ejemplo para pruebas del chatbot
INSERT INTO citas (paciente_id, doctor_id, fecha, hora, motivo, estado) VALUES
(1, 1, '2023-03-31', '10:45', 'Control de glucemia', 'completada'),
(2, 3, '2023-03-31', '11:30', 'Revisión cardiológica', 'completada'),
(3, 2, '2023-03-31', '09:00', 'Control pediátrico', 'completada'),
(4, 4, '2023-03-31', '14:15', 'Control prenatal', 'completada'),
(5, 1, '2023-04-15', '10:00', 'Control de presión arterial', 'completada'),
(1, 3, '2023-05-20', '11:00', 'Electrocardiograma', 'completada'),
(2, 2, '2023-06-10', '15:30', 'Consulta por fiebre', 'completada'),
(3, 4, '2023-07-05', '09:45', 'Control ginecológico', 'completada'),
(4, 1, '2023-08-12', '16:00', 'Análisis de sangre', 'completada'),
(5, 3, '2023-09-18', '10:30', 'Revisión cardiológica', 'completada'),
(1, 2, '2023-10-25', '14:00', 'Consulta pediátrica', 'completada'),
(2, 4, '2023-11-30', '11:15', 'Control prenatal', 'completada'),
(3, 1, '2023-12-05', '09:30', 'Control de diabetes', 'completada'),
(4, 3, '2024-01-15', '15:45', 'Ecocardiograma', 'completada'),
(5, 2, '2024-02-20', '10:15', 'Vacunación', 'completada'),
(1, 4, '2024-03-10', '11:45', 'Papanicolaou', 'completada'),
(2, 1, '2024-04-05', '16:30', 'Control de glucemia', 'pendiente'),
(3, 3, '2024-04-12', '09:15', 'Holter cardíaco', 'pendiente'),
(4, 2, '2024-04-18', '14:30', 'Control de crecimiento', 'pendiente'),
(5, 4, '2024-04-25', '10:45', 'Ultrasonido obstétrico', 'pendiente'),
(1, 1, '2024-05-02', '15:00', 'Control de hipertensión', 'pendiente'),
(2, 3, '2024-05-10', '11:30', 'Prueba de esfuerzo', 'pendiente'),
(3, 2, '2024-05-15', '09:45', 'Consulta por alergia', 'pendiente'),
(4, 4, '2024-05-22', '16:15', 'Control ginecológico', 'pendiente'),
(5, 1, '2024-05-30', '10:00', 'Análisis de colesterol', 'pendiente');

-- Insertar citas específicas para pruebas de consulta
INSERT INTO citas (paciente_id, doctor_id, fecha, hora, motivo, estado) VALUES
(1, 1, '2023-03-31', '10:45', 'Control de glucemia', 'completada'),
(3, 1, '2023-03-31', '10:45', 'Prueba de glucemia', 'completada'),
(2, 2, '2023-03-31', '10:45', 'Revisión de glucemia', 'completada');
