import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

// Respuestas de fallback más concisas
const respuestasFallback = [
  "Para información más precisa, llame al Centro Médico Familiar al 4644-9158. ¿Puedo ayudarle en algo más?",
  "El Centro Médico Familiar está en 2 av. 5-08 zona 3 San Juan Sacatepéquez. Para más detalles, llame al 4644-9158.",
  "Ofrecemos diversos servicios médicos. Para consultas específicas o agendar cita, llame al 4644-9158.",
  "Nuestro horario es de lunes a viernes 8:00-18:00 y sábados 8:00-13:00. ¿Necesita algo más?",
  "Para agendar una cita, llame al 4644-9158 o use el formulario en nuestra web. Estoy para servirle.",
  "Los documentos necesarios son: DPI, comprobante de domicilio y tarjeta de seguro médico (si aplica).",
  "Aceptamos efectivo, tarjetas, cheques y transferencias bancarias. ¿Requiere información adicional?",
]

// Función para extraer precios de mensajes anteriores
const extractPricesFromHistory = (history) => {
  if (!history || !Array.isArray(history)) return []

  const prices = []
  const priceRegex = /([\w\s]+):\s*Q\s*(\d+(?:\.\d+)?)/g

  // Buscar en los mensajes del asistente
  for (const msg of history) {
    if (msg.role === "assistant") {
      let match
      while ((match = priceRegex.exec(msg.content)) !== null) {
        const item = match[1].trim()
        const price = Number.parseFloat(match[2])
        if (!isNaN(price)) {
          prices.push({ item, price })
        }
      }
    }
  }

  return prices
}

// Función para verificar si se está preguntando por un total
const isAskingForTotal = (message) => {
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
const isAskingForTaxCalculation = (message) => {
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
const calculateTaxes = (prices, taxType, rate) => {
  if (!prices || prices.length === 0) {
    return "No he mencionado precios anteriormente para poder calcular impuestos."
  }

  const subtotal = prices.reduce((sum, item) => sum + item.price, 0)
  const taxAmount = (subtotal * rate) / 100
  const total = subtotal + taxAmount

  let response = `Cálculo de ${taxType} (${rate}%):\n\n`
  response += `Subtotal: Q${subtotal.toFixed(2)}\n`
  response += `${taxType} (${rate}%): Q${taxAmount.toFixed(2)}\n`
  response += `Total con ${taxType}: Q${total.toFixed(2)}\n\n`

  response += "Desglose de servicios:\n"
  prices.forEach((item) => {
    response += `- ${item.item}: Q${item.price.toFixed(2)}\n`
  })

  return response
}

// Función para calcular el total de los precios
const calculateTotal = (prices) => {
  if (!prices || prices.length === 0) {
    return "No he mencionado precios anteriormente para poder calcular un total."
  }

  const total = prices.reduce((sum, item) => sum + item.price, 0)

  let response = `El total de los servicios mencionados es: Q${total.toFixed(2)}\n\n`
  response += "Desglose:\n"

  prices.forEach((item) => {
    response += `- ${item.item}: Q${item.price.toFixed(2)}\n`
  })

  return response
}

export async function POST(request: Request) {
  try {
    const { query, conversationHistory } = await request.json()

    // Verificar si está preguntando por un total o un cálculo de impuestos
    if (isAskingForTotal(query)) {
      const prices = extractPricesFromHistory(conversationHistory)
      const totalResponse = calculateTotal(prices)

      return NextResponse.json({
        success: true,
        text: totalResponse,
        query,
      })
    }

    // Verificar si está preguntando por un cálculo de impuestos
    const { isTaxQuestion, taxType, rate } = isAskingForTaxCalculation(query)
    if (isTaxQuestion && taxType && rate) {
      const prices = extractPricesFromHistory(conversationHistory)
      const taxResponse = calculateTaxes(prices, taxType, rate)

      return NextResponse.json({
        success: true,
        text: taxResponse,
        query,
      })
    }

    // Intentar buscar información relevante en la base de datos
    try {
      const supabase = createServerSupabaseClient()
      const { data: infoMedica } = await supabase.from("info_medica").select("titulo, contenido")

      if (infoMedica && infoMedica.length > 0) {
        // Convertir consulta a minúsculas y sin acentos
        const queryLimpio = query
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")

        // Buscar coincidencias en la información médica
        for (const info of infoMedica) {
          const tituloLimpio = info.titulo
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")

          // Si hay coincidencia en el título, devolver el contenido resumido
          if (tituloLimpio.includes(queryLimpio) || queryLimpio.includes(tituloLimpio)) {
            // Resumir el contenido para que sea más conciso
            const contenidoResumido = info.contenido.split(".").slice(0, 2).join(".") + "."

            return NextResponse.json({
              success: true,
              text: contenidoResumido,
              query,
            })
          }

          // Buscar palabras clave en el contenido
          const palabrasUsuario = queryLimpio.split(" ").filter((p) => p.length > 3)
          const contenidoLimpio = info.contenido
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")

          for (const palabra of palabrasUsuario) {
            if (contenidoLimpio.includes(palabra)) {
              // Resumir el contenido para que sea más conciso
              const contenidoResumido = info.contenido.split(".").slice(0, 2).join(".") + "."

              return NextResponse.json({
                success: true,
                text: contenidoResumido,
                query,
              })
            }
          }
        }
      }
    } catch (dbError) {
      console.error("Error al buscar en la base de datos:", dbError)
      // Continuar con respuestas predefinidas
    }

    // Si no se encontró información relevante, seleccionar una respuesta aleatoria
    const respuestaAleatoria = respuestasFallback[Math.floor(Math.random() * respuestasFallback.length)]

    return NextResponse.json({
      success: true,
      text: respuestaAleatoria,
      query: query || "consulta general",
    })
  } catch (error) {
    console.error("Error en el endpoint de fallback:", error)
    return NextResponse.json(
      {
        success: false,
        text: "Lo siento, estoy teniendo problemas para responder. Por favor, intente de nuevo o comuníquese al 4644-9158.",
        error: "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}
