"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { createClientSupabaseClient } from "@/lib/supabase"

export function DoctorLoginDebug() {
  const [debugInfo, setDebugInfo] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  const checkDoctores = async () => {
    setIsLoading(true)
    try {
      const supabase = createClientSupabaseClient()
      const { data, error } = await supabase.from("doctores").select("*")

      if (error) {
        setDebugInfo(`Error al consultar doctores: ${error.message}`)
      } else {
        setDebugInfo(`Doctores encontrados: ${JSON.stringify(data, null, 2)}`)
      }
    } catch (error) {
      setDebugInfo(`Error: ${error instanceof Error ? error.message : "Error desconocido"}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mt-8 p-4 border rounded-md">
      <h3 className="text-sm font-medium mb-2">Herramienta de depuración</h3>
      <Button variant="outline" size="sm" onClick={checkDoctores} disabled={isLoading}>
        Verificar doctores en la base de datos
      </Button>

      {debugInfo && <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">{debugInfo}</pre>}
    </div>
  )
}
