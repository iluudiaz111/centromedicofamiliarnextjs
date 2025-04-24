"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { createClientSupabaseClient } from "@/lib/supabase"
import { toast } from "@/components/ui/use-toast"
import { DoctorChatbotWidget } from "@/components/doctor-chatbot-widget"
import { RefreshCw } from "lucide-react"

type Cita = {
  id: number
  paciente: {
    id: number
    nombre: string
    telefono: string
  }
  fecha: string
  hora: string
  motivo: string
  estado: string
}

export default function DoctorDashboardPage() {
  const router = useRouter()
  const [doctorNombre, setDoctorNombre] = useState<string>("")
  const [doctorId, setDoctorId] = useState<number | null>(null)
  const [citas, setCitas] = useState<Cita[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    // Verificar si el doctor está autenticado
    const storedDoctorId = localStorage.getItem("doctorId")
    const storedDoctorNombre = localStorage.getItem("doctorNombre")

    if (!storedDoctorId || !storedDoctorNombre) {
      router.push("/doctor/login")
      return
    }

    setDoctorId(Number.parseInt(storedDoctorId))
    setDoctorNombre(storedDoctorNombre)

    // Cargar citas del doctor
    fetchCitas(Number.parseInt(storedDoctorId))
  }, [router])

  const fetchCitas = async (doctorId: number) => {
    try {
      setIsLoading(true)

      const supabase = createClientSupabaseClient()

      const { data, error } = await supabase
        .from("citas")
        .select(`
          id,
          fecha,
          hora,
          motivo,
          estado,
          paciente_id,
          pacientes (
            id,
            nombre,
            telefono
          )
        `)
        .eq("doctor_id", doctorId)
        .order("fecha", { ascending: true })
        .order("hora", { ascending: true })

      if (error) {
        throw new Error("Error al cargar citas: " + error.message)
      }

      // Transformar datos para el formato que necesitamos
      const citasFormateadas = data.map((cita: any) => ({
        id: cita.id,
        paciente: {
          id: cita.pacientes.id,
          nombre: cita.pacientes.nombre,
          telefono: cita.pacientes.telefono,
        },
        fecha: cita.fecha,
        hora: cita.hora,
        motivo: cita.motivo,
        estado: cita.estado,
      }))

      setCitas(citasFormateadas)
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Ha ocurrido un error inesperado",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleRefresh = () => {
    if (doctorId) {
      setIsRefreshing(true)
      fetchCitas(doctorId)
    }
  }

  const handleCerrarSesion = () => {
    localStorage.removeItem("doctorId")
    localStorage.removeItem("doctorNombre")
    router.push("/doctor/login")
  }

  const handleCambiarEstado = async (citaId: number, nuevoEstado: string) => {
    try {
      const supabase = createClientSupabaseClient()

      const { error } = await supabase.from("citas").update({ estado: nuevoEstado }).eq("id", citaId)

      if (error) {
        throw new Error("Error al actualizar cita: " + error.message)
      }

      // Actualizar estado local
      setCitas(citas.map((cita) => (cita.id === citaId ? { ...cita, estado: nuevoEstado } : cita)))

      toast({
        title: "Estado actualizado",
        description: `La cita ha sido marcada como ${nuevoEstado}`,
      })
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Ha ocurrido un error inesperado",
        variant: "destructive",
      })
    }
  }

  // Filtrar citas por fecha
  const hoy = new Date().toISOString().split("T")[0]
  const citasHoy = citas.filter((cita) => cita.fecha === hoy)
  const citasFuturas = citas.filter((cita) => cita.fecha > hoy)
  const citasPasadas = citas.filter((cita) => cita.fecha < hoy)

  // Renderizar tabla de citas
  const renderTablaCitas = (citasAMostrar: Cita[]) => {
    if (citasAMostrar.length === 0) {
      return <p className="text-center py-4 text-gray-500">No hay citas para mostrar</p>
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Paciente</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Hora</TableHead>
            <TableHead>Motivo</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {citasAMostrar.map((cita) => (
            <TableRow key={cita.id}>
              <TableCell className="font-medium">{cita.paciente.nombre}</TableCell>
              <TableCell>{format(new Date(cita.fecha), "dd/MM/yyyy")}</TableCell>
              <TableCell>{cita.hora}</TableCell>
              <TableCell className="max-w-[200px] truncate">{cita.motivo}</TableCell>
              <TableCell>
                <Badge
                  className={
                    cita.estado === "completada"
                      ? "bg-green-500"
                      : cita.estado === "cancelada"
                        ? "bg-red-500"
                        : "bg-yellow-500"
                  }
                >
                  {cita.estado}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {cita.estado === "pendiente" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 border-green-600 hover:bg-green-50"
                        onClick={() => handleCambiarEstado(cita.id, "completada")}
                      >
                        Completar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                        onClick={() => handleCambiarEstado(cita.id, "cancelada")}
                      >
                        Cancelar
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  if (isLoading) {
    return (
      <div className="container py-12">
        <div className="flex justify-center">
          <p>Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-sky-700">Dashboard Médico</h1>
          <p className="text-gray-600">Bienvenido/a, {doctorNombre}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Actualizando..." : "Actualizar citas"}
          </Button>
          <Button
            variant="outline"
            className="border-sky-500 text-sky-500 hover:bg-sky-50"
            onClick={handleCerrarSesion}
          >
            Cerrar Sesión
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Citas de Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-sky-600">{citasHoy.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Citas Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-sky-600">{citas.filter((c) => c.estado === "pendiente").length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Citas Completadas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-sky-600">{citas.filter((c) => c.estado === "completada").length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gestión de Citas</CardTitle>
          <CardDescription>Administre las citas de sus pacientes</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="hoy">
            <TabsList className="mb-4">
              <TabsTrigger value="hoy">Hoy ({citasHoy.length})</TabsTrigger>
              <TabsTrigger value="futuras">Próximas ({citasFuturas.length})</TabsTrigger>
              <TabsTrigger value="pasadas">Pasadas ({citasPasadas.length})</TabsTrigger>
              <TabsTrigger value="todas">Todas ({citas.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="hoy">{renderTablaCitas(citasHoy)}</TabsContent>
            <TabsContent value="futuras">{renderTablaCitas(citasFuturas)}</TabsContent>
            <TabsContent value="pasadas">{renderTablaCitas(citasPasadas)}</TabsContent>
            <TabsContent value="todas">{renderTablaCitas(citas)}</TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <DoctorChatbotWidget />
    </div>
  )
}
