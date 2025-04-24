"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MessageSquare } from "lucide-react"

export function SimpleChatbot() {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      {isVisible && (
        <div className="bg-white p-4 rounded-lg shadow-lg mb-2 w-[300px]">
          <div className="font-bold mb-2">Chatbot de prueba</div>
          <p>Este es un chatbot simplificado para verificar que el componente se renderiza correctamente.</p>
          <Button className="mt-2 w-full" variant="outline" onClick={() => setIsVisible(false)}>
            Cerrar
          </Button>
        </div>
      )}

      <Button
        className="rounded-full h-12 w-12 flex items-center justify-center"
        onClick={() => setIsVisible(!isVisible)}
      >
        <MessageSquare className="h-6 w-6" />
      </Button>
    </div>
  )
}
