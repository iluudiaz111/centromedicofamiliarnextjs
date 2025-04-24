import { groq } from "@ai-sdk/groq"

// Singleton para el modelo de Groq
let groqModel: ReturnType<typeof groq> | null = null

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
    const model = getGroqModel()
    if (!model) return false

    // Intentar una solicitud simple para verificar la conexión
    const response = await fetch("https://api.groq.com/openai/v1/models", {
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY || ""}`,
      },
    })

    return response.ok
  } catch (error) {
    console.error("Error al verificar disponibilidad de Groq:", error)
    return false
  }
}
