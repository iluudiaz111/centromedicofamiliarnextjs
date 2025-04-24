import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { numeroCita } = await request.json()

    if (!numeroCita) {
      return NextResponse.json({ success: false, error: "Se requiere un número de cita" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Modificar la consulta para manejar correctamente cuando no se encuentra una cita
    // Reemplazar:
    // Con:
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

    if (error) {
      console.error("Error al buscar cita:", error)
      return NextResponse.json(
        { success: false, error: "Error al buscar la cita en la base de datos" },
        { status: 500 },
      )
    }

    if (!citas || citas.length === 0) {
      return NextResponse.json({ success: false, error: "No se encontró ninguna cita con ese número" }, { status: 404 })
    }

    const cita = citas[0]

    // Formatear la respuesta
    const citaFormateada = {
      numeroCita: cita.numero_cita,
      fecha: cita.fecha,
      hora: cita.hora,
      motivo: cita.motivo,
      estado: cita.estado,
      paciente: {
        nombre: cita.pacientes.nombre,
        telefono: cita.pacientes.telefono,
        email: cita.pacientes.email,
      },
      doctor: {
        nombre: cita.doctores.nombre,
        especialidad: cita.doctores.especialidad,
      },
    }

    return NextResponse.json({
      success: true,
      data: citaFormateada,
    })
  } catch (error) {
    console.error("Error en la búsqueda de cita:", error)
    return NextResponse.json({ success: false, error: "Error al procesar la búsqueda de cita" }, { status: 500 })
  }
}
