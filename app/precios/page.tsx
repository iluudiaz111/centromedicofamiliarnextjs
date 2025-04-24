import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createServerSupabaseClient } from "@/lib/supabase"

export const metadata = {
  title: "Precios - Centro Médico Familiar",
  description: "Lista de precios de servicios médicos del Centro Médico Familiar",
}

// Función para formatear precio en quetzales
const formatPrecio = (precio: number) => {
  return `Q${precio.toFixed(2)}`
}

export default async function PreciosPage() {
  const supabase = createServerSupabaseClient()
  const { data: precios } = await supabase.from("precios").select("*").order("precio", { ascending: true })

  // Agrupar precios por categoría
  const categorias = {
    consultas: precios?.filter((p) => p.servicio.toLowerCase().includes("consulta")) || [],
    estudios:
      precios?.filter(
        (p) => !p.servicio.toLowerCase().includes("consulta") && !p.servicio.toLowerCase().includes("análisis"),
      ) || [],
    laboratorio: precios?.filter((p) => p.servicio.toLowerCase().includes("análisis")) || [],
  }

  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold text-sky-700 mb-2">Lista de Precios</h1>
      <p className="text-gray-600 mb-8 max-w-3xl">
        A continuación encontrará los precios de nuestros servicios médicos. Todos los precios están expresados en
        quetzales (Q). Para más información, no dude en contactarnos.
      </p>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold text-sky-600 mb-4">Consultas Médicas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categorias.consultas.map((precio) => (
              <Card key={precio.id} className="overflow-hidden">
                <CardHeader className="bg-sky-50 pb-3">
                  <CardTitle className="text-lg text-sky-700">{precio.servicio}</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-gray-600 text-sm">{precio.descripcion}</p>
                      {precio.duracion_minutos && (
                        <p className="text-gray-500 text-xs mt-1">Duración: {precio.duracion_minutos} minutos</p>
                      )}
                    </div>
                    <div className="text-xl font-bold text-sky-700">{formatPrecio(precio.precio)}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-sky-600 mb-4">Estudios y Procedimientos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categorias.estudios.map((precio) => (
              <Card key={precio.id} className="overflow-hidden">
                <CardHeader className="bg-sky-50 pb-3">
                  <CardTitle className="text-lg text-sky-700">{precio.servicio}</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-gray-600 text-sm">{precio.descripcion}</p>
                      {precio.duracion_minutos && (
                        <p className="text-gray-500 text-xs mt-1">Duración: {precio.duracion_minutos} minutos</p>
                      )}
                    </div>
                    <div className="text-xl font-bold text-sky-700">{formatPrecio(precio.precio)}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-sky-600 mb-4">Laboratorio Clínico</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categorias.laboratorio.map((precio) => (
              <Card key={precio.id} className="overflow-hidden">
                <CardHeader className="bg-sky-50 pb-3">
                  <CardTitle className="text-lg text-sky-700">{precio.servicio}</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-gray-600 text-sm">{precio.descripcion}</p>
                      {precio.duracion_minutos && (
                        <p className="text-gray-500 text-xs mt-1">Duración: {precio.duracion_minutos} minutos</p>
                      )}
                    </div>
                    <div className="text-xl font-bold text-sky-700">{formatPrecio(precio.precio)}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-12 bg-sky-50 p-6 rounded-lg">
        <h2 className="text-xl font-bold text-sky-700 mb-2">Información Importante</h2>
        <ul className="list-disc pl-5 space-y-2 text-gray-600">
          <li>Los precios pueden estar sujetos a cambios sin previo aviso.</li>
          <li>Algunos procedimientos pueden requerir estudios adicionales con costo extra.</li>
          <li>Aceptamos efectivo y tarjetas de crédito/débito.</li>
          <li>Para más información sobre precios específicos, por favor contáctenos al 4644-9158.</li>
        </ul>
      </div>
    </div>
  )
}
