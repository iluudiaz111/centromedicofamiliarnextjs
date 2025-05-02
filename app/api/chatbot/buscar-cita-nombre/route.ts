import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { nombrePaciente, doctorNombre, especialidad, fechaAproximada } = await request.json()

    if (!nombrePaciente && !doctorNombre && !especialidad && !fechaAproximada) {
      return NextResponse.json(
        { success: false, error: "Se requiere al menos un parámetro de búsqueda" },
        { status: 400 },
      )
    }

    const supabase = createServerSupabaseClient()

    // Buscar el ID del paciente por nombre
    let pacienteIds: number[] = []
    if (nombrePaciente) {
      const { data: pacientes } = await supabase.from("pacientes").select("id").ilike("nombre", `%${nombrePaciente}%`)

      if (pacientes && pacientes.length > 0) {
        pacienteIds = pacientes.map((p) => p.id)
      } else {
        return NextResponse.json(
          { success: false, error: "No se encontró ningún paciente con ese nombre" },
          { status: 404 },
        )
      }
    }

    // Buscar el ID del doctor por nombre o especialidad
    let doctorIds: number[] = []
    if (doctorNombre || especialidad) {
      let query = supabase.from("doctores").select("id")

      if (doctorNombre) {
        query = query.ilike("nombre", `%${doctorNombre}%`)
      }

      if (especialidad) {
        query = query.ilike("especialidad", `%${especialidad}%`)
      }

      const { data: doctores } = await query

      if (doctores && doctores.length > 0) {
        doctorIds = doctores.map((d) => d.id)
      }
    }

    // Construir la consulta base para buscar citas
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
      .order("fecha", { ascending: false })
      .limit(5)

    // Aplicar filtros según los parámetros proporcionados
    if (pacienteIds.length > 0) {
      query = query.in("paciente_id", pacienteIds)
    }

    if (doctorIds.length > 0) {
      query = query.in("doctor_id", doctorIds)
    }

    if (fechaAproximada) {
      // Convertir la fecha aproximada a un rango de fechas (±7 días)
      const fecha = new Date(fechaAproximada)
      const fechaInicio = new Date(fecha)
      fechaInicio.setDate(fecha.getDate() - 7)
      const fechaFin = new Date(fecha)
      fechaFin.setDate(fecha.getDate() + 7)

      query = query
        .gte("fecha", fechaInicio.toISOString().split("T")[0])
        .lte("fecha", fechaFin.toISOString().split("T")[0])
    }

    // Ejecutar la consulta
    const { data: citas, error } = await query

    if (error) {
      console.error("Error al consultar citas:", error)
      return NextResponse.json({ success: false, error: "Error al consultar la base de datos" }, { status: 500 })
    }

    if (!citas || citas.length === 0) {
      return NextResponse.json(
        { success: false, error: "No se encontraron citas con los criterios proporcionados" },
        { status: 404 },
      )
    }

    // Formatear las citas encontradas
    const citasFormateadas = citas.map((cita) => {
      // Formatear la fecha para que sea más legible
      let fechaFormateada = cita.fecha
      if (cita.fecha) {
        const fecha = new Date(cita.fecha)
        const options: Intl.DateTimeFormatOptions = {
          year: "numeric",
          month: "long",
          day: "numeric",
          weekday: "long",
        }
        fechaFormateada = fecha.toLocaleDateString("es-ES", options)
      }

      return {
        numeroCita: cita.numero_cita,
        fecha: fechaFormateada,
        hora: cita.hora,
        motivo: cita.motivo,
        estado: cita.estado,
        paciente: {
          nombre: cita.paciente?.nombre || "Paciente sin nombre",
          telefono: cita.paciente?.telefono || "No disponible",
          email: cita.paciente?.email || "No disponible",
        },
        doctor: {
          nombre: cita.doctor?.nombre || "Doctor no asignado",
          especialidad: cita.doctor?.especialidad || "No especificada",
        },
      }
    })

    return NextResponse.json({
      success: true,
      data: citasFormateadas,
      count: citasFormateadas.length,
    })
  } catch (error) {
    console.error("Error en el endpoint de buscar cita por nombre:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
