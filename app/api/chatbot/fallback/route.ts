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

// Precios de servicios para respuestas de fallback
const preciosServicios = {
  "medicina general": 150,
  pediatría: 200,
  ginecología: 250,
  cardiología: 300,
  psicología: 300,
  nutrición: 200,
  dermatología: 250,
}

// Función para manejar consultas de precios
const handlePriceQuery = (query: string): string | null => {
  const lowerQuery = query.toLowerCase()

  // Verificar si es una pregunta sobre precios
  if (
    lowerQuery.includes("precio") ||
    lowerQuery.includes("costo") ||
    lowerQuery.includes("cuanto cuesta") ||
    lowerQuery.includes("cuánto cuesta")
  ) {
    // Verificar si pregunta por múltiples servicios
    const serviciosMencionados = []
    for (const servicio of Object.keys(preciosServicios)) {
      if (lowerQuery.includes(servicio)) {
        serviciosMencionados.push(servicio)
      }
    }

    // Si menciona múltiples servicios, dar una respuesta con todos los precios
    if (serviciosMencionados.length > 1) {
      let respuesta = "**Precios de los servicios solicitados:**\n\n"

      for (const servicio of serviciosMencionados) {
        const precio = preciosServicios[servicio as keyof typeof preciosServicios]
        respuesta += `- ${servicio.charAt(0).toUpperCase() + servicio.slice(1)}: Q${precio}\n`
      }

      // Calcular total sin IVA
      const subtotal = serviciosMencionados.reduce((total, servicio) => {
        return total + preciosServicios[servicio as keyof typeof preciosServicios]
      }, 0)

      // Calcular IVA y total con IVA
      const iva = subtotal * 0.12
      const total = subtotal + iva

      respuesta += `\n**Subtotal (sin IVA):** Q${subtotal.toFixed(2)}\n`

      // Si menciona IVA, incluir el cálculo
      if (lowerQuery.includes("iva") || lowerQuery.includes("impuesto")) {
        respuesta += `**IVA (12%):** Q${iva.toFixed(2)}\n`
        respuesta += `**Total (con IVA):** Q${total.toFixed(2)}`
      }

      return respuesta
    }

    // Si solo menciona un servicio
    for (const [servicio, precio] of Object.entries(preciosServicios)) {
      if (lowerQuery.includes(servicio)) {
        let respuesta = `El precio de la consulta de ${servicio} es de Q${precio} (sin IVA).`

        // Si menciona IVA, incluir el cálculo
        if (lowerQuery.includes("iva") || lowerQuery.includes("impuesto")) {
          const iva = precio * 0.12
          const total = precio + iva
          respuesta += ` Con IVA (12%) sería Q${total.toFixed(2)}.`
        }

        return respuesta
      }
    }

    // Si pregunta por precios en general
    return (
      "**Precios de nuestras consultas (sin IVA):**\n\n" +
      "- Medicina general: Q150\n" +
      "- Pediatría: Q200\n" +
      "- Ginecología: Q250\n" +
      "- Cardiología: Q300\n" +
      "- Psicología: Q300\n" +
      "- Nutrición: Q200\n" +
      "- Dermatología: Q250\n\n" +
      "Para agendar una cita, puede llamar al 4644-9158 o usar nuestro formulario en línea."
    )
  }

  return null
}

// Función para manejar consultas de citas por número
const handleCitaQuery = (query: string): string | null => {
  // Buscar un número de 4 dígitos que podría ser un número de cita
  const match = query.match(/\b(\d{4})\b/)
  if (match && match[1]) {
    return `Para información sobre la cita #${match[1]}, por favor llame al 4644-9158 o visite la sección de Citas en nuestra página web.`
  }
  return null
}

// Función para manejar saludos
const handleGreeting = (query: string): string | null => {
  const greetings = ["hola", "buenos dias", "buenas tardes", "buenas noches", "saludos"]
  const lowerQuery = query.toLowerCase()

  for (const greeting of greetings) {
    if (lowerQuery.includes(greeting)) {
      return "¡Hola! Soy el asistente virtual del Centro Médico Familiar. ¿En qué puedo ayudarte hoy?"
    }
  }
  return null
}

export async function POST(request: Request) {
  try {
    const { query, conversationHistory } = await request.json()

    // Manejar consultas específicas primero

    // 1. Consultas de precios
    const priceResponse = handlePriceQuery(query)
    if (priceResponse) {
      return NextResponse.json({
        success: true,
        text: priceResponse,
        query,
      })
    }

    // 2. Consultas de citas por número
    const citaResponse = handleCitaQuery(query)
    if (citaResponse) {
      return NextResponse.json({
        success: true,
        text: citaResponse,
        query,
      })
    }

    // 3. Saludos
    const greetingResponse = handleGreeting(query)
    if (greetingResponse) {
      return NextResponse.json({
        success: true,
        text: greetingResponse,
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
    return NextResponse.json({
      success: true, // Cambiado a true para evitar errores en el cliente
      text: "Lo siento, estoy teniendo problemas para responder. Por favor, intente de nuevo o comuníquese al 4644-9158.",
      error: "Error interno del servidor",
    })
  }
}
