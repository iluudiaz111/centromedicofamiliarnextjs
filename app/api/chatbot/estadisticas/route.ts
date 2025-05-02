import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { searchParams } = new URL(request.url)
    const categoria = searchParams.get("categoria")
    const nombre = searchParams.get("nombre")
    const periodo = searchParams.get("periodo")

    let query = supabase.from("estadisticas").select("*")

    if (categoria) {
      query = query.eq("categoria", categoria)
    }

    if (nombre) {
      query = query.eq("nombre", nombre)
    }

    if (periodo) {
      query = query.eq("periodo", periodo)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error al consultar estadísticas:", error)
      return NextResponse.json({ error: "Error al consultar estadísticas" }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error en el endpoint de estadísticas:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient()
    const { tipo, filtros } = await request.json()

    let query = supabase.from("estadisticas").select("*")

    if (tipo) {
      query = query.eq("categoria", tipo)
    }

    if (filtros?.nombre) {
      query = query.eq("nombre", filtros.nombre)
    }

    if (filtros?.periodo) {
      query = query.eq("periodo", filtros.periodo)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error al consultar estadísticas:", error)
      return NextResponse.json({ error: "Error al consultar estadísticas" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data,
      total: data.length,
      porEspecialidad: {}, // Esto se calcularía según los datos
      promedioPorDia: 0, // Esto se calcularía según los datos
      porEstado: {}, // Esto se calcularía según los datos
      precioPromedio: 0, // Esto se calcularía según los datos
    })
  } catch (error) {
    console.error("Error en el endpoint de estadísticas POST:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
