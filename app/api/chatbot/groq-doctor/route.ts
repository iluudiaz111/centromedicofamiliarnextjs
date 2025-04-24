import { NextResponse } from "next/server"
import { generateText } from "ai"
import { getGroqDoctorModel, isGroqDoctorAvailable } from "@/lib/groq-doctor-config"

// Respuesta de fallback simple para cuando Groq no está disponible
const getFallbackResponse = (mensaje: string): string => {
  // Respuestas básicas para mantener la funcionalidad mínima
  if (mensaje.toLowerCase().includes("hola") || mensaje.toLowerCase().includes("saludos")) {
    return "Hola, soy el asistente médico del Centro Médico Familiar. ¿En qué puedo ayudarle hoy, doctor?"
  }

  if (mensaje.toLowerCase().includes("citas")) {
    return "Para consultar sus citas, puede decir 'muestra mis citas de hoy' o 'cuáles son mis próximas citas'."
  }

  if (mensaje.toLowerCase().includes("paciente") || mensaje.toLowerCase().includes("pacientes")) {
    return "Puede consultar información de pacientes a través del sistema de gestión. ¿Necesita ayuda con algo más?"
  }

  // Respuesta genérica
  return "Lo siento, estamos experimentando problemas técnicos con el asistente. Por favor, utilice las funciones del panel para consultar información específica."
}

export async function POST(request: Request) {
  try {
    const { mensaje, contexto, conversationHistory, medicoNombre, medicoId } = await request.json()

    if (!mensaje) {
      return NextResponse.json({ success: false, error: "Se requiere un mensaje" }, { status: 400 })
    }

    // Verificar si Groq está disponible con un timeout corto
    let groqAvailable = false
    try {
      const availabilityPromise = isGroqDoctorAvailable()
      const timeoutPromise = new Promise<boolean>((resolve) => {
        setTimeout(() => resolve(false), 2000) // 2 segundos máximo para verificar
      })

      groqAvailable = await Promise.race([availabilityPromise, timeoutPromise])
    } catch (error) {
      console.error("Error al verificar disponibilidad de Groq para doctores:", error)
      groqAvailable = false
    }

    if (!groqAvailable) {
      console.log("Groq no está disponible para doctores, usando respuesta de fallback")
      return NextResponse.json({
        success: true,
        text: getFallbackResponse(mensaje),
        source: "fallback",
      })
    }

    const model = getGroqDoctorModel()
    if (!model) {
      console.log("No se pudo configurar el modelo de Groq para doctores, usando respuesta de fallback")
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
        .map((msg) => `${msg.role === "user" ? "Doctor" : "Asistente"}: ${msg.content}`)
        .join("\n\n")
    }

    // Sistema de prompt mejorado para respuestas concisas y manejo de contexto
    const sistemaPrompt = `
    ${
      contexto ||
      `
    Eres el asistente médico virtual del Centro Médico Familiar, específicamente para el Dr. ${
      medicoNombre || "médico"
    } (ID: ${medicoId || "desconocido"}).
    
    INSTRUCCIONES IMPORTANTES:
    1. Sé EXTREMADAMENTE CONCISO. Limita tus respuestas a 1-3 oraciones cortas.
    2. Mantén un tono profesional y médico.
    3. Identifícate como el asistente médico del Centro Médico Familiar.
    4. Evita explicaciones largas o detalles innecesarios.
    5. Proporciona información precisa y directa.
    6. Si te preguntan por citas específicas, sugiere usar comandos como "muestra mis citas de hoy" o "cuáles son mis próximas citas".
    7. Si te preguntan por pacientes específicos, sugiere consultar el expediente en el sistema.
    8. Recuerda que estás en el panel del doctor, no en el chat general para pacientes.
    
    INFORMACIÓN GENERAL:
    - El doctor puede consultar sus citas diciendo "muestra mis citas de hoy" o "cuáles son mis próximas citas"
    - El sistema permite filtrar citas por estado: pendientes, completadas, canceladas
    - El doctor puede ver información de pacientes a través del sistema de gestión
    
    Recuerda: Brevedad y precisión son tu prioridad.
    `
    }

    HISTORIAL DE CONVERSACIÓN RECIENTE:
    ${conversationContext}
    `

    // Generar respuesta con Groq con manejo de timeout
    try {
      const generatePromise = generateText({
        model,
        prompt: mensaje,
        system: sistemaPrompt,
        temperature: 0.7,
        maxTokens: 200, // Reducir el número máximo de tokens para forzar respuestas más cortas
      })

      // Establecer un timeout para la generación de texto
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Timeout al generar respuesta con Groq")), 10000) // 10 segundos
      })

      const { text } = (await Promise.race([generatePromise, timeoutPromise])) as { text: string }

      return NextResponse.json({
        success: true,
        text,
        source: "groq-doctor",
      })
    } catch (error) {
      console.error("Error al generar texto con Groq para doctores:", error)
      return NextResponse.json({
        success: true,
        text: getFallbackResponse(mensaje),
        source: "fallback",
      })
    }
  } catch (error) {
    console.error("Error en el endpoint de Groq para doctores:", error)
    return NextResponse.json({
      success: true,
      text: "Lo siento, estamos experimentando problemas técnicos. Por favor, utilice las funciones del panel para consultar información específica.",
      source: "error",
    })
  }
}
