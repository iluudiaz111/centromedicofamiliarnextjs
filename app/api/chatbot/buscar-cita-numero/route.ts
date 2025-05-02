import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { numeroCita, nombrePaciente, doctorNombre } = await request.json()

    if (!numeroCita) {
      return NextResponse.json({ success: false, error: "Se requiere un número de cita" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Consulta base para buscar citas por número
    let query = supabase
      .from("citas")
      .select(`
        id,
        fecha,
        hora,
        motivo,
        estado,
        numero_cita,
        paciente:paciente_id (
          id,
          nombre,
          telefono,
          email
        ),
        doctor:doctor_id (
          id,
          nombre,
          especialidad
        )
      `)
      .eq("numero_cita", numeroCita)

    // Filtrar por nombre de paciente si se proporciona
    if (nombrePaciente) {
      // Buscar pacientes con nombre similar
      const { data: pacientes } = await supabase.from("pacientes").select("id").ilike("nombre", `%${nombrePaciente}%`)

      if (pacientes && pacientes.length > 0) {
        const pacienteIds = pacientes.map((p) => p.id)
        query = query.in("paciente_id", pacienteIds)
      }
    }

    // Filtrar por nombre de doctor si se proporciona
    if (doctorNombre) {
      // Buscar doctores con nombre similar
      const { data: doctores } = await supabase.from("doctores").select("id").ilike("nombre", `%${doctorNombre}%`)

      if (doctores && doctores.length > 0) {
        const doctorIds = doctores.map((d) => d.id)
        query = query.in("doctor_id", doctorIds)
      }
    }

    // Ejecutar la consulta
    const { data: citas, error } = await query

    if (error) {
      console.error("Error al consultar citas:", error)
      return NextResponse.json({ success: false, error: "Error al consultar la base de datos" }, { status: 500 })
    }

    if (!citas || citas.length === 0) {
      return NextResponse.json(
        { success: false, error: `No se encontró ninguna cita con el número ${numeroCita}` },
        { status: 404 },
      )
    }

    // Si hay múltiples citas, devolver información básica
    if (citas.length > 1) {
      return NextResponse.json({
        success: true,
        data: {
          multiple: true,
          length: citas.length,
          message: "Se encontraron múltiples citas con ese número",
        },
      })
    }

    // Formatear la fecha para que sea más legible
    const cita = citas[0]
    if (cita.fecha) {
      const fecha = new Date(cita.fecha)
      const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
      }
      cita.fecha = fecha.toLocaleDateString("es-ES", options)
    }

    return NextResponse.json({
      success: true,
      data: cita,
    })
  } catch (error) {
    console.error("Error en el endpoint de buscar cita por número:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
