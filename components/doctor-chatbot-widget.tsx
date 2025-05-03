"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send } from "lucide-react"

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

export function DoctorChatbotWidget() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "¡Hola! Soy el asistente virtual del Centro Médico Familiar. ¿En qué puedo ayudarte hoy?",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [medicoNombre, setMedicoNombre] = useState("")
  const [medicoId, setMedicoId] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Estado para mantener el contexto de la conversación
  const [conversationContext, setConversationContext] = useState<ConversationContext>({
    mentionedPrices: [],
    lastQuery: "",
    currentTopic: "",
  })

  // Verificar si hay un médico logueado
  useEffect(() => {
    // Asegurarse de que localStorage esté disponible (solo en el cliente)
    if (typeof window !== "undefined") {
      const doctorId = localStorage.getItem("doctorId")
      const doctorNombre = localStorage.getItem("doctorNombre")

      if (doctorId && doctorNombre) {
        setMedicoId(Number(doctorId))
        setMedicoNombre(doctorNombre)

        // Actualizar el mensaje de bienvenida para médicos
        setMessages([
          {
            role: "assistant",
            content: `¡Bienvenido Dr(a). ${doctorNombre}! Soy su asistente virtual. ¿En qué puedo ayudarle hoy?`,
          },
        ])
      }
    }
  }, [])

  // Scroll to bottom whenever messages change, pero sin afectar el scroll de la página
  useEffect(() => {
    if (messagesEndRef.current && chatContainerRef.current) {
      // Solo hacemos scroll dentro del contenedor del chat, no en toda la página
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
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

  // Añadir esta función después de isPreguntaCitaPorNumero
  const isPreguntaCitasDoctor = (
    mensaje: string,
  ): {
    esPregunta: boolean
    doctorId?: string
    doctorNombre?: string
    periodo?: string
    estado?: string
  } => {
    // Convertir a minúsculas y eliminar acentos para facilitar la comparación
    const mensajeLimpio = mensaje
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")

    // Patrones para detectar preguntas sobre citas de doctores
    const patrones = [
      "citas del doctor",
      "citas de la doctora",
      "citas del dr",
      "citas de la dra",
      "citas que tengo",
      "mis citas",
      "mi agenda",
      "mis pacientes",
      "tengo citas",
      "agenda del dia",
      "agenda de hoy",
      "citas para hoy",
      "citas pendientes",
      "citas programadas",
      "citas completadas",
      "citas realizadas",
      "citas canceladas",
      "proximas citas",
      "citas proximas",
      "citas futuras",
      "citas pasadas",
      "citas anteriores",
      "historial de citas",
    ]

    // Verificar si algún patrón coincide
    const esPregunta = patrones.some((patron) => mensajeLimpio.includes(patron))

    if (!esPregunta) {
      return { esPregunta: false }
    }

    // Extraer nombre del doctor si se menciona
    let doctorNombre: string | undefined

    // Patrones para nombres de doctores
    const patronesNombreDoctor = [
      /doctor[a]?\s+([a-zñáéíóúü\s]+)/i,
      /dr[a]?\.\s+([a-zñáéíóúü\s]+)/i,
      /del\s+doctor[a]?\s+([a-zñáéíóúü\s]+)/i,
      /de\s+la\s+doctor[a]?\s+([a-zñáéíóúü\s]+)/i,
      /del\s+dr[a]?\.\s+([a-zñáéíóúü\s]+)/i,
      /de\s+la\s+dr[a]?\.\s+([a-zñáéíóúü\s]+)/i,
    ]

    for (const patron of patronesNombreDoctor) {
      const coincidencia = mensajeLimpio.match(patron)
      if (coincidencia && coincidencia[1]) {
        doctorNombre = coincidencia[1].trim()
        break
      }
    }

    // Determinar el periodo de tiempo
    let periodo: string | undefined

    if (mensajeLimpio.includes("hoy") || mensajeLimpio.includes("dia")) {
      periodo = "hoy"
    } else if (
      mensajeLimpio.includes("proxima") ||
      mensajeLimpio.includes("futuras") ||
      mensajeLimpio.includes("siguientes") ||
      mensajeLimpio.includes("programadas")
    ) {
      periodo = "proximas"
    } else if (
      mensajeLimpio.includes("pasada") ||
      mensajeLimpio.includes("anteriores") ||
      mensajeLimpio.includes("historial") ||
      mensajeLimpio.includes("realizadas")
    ) {
      periodo = "pasadas"
    }

    // Determinar el estado de las citas
    let estado: string | undefined

    if (mensajeLimpio.includes("pendiente")) {
      estado = "pendiente"
    } else if (mensajeLimpio.includes("completada") || mensajeLimpio.includes("realizada")) {
      estado = "completada"
    } else if (mensajeLimpio.includes("cancelada")) {
      estado = "cancelada"
    }

    return {
      esPregunta: true,
      doctorNombre,
      periodo,
      estado,
    }
  }

  // Añadir esta función después de consultarCitaPorNumero
  const consultarCitasDoctor = async (doctorId?: string, doctorNombre?: string, estado?: string, periodo?: string) => {
    try {
      const response = await fetch("/api/chatbot/citas-doctor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          doctorId,
          doctorNombre,
          estado,
          periodo,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        if (response.status === 404) {
          throw new Error(`No se encontró ningún doctor con el nombre ${doctorNombre}`)
        } else {
          throw new Error(data.error || "No se pudo encontrar las citas del doctor")
        }
      }

      return data
    } catch (error) {
      console.error("Error al consultar citas del doctor:", error)
      throw error
    }
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

  // Función para formatear la fecha en formato legible
  const formatearFecha = (fechaStr: string): string => {
    const fecha = new Date(fechaStr)
    const opciones: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }
    return fecha.toLocaleDateString("es-ES", opciones)
  }

  // Función para manejar el envío de mensajes
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

      // NUEVA VERIFICACIÓN: Verificar si está preguntando por citas del doctor
      if (medicoId) {
        const { esPregunta, periodo, estado } = isPreguntaCitasDoctor(userMessage)

        if (esPregunta) {
          try {
            const citasData = await consultarCitasDoctor(String(medicoId), medicoNombre, estado, periodo)

            if (citasData && citasData.data && citasData.data.length > 0) {
              // Formatear la respuesta según el periodo
              let periodoTexto = ""
              switch (periodo) {
                case "hoy":
                  periodoTexto = "para hoy"
                  break
                case "proximas":
                  periodoTexto = "próximas"
                  break
                case "pasadas":
                  periodoTexto = "pasadas"
                  break
                default:
                  periodoTexto = "programadas"
              }

              // Formatear el estado si existe
              let estadoTexto = ""
              if (estado) {
                estadoTexto = ` con estado "${estado}"`
              }

              let respuesta = `Dr(a). ${medicoNombre}, tiene ${citasData.data.length} citas ${periodoTexto}${estadoTexto}:\n\n`

              // Agrupar citas por fecha
              const citasPorFecha: Record<string, any[]> = {}
              citasData.data.forEach((cita: any) => {
                if (!citasPorFecha[cita.fecha]) {
                  citasPorFecha[cita.fecha] = []
                }
                citasPorFecha[cita.fecha].push(cita)
              })

              // Ordenar fechas
              const fechasOrdenadas = Object.keys(citasPorFecha).sort()

              // Mostrar citas agrupadas por fecha
              fechasOrdenadas.forEach((fecha) => {
                respuesta += `📅 ${formatearFecha(fecha)}:\n`

                citasPorFecha[fecha].forEach((cita: any, index: number) => {
                  respuesta += `${index + 1}. ${cita.hora} - ${cita.paciente?.nombre || "Paciente sin nombre"}\n`
                  respuesta += `   Motivo: ${cita.motivo}\n`
                  respuesta += `   Estado: ${cita.estado}\n`
                  if (cita.numero_cita) {
                    respuesta += `   Cita #: ${cita.numero_cita}\n`
                  }
                  respuesta += "\n"
                })
              })

              setMessages((prev) => [...prev, { role: "assistant", content: respuesta }])
              setIsLoading(false)
              return
            } else {
              // No se encontraron citas
              let periodoTexto = ""
              switch (periodo) {
                case "hoy":
                  periodoTexto = "para hoy"
                  break
                case "proximas":
                  periodoTexto = "próximas"
                  break
                case "pasadas":
                  periodoTexto = "pasadas"
                  break
                default:
                  periodoTexto = "programadas"
              }

              // Formatear el estado si existe
              let estadoTexto = ""
              if (estado) {
                estadoTexto = ` con estado "${estado}"`
              }

              setMessages((prev) => [
                ...prev,
                {
                  role: "assistant",
                  content: `Dr(a). ${medicoNombre}, no tiene citas ${periodoTexto}${estadoTexto}. ¿Puedo ayudarle con algo más?`,
                },
              ])
              setIsLoading(false)
              return
            }
          } catch (error) {
            console.error("Error al consultar citas del doctor:", error)
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: `Lo siento, Dr(a). ${medicoNombre}, tuve un problema al consultar sus citas. Por favor, intente nuevamente o verifique directamente en el sistema.`,
              },
            ])
            setIsLoading(false)
            return
          }
        }
      }

      // Verificar si es una pregunta sobre citas
      const { esPreguntaCita, fecha, hora, tipo } = isPreguntaCita(userMessage)

      // Verificar si es una pregunta sobre cita por número
      const { esPregunta, numeroCita } = isPreguntaCitaPorNumero(userMessage)

      if (esPregunta) {
        if (numeroCita) {
          try {
            const citaData = await consultarCitaPorNumero(numeroCita)

            const respuesta = `Cita #${citaData.numeroCita}: Paciente ${citaData.paciente.nombre}, ${citaData.fecha} a las ${citaData.hora} con Dr(a). ${citaData.doctor.nombre}. Motivo: ${citaData.motivo}. Estado: ${citaData.estado}.`

            setMessages((prev) => [...prev, { role: "assistant", content: respuesta }])
            setIsLoading(false)
            return
          } catch (error) {
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: `No encontré cita #${numeroCita}. Verifique el número e intente nuevamente.`,
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
              content: "Para consultar una cita, indique el número de 4 dígitos (ej: 'Buscar cita 0042').",
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
            let respuesta = `${citasData.length} cita(s) para ${fecha}${hora ? ` a las ${hora}` : ""}${tipo ? ` (${tipo})` : ""}:`

            citasData.slice(0, 3).forEach((cita: any, index: number) => {
              respuesta += `\n${index + 1}. Paciente: ${cita.paciente.nombre}, Dr: ${cita.doctor.nombre}, Hora: ${cita.hora}`
            })

            if (citasData.length > 3) {
              respuesta += `\n...y ${citasData.length - 3} más.`
            }

            setMessages((prev) => [...prev, { role: "assistant", content: respuesta }])
            setIsLoading(false)
            return
          } else {
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: `No hay citas para ${fecha}${hora ? ` a las ${hora}` : ""}${tipo ? ` relacionadas con ${tipo}` : ""}.`,
              },
            ])
            setIsLoading(false)
            return
          }
        } catch (error) {
          console.error("Error al consultar citas:", error)
        }
      }

      try {
        // Procesar con el chatbot específico para doctores
        const response = await fetch("/api/chatbot/groq-doctor", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mensaje: userMessage,
            conversationHistory: messages.slice(-4), // Enviar solo los últimos 4 mensajes para contexto
            medicoNombre,
            medicoId,
          }),
        })

        if (!response.ok) {
          throw new Error(`Error en la respuesta: ${response.status}`)
        }

        const data = await response.json()

        // Agregar la respuesta del asistente al estado
        const assistantMessage = {
          role: "assistant",
          content: data.text || "Lo siento, ocurrió un error al procesar tu mensaje.",
        }
        setMessages((prev) => [...prev, assistantMessage])
      } catch (error) {
        console.error("Error al enviar mensaje:", error)

        // Usar el endpoint de fallback
        try {
          const fallbackResponse = await fetch("/api/chatbot/fallback", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query: userMessage,
              conversationHistory: messages.slice(-3), // Enviar las últimas 3 mensajes para contexto
            }),
          })

          if (!fallbackResponse.ok) {
            throw new Error("Error en la respuesta de fallback")
          }

          const fallbackData = await fallbackResponse.json()
          setMessages((prev) => [...prev, { role: "assistant", content: fallbackData.text }])
        } catch (fallbackError) {
          // Agregar un mensaje de error amigable
          const errorMessage = {
            role: "assistant",
            content: "Lo siento, estoy teniendo problemas para conectarme. Intente nuevamente más tarde.",
          }
          setMessages((prev) => [...prev, errorMessage])
        }
      }
    } catch (error) {
      console.error("Error general en el chatbot:", error)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Lo siento, estoy teniendo problemas para responder. Intente nuevamente o llame al 4644-9158.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Contenedor de mensajes con altura fija */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-3 space-y-3"
        style={{ height: "300px", maxHeight: "300px" }}
      >
        {messages.map((message, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg max-w-[85%] ${message.role === "user" ? "bg-blue-100 ml-auto" : "bg-green-50"}`}
          >
            {message.content}
          </div>
        ))}
        {isLoading && (
          <div className="bg-green-50 p-3 rounded-lg max-w-[85%] flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
            <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
            <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Formulario de entrada */}
      <form onSubmit={handleSendMessage} className="p-2 border-t flex">
        <Input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu mensaje..."
          className="flex-1 border rounded-l-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-500"
          disabled={isLoading}
        />
        <Button
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded-r-md hover:bg-green-600 disabled:bg-green-300"
          disabled={isLoading || !input.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
