"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MessageSquare, Send, X } from "lucide-react"
import { createClientSupabaseClient } from "@/lib/supabase"

type Message = {
  role: "user" | "assistant"
  content: string
}

// Tipo para almacenar información contextual de la conversación
type ConversationContext = {
  mentionedPrices: {
    item: string
    price: number
  }[]
  lastQuery?: string
  currentTopic?: string
}

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "¡Hola! Soy el asistente virtual del Centro Médico Familiar. ¿En qué puedo ayudarte hoy?",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Estado para mantener el contexto de la conversación
  const [conversationContext, setConversationContext] = useState<ConversationContext>({
    mentionedPrices: [],
    lastQuery: "",
    currentTopic: "",
  })

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Función para extraer precios de un texto
  const extractPrices = (text: string): { item: string; price: number }[] => {
    const priceRegex = /([\w\s]+):\s*Q\s*(\d+(?:\.\d+)?)/g
    const prices: { item: string; price: number }[] = []
    let match

    while ((match = priceRegex.exec(text)) !== null) {
      const item = match[1].trim()
      const price = Number.parseFloat(match[2])
      if (!isNaN(price)) {
        prices.push({ item, price })
      }
    }

    return prices
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

  // Función para calcular el total de los precios mencionados
  const calculateTotal = (): string => {
    if (conversationContext.mentionedPrices.length === 0) {
      return "No he mencionado precios anteriormente para poder calcular un total."
    }

    const total = conversationContext.mentionedPrices.reduce((sum, item) => sum + item.price, 0)

    let response = `El total de los servicios mencionados es: Q${total.toFixed(2)}\n\n`
    response += "Desglose:\n"

    conversationContext.mentionedPrices.forEach((item) => {
      response += `- ${item.item}: Q${item.price.toFixed(2)}\n`
    })

    return response
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

  // Función para calcular impuestos sobre los precios mencionados
  const calculateTaxes = (taxType: string, rate: number): string => {
    if (conversationContext.mentionedPrices.length === 0) {
      return "No he mencionado precios anteriormente para poder calcular impuestos."
    }

    const subtotal = conversationContext.mentionedPrices.reduce((sum, item) => sum + item.price, 0)
    const taxAmount = (subtotal * rate) / 100
    const total = subtotal + taxAmount

    let response = `Cálculo de ${taxType} (${rate}%):\n\n`
    response += `Subtotal: Q${subtotal.toFixed(2)}\n`
    response += `${taxType} (${rate}%): Q${taxAmount.toFixed(2)}\n`
    response += `Total con ${taxType}: Q${total.toFixed(2)}\n\n`

    response += "Desglose de servicios:\n"
    conversationContext.mentionedPrices.forEach((item) => {
      response += `- ${item.item}: Q${item.price.toFixed(2)}\n`
    })

    return response
  }

  const isPreguntaCita = (
    mensaje: string,
  ): { esPreguntaCita: boolean; fecha?: string; hora?: string; tipo?: string } => {
    // Convertir a minúsculas y eliminar acentos para facilitar la comparación
    const mensajeLimpio = mensaje
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")

    // Patrones para detectar preguntas sobre citas
    const patronesCita = [
      "quien tiene cita",
      "quien tiene una cita",
      "que paciente tiene",
      "cita programada",
      "cita agendada",
      "cita para",
      "consulta de",
      "consulta para",
    ]

    // Verificar si algún patrón coincide
    const esPreguntaCita = patronesCita.some((patron) => mensajeLimpio.includes(patron))

    if (!esPreguntaCita) {
      return { esPreguntaCita: false }
    }

    // Extraer fecha (formatos: DD/MM/YYYY, DD-MM-YYYY, etc.)
    const patronesFecha = [
      /(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/, // DD/MM/YYYY o DD-MM-YYYY
      /(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})/, // YYYY/MM/DD o YYYY-MM-DD
    ]

    let fecha: string | undefined

    for (const patron of patronesFecha) {
      const coincidencia = mensajeLimpio.match(patron)
      if (coincidencia) {
        // Normalizar al formato YYYY-MM-DD para la base de datos
        if (coincidencia[3] && coincidencia[3].length === 2) {
          // Si el año tiene 2 dígitos, asumir 2000+
          coincidencia[3] = "20" + coincidencia[3]
        }

        if (coincidencia[0].includes("/") || coincidencia[0].includes("-") || coincidencia[0].includes(".")) {
          // Si el formato es DD/MM/YYYY
          if (coincidencia[1].length <= 2 && Number.parseInt(coincidencia[1]) <= 31) {
            const dia = coincidencia[1].padStart(2, "0")
            const mes = coincidencia[2].padStart(2, "0")
            fecha = `${coincidencia[3]}-${mes}-${dia}`
          } else {
            // Si el formato es YYYY/MM/DD
            const dia = coincidencia[3].padStart(2, "0")
            const mes = coincidencia[2].padStart(2, "0")
            fecha = `${coincidencia[1]}-${mes}-${dia}`
          }
          break
        }
      }
    }

    // Extraer hora (formato: HH:MM)
    const patronHora = /(\d{1,2}):(\d{2})/
    const coincidenciaHora = mensajeLimpio.match(patronHora)
    let hora: string | undefined

    if (coincidenciaHora) {
      const horas = coincidenciaHora[1].padStart(2, "0")
      const minutos = coincidenciaHora[2]
      hora = `${horas}:${minutos}`
    }

    // Extraer tipo de cita/consulta
    const tiposDeCita = [
      "glucemia",
      "diabetes",
      "presion",
      "hipertension",
      "cardiologia",
      "pediatria",
      "ginecologia",
      "dermatologia",
      "oftalmologia",
      "ultrasonido",
      "radiografia",
      "laboratorio",
      "covid",
      "dengue",
    ]

    let tipo: string | undefined

    for (const tipoCita of tiposDeCita) {
      if (mensajeLimpio.includes(tipoCita)) {
        tipo = tipoCita
        break
      }
    }

    return {
      esPreguntaCita: true,
      fecha,
      hora,
      tipo,
    }
  }

  const isPreguntaCitaPorNumero = (mensaje: string): { esPregunta: boolean; numeroCita?: string } => {
    // Convertir a minúsculas y eliminar acentos para facilitar la comparación
    const mensajeLimpio = mensaje
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")

    // Patrones para detectar preguntas sobre citas por número
    const patrones = [
      "cita numero",
      "cita #",
      "numero de cita",
      "mi cita",
      "informacion de la cita",
      "informacion de cita",
      "informacion cita",
      "detalles de cita",
      "consultar cita",
      "buscar cita",
      "estado de cita",
      "cita con numero",
      "cita con el numero",
      "necesito informacion",
      "quiero saber",
      "datos de la cita",
      "datos de mi cita",
    ]

    // Verificar si algún patrón coincide
    const esPregunta = patrones.some((patron) => mensajeLimpio.includes(patron))

    // Si no coincide con ningún patrón pero contiene un número de 4 dígitos, también considerarlo como pregunta
    const contieneCuatroDigitos = /\b\d{4}\b/.test(mensajeLimpio)

    if (!esPregunta && !contieneCuatroDigitos) {
      return { esPregunta: false }
    }

    // Buscar un patrón de 4 dígitos que podría ser el número de cita
    const patronNumero = /\b(\d{4})\b/
    const coincidencia = mensajeLimpio.match(patronNumero)

    if (coincidencia && coincidencia[1]) {
      return {
        esPregunta: true,
        numeroCita: coincidencia[1],
      }
    }

    return { esPregunta: true }
  }

  const consultarCitaPorNumero = async (numeroCita: string) => {
    try {
      const response = await fetch("/api/chatbot/buscar-cita", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          numeroCita,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        if (response.status === 404) {
          throw new Error(`No se encontró ninguna cita con el número ${numeroCita}`)
        } else {
          throw new Error(data.error || "No se pudo encontrar la cita")
        }
      }

      return data.data
    } catch (error) {
      console.error("Error al consultar cita por número:", error)
      throw error
    }
  }

  // Función para consultar información de citas
  const consultarCita = async (fecha?: string, hora?: string, tipo?: string) => {
    try {
      const response = await fetch("/api/chatbot/citas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fecha,
          hora,
          tipo,
        }),
      })

      if (!response.ok) {
        throw new Error("Error al consultar información de citas")
      }

      const { success, data, error } = await response.json()

      if (!success || error) {
        throw new Error(error || "Error al procesar la consulta")
      }

      return data
    } catch (error) {
      console.error("Error al consultar citas:", error)
      throw error
    }
  }

  // Función para obtener respuesta de Groq a través del API
  const obtenerRespuestaGroq = async (mensaje: string, contexto: string) => {
    try {
      const response = await fetch("/api/chatbot/groq", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mensaje,
          contexto,
          conversationHistory: messages.slice(-5), // Enviar las últimas 5 mensajes para contexto
        }),
      })

      if (!response.ok) {
        throw new Error("Error al obtener respuesta de Groq")
      }

      const { success, text, error } = await response.json()

      if (!success || error) {
        throw new Error(error || "Error en el servicio de Groq")
      }

      return text
    } catch (error) {
      console.error("Error al obtener respuesta de Groq:", error)
      throw error
    }
  }

  // Función para obtener respuesta de fallback cuando falla la API de Groq
  const obtenerRespuestaFallback = async (mensaje: string) => {
    try {
      const response = await fetch("/api/chatbot/fallback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: mensaje,
          conversationHistory: messages.slice(-5), // Enviar las últimas 5 mensajes para contexto
        }),
      })

      if (!response.ok) {
        throw new Error("Error al obtener respuesta de fallback")
      }

      const { success, text } = await response.json()

      if (!success) {
        throw new Error("Error en el servicio de fallback")
      }

      return text
    } catch (error) {
      console.error("Error al obtener respuesta de fallback:", error)
      return "Lo siento, estoy teniendo problemas para responder. Por favor, intenta de nuevo o comunícate directamente al 4644-9158."
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput("")

    // Add user message to chat
    setMessages((prev) => [...prev, { role: "user", content: userMessage }])

    // Actualizar el contexto con la última consulta del usuario
    setConversationContext((prevContext) => ({
      ...prevContext,
      lastQuery: userMessage,
    }))

    setIsLoading(true)

    try {
      // Verificar si está preguntando por un cálculo de impuestos
      const { isTaxQuestion, taxType, rate } = isAskingForTaxCalculation(userMessage)
      if (isTaxQuestion && taxType && rate) {
        const taxResponse = calculateTaxes(taxType, rate)
        setMessages((prev) => [...prev, { role: "assistant", content: taxResponse }])
        setIsLoading(false)
        return
      }
      // Verificar si está preguntando por un total
      if (isAskingForTotal(userMessage)) {
        const totalResponse = calculateTotal()
        setMessages((prev) => [...prev, { role: "assistant", content: totalResponse }])
        setIsLoading(false)
        return
      }

      // Verificar si es una pregunta sobre citas
      const { esPreguntaCita, fecha, hora, tipo } = isPreguntaCita(userMessage)
      // Verificar si es una pregunta sobre cita por número
      const { esPregunta, numeroCita } = isPreguntaCitaPorNumero(userMessage)

      if (esPregunta) {
        if (numeroCita) {
          try {
            const citaData = await consultarCitaPorNumero(numeroCita)

            const respuesta = `He encontrado la cita #${citaData.numeroCita}:
            
Paciente: ${citaData.paciente.nombre}
Fecha: ${citaData.fecha}
Hora: ${citaData.hora}
Doctor: ${citaData.doctor.nombre} (${citaData.doctor.especialidad})
Motivo: ${citaData.motivo}
Estado: ${citaData.estado}

Si necesita modificar o cancelar su cita, por favor llame al 4644-9158.`

            setMessages((prev) => [...prev, { role: "assistant", content: respuesta }])
            setIsLoading(false)
            return
          } catch (error) {
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: `No pude encontrar ninguna cita con el número ${numeroCita}. Por favor, verifique el número e intente nuevamente o comuníquese directamente al 4644-9158.`,
              },
            ])
            setIsLoading(false)
            return
          }
        } else {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content:
                "Para consultar información sobre su cita, por favor indique el número de cita de 4 dígitos que recibió al agendar (por ejemplo: 'Quiero información sobre la cita 0042').",
            },
          ])
          setIsLoading(false)
          return
        }
      }

      if (esPreguntaCita && fecha) {
        // Es una pregunta sobre citas con fecha, consultar directamente
        try {
          const citasData = await consultarCita(fecha, hora, tipo)

          if (citasData && citasData.length > 0) {
            let respuesta = `He encontrado ${citasData.length} cita(s) para el ${fecha}`
            if (hora) respuesta += ` a las ${hora}`
            if (tipo) respuesta += ` relacionada con ${tipo}`
            respuesta += ":\n\n"

            citasData.forEach((cita: any, index: number) => {
              respuesta += `${index + 1}. Paciente: ${cita.paciente.nombre}\n`
              respuesta += `   Hora: ${cita.hora}\n`
              respuesta += `   Motivo: ${cita.motivo}\n`
              respuesta += `   Doctor: ${cita.doctor.nombre} (${cita.doctor.especialidad})\n`
              respuesta += `   Estado: ${cita.estado}\n\n`
            })

            setMessages((prev) => [...prev, { role: "assistant", content: respuesta }])
            setIsLoading(false)
            return
          } else {
            // No se encontraron citas, continuar con la respuesta normal del chatbot
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: `No encontré citas programadas para el ${fecha}${hora ? ` a las ${hora}` : ""}${
                  tipo ? ` relacionadas con ${tipo}` : ""
                }. ¿Puedo ayudarte con algo más?`,
              },
            ])
            setIsLoading(false)
            return
          }
        } catch (error) {
          console.error("Error al consultar citas:", error)
          // Continuar con la respuesta normal del chatbot
        }
      }

      try {
        // Fetch relevant info from database
        const supabase = createClientSupabaseClient()

        // Obtener información básica
        const { data: infoMedica } = await supabase.from("info_medica").select("titulo, contenido")
        const { data: precios } = await supabase.from("precios").select("*")
        const { data: doctores } = await supabase.from("doctores").select("id, nombre, especialidad, email")
        const { data: especialidades } = await supabase.from("especialidades").select("id, nombre, descripcion")

        // Obtener estadísticas
        const { data: estadisticas } = await supabase.from("estadisticas_diarias").select("*")

        // Obtener información de seguros
        const { data: seguros } = await supabase.from("seguros_medicos").select("*")

        // Contar pacientes
        const { count: pacientes } = await supabase.from("pacientes").select("*", { count: "exact", head: true })

        // Obtener citas
        const { data: citas } = await supabase.from("citas").select("*")

        // Preparar información formateada para el chatbot
        const infoMedicaText = infoMedica
          ? infoMedica.map((item) => `${item.titulo}: ${item.contenido}`).join("\n\n")
          : ""

        const preciosText = precios
          ? precios
              .map(
                (precio) =>
                  `${precio.servicio}: Q${precio.precio.toFixed(2)} - ${precio.descripcion}${
                    precio.duracion_minutos ? ` (Duración: ${precio.duracion_minutos} minutos)` : ""
                  }`,
              )
              .join("\n")
          : "No hay información de precios disponible."

        const doctoresText = doctores
          ? doctores.map((doctor) => `${doctor.nombre} - ${doctor.especialidad}`).join("\n")
          : "No hay información de doctores disponible."

        const especialidadesText = especialidades
          ? especialidades.map((esp) => `${esp.nombre}: ${esp.descripcion}`).join("\n")
          : "No hay información de especialidades disponible."

        // Estadísticas
        const pacientesPromedio =
          estadisticas && estadisticas.length > 0
            ? (estadisticas.reduce((sum, stat) => sum + stat.pacientes_atendidos, 0) / estadisticas.length).toFixed(0)
            : "No disponible"

        const tiempoEsperaPromedio =
          estadisticas && estadisticas.length > 0
            ? (estadisticas.reduce((sum, stat) => sum + stat.tiempo_espera_promedio, 0) / estadisticas.length).toFixed(
                0,
              )
            : "No disponible"

        const citasCanceladas = citas ? citas.filter((cita) => cita.estado === "cancelada").length : 0
        const citasPendientes = citas ? citas.filter((cita) => cita.estado === "pendiente").length : 0
        const citasCompletadas = citas ? citas.filter((cita) => cita.estado === "completada").length : 0

        // Información de seguros
        const segurosText = seguros
          ? seguros.map((s) => `${s.nombre}: ${s.cobertura}`).join("\n")
          : "No hay información de seguros disponible."

        // Crear un contexto detallado para el modelo
        const systemPrompt = `
Eres la asistente virtual del Centro Médico Familiar en San Juan Sacatepéquez, Guatemala.

INSTRUCCIONES IMPORTANTES:
1. Sé EXTREMADAMENTE CONCISO. Limita tus respuestas a 1-3 oraciones cortas.
2. Mantén un tono amable y profesional.
3. Identifícate como la IA del Centro Médico Familiar.
4. Evita explicaciones largas o detalles innecesarios.
5. Proporciona información precisa y directa.
6. Si no conoces la respuesta, sugiere contactar al centro al 4644-9158.
7. Cuando menciones precios, usa quetzales (Q).
8. Si te preguntan por un total o suma de precios mencionados anteriormente, CALCULA el total y muestra el desglose.
9. Mantén el contexto de la conversación y recuerda información previa relevante.

INFORMACIÓN GENERAL:
- Dirección: 2 av. 5-08 zona 3 San Juan Sacatepéquez
- Teléfono: 4644-9158
- Horario: Lunes a Viernes 8:00-18:00, Sábados 8:00-13:00
- Especialidades: medicina general, pediatría, cardiología, ginecología, nutrición, dermatología y psicología
- Métodos de pago: efectivo, tarjetas, cheques, transferencias y seguros médicos

Recuerda: Brevedad y precisión son tu prioridad.
`

        try {
          // Usar el endpoint de Groq
          const text = await obtenerRespuestaGroq(userMessage, systemPrompt)

          // Extraer precios mencionados en la respuesta
          const extractedPrices = extractPrices(text)

          // Actualizar el contexto con los precios mencionados
          if (extractedPrices.length > 0) {
            setConversationContext((prevContext) => ({
              ...prevContext,
              mentionedPrices: [...extractedPrices],
            }))
          }

          setMessages((prev) => [...prev, { role: "assistant", content: text }])
        } catch (groqError) {
          console.error("Error al generar respuesta con Groq:", groqError)

          // Usar el endpoint de fallback
          const fallbackText = await obtenerRespuestaFallback(userMessage)

          // Extraer precios mencionados en la respuesta
          const extractedPrices = extractPrices(fallbackText)

          // Actualizar el contexto con los precios mencionados
          if (extractedPrices.length > 0) {
            setConversationContext((prevContext) => ({
              ...prevContext,
              mentionedPrices: [...extractedPrices],
            }))
          }

          setMessages((prev) => [...prev, { role: "assistant", content: fallbackText }])
        }
      } catch (dbError) {
        console.error("Error al obtener datos de la base de datos:", dbError)

        // Usar el endpoint de fallback
        const fallbackText = await obtenerRespuestaFallback(userMessage)
        setMessages((prev) => [...prev, { role: "assistant", content: fallbackText }])
      }
    } catch (error) {
      console.error("Error general en el chatbot:", error)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Lo siento, estoy teniendo problemas para responder. Por favor, intenta de nuevo o comunícate directamente al 4644-9158.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Chat button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 rounded-full w-12 h-12 p-0 bg-sky-500 hover:bg-sky-600 shadow-lg"
        aria-label="Abrir chat"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>

      {/* Chat widget */}
      {isOpen && (
        <Card className="fixed bottom-4 right-4 w-80 md:w-96 h-96 flex flex-col shadow-xl z-50">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b">
            <CardTitle className="text-sm font-medium text-sky-700">Asistente Virtual</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    message.role === "user" ? "bg-sky-500 text-white" : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-800">
                  <span className="flex gap-1">
                    <span className="animate-bounce">.</span>
                    <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>
                      .
                    </span>
                    <span className="animate-bounce" style={{ animationDelay: "0.4s" }}>
                      .
                    </span>
                  </span>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="p-2 border-t">
            <form onSubmit={handleSendMessage} className="flex w-full gap-2">
              <Input
                placeholder="Escribe tu mensaje..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !input.trim()}
                className="bg-sky-500 hover:bg-sky-600"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}
    </>
  )
}
