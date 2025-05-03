import { NextResponse } from "next/server"
import { generateText } from "ai"
import { getGroqDoctorModel } from "@/lib/groq-doctor-config"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

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

    // Obtener información adicional de la base de datos
    const supabase = createRouteHandlerClient({ cookies })

    // Obtener información de doctores
    const { data: doctoresData } = await supabase
      .from("doctores")
      .select("id, nombre, especialidad, horario, biografia")

    // Obtener información de servicios
    const { data: serviciosData } = await supabase.from("servicios").select("*")

    // Obtener información médica
    const { data: infoMedicaData } = await supabase.from("info_medica").select("*")

    // Construir el contexto de información
    let informacionContextual = ""

    if (doctoresData && doctoresData.length > 0) {
      informacionContextual += "INFORMACIÓN DE DOCTORES:\n"
      doctoresData.forEach((doctor) => {
        informacionContextual += `- Dr(a). ${doctor.nombre}: ${doctor.especialidad}${doctor.horario ? `, Horario: ${doctor.horario}` : ""}\n`
      })
      informacionContextual += "\n"
    }

    if (serviciosData && serviciosData.length > 0) {
      informacionContextual += "SERVICIOS DISPONIBLES:\n"
      serviciosData.forEach((servicio) => {
        informacionContextual += `- ${servicio.nombre}: ${servicio.descripcion_corta || ""}\n`
      })
      informacionContextual += "\n"
    }

    if (infoMedicaData && infoMedicaData.length > 0) {
      informacionContextual += "INFORMACIÓN MÉDICA RELEVANTE:\n"
      infoMedicaData.slice(0, 5).forEach((info) => {
        // Limitamos a 5 entradas para no sobrecargar
        informacionContextual += `- ${info.titulo}: ${info.descripcion_corta || ""}\n`
      })
    }

    // Construir el contexto de la conversación
    let contextoPrevio = ""
    if (conversationHistory && Array.isArray(conversationHistory)) {
      contextoPrevio = conversationHistory
        .slice(-3) // Solo usar los últimos 3 mensajes para mantener el contexto conciso
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

INSTRUCCIONES IMPORTANTES:
1. Proporciona respuestas BREVES y PUNTUALES (máximo 3 oraciones).
2. Usa lenguaje médico profesional pero claro.
3. Si no tienes información específica, indica brevemente que no tienes esos datos.
4. Evita explicaciones largas y divagaciones.
5. Prioriza información factual sobre opiniones.
6. Responde directamente a la pregunta sin introducciones innecesarias.

INFORMACIÓN CONTEXTUAL DEL CENTRO MÉDICO:
${informacionContextual}

CONTEXTO PREVIO DE LA CONVERSACIÓN:
${contextoPrevio}

CONSULTA ACTUAL:
${mensaje}

Recuerda: Sé BREVE, PRECISO y DIRECTO en tu respuesta.
`

    // Generar respuesta con el modelo
    const { text } = await generateText({
      model,
      prompt,
      maxTokens: 300, // Limitar la longitud de la respuesta
      temperature: 0.3, // Temperatura más baja para respuestas más precisas y menos creativas
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
