import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const doctorId = searchParams.get("doctorId")

    if (!doctorId) {
      return NextResponse.json({ success: false, error: "Se requiere el ID del doctor" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Obtener las citas del doctor
    const { data, error } = await supabase
      .from("citas")
      .select(`
        id,
        fecha,
        hora,
        motivo,
        estado,
        paciente_id,
        pacientes (
          id,
          nombre,
          telefono
        )
      `)
      .eq("doctor_id", doctorId)
      .order("fecha", { ascending: true })
      .order("hora", { ascending: true })

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Obtener la fecha actual
    const hoy = new Date().toISOString().split("T")[0]

    // Filtrar citas por fecha
    const citasHoy = data.filter((cita: any) => cita.fecha === hoy)
    const citasPendientes = data.filter((cita: any) => cita.estado === "pendiente")
    const citasCompletadas = data.filter((cita: any) => cita.estado === "completada")

    return NextResponse.json({
      success: true,
      data: {
        total: data.length,
        hoy: citasHoy.length,
        pendientes: citasPendientes.length,
        completadas: citasCompletadas.length,
        citas: data,
      },
    })
  } catch (error) {
    console.error("Error al obtener estado de citas:", error)
    return NextResponse.json({ success: false, error: "Error al procesar la solicitud" }, { status: 500 })
  }
}
