"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Users, Calendar, DollarSign } from "lucide-react"

interface Estadistica {
  id: number
  categoria: string
  nombre: string
  valor: number
  periodo: string
  descripcion: string
}

export default function EstadisticasDestacadas() {
  const [estadisticas, setEstadisticas] = useState<{
    pacientes?: Estadistica
    citas?: Estadistica
    medicos?: Estadistica
    financiero?: Estadistica
  }>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEstadisticas = async () => {
      try {
        const [pacientesRes, citasRes, medicosRes, financieroRes] = await Promise.all([
          fetch("/api/chatbot/estadisticas?nombre=promedio_diario&categoria=pacientes"),
          fetch("/api/chatbot/estadisticas?nombre=promedio_diario&categoria=citas"),
          fetch("/api/chatbot/estadisticas?nombre=total_especialistas&categoria=medicos"),
          fetch("/api/chatbot/estadisticas?nombre=costo_consulta_general&categoria=financiero"),
        ])

        // Verificar si alguna respuesta no fue exitosa
        if (!pacientesRes.ok || !citasRes.ok || !medicosRes.ok || !financieroRes.ok) {
          throw new Error("Error al obtener estadísticas del servidor")
        }

        const [pacientesData, citasData, medicosData, financieroData] = await Promise.all([
          pacientesRes.json(),
          citasRes.json(),
          medicosRes.json(),
          financieroRes.json(),
        ])

        setEstadisticas({
          pacientes: pacientesData.data?.[0],
          citas: citasData.data?.[0],
          medicos: medicosData.data?.[0],
          financiero: financieroData.data?.[0],
        })
      } catch (err) {
        console.error("Error fetching estadisticas:", err)
        setError("No se pudieron cargar las estadísticas. Por favor, intente más tarde.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchEstadisticas()
  }, [])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 mb-4">
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pacientes Diarios</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{estadisticas.pacientes?.valor || "N/A"}</div>
          <p className="text-xs text-muted-foreground">
            {estadisticas.pacientes?.descripcion || "Promedio de pacientes atendidos por día"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Citas Diarias</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{estadisticas.citas?.valor || "N/A"}</div>
          <p className="text-xs text-muted-foreground">
            {estadisticas.citas?.descripcion || "Promedio de citas diarias"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Especialistas</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{estadisticas.medicos?.valor || "N/A"}</div>
          <p className="text-xs text-muted-foreground">
            {estadisticas.medicos?.descripcion || "Total de médicos especialistas"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Consulta General</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Q{estadisticas.financiero?.valor || "N/A"}</div>
          <p className="text-xs text-muted-foreground">
            {estadisticas.financiero?.descripcion || "Costo de consulta general en quetzales"}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
