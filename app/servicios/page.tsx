import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"

export const metadata = {
  title: "Servicios - Centro Médico Familiar",
  description: "Servicios médicos ofrecidos por el Centro Médico Familiar",
}

const servicios = [
  {
    id: 1,
    titulo: "Medicina General",
    descripcion:
      "Atención médica integral para pacientes de todas las edades. Nuestros médicos generales están capacitados para diagnosticar y tratar una amplia variedad de condiciones médicas, así como para proporcionar orientación preventiva.",
    beneficios: [
      "Consultas médicas generales",
      "Exámenes físicos de rutina",
      "Control de enfermedades crónicas",
      "Vacunación",
      "Referencias a especialistas cuando sea necesario",
    ],
  },
  {
    id: 2,
    titulo: "Pediatría",
    descripcion:
      "Cuidado especializado para niños y adolescentes desde el nacimiento hasta los 18 años. Nuestros pediatras se enfocan en el desarrollo saludable y el bienestar de los más pequeños.",
    beneficios: [
      "Control de crecimiento y desarrollo",
      "Vacunación infantil",
      "Tratamiento de enfermedades comunes en la infancia",
      "Orientación nutricional para niños",
      "Atención de emergencias pediátricas",
    ],
  },
  {
    id: 3,
    titulo: "Ginecología",
    descripcion:
      "Atención integral para la salud de la mujer en todas las etapas de la vida. Nuestros ginecólogos ofrecen servicios preventivos, diagnósticos y terapéuticos para condiciones que afectan el sistema reproductivo femenino.",
    beneficios: [
      "Exámenes ginecológicos de rutina",
      "Planificación familiar",
      "Control prenatal",
      "Detección temprana de cáncer",
      "Tratamiento de infecciones y trastornos hormonales",
    ],
  },
  {
    id: 4,
    titulo: "Laboratorio Clínico",
    descripcion:
      "Análisis clínicos con resultados precisos y en tiempo oportuno. Nuestro laboratorio está equipado con tecnología moderna para realizar una amplia gama de pruebas diagnósticas.",
    beneficios: [
      "Análisis de sangre completos",
      "Pruebas de química sanguínea",
      "Análisis de orina",
      "Pruebas de embarazo",
      "Perfiles hormonales y metabólicos",
    ],
  },
  {
    id: 5,
    titulo: "Cardiología",
    descripcion:
      "Diagnóstico y tratamiento de enfermedades cardiovasculares. Nuestros cardiólogos utilizan métodos avanzados para evaluar la salud del corazón y los vasos sanguíneos.",
    beneficios: [
      "Electrocardiogramas",
      "Ecocardiogramas",
      "Pruebas de esfuerzo",
      "Control de hipertensión",
      "Prevención de enfermedades cardíacas",
    ],
  },
  {
    id: 6,
    titulo: "Nutrición",
    descripcion:
      "Asesoría nutricional personalizada para mejorar su salud y bienestar. Nuestros nutricionistas desarrollan planes alimenticios adaptados a las necesidades específicas de cada paciente.",
    beneficios: [
      "Evaluación del estado nutricional",
      "Planes de alimentación personalizados",
      "Control de peso",
      "Manejo nutricional de enfermedades crónicas",
      "Educación sobre hábitos alimenticios saludables",
    ],
  },
  {
    id: 7,
    titulo: "Dermatología",
    descripcion:
      "Diagnóstico y tratamiento de condiciones que afectan la piel, el cabello y las uñas. Nuestros dermatólogos atienden desde problemas comunes hasta condiciones más complejas.",
    beneficios: [
      "Tratamiento de acné y rosácea",
      "Detección de cáncer de piel",
      "Tratamiento de alergias cutáneas",
      "Procedimientos dermatológicos menores",
      "Cuidado de la piel para todas las edades",
    ],
  },
  {
    id: 8,
    titulo: "Psicología",
    descripcion:
      "Apoyo profesional para la salud mental y emocional. Nuestros psicólogos ofrecen un espacio seguro para abordar diversos problemas psicológicos y emocionales.",
    beneficios: [
      "Terapia individual y familiar",
      "Manejo del estrés y ansiedad",
      "Tratamiento de depresión",
      "Orientación para problemas de conducta",
      "Apoyo en situaciones de crisis",
    ],
  },
]

export default function ServiciosPage() {
  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold text-sky-700 mb-2">Nuestros Servicios</h1>
      <p className="text-gray-600 mb-8 max-w-3xl">
        En Centro Médico Familiar ofrecemos una amplia gama de servicios médicos para el cuidado integral de su salud y
        la de su familia. Contamos con profesionales altamente calificados y tecnología moderna para brindarle la mejor
        atención.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {servicios.map((servicio) => (
          <Card key={servicio.id} className="overflow-hidden">
            <CardHeader className="bg-sky-50">
              <CardTitle className="text-sky-700">{servicio.titulo}</CardTitle>
              <CardDescription>{servicio.descripcion}</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <h3 className="font-medium mb-3">Servicios incluidos:</h3>
              <ul className="space-y-2">
                {servicio.beneficios.map((beneficio, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-sky-500 mt-0.5 flex-shrink-0" />
                    <span>{beneficio}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 bg-sky-50 p-6 rounded-lg">
        <h2 className="text-2xl font-bold text-sky-700 mb-4">¿Necesita agendar una cita?</h2>
        <p className="mb-4">
          Puede agendar una cita con cualquiera de nuestros especialistas llamando al 4644-9158 o utilizando nuestro
          formulario en línea.
        </p>
        <div className="flex items-center gap-4">
          <a href="/agendar-cita" className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-md">
            Agendar Cita
          </a>
          <a href="/contacto" className="text-sky-500 hover:text-sky-600">
            Más información
          </a>
        </div>
      </div>
    </div>
  )
}
