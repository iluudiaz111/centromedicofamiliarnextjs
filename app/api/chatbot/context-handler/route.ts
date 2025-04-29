import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

// Tipo para almacenar información de precios mencionados
type PrecioMencionado = {
  servicio: string
  precio: number
}

// Función para extraer precios de un texto
function extraerPrecios(texto: string): PrecioMencionado[] {
  const precios: PrecioMencionado[] = []

  // Patrones para buscar precios en el formato "servicio: Q precio"
  const patronPrecio = /([^:]+):\s*Q\s*(\d+)/gi
  let coincidencia

  while ((coincidencia = patronPrecio.exec(texto)) !== null) {
    const servicio = coincidencia[1].trim()
    const precio = Number.parseInt(coincidencia[2], 10)

    if (!isNaN(precio)) {
      precios.push({ servicio, precio })
    }
  }

  return precios
}

// Función para verificar si un mensaje pregunta por un total
function preguntaPorTotal(mensaje: string): boolean {
  const mensajeLimpio = mensaje
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  const patronesTotal = [
    "total",
    "suma",
    "cuanto es",
    "cuanto seria",
    "cuanto cuesta",
    "precio total",
    "costo total",
    "en total",
    "todo junto",
    "todo en total",
    "sumar",
    "sumando",
  ]

  return patronesTotal.some((patron) => mensajeLimpio.includes(patron))
}

// Función para detectar si se está preguntando por información médica
function preguntaPorInfoMedica(mensaje: string): { esPregunta: boolean; tipo?: string } {
  const mensajeLimpio = mensaje
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  // Patrones para detectar preguntas sobre información médica
  const patronesInfoMedica = [
    "que es",
    "qué es",
    "como se trata",
    "cómo se trata",
    "sintomas",
    "síntomas",
    "tratamiento",
    "enfermedad",
    "condicion",
    "condición",
    "diagnostico",
    "diagnóstico",
    "informacion sobre",
    "información sobre",
    "me puedes decir sobre",
    "me puedes explicar",
    "me explicas",
  ]

  // Verificar si algún patrón coincide
  const esPregunta = patronesInfoMedica.some((patron) => mensajeLimpio.includes(patron))

  if (!esPregunta) {
    return { esPregunta: false }
  }

  // Intentar determinar el tipo de información médica
  let tipo: string | undefined

  const tiposInfoMedica = [
    "diabetes",
    "hipertension",
    "hipertensión",
    "covid",
    "dengue",
    "embarazo",
    "pediatria",
    "pediatría",
    "cardiologia",
    "cardiología",
    "ginecologia",
    "ginecología",
    "nutricion",
    "nutrición",
    "dermatologia",
    "dermatología",
    "psicologia",
    "psicología",
  ]

  for (const tipoInfo of tiposInfoMedica) {
    if (mensajeLimpio.includes(tipoInfo)) {
      tipo = tipoInfo
      break
    }
  }

  return { esPregunta: true, tipo }
}

// Función para detectar si se está preguntando por un doctor o especialidad
function preguntaPorDoctor(mensaje: string): { esPregunta: boolean; especialidad?: string; nombre?: string } {
  const mensajeLimpio = mensaje
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  // Patrones para detectar preguntas sobre doctores
  const patronesDoctor = [
    "doctor",
    "doctora",
    "medico",
    "médico",
    "especialista",
    "especialidad",
    "quien atiende",
    "quién atiende",
    "quien trata",
    "quién trata",
    "quien me puede atender",
    "quién me puede atender",
  ]

  // Verificar si algún patrón coincide
  const esPregunta = patronesDoctor.some((patron) => mensajeLimpio.includes(patron))

  if (!esPregunta) {
    return { esPregunta: false }
  }

  // Intentar determinar la especialidad
  let especialidad: string | undefined

  const especialidades = [
    "medicina general",
    "pediatria",
    "pediatría",
    "cardiologia",
    "cardiología",
    "ginecologia",
    "ginecología",
    "nutricion",
    "nutrición",
    "dermatologia",
    "dermatología",
    "psicologia",
    "psicología",
  ]

  for (const esp of especialidades) {
    if (mensajeLimpio.includes(esp)) {
      especialidad = esp
      break
    }
  }

  // Intentar extraer nombre del doctor si se menciona
  let nombre: string | undefined

  // Patrones para nombres de doctores
  const patronesNombreDoctor = [/doctor[a]?\s+([a-zñáéíóúü\s]+)/i, /dr[a]?\.\s+([a-zñáéíóúü\s]+)/i]

  for (const patron of patronesNombreDoctor) {
    const coincidencia = mensajeLimpio.match(patron)
    if (coincidencia && coincidencia[1]) {
      nombre = coincidencia[1].trim()
      break
    }
  }

  return { esPregunta: true, especialidad, nombre }
}

export async function POST(request: Request) {
  try {
    const { mensajeActual, mensajesAnteriores } = await request.json()

    if (!mensajeActual || !mensajesAnteriores || !Array.isArray(mensajesAnteriores)) {
      return NextResponse.json(
        {
          success: false,
          error: "Formato de solicitud inválido",
        },
        { status: 400 },
      )
    }

    // Verificar si el mensaje actual pregunta por un total
    if (preguntaPorTotal(mensajeActual)) {
      // Buscar precios mencionados en mensajes anteriores del asistente
      const mensajesAsistente = mensajesAnteriores.filter((m) => m.role === "assistant")
      let preciosMencionados: PrecioMencionado[] = []

      // Extraer precios de los últimos mensajes del asistente (más recientes primero)
      for (let i = mensajesAsistente.length - 1; i >= 0; i--) {
        const preciosEnMensaje = extraerPrecios(mensajesAsistente[i].content)
        if (preciosEnMensaje.length > 0) {
          preciosMencionados = preciosMencionados.concat(preciosEnMensaje)
        }

        // Limitar la búsqueda a los últimos 3 mensajes con precios
        if (preciosMencionados.length > 0 && mensajesAsistente.length - i >= 3) {
          break
        }
      }

      // Si encontramos precios, calcular el total
      if (preciosMencionados.length > 0) {
        const total = preciosMencionados.reduce((sum, item) => sum + item.precio, 0)
        const servicios = preciosMencionados.map((item) => item.servicio).join(", ")

        return NextResponse.json({
          success: true,
          requiereContexto: true,
          respuesta: `El total por ${servicios} es de Q${total}. ¿Puedo ayudarte con algo más?`,
        })
      }
    }

    // Verificar si el mensaje pregunta por información médica
    const infoMedicaQuery = preguntaPorInfoMedica(mensajeActual)
    if (infoMedicaQuery.esPregunta) {
      try {
        // Extraer la consulta real (eliminar palabras de pregunta)
        const consulta = mensajeActual
          .toLowerCase()
          .replace(
            /que es|qué es|como se trata|cómo se trata|me puedes explicar|informacion sobre|información sobre/g,
            "",
          )
          .trim()

        // Buscar información médica relacionada
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/info_medica`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            apikey: process.env.SUPABASE_ANON_KEY || "",
            Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY || ""}`,
            Prefer: "return=representation",
          },
        })

        if (!response.ok) {
          throw new Error("Error al buscar información médica")
        }

        const infoMedica = await response.json()

        // Filtrar por palabras clave
        const palabrasClave = consulta
          .split(/\s+/)
          .filter((palabra) => palabra.length >= 3)
          .map((palabra) => palabra.replace(/[^\w]/g, ""))

        const resultadosFiltrados = infoMedica.filter((info: any) => {
          const contenidoNormalizado = info.contenido
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")

          const tituloNormalizado = info.titulo
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")

          return palabrasClave.some(
            (palabra) => contenidoNormalizado.includes(palabra) || tituloNormalizado.includes(palabra),
          )
        })

        if (resultadosFiltrados.length > 0) {
          // Formatear la respuesta con la información encontrada
          const infoSeleccionada = resultadosFiltrados[0]
          const respuesta = `**${infoSeleccionada.titulo}**\n\n${infoSeleccionada.contenido.substring(0, 300)}...`

          return NextResponse.json({
            success: true,
            requiereContexto: true,
            respuesta,
          })
        }
      } catch (error) {
        console.error("Error al procesar consulta de información médica:", error)
        // Continuar con el flujo normal si hay error
      }
    }

    // Verificar si el mensaje pregunta por un doctor o especialidad
    const doctorQuery = preguntaPorDoctor(mensajeActual)
    if (doctorQuery.esPregunta) {
      try {
        const supabase = createServerSupabaseClient()

        // Construir la consulta
        let query = supabase.from("doctores").select("id, nombre, especialidad, biografia, horario")

        // Filtrar por especialidad o nombre si se proporcionaron
        if (doctorQuery.especialidad) {
          query = query.ilike("especialidad", `%${doctorQuery.especialidad}%`)
        }

        if (doctorQuery.nombre) {
          query = query.ilike("nombre", `%${doctorQuery.nombre}%`)
        }

        // Ejecutar la consulta
        const { data: doctores, error } = await query.limit(3)

        if (error) {
          throw error
        }

        if (doctores && doctores.length > 0) {
          // Formatear la respuesta con los doctores encontrados
          let respuesta = "Estos son los especialistas disponibles:\n\n"

          doctores.forEach((doctor) => {
            respuesta += `**Dr(a). ${doctor.nombre}**\n`
            respuesta += `Especialidad: ${doctor.especialidad}\n`
            if (doctor.horario) {
              respuesta += `Horario: ${doctor.horario}\n`
            }
            if (doctor.biografia) {
              respuesta += `${doctor.biografia.substring(0, 100)}...\n`
            }
            respuesta += "\n"
          })

          respuesta += "Para agendar una cita, puede llamar al 4644-9158 o utilizar nuestro formulario en línea."

          return NextResponse.json({
            success: true,
            requiereContexto: true,
            respuesta,
          })
        }
      } catch (error) {
        console.error("Error al procesar consulta de doctores:", error)
        // Continuar con el flujo normal si hay error
      }
    }

    // Si no es una pregunta sobre el total, información médica o doctores, indicar que no requiere contexto especial
    return NextResponse.json({
      success: true,
      requiereContexto: false,
    })
  } catch (error) {
    console.error("Error en el manejador de contexto:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al procesar el contexto de la conversación",
      },
      { status: 500 },
    )
  }
}
