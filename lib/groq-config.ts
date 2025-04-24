import { groq } from "@ai-sdk/groq"

// Singleton para el modelo de Groq
let groqModel: ReturnType<typeof groq> | null = null

// Asegurarse de que la configuración de Groq para el chatbot general esté correcta
export function getGroqModel() {
  // Si ya tenemos una instancia, la devolvemos
  if (groqModel) return groqModel

  const apiKey = process.env.GROQ_API_KEY

  if (!apiKey) {
    console.error("GROQ_API_KEY no está configurada en las variables de entorno")
    return null
  }

  try {
    // Crear una nueva instancia del modelo
    groqModel = groq("llama-3.1-8b-instant", { apiKey })
    return groqModel
  } catch (error) {
    console.error("Error al configurar el modelo de Groq:", error)
    return null
  }
}

// Función para verificar si Groq está disponible
export async function isGroqAvailable(): Promise<boolean> {
  try {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      console.error("GROQ_API_KEY no está configurada")
      return false
    }

    // Usamos un timeout para evitar esperas largas
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 segundos de timeout

    // Intentar una solicitud simple para verificar la conexión
    const response = await fetch("https://api.groq.com/openai/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
    }).catch((err) => {
      console.error("Error en la verificación de Groq:", err.message)
      return null
    })

    clearTimeout(timeoutId)

    return !!response && response.ok
  } catch (error) {
    console.error("Error al verificar disponibilidad de Groq:", error)
    return false
  }
}
