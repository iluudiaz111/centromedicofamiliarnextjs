"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AgendarCitaForm } from "@/components/agendar-cita-form"
import { ConsultarCitaForm } from "@/components/consultar-cita-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function CitasPage() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const [activeTab, setActiveTab] = useState(tabParam === "consultar" ? "consultar" : "agendar")

  // Actualizar la URL cuando cambie la pestaña
  useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.set("tab", activeTab)
    window.history.replaceState({}, "", url.toString())
  }, [activeTab])

  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold text-sky-700 mb-6">Gestión de Citas</h1>

      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto mb-8">
          <TabsTrigger value="agendar">Agendar Cita</TabsTrigger>
          <TabsTrigger value="consultar">Consultar Cita</TabsTrigger>
        </TabsList>

        <TabsContent value="agendar" className="mt-0">
          <div className="max-w-3xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Formulario de Cita</CardTitle>
                <CardDescription>Complete el formulario para agendar su cita en Centro Médico Familiar</CardDescription>
              </CardHeader>
              <CardContent>
                <AgendarCitaForm onSuccess={() => setActiveTab("consultar")} />
              </CardContent>
            </Card>

            <div className="mt-8">
              <h2 className="text-xl font-semibold text-sky-700 mb-4">Información Importante</h2>
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                <li>Llegue 15 minutos antes de su cita programada.</li>
                <li>Traiga su documento de identificación y tarjeta de seguro (si aplica).</li>
                <li>Si necesita cancelar o reprogramar, hágalo con al menos 24 horas de anticipación.</li>
                <li>Para consultas médicas, traiga un listado de sus medicamentos actuales.</li>
              </ul>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="consultar" className="mt-0">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Verificar estado de cita</CardTitle>
                <CardDescription>
                  Ingrese el número de cita de 4 dígitos que recibió al agendar su cita para consultar su estado y
                  detalles.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ConsultarCitaForm />
              </CardContent>
            </Card>

            <div className="mt-8 bg-sky-50 p-6 rounded-lg">
              <h2 className="text-xl font-bold text-sky-700 mb-4">Información Importante</h2>
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                <li>Llegue 15 minutos antes de su cita programada.</li>
                <li>Traiga su documento de identificación y tarjeta de seguro (si aplica).</li>
                <li>Si necesita cancelar o reprogramar, hágalo con al menos 24 horas de anticipación.</li>
                <li>Para consultas médicas, traiga un listado de sus medicamentos actuales.</li>
              </ul>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
