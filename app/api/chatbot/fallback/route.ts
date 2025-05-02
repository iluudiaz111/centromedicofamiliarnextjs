import { NextResponse } from "next/server"
import { generateText } from "ai"
import { getGroqModel } from "@/lib/groq-config"

export const maxDuration = 30 // Aumentar el tiempo máximo de ejecución a 30 segundos

export async function POST(request: Request) {
  try {
    const { query, conversationHistory, medicoNombre, medicoId } = await request.json()

    // Verificar que tenemos una consulta
    if (!query) {
      return NextResponse.json({ success: false, error: "No se proporcionó una consulta" }, { status: 400 })
    }

    // Obtener el modelo de Groq
    const model = getGroqModel()
    if (!model) {
      return NextResponse.json({ success: false, error: "No se pudo inicializar el modelo de IA" }, { status: 500 })
    }

    // Construir el contexto de la conversación
    let contextoPrevio = ""
    if (conversationHistory && Array.isArray(conversationHistory)) {
      contextoPrevio = conversationHistory
        .map(
          (msg: { role: string; content: string }) =>
            `${msg.role === "user" ? "Usuario" : "Asistente"}: ${msg.content}`,
        )
        .join("\n\n")
    }

    // Determinar si estamos en el contexto de un médico
    const esContextoMedico = medicoNombre && medicoId

    // Construir el prompt para el modelo
    let prompt = ""

    if (esContextoMedico) {
      prompt = `
Eres un asistente virtual especializado para médicos del Centro Médico Familiar. 
Estás hablando con el/la Dr(a). ${medicoNombre}.

CONTEXTO PREVIO DE LA CONVERSACIÓN:
${contextoPrevio}

CONSULTA ACTUAL:
${query}

Responde de manera profesional, clara y concisa. Proporciona información médica precisa cuando sea posible, pero recuerda que no puedes diagnosticar ni recetar medicamentos. Sugiere al médico que consulte fuentes oficiales o literatura médica actualizada para información más detallada.
`
    } else {
      prompt = `
Eres un asistente virtual del Centro Médico Familiar, una clínica médica en Guatemala.
Tu objetivo es ayudar a los pacientes respondiendo sus preguntas sobre servicios, horarios, ubicación, precios y otra información general.

CONTEXTO PREVIO DE LA CONVERSACIÓN:
${contextoPrevio}

CONSULTA ACTUAL:
${query}

Responde de manera amigable, clara y concisa. Si no tienes la información exacta, ofrece alternativas o sugiere contactar directamente a la clínica al número 4644-9158.
`
    }

    // Generar respuesta con el modelo
    const { text } = await generateText({
      model,
      prompt,
      maxTokens: 1000,
    })

    return NextResponse.json({ success: true, text })
  } catch (error) {
    console.error("Error en el endpoint de fallback:", error)
    return NextResponse.json(
      { success: false, error: "Error al procesar la solicitud con el modelo de IA" },
      { status: 500 },
    )
  }
}
