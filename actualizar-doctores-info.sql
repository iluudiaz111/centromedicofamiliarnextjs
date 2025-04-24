-- Actualizar información de los doctores para añadir descripciones y credenciales
UPDATE doctores
SET descripcion = 'Especialista en medicina general con más de 10 años de experiencia. Enfocado en la atención primaria y preventiva para pacientes de todas las edades.',
    credenciales = 'Médico y Cirujano, Universidad de San Carlos'
WHERE id = 1;

UPDATE doctores
SET descripcion = 'Pediatra con especialidad en desarrollo infantil y adolescente. Dedicada al cuidado integral de niños desde recién nacidos hasta los 18 años.',
    credenciales = 'Especialista en Pediatría, Universidad Francisco Marroquín'
WHERE id = 2;

UPDATE doctores
SET descripcion = 'Cardiólogo con amplia experiencia en diagnóstico y tratamiento de enfermedades cardiovasculares. Especializado en hipertensión y prevención cardíaca.',
    credenciales = 'Especialista en Cardiología, Universidad de San Carlos'
WHERE id = 3;

UPDATE doctores
SET descripcion = 'Ginecóloga especializada en salud reproductiva y atención prenatal. Ofrece servicios de control ginecológico, planificación familiar y atención durante el embarazo.',
    credenciales = 'Especialista en Ginecología y Obstetricia, Universidad Rafael Landívar'
WHERE id = 4;

UPDATE doctores
SET descripcion = 'Neurólogo con experiencia en diagnóstico y tratamiento de trastornos del sistema nervioso. Especializado en cefaleas, epilepsia y trastornos del sueño.',
    credenciales = 'Especialista en Neurología, Universidad de San Carlos'
WHERE id = 5;

UPDATE doctores
SET descripcion = 'Dermatóloga especializada en el diagnóstico y tratamiento de enfermedades de la piel. Experiencia en tratamientos para acné, psoriasis y detección temprana de cáncer de piel.',
    credenciales = 'Especialista en Dermatología, Universidad Francisco Marroquín'
WHERE id = 6;

UPDATE doctores
SET descripcion = 'Oftalmólogo con amplia experiencia en salud visual y tratamiento de enfermedades oculares. Especializado en cirugía refractiva y cataratas.',
    credenciales = 'Especialista en Oftalmología, Universidad de San Carlos'
WHERE id = 7;

UPDATE doctores
SET descripcion = 'Nutricionista especializada en planes alimenticios personalizados. Experiencia en manejo nutricional de enfermedades crónicas y trastornos alimenticios.',
    credenciales = 'Licenciada en Nutrición, Universidad Rafael Landívar'
WHERE id = 8;

UPDATE doctores
SET descripcion = 'Psicóloga clínica con enfoque en terapia cognitivo-conductual. Especializada en manejo de ansiedad, depresión y trastornos del estado de ánimo.',
    credenciales = 'Licenciada en Psicología Clínica, Universidad del Valle'
WHERE id = 9;

-- Verificar la actualización
SELECT id, nombre, especialidad, descripcion, credenciales FROM doctores;
