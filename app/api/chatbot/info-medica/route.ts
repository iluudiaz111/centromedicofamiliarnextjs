import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { query, tipo } = await request.json()

    if (!query) {
      return NextResponse.json({ success: false, error: "Se requiere una consulta" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Normalizar la consulta (quitar acentos, convertir a minúsculas)
    const queryNormalizada = query
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()

    // Extraer palabras clave (palabras de 3 o más caracteres)
    const palabrasClave = queryNormalizada
      .split(/\s+/)
      .filter((palabra) => palabra.length >= 3)
      .map((palabra) => palabra.replace(/[^\w]/g, ""))

    if (palabrasClave.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "La consulta no contiene palabras clave válidas",
        },
        { status: 400 },
      )
    }

    console.log("Palabras clave extraídas:", palabrasClave)

    // Construir consulta para buscar en info_medica
    let infoMedicaQuery = supabase.from("info_medica").select("id, titulo, contenido, categoria, fecha_actualizacion")

    // Si se especifica un tipo, filtrar por categoría
    if (tipo) {
      infoMedicaQuery = infoMedicaQuery.eq("categoria", tipo)
    }

    // Buscar coincidencias en título y contenido
    const condiciones = palabrasClave
      .map((palabra) => {
        return `(titulo.ilike.%${palabra}% or contenido.ilike.%${palabra}%)`
      })
      .join(" and ")

    const { data: infoMedica, error: infoMedicaError } = await infoMedicaQuery
      .or(condiciones)
      .order("fecha_actualizacion", { ascending: false })
      .limit(5)

    if (infoMedicaError) {
      console.error("Error al buscar información médica:", infoMedicaError)
      return NextResponse.json(
        {
          success: false,
          error: "Error al buscar información médica",
        },
        { status: 500 },
      )
    }

    // Buscar en servicios relacionados
    const { data: servicios, error: serviciosError } = await supabase
      .from("servicios")
      .select("id, nombre, descripcion, precio")
      .or(palabrasClave.map((palabra) => `(nombre.ilike.%${palabra}% or descripcion.ilike.%${palabra}%)`).join(" or "))
      .limit(3)

    if (serviciosError) {
      console.error("Error al buscar servicios:", serviciosError)
    }

    // Buscar en doctores relacionados
    const { data: doctores, error: doctoresError } = await supabase
      .from("doctores")
      .select("id, nombre, especialidad, biografia")
      .or(
        palabrasClave
          .map(
            (palabra) =>
              `(nombre.ilike.%${palabra}% or especialidad.ilike.%${palabra}% or biografia.ilike.%${palabra}%)`,
          )
          .join(" or "),
      )
      .limit(3)

    if (doctoresError) {
      console.error("Error al buscar doctores:", doctoresError)
    }

    // Formatear resultados
    const resultados = {
      infoMedica: infoMedica || [],
      servicios: servicios || [],
      doctores: doctores || [],
    }

    // Si no se encontró nada, devolver mensaje
    if (resultados.infoMedica.length === 0 && resultados.servicios.length === 0 && resultados.doctores.length === 0) {
      return NextResponse.json({
        success: true,
        encontrado: false,
        mensaje: "No se encontró información relacionada con la consulta",
      })
    }

    return NextResponse.json({
      success: true,
      encontrado: true,
      resultados,
    })
  } catch (error) {
    console.error("Error en la ruta de info-medica:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al procesar la consulta de información médica",
      },
      { status: 500 },
    )
  }
}
