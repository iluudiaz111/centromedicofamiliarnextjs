import { groq } from "@ai-sdk/groq"

// Verificar que la API key esté configurada
export const checkGroqConfig = () => {
  const apiKey = process.env.GROQ_API_KEY

  if (!apiKey) {
    console.error("GROQ_API_KEY no está configurada en las variables de entorno")
    return false
  }

  return true
}

// Obtener el modelo de Groq configurado
export const getGroqModel = () => {
  try {
    return groq("llama-3.1-8b-instant")
  } catch (error) {
    console.error("Error al configurar el modelo de Groq:", error)
    return null
  }
}
