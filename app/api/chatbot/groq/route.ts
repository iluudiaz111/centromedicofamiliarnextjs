import { NextResponse } from "next/server"
import { generateText } from "ai"
import { getGroqModel, isGroqAvailable } from "@/lib/groq-config"
import { createServerSupabaseClient } from "@/lib/supabase"

// Función para obtener información contextual de la base de datos
async function obtenerContextoBaseDatos(mensaje: string): Promise<string> {
  try {
    const supabase = createServerSupabaseClient()
    let contextoAdicional = ""

    // Normalizar mensaje
    const mensajeLimpio = mensaje
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()

    // Buscar palabras clave
    const palabrasClave = mensajeLimpio
      .split(/\s+/)
      .filter((palabra) => palabra.length >= 3)
      .map((palabra) => palabra.replace(/[^\w]/g, ""))

    if (palabrasClave.length === 0) {
      return ""
    }

    // Verificar si es una pregunta sobre información general
    const patronesInfoGeneral = [
      "horario",
      "ubicacion",
      "ubicación",
      "dirección",
      "direccion",
      "teléfono",
      "telefono",
      "contacto",
      "documentos",
      "requisitos",
      "pago",
      "especialidades",
      "precio",
      "costo",
      "disponibilidad",
    ]

    const esInfoGeneral = patronesInfoGeneral.some((patron) => mensajeLimpio.includes(patron))

    if (esInfoGeneral) {
      try {
        // Determinar la categoría de información
        let categoria = ""

        if (mensajeLimpio.includes("horario")) {
          categoria = "horario"
        } else if (
          mensajeLimpio.includes("ubicacion") ||
          mensajeLimpio.includes("ubicación") ||
          mensajeLimpio.includes("direccion") ||
          mensajeLimpio.includes("dirección")
        ) {
          categoria = "ubicacion"
        } else if (
          mensajeLimpio.includes("telefono") ||
          mensajeLimpio.includes("teléfono") ||
          mensajeLimpio.includes("contacto")
        ) {
          categoria = "contacto"
        } else if (mensajeLimpio.includes("documento") || mensajeLimpio.includes("requisito")) {
          categoria = "documentos_registro"
        } else if (mensajeLimpio.includes("pago")) {
          categoria = "metodos_pago"
        } else if (mensajeLimpio.includes("especialidad")) {
          categoria = "especialidades"
        } else if (mensajeLimpio.includes("precio") || mensajeLimpio.includes("costo")) {
          categoria = "precios"
        } else if (mensajeLimpio.includes("disponibilidad")) {
          categoria = "disponibilidad"
        }

        if (categoria) {
          const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/api/chatbot/info-general`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY || ""}`,
            },
            body: JSON.stringify({ categoria }),
          })

          if (response.ok) {
            const data = await response.json()

            if (data.success) {
              contextoAdicional += "INFORMACIÓN GENERAL DEL CENTRO MÉDICO:\n"

              // Formatear según la categoría
              switch (categoria) {
                case "horario":
                  contextoAdicional += `Horario: ${data.data.completo}\n`
                  break
                case "ubicacion":
                  contextoAdicional += `Ubicación: ${data.data.direccion}\n`
                  contextoAdicional += `Referencia: ${data.data.referencia}\n`
                  break
                case "contacto":
                  contextoAdicional += `Teléfono: ${data.data.telefono}\n`
                  contextoAdicional += `Email: ${data.data.email}\n`
                  contextoAdicional += `WhatsApp: ${data.data.whatsapp}\n`
                  break
                case "documentos_registro":
                  contextoAdicional += "Documentos necesarios para registro:\n"
                  data.data.forEach((doc: string, index: number) => {
                    contextoAdicional += `- ${doc}\n`
                  })
                  break
                case "metodos_pago":
                  contextoAdicional += "Métodos de pago aceptados:\n"
                  data.data.forEach((metodo: string, index: number) => {
                    contextoAdicional += `- ${metodo}\n`
                  })
                  break
                case "especialidades":
                  contextoAdicional += "Especialidades disponibles:\n"
                  data.data.especialidades.forEach((esp: string, index: number) => {
                    contextoAdicional += `- ${esp}\n`
                  })
                  break
                case "precios":
                  contextoAdicional += "Precios de servicios:\n"
                  data.data.servicios.slice(0, 5).forEach((servicio: any) => {
                    contextoAdicional += `- ${servicio.nombre}: Q${servicio.precio}\n`
                  })
                  break
                case "disponibilidad":
                  contextoAdicional += `Disponibilidad hoy: ${data.data.disponibilidad_hoy} espacios\n`
                  contextoAdicional += `Disponibilidad mañana: ${data.data.disponibilidad_manana} espacios\n`
                  break
              }
            }
          }
        }
      } catch (error) {
        console.error("Error al obtener información general:", error)
      }
    }

    // Buscar en servicios
    if (
      mensajeLimpio.includes("servicio") ||
      mensajeLimpio.includes("precio") ||
      mensajeLimpio.includes("costo") ||
      mensajeLimpio.includes("cuanto cuesta") ||
      mensajeLimpio.includes("cuánto cuesta")
    ) {
      const condicionesServicios = palabrasClave
        .map((palabra) => {
          return `(nombre.ilike.%${palabra}% or descripcion.ilike.%${palabra}%)`
        })
        .join(" or ")

      const { data: servicios, error: serviciosError } = await supabase
        .from("servicios")
        .select("nombre, descripcion, precio")
        .or(condicionesServicios)
        .limit(5)

      if (!serviciosError && servicios && servicios.length > 0) {
        contextoAdicional += "INFORMACIÓN DE SERVICIOS:\n"
        servicios.forEach((servicio) => {
          contextoAdicional += `- ${servicio.nombre}: Q${servicio.precio} - ${servicio.descripcion}\n`
        })
        contextoAdicional += "\n"
      }
    }

    // Buscar en doctores
    if (
      mensajeLimpio.includes("doctor") ||
      mensajeLimpio.includes("medico") ||
      mensajeLimpio.includes("médico") ||
      mensajeLimpio.includes("especialista") ||
      mensajeLimpio.includes("especialidad")
    ) {
      const condicionesDoctores = palabrasClave
        .map((palabra) => {
          return `(nombre.ilike.%${palabra}% or especialidad.ilike.%${palabra}%)`
        })
        .join(" or ")

      const { data: doctores, error: doctoresError } = await supabase
        .from("doctores")
        .select("nombre, especialidad")
        .or(condicionesDoctores)
        .limit(5)

      if (!doctoresError && doctores && doctores.length > 0) {
        contextoAdicional += "INFORMACIÓN DE ESPECIALISTAS:\n"
        doctores.forEach((doctor) => {
          contextoAdicional += `- Dr(a). ${doctor.nombre} - ${doctor.especialidad}\n`
        })
        contextoAdicional += "\n"
      }
    }

    // Buscar en información médica
    const condicionesInfoMedica = palabrasClave
      .map((palabra) => {
        return `(titulo.ilike.%${palabra}% or contenido.ilike.%${palabra}%)`
      })
      .join(" or ")

    const { data: infoMedica, error: infoMedicaError } = await supabase
      .from("info_medica")
      .select("titulo, contenido")
      .or(condicionesInfoMedica)
      .limit(2)

    if (!infoMedicaError && infoMedica && infoMedica.length > 0) {
      contextoAdicional += "INFORMACIÓN MÉDICA RELEVANTE:\n"
      infoMedica.forEach((info) => {
        // Limitar el contenido a 200 caracteres para no sobrecargar el contexto
        const contenidoResumido =
          info.contenido.length > 200 ? info.contenido.substring(0, 200) + "..." : info.contenido
        contextoAdicional += `- ${info.titulo}: ${contenidoResumido}\n`
      })
    }

    // Verificar si es una pregunta sobre estadísticas
    const patronesEstadisticas = [
      "cuantos",
      "cuántos",
      "cuantas",
      "cuántas",
      "promedio",
      "estadisticas",
      "estadísticas",
      "total de",
      "cantidad de",
    ]

    const esEstadistica = patronesEstadisticas.some((patron) => mensajeLimpio.includes(patron))

    if (esEstadistica) {
      // Determinar el tipo de estadística
      let tipo = ""

      if (
        mensajeLimpio.includes("doctor") ||
        mensajeLimpio.includes("médico") ||
        mensajeLimpio.includes("especialista")
      ) {
        tipo = "doctores"
      } else if (mensajeLimpio.includes("cita") || mensajeLimpio.includes("consulta")) {
        tipo = "citas"
      } else if (mensajeLimpio.includes("servicio") || mensajeLimpio.includes("precio")) {
        tipo = "servicios"
      }

      if (tipo) {
        try {
          const response = await fetch(`/api/chatbot/estadisticas`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              tipo,
              filtros: { esDoctor: "false" }, // Acceso limitado para chatbot general
            }),
          })

          if (response.ok) {
            const data = await response.json()

            if (data.success) {
              contextoAdicional += "ESTADÍSTICAS DEL CENTRO MÉDICO:\n"

              switch (tipo) {
                case "doctores":
                  contextoAdicional += `Total de médicos: ${data.data.total}\n`
                  contextoAdicional += "Distribución por especialidad:\n"
                  Object.entries(data.data.porEspecialidad).forEach(([especialidad, cantidad]: [string, any]) => {
                    contextoAdicional += `- ${especialidad}: ${cantidad} médicos\n`
                  })
                  break

                case "citas":
                  contextoAdicional += `Total de citas: ${data.data.total}\n`
                  contextoAdicional += `Promedio de citas por día: ${data.data.promedioPorDia}\n`
                  contextoAdicional += "Distribución por estado:\n"
                  Object.entries(data.data.porEstado).forEach(([estado, cantidad]: [string, any]) => {
                    contextoAdicional += `- ${estado}: ${cantidad} citas\n`
                  })
                  break

                case "servicios":
                  contextoAdicional += `Total de servicios: ${data.data.total}\n`
                  contextoAdicional += `Precio promedio: Q${data.data.precioPromedio}\n`
                  break
              }
            }
          }
        } catch (error) {
          console.error("Error al obtener estadísticas:", error)
        }
      }
    }

    return contextoAdicional
  } catch (error) {
    console.error("Error al obtener contexto de la base de datos:", error)
    return ""
  }
}

// Respuesta de fallback simple para cuando Groq no está disponible
const getFallbackResponse = (mensaje: string): string => {
  // Respuestas básicas para mantener la funcionalidad mínima
  if (mensaje.toLowerCase().includes("hola") || mensaje.toLowerCase().includes("saludos")) {
    return "Hola, soy la asistente virtual del Centro Médico Familiar. ¿En qué puedo ayudarte hoy?"
  }

  if (mensaje.toLowerCase().includes("horario")) {
    return "Nuestro horario es de lunes a viernes de 8:00 a 18:00 y sábados de 8:00 a 13:00."
  }

  if (mensaje.toLowerCase().includes("ubicación") || mensaje.toLowerCase().includes("dirección")) {
    return "Estamos ubicados en 2 av. 5-08 zona 3 San Juan Sacatepéquez."
  }

  if (mensaje.toLowerCase().includes("teléfono") || mensaje.toLowerCase().includes("contacto")) {
    return "Puede contactarnos al teléfono 4644-9158."
  }

  // Respuestas específicas para preguntas del Nivel 1
  if (
    mensaje.toLowerCase().includes("especialidades") ||
    (mensaje.toLowerCase().includes("qué") && mensaje.toLowerCase().includes("especialidades")) ||
    (mensaje.toLowerCase().includes("que") && mensaje.toLowerCase().includes("especialidades"))
  ) {
    return "Ofrecemos las siguientes especialidades: medicina general, pediatría, ginecología, cardiología, psicología, nutrición y dermatología. Para más información, llame al 4644-9158."
  }

  if (mensaje.toLowerCase().includes("agendar") && mensaje.toLowerCase().includes("cita")) {
    return "Para agendar una cita, puede llamar al 4644-9158 o utilizar nuestro formulario en línea en la sección 'Agendar Cita'. Necesitará proporcionar sus datos personales y el motivo de la consulta."
  }

  if (mensaje.toLowerCase().includes("documentos") || mensaje.toLowerCase().includes("registrarme")) {
    return "Para registrarse como paciente, necesita presentar: DPI, comprobante de domicilio y tarjeta de seguro médico (si aplica)."
  }

  if (
    (mensaje.toLowerCase().includes("métodos") && mensaje.toLowerCase().includes("pago")) ||
    (mensaje.toLowerCase().includes("metodos") && mensaje.toLowerCase().includes("pago"))
  ) {
    return "Aceptamos efectivo, tarjetas de crédito/débito, cheques, transferencias bancarias y seguros médicos afiliados."
  }

  if (mensaje.toLowerCase().includes("disponibilidad") && mensaje.toLowerCase().includes("cita")) {
    const hoy = new Date()
    return `Actualmente tenemos disponibilidad para citas. Para verificar horarios específicos, por favor llame al 4644-9158 o consulte nuestro sistema de citas en línea.`
  }

  // Respuestas específicas para preguntas sobre precios de citas
  if (
    mensaje.toLowerCase().includes("precio") ||
    mensaje.toLowerCase().includes("costo") ||
    mensaje.toLowerCase().includes("cuanto cuesta")
  ) {
    if (mensaje.toLowerCase().includes("medicina general")) {
      return "El precio de la consulta de medicina general es de Q150."
    }
    if (mensaje.toLowerCase().includes("pediatría") || mensaje.toLowerCase().includes("pediatria")) {
      return "El precio de la consulta de pediatría es de Q200."
    }
    if (mensaje.toLowerCase().includes("ginecología") || mensaje.toLowerCase().includes("ginecologia")) {
      return "El precio de la consulta de ginecología es de Q250."
    }
    if (mensaje.toLowerCase().includes("cardiología") || mensaje.toLowerCase().includes("cardiologia")) {
      return "El precio de la consulta de cardiología es de Q300."
    }
    if (mensaje.toLowerCase().includes("psicología") || mensaje.toLowerCase().includes("psicologia")) {
      return "El precio de la consulta de psicología es de Q300."
    }

    // Si pregunta por varias especialidades
    if (
      mensaje.toLowerCase().includes("cita") &&
      (mensaje.toLowerCase().includes("especialidades") || mensaje.match(/citas|consultas|precios/i))
    ) {
      return (
        "**Precios de nuestras consultas:**\n\n" +
        "- Medicina general: Q150\n" +
        "- Pediatría: Q200\n" +
        "- Ginecología: Q250\n" +
        "- Cardiología: Q300\n" +
        "- Psicología: Q300\n\n" +
        "Estos precios no incluyen IVA. Para agendar una cita, puede llamar al 4644-9158 o usar nuestro formulario en línea."
      )
    }
  }

  if (mensaje.toLowerCase().includes("cita")) {
    const numeroCita = mensaje.match(/\d{4}/)?.[0]
    if (numeroCita) {
      return `Para información sobre la cita ${numeroCita}, por favor llame al 4644-9158 o visite la sección de Citas en nuestra página web.`
    }
    return "Para agendar una cita, puede llamar al 4644-9158 o utilizar nuestro formulario en línea en la sección 'Agendar Cita'."
  }

  // Respuesta genérica
  return "Lo siento, estamos experimentando problemas técnicos. Por favor, contacte directamente al Centro Médico al 4644-9158 para asistencia."
}

export async function POST(request: Request) {
  try {
    const { mensaje, contexto, conversationHistory, esDoctor } = await request.json()

    if (!mensaje) {
      return NextResponse.json({ success: false, error: "Se requiere un mensaje" }, { status: 400 })
    }

    // Obtener contexto adicional de la base de datos
    const contextoBaseDatos = await obtenerContextoBaseDatos(mensaje)

    // Verificar si Groq está disponible con un timeout corto
    let groqAvailable = false
    try {
      const availabilityPromise = isGroqAvailable()
      const timeoutPromise = new Promise<boolean>((resolve) => {
        setTimeout(() => resolve(false), 2000) // 2 segundos máximo para verificar
      })

      groqAvailable = await Promise.race([availabilityPromise, timeoutPromise])
    } catch (error) {
      console.error("Error al verificar disponibilidad de Groq:", error)
      groqAvailable = false
    }

    if (!groqAvailable) {
      console.log("Groq no está disponible, usando respuesta de fallback")
      return NextResponse.json({
        success: true,
        text: getFallbackResponse(mensaje),
        source: "fallback",
      })
    }

    const model = getGroqModel()
    if (!model) {
      console.log("No se pudo configurar el modelo de Groq, usando respuesta de fallback")
      return NextResponse.json({
        success: true,
        text: getFallbackResponse(mensaje),
        source: "fallback",
      })
    }

    // Preparar el historial de conversación para el contexto
    let conversationContext = ""
    if (conversationHistory && Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      conversationContext = conversationHistory
        .map((msg) => `${msg.role === "user" ? "Usuario" : "Asistente"}: ${msg.content}`)
        .join("\n\n")
    }

    // Verificar si hay un contexto específico para la pregunta actual
    const contextoEspecifico = ""
    try {
      const contextResponse = await fetch("/api/chatbot/context-handler", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mensajeActual: mensaje,
          mensajesAnteriores: conversationHistory,
          esDoctor: esDoctor || false,
        }),
      })

      if (contextResponse.ok) {
        const contextData = await contextResponse.json()
        if (contextData.success && contextData.requiereContexto && contextData.respuesta) {
          // Si hay una respuesta específica del manejador de contexto, usarla directamente
          return NextResponse.json({
            success: true,
            text: contextData.respuesta,
            source: "context-handler",
          })
        }
      }
    } catch (error) {
      console.error("Error al consultar el manejador de contexto:", error)
      // Continuar con el flujo normal si hay error
    }

    // Sistema de prompt mejorado para respuestas concisas y manejo de contexto
    const sistemaPrompt = `
    ${
      contexto ||
      `
    Eres la asistente virtual del Centro Médico Familiar en San Juan Sacatepéquez, Guatemala.
    
    INSTRUCCIONES IMPORTANTES:
    1. Sé EXTREMADAMENTE CONCISO. Limita tus respuestas a 1-3 oraciones cortas.
    2. Mantén un tono amable y profesional.
    3. Identifícate como la IA del Centro Médico Familiar.
    4. Evita explicaciones largas o detalles innecesarios.
    5. Proporciona información precisa y directa.
    6. Si no conoces la respuesta, sugiere contactar al centro al 4644-9158.
    7. Cuando menciones precios, usa quetzales (Q) y SIEMPRE especifica claramente si el precio incluye o no IVA.
    8. Cuando menciones precios, usa este formato: "Servicio: Q000" para facilitar la extracción de información.
    9. Si te preguntan por un total o suma de precios mencionados anteriormente, CALCULA el total y muestra el desglose.
    10. Mantén el contexto de la conversación y recuerda información previa relevante.
    
    INFORMACIÓN GENERAL:
    - Dirección: 2 av. 5-08 zona 3 San Juan Sacatepéquez
    - Teléfono: 4644-9158
    - Horario: Lunes a Viernes 8:00-18:00, Sábados 8:00-13:00
    - Especialidades: medicina general, pediatría, cardiología, ginecología, nutrición, dermatología y psicología
    - Métodos de pago: efectivo, tarjetas, cheques, transferencias y seguros médicos
    
    PRECIOS DE CONSULTAS (sin IVA):
    - Medicina general: Q150
    - Pediatría: Q200
    - Ginecología: Q250
    - Cardiología: Q300
    - Psicología: Q300
    - Nutrición: Q200
    - Dermatología: Q250
    
    Cuando te pregunten por precios, SIEMPRE especifica si incluyen o no IVA.
    Si te preguntan por varios precios, preséntalos en formato de lista con guiones.
    Si te preguntan por un total con IVA, calcula el IVA (12%) y muestra el desglose completo.
    
    CONTEXTO ADICIONAL DE LA BASE DE DATOS:
    ${contextoBaseDatos}
    
    Recuerda: Brevedad y precisión son tu prioridad.
    `
    }

    HISTORIAL DE CONVERSACIÓN RECIENTE:
    ${conversationContext}
    `

    // Generar respuesta con Groq con manejo de timeout
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 segundos de timeout

      const { text } = await generateText({
        model,
        prompt: mensaje,
        system: sistemaPrompt,
        temperature: 0.7,
        maxTokens: 300, // Aumentado para permitir respuestas más detalladas con precios
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      return NextResponse.json({
        success: true,
        text,
        source: "groq",
      })
    } catch (error) {
      console.error("Error al generar texto con Groq:", error)
      return NextResponse.json({
        success: true,
        text: getFallbackResponse(mensaje),
        source: "fallback",
      })
    }
  } catch (error) {
    console.error("Error en el endpoint de Groq:", error)
    return NextResponse.json({
      success: true,
      text: "Lo siento, estamos experimentando problemas técnicos. Por favor, contacte directamente al Centro Médico al 4644-9158 para asistencia.",
      source: "error",
    })
  }
}
