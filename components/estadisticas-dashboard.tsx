"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface Estadistica {
  id: number
  categoria: string
  nombre: string
  valor: number
  periodo: string
  descripcion: string
  fecha_registro: string
}

export default function EstadisticasDashboard() {
  const [estadisticas, setEstadisticas] = useState<Estadistica[]>([])
  const [categoriaActual, setCategoriaActual] = useState<string>("pacientes")
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const categorias = [
    { id: "pacientes", nombre: "Pacientes" },
    { id: "medicos", nombre: "Médicos" },
    { id: "citas", nombre: "Citas" },
    { id: "financiero", nombre: "Financiero" },
    { id: "servicios", nombre: "Servicios" },
    { id: "satisfaccion", nombre: "Satisfacción" },
    { id: "tendencias", nombre: "Tendencias" },
    { id: "temporada", nombre: "Temporada" },
  ]

  useEffect(() => {
    const fetchEstadisticas = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/chatbot/estadisticas?categoria=${categoriaActual}`)
        if (!response.ok) {
          throw new Error("Error al cargar estadísticas")
        }
        const result = await response.json()
        setEstadisticas(result.data || [])
        setError(null)
      } catch (err) {
        setError("Error al cargar los datos de estadísticas")
        console.error("Error fetching estadisticas:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEstadisticas()
  }, [categoriaActual])

  const formatDataForChart = (data: Estadistica[]) => {
    return data.map((item) => ({
      name: item.nombre.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()),
      valor: item.valor,
    }))
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Estadísticas del Centro Médico</CardTitle>
          <CardDescription>Visualización de datos estadísticos por categoría</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={categoriaActual} onValueChange={setCategoriaActual}>
            <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8">
              {categorias.map((cat) => (
                <TabsTrigger key={cat.id} value={cat.id}>
                  {cat.nombre}
                </TabsTrigger>
              ))}
            </TabsList>

            {categorias.map((cat) => (
              <TabsContent key={cat.id} value={cat.id}>
                {isLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <p>Cargando estadísticas...</p>
                  </div>
                ) : error ? (
                  <div className="flex justify-center items-center h-64">
                    <p className="text-red-500">{error}</p>
                  </div>
                ) : estadisticas.length === 0 ? (
                  <div className="flex justify-center items-center h-64">
                    <p>No hay datos disponibles para esta categoría</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={formatDataForChart(estadisticas)}
                          margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="valor" fill="#8884d8" name="Valor" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                      {estadisticas.map((item) => (
                        <Card key={item.id}>
                          <CardContent className="p-4">
                            <h3 className="font-medium text-lg capitalize">{item.nombre.replace(/_/g, " ")}</h3>
                            <p className="text-2xl font-bold">{item.valor}</p>
                            <p className="text-sm text-gray-500">{item.descripcion}</p>
                            <p className="text-xs text-gray-400 mt-2">Periodo: {item.periodo}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
