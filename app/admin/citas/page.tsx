import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createServerSupabaseClient } from "@/lib/supabase"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export const metadata = {
  title: "Administración de Citas - Centro Médico Familiar",
  description: "Panel de administración de citas del Centro Médico Familiar",
}

export default async function AdminCitasPage() {
  const supabase = createServerSupabaseClient()

  // Obtener todas las citas con información de pacientes y doctores
  const { data: citas } = await supabase
    .from("citas")
    .select(`
      id,
      fecha,
      hora,
      motivo,
      estado,
      pacientes (
        id,
        nombre,
        telefono,
        email
      ),
      doctores (
        id,
        nombre,
        especialidad
      )
    `)
    .order("fecha", { ascending: false })
    .order("hora", { ascending: true })

  // Agrupar citas por fecha
  const citasPorFecha: Record<string, any[]> = {}

  citas?.forEach((cita) => {
    if (!citasPorFecha[cita.fecha]) {
      citasPorFecha[cita.fecha] = []
    }
    citasPorFecha[cita.fecha].push(cita)
  })

  // Ordenar fechas de más reciente a más antigua
  const fechasOrdenadas = Object.keys(citasPorFecha).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime()
  })

  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold text-sky-700 mb-6">Administración de Citas</h1>

      <div className="space-y-8">
        {fechasOrdenadas.map((fecha) => (
          <Card key={fecha}>
            <CardHeader>
              <CardTitle>{format(new Date(fecha), "PPPP", { locale: es })}</CardTitle>
              <CardDescription>{citasPorFecha[fecha].length} citas programadas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {citasPorFecha[fecha].map((cita) => (
                  <Card key={cita.id} className="overflow-hidden">
                    <div
                      className={`h-2 ${
                        cita.estado === "completada"
                          ? "bg-green-500"
                          : cita.estado === "cancelada"
                            ? "bg-red-500"
                            : "bg-yellow-500"
                      }`}
                    />
                    <CardContent className="pt-4">
                      <p className="font-medium">
                        {cita.hora} - {cita.pacientes.nombre}
                      </p>
                      <p className="text-sm text-gray-600">{cita.motivo}</p>
                      <p className="text-sm text-gray-600">Doctor: {cita.doctores.nombre}</p>
                      <p className="text-sm text-gray-600">Especialidad: {cita.doctores.especialidad}</p>
                      <div className="mt-2">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            cita.estado === "completada"
                              ? "bg-green-100 text-green-800"
                              : cita.estado === "cancelada"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {cita.estado}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
