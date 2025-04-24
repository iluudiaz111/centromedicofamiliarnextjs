import { NextResponse } from "next/server"
import { isGroqAvailable } from "@/lib/groq-config"

export async function GET() {
  try {
    const groqAvailable = await isGroqAvailable()

    return NextResponse.json({
      success: true,
      services: {
        groq: {
          available: groqAvailable,
          status: groqAvailable ? "online" : "offline",
        },
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error al verificar el estado de los servicios:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al verificar el estado de los servicios",
      },
      { status: 500 },
    )
  }
}
