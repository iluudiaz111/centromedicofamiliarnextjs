import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { categoria, nombre, periodo, esDoctor } = await request.json()

    const supabase = createServerSupabaseClient()
    let query = supabase.from("estadisticas").select("*")

    // Filtrar por categoría si se proporciona
    if (categoria) {
      query = query.eq("categoria", categoria)
    }

    // Filtrar por nombre si se proporciona
    if (nombre) {
      query = query.eq("nombre", nombre)
    }

    // Filtrar por periodo si se proporciona
    if (periodo) {
      query = query.eq("periodo", periodo)
    }

    // Ejecutar la consulta
    const { data, error } = await query

    if (error) {
      console.error("Error al consultar estadísticas:", error)
      return NextResponse.json(
        { success: false, error: "Error al obtener estadísticas de la base de datos" },
        { status: 500 },
      )
    }

    // Restringir cierta información si no es un doctor
    if (!esDoctor) {
      // Filtrar información financiera detallada y tendencias avanzadas
      const datosPermitidos = data.filter((item) => {
        // Excluir datos financieros detallados
        if (
          item.categoria === "financiero" &&
          (item.nombre.includes("ingresos") || item.nombre.includes("costo_tratamiento"))
        ) {
          return false
        }

        // Excluir tendencias avanzadas
        if (item.categoria === "tendencias" && !item.nombre.includes("reconsultas")) {
          return false
        }

        return true
      })

      return NextResponse.json({
        success: true,
        data: datosPermitidos,
      })
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error("Error en el endpoint de estadísticas-db:", error)
    return NextResponse.json(
      { success: false, error: "Error al procesar la solicitud de estadísticas" },
      { status: 500 },
    )
  }
}
