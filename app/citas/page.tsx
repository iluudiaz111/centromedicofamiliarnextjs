import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AgendarCitaForm } from "@/components/agendar-cita-form"
import { ConsultarCitaForm } from "@/components/consultar-cita-form"
import { Suspense } from "react"

export default function CitasPage({ searchParams }: { searchParams: { tab?: string } }) {
  // Determinar la pestaña activa basada en los parámetros de búsqueda
  const activeTab = searchParams.tab === "consultar" ? "consultar" : "agendar"

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">Gestión de Citas</h1>

      <div className="max-w-3xl mx-auto">
        <Tabs defaultValue={activeTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="agendar">Agendar Cita</TabsTrigger>
            <TabsTrigger value="consultar">Consultar Cita</TabsTrigger>
          </TabsList>

          <TabsContent value="agendar">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-6">Agendar Nueva Cita</h2>
              <Suspense fallback={<div>Cargando formulario...</div>}>
                <AgendarCitaForm />
              </Suspense>
            </div>
          </TabsContent>

          <TabsContent value="consultar">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-6">Consultar Estado de Cita</h2>
              <Suspense fallback={<div>Cargando formulario...</div>}>
                <ConsultarCitaForm />
              </Suspense>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
