import { NextResponse } from "next/server"
import { generateText } from "ai"
import { getGroqDoctorModel } from "@/lib/groq-doctor-config"

export const maxDuration = 30 // Aumentar el tiempo máximo de ejecución a 30 segundos

export async function POST(request: Request) {
  try {
    const { mensaje, medicoNombre, medicoId, conversationHistory } = await request.json()

    // Verificar que tenemos un mensaje
    if (!mensaje) {
      return NextResponse.json({ success: false, error: "No se proporcionó un mensaje" }, { status: 400 })
    }

    // Obtener el modelo de Groq para doctores
    const model = getGroqDoctorModel()
    if (!model) {
      return NextResponse.json(
        { success: false, error: "No se pudo inicializar el modelo de IA para doctores" },
        { status: 500 },
      )
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

    // Construir el prompt para el modelo
    const prompt = `
Eres un asistente virtual especializado para médicos del Centro Médico Familiar. 
${medicoNombre ? `Estás hablando con el/la Dr(a). ${medicoNombre}.` : ""}

CONTEXTO PREVIO DE LA CONVERSACIÓN:
${contextoPrevio}

CONSULTA ACTUAL:
${mensaje}

Responde de manera profesional, clara y concisa. Proporciona información médica precisa cuando sea posible, pero recuerda que no puedes diagnosticar ni recetar medicamentos. Sugiere al médico que consulte fuentes oficiales o literatura médica actualizada para información más detallada.
`

    // Generar respuesta con el modelo
    const { text } = await generateText({
      model,
      prompt,
      maxTokens: 1000,
    })

    return NextResponse.json({ success: true, text })
  } catch (error) {
    console.error("Error en el endpoint de groq-doctor:", error)
    return NextResponse.json(
      { success: false, error: "Error al procesar la solicitud con el modelo de IA" },
      { status: 500 },
    )
  }
}
