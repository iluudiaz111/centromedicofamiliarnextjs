import { NextResponse } from "next/server"
import { isGroqAvailable } from "@/lib/groq-config"

export async function GET() {
  try {
    const groqAvailable = await isGroqAvailable()

    return NextResponse.json({
      success: true,
      groqAvailable,
      apiKey: process.env.GROQ_API_KEY ? "Configurada" : "No configurada",
    })
  } catch (error) {
    console.error("Error al verificar el estado de Groq:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al verificar el estado de Groq",
      },
      { status: 500 },
    )
  }
}
