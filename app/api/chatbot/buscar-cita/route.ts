import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { numeroCita, pacienteNombre, pacienteTelefono, fecha } = await request.json()
    console.log("Parámetros de búsqueda:", { numeroCita, pacienteNombre, pacienteTelefono, fecha })

    if (!numeroCita && !pacienteNombre && !pacienteTelefono && !fecha) {
      return NextResponse.json(
        { success: false, error: "Se requiere al menos un parámetro de búsqueda" },
        { status: 400 },
      )
    }

    const supabase = createServerSupabaseClient()
    console.log("Cliente Supabase creado")

    // Construir la consulta base
    let query = supabase.from("citas").select(`
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

    // Aplicar filtros según los parámetros proporcionados
    if (numeroCita) {
      query = query.eq("numero_cita", numeroCita)
    }

    if (fecha) {
      query = query.eq("fecha", fecha)
    }

    // Obtener resultados
    const { data: citas, error } = await query

    console.log("Resultado de la consulta:", { citas, error })

    if (error) {
      console.error("Error en la consulta:", error)
      return NextResponse.json(
        { success: false, error: "Error al buscar la cita en la base de datos" },
        { status: 500 },
      )
    }

    // Filtrar por nombre o teléfono del paciente si se proporcionaron
    let citasFiltradas = citas || []

    if (pacienteNombre && citasFiltradas.length > 0) {
      const nombreNormalizado = pacienteNombre.toLowerCase().trim()
      citasFiltradas = citasFiltradas.filter(
        (cita) => cita.pacientes && cita.pacientes.nombre.toLowerCase().includes(nombreNormalizado),
      )
    }

    if (pacienteTelefono && citasFiltradas.length > 0) {
      citasFiltradas = citasFiltradas.filter(
        (cita) => cita.pacientes && cita.pacientes.telefono.includes(pacienteTelefono),
      )
    }

    if (!citasFiltradas || citasFiltradas.length === 0) {
      return NextResponse.json(
        { success: false, error: "No se encontró ninguna cita con los parámetros proporcionados" },
        { status: 404 },
      )
    }

    // Formatear las citas encontradas
    const citasFormateadas = citasFiltradas.map((cita) => ({
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
    }))

    return NextResponse.json({
      success: true,
      data: citasFormateadas.length === 1 ? citasFormateadas[0] : citasFormateadas,
      multiple: citasFormateadas.length > 1,
    })
  } catch (error) {
    console.error("Error en la búsqueda de cita:", error)
    return NextResponse.json({ success: false, error: "Error al procesar la búsqueda de cita" }, { status: 500 })
  }
}
