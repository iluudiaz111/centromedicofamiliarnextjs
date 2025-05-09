import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createServerSupabaseClient } from "@/lib/supabase"
import { Mail, Phone, Award } from "lucide-react"

export const metadata = {
  title: "Especialistas - Centro Médico Familiar",
  description: "Conoce a nuestros especialistas médicos del Centro Médico Familiar",
}

// Imágenes de doctores destacados para la sección superior
const doctoresDestacados = [
  {
    id: 1,
    nombre: "Dra. María Rodríguez",
    especialidad: "Medicina General",
    imagen: "/images/doctores/doctora-clipboard.jpeg",
  },
  {
    id: 2,
    nombre: "Dr. Carlos Mendoza",
    especialidad: "Cardiología",
    imagen: "/images/doctores/doctor-sonriente.jpeg",
  },
  {
    id: 3,
    nombre: "Dra. Laura Sánchez",
    especialidad: "Pediatría",
    imagen: "/images/doctores/doctora-estetoscopio.jpeg",
  },
  {
    id: 4,
    nombre: "Dr. Roberto Jiménez",
    especialidad: "Medicina Interna",
    imagen: "/images/doctores/doctor-gafas.png",
  },
  {
    id: 5,
    nombre: "Dr. Miguel Hernández",
    especialidad: "Neurología",
    imagen: "/images/doctores/doctor-corbata-azul.png",
  },
  {
    id: 6,
    nombre: "Dr. Antonio Pérez",
    especialidad: "Traumatología",
    imagen: "/images/doctores/doctor-senalando.png",
  },
]

export default async function EspecialistasPage() {
  const supabase = createServerSupabaseClient()
  const { data: doctores } = await supabase.from("doctores").select("*").order("especialidad", { ascending: true })

  // Agrupar doctores por especialidad
  const doctoresPorEspecialidad: Record<string, any[]> = {}

  doctores?.forEach((doctor) => {
    if (!doctoresPorEspecialidad[doctor.especialidad]) {
      doctoresPorEspecialidad[doctor.especialidad] = []
    }
    doctoresPorEspecialidad[doctor.especialidad].push(doctor)
  })

  // Obtener especialidades ordenadas
  const especialidades = Object.keys(doctoresPorEspecialidad).sort()

  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold text-sky-700 mb-2">Nuestros Especialistas</h1>
      <p className="text-gray-600 mb-8 max-w-3xl">
        En Centro Médico Familiar contamos con un equipo de profesionales altamente calificados, comprometidos con
        brindarle la mejor atención médica. Conozca a nuestros especialistas.
      </p>

      {/* Nueva sección de doctores destacados con imágenes */}
      <div className="bg-sky-500 text-white p-8 rounded-lg mb-12">
        <h2 className="text-2xl font-bold mb-6 text-center">Especialistas Destacados</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctoresDestacados.map((doctor) => (
            <div
              key={doctor.id}
              className="bg-white rounded-lg overflow-hidden shadow-lg transform transition-transform hover:scale-105"
            >
              <div className="aspect-[3/4] relative">
                <Image
                  src={doctor.imagen || "/placeholder.svg"}
                  alt={doctor.nombre}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
              <div className="p-4 bg-white text-sky-800">
                <h3 className="font-bold text-lg">{doctor.nombre}</h3>
                <p className="text-sky-600">{doctor.especialidad}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-12">
        {especialidades.map((especialidad) => (
          <section key={especialidad}>
            <h2 className="text-2xl font-semibold text-sky-600 mb-6">{especialidad}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {doctoresPorEspecialidad[especialidad].map((doctor) => (
                <Card key={doctor.id} className="overflow-hidden">
                  <div className="aspect-[3/2] relative bg-sky-50">
                    {doctor.imagen_url ? (
                      <Image
                        src={doctor.imagen_url || "/placeholder.svg"}
                        alt={`Dr. ${doctor.nombre}`}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="h-24 w-24 rounded-full bg-sky-200 flex items-center justify-center">
                          <span className="text-3xl font-bold text-sky-700">
                            {doctor.nombre
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .substring(0, 2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle className="text-sky-700">{doctor.nombre}</CardTitle>
                    <CardDescription>{doctor.especialidad}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {doctor.descripcion && <p className="text-gray-600 text-sm">{doctor.descripcion}</p>}
                    <div className="pt-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Award className="h-4 w-4 text-sky-500" />
                        <span>{doctor.credenciales || "Médico Colegiado"}</span>
                      </div>
                      {doctor.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <Mail className="h-4 w-4 text-sky-500" />
                          <span>{doctor.email}</span>
                        </div>
                      )}
                      {doctor.telefono && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <Phone className="h-4 w-4 text-sky-500" />
                          <span>{doctor.telefono}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-12 bg-sky-50 p-6 rounded-lg">
        <h2 className="text-xl font-bold text-sky-700 mb-4">
          ¿Necesita una consulta con alguno de nuestros especialistas?
        </h2>
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
