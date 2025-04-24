import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const { doctorId, doctorNombre, estado, periodo } = await request.json()

    if (!doctorId && !doctorNombre) {
      return NextResponse.json({ success: false, error: "Se requiere el ID o nombre del doctor" }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    // Buscar el doctor por ID o nombre
    let doctorQuery = supabase.from("doctores").select("id, nombre, especialidad")

    if (doctorId) {
      doctorQuery = doctorQuery.eq("id", doctorId)
    } else if (doctorNombre) {
      doctorQuery = doctorQuery.ilike("nombre", `%${doctorNombre}%`)
    }

    const { data: doctorData, error: doctorError } = await doctorQuery.single()

    if (doctorError || !doctorData) {
      return NextResponse.json(
        {
          success: false,
          error: `No se encontró el doctor ${doctorNombre ? `con nombre "${doctorNombre}"` : `con ID ${doctorId}`}`,
        },
        { status: 404 },
      )
    }

    // Construir la consulta de citas
    let citasQuery = supabase
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
          telefono
        )
      `)
      .eq("doctor_id", doctorData.id)

    // Filtrar por estado si se proporciona
    if (estado) {
      citasQuery = citasQuery.eq("estado", estado)
    }

    // Filtrar por periodo
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const fechaHoy = hoy.toISOString().split("T")[0]

    if (periodo === "hoy") {
      citasQuery = citasQuery.eq("fecha", fechaHoy)
    } else if (periodo === "proximas") {
      citasQuery = citasQuery.gte("fecha", fechaHoy)
    } else if (periodo === "pasadas") {
      citasQuery = citasQuery.lt("fecha", fechaHoy)
    }

    // Ordenar por fecha y hora
    citasQuery = citasQuery.order("fecha", { ascending: true }).order("hora", { ascending: true })

    const { data: citasData, error: citasError } = await citasQuery

    if (citasError) {
      console.error("Error al consultar citas:", citasError)
      return NextResponse.json({ success: false, error: "Error al consultar citas del doctor" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: citasData,
      doctor: doctorData,
    })
  } catch (error) {
    console.error("Error en el endpoint de citas-doctor:", error)
    return NextResponse.json({ success: false, error: "Error al procesar la solicitud" }, { status: 500 })
  }
}
