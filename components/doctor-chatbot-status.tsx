"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RefreshCw } from "lucide-react"

export function DoctorChatbotStatus() {
  const [status, setStatus] = useState<{
    groqDoctorAvailable: boolean
    apiKey: string
    fallbackApiKey: string
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const checkStatus = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/chatbot/doctor-status")

      if (!response.ok) {
        throw new Error(`Error al verificar el estado: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Error desconocido")
      }

      setStatus({
        groqDoctorAvailable: data.groqDoctorAvailable,
        apiKey: data.apiKey,
        fallbackApiKey: data.fallbackApiKey,
      })
    } catch (error) {
      console.error("Error al verificar el estado:", error)
      setError(error instanceof Error ? error.message : "Error desconocido")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkStatus()
  }, [])

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg">Estado del Asistente Médico</CardTitle>
            <CardDescription>Verificación de la conexión con la IA</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={checkStatus} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Verificar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-red-500 text-sm">{error}</div>
        ) : status ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Estado de la conexión:</span>
              <Badge className={status.groqDoctorAvailable ? "bg-green-500" : "bg-red-500"}>
                {status.groqDoctorAvailable ? "Conectado" : "Desconectado"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">API Key para doctores:</span>
              <Badge variant="outline">{status.apiKey}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">API Key de respaldo:</span>
              <Badge variant="outline">{status.fallbackApiKey}</Badge>
            </div>
            {!status.groqDoctorAvailable && (
              <div className="text-amber-500 text-xs mt-2">
                El asistente está funcionando en modo limitado. Algunas funciones avanzadas podrían no estar
                disponibles.
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-2">
            <span className="text-gray-500">Verificando estado...</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
