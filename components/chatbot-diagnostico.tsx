"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function ChatbotDiagnostico() {
  const [status, setStatus] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkStatus = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/chatbot/health")

      if (!response.ok) {
        throw new Error(`Error al verificar el estado: ${response.status}`)
      }

      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error("Error al verificar el estado:", error)
      setError(error instanceof Error ? error.message : "Error desconocido")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="max-w-md mx-auto my-8">
      <CardHeader>
        <CardTitle>Diagnóstico del Chatbot</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={checkStatus} disabled={isLoading}>
          {isLoading ? "Verificando..." : "Verificar estado del chatbot"}
        </Button>

        {error && <div className="mt-4 p-2 bg-red-50 text-red-700 rounded-md">Error: {error}</div>}

        {status && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between">
              <span>Estado de Groq:</span>
              <Badge className={status.services?.groq?.available ? "bg-green-500" : "bg-red-500"}>
                {status.services?.groq?.available ? "Disponible" : "No disponible"}
              </Badge>
            </div>
            <div className="text-xs text-gray-500">Timestamp: {status.timestamp}</div>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto mt-2">{JSON.stringify(status, null, 2)}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
