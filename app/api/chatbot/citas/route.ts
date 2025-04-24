import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { fecha, hora, tipo } = await request.json()

    // Validar los parámetros
    if (!fecha) {
      return NextResponse.json({ success: false, error: "Se requiere una fecha" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Construir la consulta base
    let query = supabase
      .from("citas")
      .select(`
        id,
        fecha,
        hora,
        motivo,
        estado,
        pacientes (
          id,
          nombre
        ),
        doctores (
          id,
          nombre,
          especialidad
        )
      `)
      .eq("fecha", fecha)

    // Añadir filtros adicionales si se proporcionan
    if (hora) {
      query = query.eq("hora", hora)
    }

    if (tipo) {
      query = query.ilike("motivo", `%${tipo}%`)
    }

    // Ejecutar la consulta
    const { data, error } = await query

    if (error) {
      throw new Error(`Error al consultar citas: ${error.message}`)
    }

    // Formatear la respuesta
    const citasFormateadas = data.map((cita: any) => {
      return {
        id: cita.id,
        fecha: cita.fecha,
        hora: cita.hora,
        motivo: cita.motivo,
        estado: cita.estado,
        paciente: {
          nombre: cita.pacientes.nombre,
        },
        doctor: {
          nombre: cita.doctores.nombre,
          especialidad: cita.doctores.especialidad,
        },
      }
    })

    return NextResponse.json({ success: true, data: citasFormateadas })
  } catch (error) {
    console.error("Error en la consulta de citas:", error)
    return NextResponse.json({ success: false, error: "Error al procesar la consulta de citas" }, { status: 500 })
  }
}
