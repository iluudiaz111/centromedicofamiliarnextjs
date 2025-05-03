import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { numeroCita } = await request.json()

    if (!numeroCita) {
      return NextResponse.json({ success: false, error: "Se requiere un número de cita" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Consultar la cita por número
    const { data: citas, error } = await supabase
      .from("citas")
      .select(`
        id,
        fecha,
        hora,
        motivo,
        estado,
        numero_cita,
        pacientes (
          id,
          nombre,
          telefono,
          email
        ),
        doctores (
          id,
          nombre,
          especialidad
        )
      `)
      .eq("numero_cita", numeroCita)
      .limit(1)

    if (error) {
      return NextResponse.json({ success: false, error: "Error al consultar la base de datos" }, { status: 500 })
    }

    if (!citas || citas.length === 0) {
      return NextResponse.json(
        { success: false, error: `No se encontró ninguna cita con el número ${numeroCita}` },
        { status: 404 },
      )
    }

    // Formatear la respuesta
    const cita = citas[0]

    const citaFormateada = {
      numeroCita: cita.numero_cita,
      fecha: cita.fecha,
      hora: cita.hora,
      motivo: cita.motivo,
      estado: cita.estado,
      paciente: {
        nombre: cita.pacientes?.nombre || "No disponible",
        telefono: cita.pacientes?.telefono || "No disponible",
        email: cita.pacientes?.email || "No disponible",
      },
      doctor: {
        nombre: cita.doctores?.nombre || "No disponible",
        especialidad: cita.doctores?.especialidad || "No disponible",
      },
    }

    return NextResponse.json({
      success: true,
      data: citaFormateada,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Error al procesar la búsqueda de cita" }, { status: 500 })
  }
}
