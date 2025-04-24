"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { MessageSquare, Send, X, RefreshCw } from "lucide-react"

interface Message {
  role: "user" | "assistant"
  content: string
}

// Tipo para almacenar información de precios mencionados
interface PrecioItem {
  servicio: string
  precio: number
  conIVA: boolean
}

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Estado para almacenar los precios mencionados en la conversación
  const [preciosMencionados, setPreciosMencionados] = useState<PrecioItem[]>([])

  useEffect(() => {
    // Mensaje de bienvenida inicial
    if (messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: "¡Hola! Soy el asistente virtual del Centro Médico Familiar. ¿En qué puedo ayudarte hoy?",
        },
      ])
    }
  }, [messages.length])

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
      inputRef.current?.focus()
    }
  }, [isOpen, messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const toggleChat = () => {
    setIsOpen((prev) => !prev)
  }

  // Función para extraer precios de un texto
  const extractPrices = (text: string): PrecioItem[] => {
    const extractedPrices: PrecioItem[] = []

    // Patrón para detectar precios en formato "Servicio: Q X" o "Servicio cuesta Q X"
    const priceRegex1 = /([\w\s]+?)(?::\s*|cuesta\s*)Q\s*(\d+(?:[,.]\d+)?)/gi
    let match1

    while ((match1 = priceRegex1.exec(text)) !== null) {
      const servicio = match1[1].trim()
      // Normalizar el formato del precio (reemplazar comas por puntos)
      const precioStr = match1[2].replace(",", ".")
      const precio = Number.parseFloat(precioStr)

      if (!isNaN(precio) && servicio) {
        // Determinar si el precio incluye IVA
        const conIVA =
          text.toLowerCase().includes("incluye iva") ||
          text.toLowerCase().includes("incluyendo iva") ||
          text.toLowerCase().includes("incluido iva")

        extractedPrices.push({ servicio, precio, conIVA })
      }
    }

    // Patrón para detectar precios en listas con guiones "- Servicio: Q X"
    const priceRegex2 = /-\s*([\w\s]+?)(?::\s*|cuesta\s*)Q\s*(\d+(?:[,.]\d+)?)/gi
    let match2

    while ((match2 = priceRegex2.exec(text)) !== null) {
      const servicio = match2[1].trim()
      const precioStr = match2[2].replace(",", ".")
      const precio = Number.parseFloat(precioStr)

      if (!isNaN(precio) && servicio) {
        const conIVA =
          text.toLowerCase().includes("incluye iva") ||
          text.toLowerCase().includes("incluyendo iva") ||
          text.toLowerCase().includes("incluido iva")

        extractedPrices.push({ servicio, precio, conIVA })
      }
    }

    return extractedPrices
  }

  // Función para detectar si se está preguntando por un total o suma
  const isAskingForTotal = (message: string): boolean => {
    const totalKeywords = [
      "total",
      "suma",
      "cuanto es",
      "cuánto es",
      "cuanto cuesta",
      "cuánto cuesta",
      "precio total",
      "costo total",
      "sumar",
      "sumatoria",
      "todo junto",
    ]

    const lowerMessage = message.toLowerCase()
    return totalKeywords.some((keyword) => lowerMessage.includes(keyword))
  }

  // Función para detectar si se está preguntando por un cálculo de impuestos
  const isAskingForTaxCalculation = (message: string): { isTaxQuestion: boolean; taxType?: string; rate?: number } => {
    const lowerMessage = message.toLowerCase()

    // Patrones para detectar preguntas sobre impuestos
    const ivaPattern = /iva|impuesto al valor agregado|12%|12 %|doce por ciento/i
    const isrPattern = /isr|impuesto sobre la renta|5%|5 %|cinco por ciento/i
    const genericTaxPattern = /impuesto|calcula impuesto|con impuesto|más impuesto|impuestos/i

    if (ivaPattern.test(lowerMessage)) {
      return { isTaxQuestion: true, taxType: "IVA", rate: 12 }
    } else if (isrPattern.test(lowerMessage)) {
      return { isTaxQuestion: true, taxType: "ISR", rate: 5 }
    } else if (genericTaxPattern.test(lowerMessage)) {
      return { isTaxQuestion: true, taxType: "IVA", rate: 12 } // Por defecto usamos IVA
    }

    return { isTaxQuestion: false }
  }

  // Función para calcular el total de los precios mencionados
  const calculateTotal = (withTax = false): string => {
    if (preciosMencionados.length === 0) {
      return "No he mencionado precios anteriormente para poder calcular un total."
    }

    // Calcular subtotal (sin IVA)
    let subtotal = 0
    preciosMencionados.forEach((item) => {
      // Si el precio ya incluye IVA, lo dividimos entre 1.12 para obtener el precio sin IVA
      const precioSinIVA = item.conIVA ? item.precio / 1.12 : item.precio
      subtotal += precioSinIVA
    })

    // Calcular IVA
    const iva = subtotal * 0.12

    // Calcular total con IVA
    const total = subtotal + iva

    // Formatear respuesta
    let response = ""

    if (withTax) {
      response = `**Cotización con desglose de IVA:**\n\n`
    } else {
      response = `**Cotización:**\n\n`
    }

    // Desglose de servicios
    response += "**Desglose de servicios:**\n"
    preciosMencionados.forEach((item) => {
      const precioSinIVA = item.conIVA ? (item.precio / 1.12).toFixed(2) : item.precio.toFixed(2)

      if (withTax) {
        const ivaItem = (Number.parseFloat(precioSinIVA) * 0.12).toFixed(2)
        const totalItem = (Number.parseFloat(precioSinIVA) + Number.parseFloat(ivaItem)).toFixed(2)
        response += `- ${item.servicio}: Q${precioSinIVA} + IVA (Q${ivaItem}) = Q${totalItem}\n`
      } else {
        response += `- ${item.servicio}: Q${precioSinIVA}\n`
      }
    })

    // Totales
    response += `\n**Subtotal (sin IVA):** Q${subtotal.toFixed(2)}\n`

    if (withTax) {
      response += `**IVA (12%):** Q${iva.toFixed(2)}\n`
      response += `**Total (con IVA):** Q${total.toFixed(2)}`
    }

    return response
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput("")
    setIsLoading(true)
    setIsError(false)

    // Agregar mensaje del usuario
    setMessages((prev) => [...prev, { role: "user", content: userMessage }])

    // Verificar si está preguntando por un total o impuestos
    const askingForTotal = isAskingForTotal(userMessage)
    const taxInfo = isAskingForTaxCalculation(userMessage)

    // Si está preguntando por un total con IVA, responder directamente
    if (askingForTotal && taxInfo.isTaxQuestion) {
      const totalResponse = calculateTotal(true)
      setMessages((prev) => [...prev, { role: "assistant", content: totalResponse }])
      setIsLoading(false)
      return
    }

    // Si solo está preguntando por un total sin mencionar impuestos, responder directamente
    if (askingForTotal && !taxInfo.isTaxQuestion) {
      const totalResponse = calculateTotal(false)
      setMessages((prev) => [...prev, { role: "assistant", content: totalResponse }])
      setIsLoading(false)
      return
    }

    try {
      // Intentar primero con el endpoint principal
      const response = await fetch("/api/chatbot/groq", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mensaje: userMessage,
          conversationHistory: messages.slice(-5), // Enviar las últimas 5 mensajes para contexto
        }),
        // Agregar un timeout para evitar esperas largas
        signal: AbortSignal.timeout(8000),
      })

      if (!response.ok) {
        throw new Error(`Error en la respuesta: ${response.status}`)
      }

      const data = await response.json()

      if (data && data.text) {
        // Agregar la respuesta del asistente al estado
        setMessages((prev) => [...prev, { role: "assistant", content: data.text }])

        // Extraer precios de la respuesta del asistente
        const extractedPrices = extractPrices(data.text)
        if (extractedPrices.length > 0) {
          // Actualizar los precios mencionados
          setPreciosMencionados((prev) => {
            // Filtrar duplicados basados en el servicio
            const serviciosExistentes = new Set(prev.map((item) => item.servicio))
            const nuevosPrecios = extractedPrices.filter((item) => !serviciosExistentes.has(item.servicio))
            return [...prev, ...nuevosPrecios]
          })
        }
      } else {
        throw new Error("Respuesta vacía del servidor")
      }
    } catch (error) {
      console.error("Error al enviar mensaje al endpoint principal:", error)

      // Intentar con el endpoint de fallback
      try {
        const fallbackResponse = await fetch("/api/chatbot/fallback", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: userMessage,
            conversationHistory: messages.slice(-5), // Enviar las últimas 5 mensajes para contexto
          }),
          // Agregar un timeout para el fallback también
          signal: AbortSignal.timeout(5000),
        })

        if (!fallbackResponse.ok) {
          throw new Error("Error en la respuesta de fallback")
        }

        const fallbackData = await fallbackResponse.json()

        if (fallbackData && fallbackData.text) {
          setMessages((prev) => [...prev, { role: "assistant", content: fallbackData.text }])

          // Extraer precios de la respuesta del fallback
          const extractedPrices = extractPrices(fallbackData.text)
          if (extractedPrices.length > 0) {
            setPreciosMencionados((prev) => {
              const serviciosExistentes = new Set(prev.map((item) => item.servicio))
              const nuevosPrecios = extractedPrices.filter((item) => !serviciosExistentes.has(item.servicio))
              return [...prev, ...nuevosPrecios]
            })
          }
        } else {
          throw new Error("Respuesta vacía del servidor de fallback")
        }
      } catch (fallbackError) {
        console.error("Error en el fallback:", fallbackError)
        setIsError(true)

        // Intentar con respuestas predefinidas simples
        if (userMessage.toLowerCase().includes("cita") && /\d{4}/.test(userMessage)) {
          // Si parece una consulta de cita con un número de 4 dígitos
          const citaNum = userMessage.match(/\d{4}/)?.[0]
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `Para consultar información sobre la cita ${citaNum || ""}, por favor llame al 4644-9158 o visite la sección de Citas en nuestra página web.`,
            },
          ])
        } else if (userMessage.toLowerCase().includes("hola") || userMessage.toLowerCase().includes("saludos")) {
          // Si es un saludo
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "¡Hola! Soy el asistente virtual del Centro Médico Familiar. ¿En qué puedo ayudarte hoy?",
            },
          ])
        } else {
          // Mensaje genérico de error
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content:
                "Lo siento, estoy teniendo problemas para responder en este momento. Por favor, intenta de nuevo más tarde o comunícate directamente al 4644-9158.",
            },
          ])
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setMessages([])
    setIsError(false)
    setPreciosMencionados([]) // Resetear los precios mencionados
    // El mensaje de bienvenida se agregará automáticamente por el useEffect
  }

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <>
      {/* Botón flotante para abrir el chat */}
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-4 shadow-lg z-50 flex items-center justify-center"
        aria-label="Abrir chat"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      {/* Ventana de chat */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 sm:w-96 h-[500px] bg-white rounded-lg shadow-xl flex flex-col z-40 border border-gray-200">
          {/* Encabezado */}
          <div className="bg-blue-500 text-white p-3 rounded-t-lg flex items-center">
            <MessageSquare size={20} className="mr-2" />
            <div className="font-medium">Asistente Virtual</div>
            <button
              onClick={handleReset}
              className="ml-auto text-white hover:text-blue-100"
              title="Reiniciar conversación"
            >
              <RefreshCw size={18} />
            </button>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg max-w-[85%] ${
                  message.role === "user" ? "bg-blue-100 ml-auto" : "bg-gray-100"
                }`}
              >
                {/* Convertir formato markdown simple a HTML */}
                <div
                  dangerouslySetInnerHTML={{
                    __html: message.content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br>"),
                  }}
                />
              </div>
            ))}
            {isLoading && (
              <div className="bg-gray-100 p-3 rounded-lg max-w-[85%] flex items-center space-x-2">
                <div
                  className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></div>
                <div
                  className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></div>
                <div
                  className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></div>
              </div>
            )}
            {isError && (
              <div className="bg-red-50 p-3 rounded-lg max-w-[85%] text-red-600 text-sm">
                Hay problemas de conexión. Estamos usando respuestas básicas.
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Formulario de entrada */}
          <form onSubmit={handleSubmit} className="p-3 border-t flex">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu mensaje..."
              className="flex-1 border rounded-l-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={isLoading}
              ref={inputRef}
            />
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600 disabled:bg-blue-300"
              disabled={isLoading || !input.trim()}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
