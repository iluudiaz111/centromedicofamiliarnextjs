import { NextResponse } from "next/server"

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

    // Si no es una pregunta sobre el total o no encontramos precios, indicar que no requiere contexto especial
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
