import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { numeroCita } = await request.json()
    console.log("Buscando cita con número:", numeroCita)

    if (!numeroCita) {
      return NextResponse.json({ success: false, error: "Se requiere un número de cita" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Primero intentamos una búsqueda exacta
    let { data: citasExactas, error: errorExacto } = await supabase
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

    // Si no hay resultados exactos, intentamos una búsqueda parcial
    if ((!citasExactas || citasExactas.length === 0) && !errorExacto) {
      const { data: citasParciales, error: errorParcial } = await supabase
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
        .ilike("numero_cita", `%${numeroCita}%`)

      if (errorParcial) {
        console.error("Error en búsqueda parcial:", errorParcial)
      } else if (citasParciales && citasParciales.length > 0) {
        citasExactas = citasParciales
      }
    }

    if (errorExacto) {
      console.error("Error al buscar cita:", errorExacto)
      return NextResponse.json(
        { success: false, error: "Error al buscar la cita en la base de datos" },
        { status: 500 },
      )
    }

    if (!citasExactas || citasExactas.length === 0) {
      console.log("No se encontró ninguna cita con el número:", numeroCita)
      return NextResponse.json({ success: false, error: "No se encontró ninguna cita con ese número" }, { status: 404 })
    }

    // Formatear las citas encontradas
    const citasFormateadas = citasExactas.map((cita) => ({
      numeroCita: cita.numero_cita,
      fecha: cita.fecha,
      hora: cita.hora,
      motivo: cita.motivo,
      estado: cita.estado,
      paciente: {
        nombre: cita.pacientes?.nombre || "Paciente sin nombre",
        telefono: cita.pacientes?.telefono || "No disponible",
        email: cita.pacientes?.email || "No disponible",
      },
      doctor: {
        nombre: cita.doctores?.nombre || "Doctor no asignado",
        especialidad: cita.doctores?.especialidad || "No especificada",
      },
    }))

    console.log("Citas encontradas:", citasFormateadas.length)

    return NextResponse.json({
      success: true,
      data: citasFormateadas.length === 1 ? citasFormateadas[0] : citasFormateadas,
      multiple: citasFormateadas.length > 1,
    })
  } catch (error) {
    console.error("Error en la búsqueda de cita por número:", error)
    return NextResponse.json({ success: false, error: "Error al procesar la búsqueda de cita" }, { status: 500 })
  }
}
