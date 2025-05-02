import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

// Información general del centro médico
const infoGeneral = {
  horario: {
    semana: "Lunes a Viernes de 8:00 a 18:00",
    sabado: "Sábados de 8:00 a 13:00",
    domingo: "Cerrado",
    completo: "Lunes a Viernes de 8:00 a 18:00 y Sábados de 8:00 a 13:00",
  },
  ubicacion: {
    direccion: "2 av. 5-08 zona 3 San Juan Sacatepéquez",
    coordenadas: {
      latitud: 14.7167,
      longitud: -90.6333,
    },
    referencia: "A dos cuadras del parque central",
  },
  contacto: {
    telefono: "4644-9158",
    email: "info@centromedicofamiliar.com",
    whatsapp: "+502 4644-9158",
  },
  documentos_registro: [
    "Documento Personal de Identificación (DPI)",
    "Comprobante de domicilio reciente",
    "Tarjeta de seguro médico (si aplica)",
  ],
  metodos_pago: [
    "Efectivo",
    "Tarjetas de crédito/débito",
    "Cheques",
    "Transferencias bancarias",
    "Seguros médicos afiliados",
  ],
  seguros_afiliados: [
    "Seguros El Roble",
    "Seguros G&T",
    "Aseguradora General",
    "Mapfre Seguros",
    "Seguros Universales",
  ],
  proceso_cita: [
    "Llamar al 4644-9158 o usar el formulario en línea",
    "Proporcionar datos personales y motivo de consulta",
    "Seleccionar especialidad y fecha/hora disponible",
    "Recibir confirmación por correo o SMS",
    "Presentarse 15 minutos antes de la cita con documentos",
  ],
}

export async function POST(request: Request) {
  try {
    const { categoria, subcategoria, esDoctor } = await request.json()

    // Si no se especifica categoría, devolver todas las categorías disponibles
    if (!categoria) {
      return NextResponse.json({
        success: true,
        data: {
          categorias_disponibles: Object.keys(infoGeneral),
        },
      })
    }

    // Si la categoría existe en la información general
    if (categoria in infoGeneral) {
      const infoCategoria = infoGeneral[categoria as keyof typeof infoGeneral]

      // Si se especifica subcategoría y existe
      if (subcategoria && typeof infoCategoria === "object" && subcategoria in infoCategoria) {
        return NextResponse.json({
          success: true,
          data: {
            [subcategoria]: infoCategoria[subcategoria as keyof typeof infoCategoria],
          },
        })
      }

      // Devolver toda la información de la categoría
      return NextResponse.json({
        success: true,
        data: infoCategoria,
      })
    }

    // Si la categoría es "especialidades", obtener de la base de datos
    if (categoria === "especialidades") {
      const supabase = createServerSupabaseClient()

      const { data: doctores, error } = await supabase.from("doctores").select("especialidad").order("especialidad")

      if (error) {
        console.error("Error al obtener especialidades:", error)
        return NextResponse.json({ success: false, error: "Error al obtener especialidades" }, { status: 500 })
      }

      // Extraer especialidades únicas
      const especialidadesUnicas = [...new Set(doctores.map((d) => d.especialidad))]

      return NextResponse.json({
        success: true,
        data: {
          especialidades: especialidadesUnicas,
        },
      })
    }

    // Si la categoría es "precios", obtener de la base de datos
    if (categoria === "precios") {
      const supabase = createServerSupabaseClient()

      const { data: servicios, error } = await supabase
        .from("servicios")
        .select("nombre, descripcion, precio")
        .order("nombre")

      if (error) {
        console.error("Error al obtener precios:", error)
        return NextResponse.json({ success: false, error: "Error al obtener precios" }, { status: 500 })
      }

      // Si se especifica un servicio específico
      if (subcategoria) {
        const servicioFiltrado = servicios.filter((s) => s.nombre.toLowerCase().includes(subcategoria.toLowerCase()))

        if (servicioFiltrado.length > 0) {
          return NextResponse.json({
            success: true,
            data: {
              servicios: servicioFiltrado,
            },
          })
        }

        return NextResponse.json(
          {
            success: false,
            error: "No se encontró información sobre el servicio especificado",
          },
          { status: 404 },
        )
      }

      return NextResponse.json({
        success: true,
        data: {
          servicios,
        },
      })
    }

    // Si la categoría es "disponibilidad", verificar disponibilidad de citas
    if (categoria === "disponibilidad") {
      const supabase = createServerSupabaseClient()

      // Obtener fecha actual
      const hoy = new Date()
      const fechaHoy = hoy.toISOString().split("T")[0]

      // Fecha para mañana
      const manana = new Date(hoy)
      manana.setDate(hoy.getDate() + 1)
      const fechaManana = manana.toISOString().split("T")[0]

      // Fecha para una semana
      const unaSemana = new Date(hoy)
      unaSemana.setDate(hoy.getDate() + 7)
      const fechaSemana = unaSemana.toISOString().split("T")[0]

      // Consultar citas para hoy, mañana y próxima semana
      const { data: citasHoy, error: errorHoy } = await supabase.from("citas").select("id, hora").eq("fecha", fechaHoy)

      const { data: citasManana, error: errorManana } = await supabase
        .from("citas")
        .select("id, hora")
        .eq("fecha", fechaManana)

      const { data: citasSemana, error: errorSemana } = await supabase
        .from("citas")
        .select("id, hora, fecha")
        .gte("fecha", fechaHoy)
        .lte("fecha", fechaSemana)

      if (errorHoy || errorManana || errorSemana) {
        console.error("Error al consultar disponibilidad:", errorHoy || errorManana || errorSemana)
        return NextResponse.json({ success: false, error: "Error al consultar disponibilidad" }, { status: 500 })
      }

      // Calcular disponibilidad (asumiendo 8 horas de atención y citas de 30 minutos = 16 citas por día)
      const capacidadDiaria = 16
      const disponibilidadHoy = Math.max(0, capacidadDiaria - (citasHoy?.length || 0))
      const disponibilidadManana = Math.max(0, capacidadDiaria - (citasManana?.length || 0))

      // Agrupar citas por día para la semana
      const citasPorDia: Record<string, number> = {}
      citasSemana?.forEach((cita) => {
        citasPorDia[cita.fecha] = (citasPorDia[cita.fecha] || 0) + 1
      })

      // Calcular disponibilidad para cada día de la semana
      const disponibilidadSemana: Record<string, number> = {}
      for (let i = 0; i < 7; i++) {
        const fecha = new Date(hoy)
        fecha.setDate(hoy.getDate() + i)
        const fechaStr = fecha.toISOString().split("T")[0]
        disponibilidadSemana[fechaStr] = Math.max(0, capacidadDiaria - (citasPorDia[fechaStr] || 0))
      }

      return NextResponse.json({
        success: true,
        data: {
          disponibilidad_hoy: disponibilidadHoy,
          disponibilidad_manana: disponibilidadManana,
          disponibilidad_semana: disponibilidadSemana,
        },
      })
    }

    // Si la categoría no existe
    return NextResponse.json(
      {
        success: false,
        error: "Categoría de información no encontrada",
      },
      { status: 404 },
    )
  } catch (error) {
    console.error("Error en el endpoint de información general:", error)
    return NextResponse.json(
      { success: false, error: "Error al procesar la solicitud de información" },
      { status: 500 },
    )
  }
}
