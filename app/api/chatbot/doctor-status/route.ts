import { NextResponse } from "next/server"
import { isGroqDoctorAvailable } from "@/lib/groq-doctor-config"

export async function GET() {
  try {
    const groqDoctorAvailable = await isGroqDoctorAvailable()

    return NextResponse.json({
      success: true,
      groqDoctorAvailable,
      apiKey: process.env.GROQ_DOCTOR_API_KEY ? "Configurada" : "No configurada",
      fallbackApiKey: process.env.GROQ_API_KEY ? "Configurada (fallback)" : "No configurada",
    })
  } catch (error) {
    console.error("Error al verificar el estado de Groq para doctores:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al verificar el estado de Groq para doctores",
      },
      { status: 500 },
    )
  }
}
