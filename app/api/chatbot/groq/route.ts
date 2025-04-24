import { NextResponse } from "next/server"
import { generateText } from "ai"
import { getGroqModel, isGroqAvailable } from "@/lib/groq-config"

export async function POST(request: Request) {
  try {
    // Verificar si Groq está disponible
    const groqAvailable = await isGroqAvailable()
    if (!groqAvailable) {
      return NextResponse.json(
        {
          success: false,
          error: "El servicio de Groq no está disponible en este momento",
        },
        { status: 503 },
      )
    }

    const { mensaje, contexto, conversationHistory } = await request.json()

    if (!mensaje) {
      return NextResponse.json({ success: false, error: "Se requiere un mensaje" }, { status: 400 })
    }

    const model = getGroqModel()
    if (!model) {
      return NextResponse.json({ success: false, error: "No se pudo configurar el modelo de Groq" }, { status: 500 })
    }

    // Preparar el historial de conversación para el contexto
    let conversationContext = ""
    if (conversationHistory && Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      conversationContext = conversationHistory
        .map((msg) => `${msg.role === "user" ? "Usuario" : "Asistente"}: ${msg.content}`)
        .join("\n\n")
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
    }

    HISTORIAL DE CONVERSACIÓN RECIENTE:
    ${conversationContext}
    `

    // Generar respuesta con Groq
    const { text } = await generateText({
      model,
      prompt: mensaje,
      system: sistemaPrompt,
      temperature: 0.7,
      maxTokens: 200, // Reducir el número máximo de tokens para forzar respuestas más cortas
    })

    return NextResponse.json({
      success: true,
      text,
    })
  } catch (error) {
    console.error("Error en el endpoint de Groq:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al procesar la solicitud con Groq",
      },
      { status: 500 },
    )
  }
}
