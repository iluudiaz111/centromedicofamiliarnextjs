import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

// Respuestas predefinidas más concisas para preguntas comunes
const respuestasPredefinidas: Record<string, string> = {
  horario:
    "Atendemos de lunes a viernes de 8:00 AM a 6:00 PM y sábados de 8:00 AM a 1:00 PM. ¿En qué más puedo ayudarle?",
  ubicacion: "Estamos en 2 av. 5-08 zona 3 San Juan Sacatepéquez. Contamos con estacionamiento para pacientes.",
  contacto: "Puede contactarnos al 4644-9158 o por correo a info@centromedicofamiliar.com. ¿Necesita algo más?",
  cita: "Para agendar una cita, llame al 4644-9158 o use nuestro formulario en línea en la sección 'Agendar Cita'.",
  documentos: "Para registrarse necesita: DPI, comprobante de domicilio y tarjeta de seguro médico (si aplica).",
  pago: "Aceptamos efectivo, tarjetas, cheques y transferencias. Trabajamos con los principales seguros médicos del país.",
  seguros: "Tenemos convenio con Seguros G&T, Mapfre, El Roble, Aseguradora General, Universales y BUPA Guatemala.",
  especialidades:
    "Ofrecemos medicina general, pediatría, cardiología, ginecología, nutrición, dermatología y psicología.",
  covid: "Realizamos pruebas COVID-19 con resultados en 24 horas. No requiere ayuno previo.",
  dengue: "Ofrecemos pruebas para diagnóstico de dengue con resultados rápidos y confiables.",
  ultrasonido:
    "Contamos con servicios de ultrasonido durante los turnos de la Doctora Peláez. Para abdominales se requiere ayuno de 6 horas.",
  laboratorio:
    "Nuestro laboratorio ofrece análisis de sangre, química sanguínea, orina, pruebas de embarazo y perfiles hormonales.",
  emergencia:
    "Para emergencias graves, diríjase al hospital más cercano. Para consultas urgentes en horario de atención, llame al 4644-9158.",
  precios:
    "La consulta general cuesta Q150, pediatría Q200, ginecología Q250 y cardiología Q300. Para más detalles visite nuestra sección de Precios.",
  disponibilidad:
    "Generalmente hay citas disponibles con 1-3 días de anticipación para medicina general y 3-7 días para especialidades.",
  saludo: "¡Hola! Soy la asistente virtual del Centro Médico Familiar. ¿En qué puedo ayudarle hoy?",
}

export async function POST(request: Request) {
  try {
    const { mensaje, isMedico, medicoNombre, mensajesAnteriores } = await request.json()

    // Primero verificar si es una pregunta que requiere contexto de la conversación
    try {
      const contextResponse = await fetch(new URL("/api/chatbot/context-handler", request.url), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mensajeActual: mensaje,
          mensajesAnteriores: mensajesAnteriores || [],
        }),
      })

      const contextData = await contextResponse.json()

      if (contextData.success && contextData.requiereContexto) {
        return NextResponse.json({
          success: true,
          respuesta: contextData.respuesta,
        })
      }
    } catch (contextError) {
      console.error("Error al procesar el contexto:", contextError)
      // Continuar con el flujo normal si hay error en el procesamiento de contexto
    }

    // Convertir mensaje a minúsculas y sin acentos para facilitar la comparación
    const mensajeLimpio = mensaje
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")

    // Verificar si el mensaje coincide con alguna palabra clave
    const palabrasClave: Record<string, string[]> = {
      horario: ["horario", "hora", "atencion", "abierto", "cerrado"],
      ubicacion: ["ubicacion", "direccion", "donde", "llegar", "mapa"],
      contacto: ["contacto", "telefono", "correo", "email", "llamar"],
      cita: ["cita", "agendar", "reservar", "turno", "consulta"],
      documentos: ["documentos", "papeles", "requisitos", "registro", "registrar"],
      pago: ["pago", "pagar", "efectivo", "tarjeta", "precio", "costo"],
      seguros: ["seguro", "aseguradora", "cobertura", "poliza"],
      especialidades: ["especialidad", "especialidades", "servicio", "servicios", "atencion"],
      covid: ["covid", "coronavirus", "hisopado", "pcr", "antigeno"],
      dengue: ["dengue", "zika", "mosquito", "fiebre"],
      ultrasonido: ["ultrasonido", "ecografia", "sonografia", "embarazo"],
      laboratorio: ["laboratorio", "analisis", "sangre", "orina", "examen"],
      emergencia: ["emergencia", "urgencia", "grave", "accidente"],
      precios: ["precio", "costo", "tarifa", "valor", "cuanto cuesta"],
      disponibilidad: ["disponibilidad", "disponible", "agenda", "cuando", "proximo"],
      saludo: ["hola", "buenos dias", "buenas tardes", "buenas noches", "saludos"],
    }

    // Buscar coincidencias
    let tipoRespuesta: string | null = null
    for (const [tipo, palabras] of Object.entries(palabrasClave)) {
      if (palabras.some((palabra) => mensajeLimpio.includes(palabra))) {
        tipoRespuesta = tipo
        break
      }
    }

    // Si no hay coincidencia, buscar en la base de datos
    if (!tipoRespuesta) {
      const supabase = createServerSupabaseClient()
      const { data: infoMedica } = await supabase.from("info_medica").select("titulo, contenido")

      if (infoMedica) {
        for (const info of infoMedica) {
          const tituloLimpio = info.titulo
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")

          const contenidoLimpio = info.contenido
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")

          if (mensajeLimpio.includes(tituloLimpio) || tituloLimpio.includes(mensajeLimpio)) {
            // Resumir el contenido para que sea más conciso
            const contenidoResumido = info.contenido.split(".").slice(0, 2).join(".") + "."

            return NextResponse.json({
              success: true,
              respuesta: contenidoResumido,
            })
          }

          // Buscar palabras clave en el contenido
          const palabrasUsuario = mensajeLimpio.split(" ").filter((p) => p.length > 3)
          for (const palabra of palabrasUsuario) {
            if (contenidoLimpio.includes(palabra)) {
              // Resumir el contenido para que sea más conciso
              const contenidoResumido = info.contenido.split(".").slice(0, 2).join(".") + "."

              return NextResponse.json({
                success: true,
                respuesta: contenidoResumido,
              })
            }
          }
        }
      }
    }

    // Si hay coincidencia, devolver la respuesta predefinida
    if (tipoRespuesta && respuestasPredefinidas[tipoRespuesta]) {
      return NextResponse.json({
        success: true,
        respuesta: respuestasPredefinidas[tipoRespuesta],
      })
    }

    // Si no hay coincidencia, devolver una respuesta genérica
    let respuestaGenerica = ""
    if (isMedico) {
      respuestaGenerica = `Dr(a). ${medicoNombre}, para información específica sobre este tema, consulte el sistema interno o comuníquese con administración. Estoy aquí para ayudarle con información general.`
    } else {
      respuestaGenerica =
        "Gracias por su consulta. Para información más detallada, llame al 4644-9158 o visite nuestra página web. ¿En qué más puedo ayudarle?"
    }

    return NextResponse.json({
      success: true,
      respuesta: respuestaGenerica,
    })
  } catch (error) {
    console.error("Error en el endpoint de respuesta:", error)
    return NextResponse.json(
      {
        success: false,
        respuesta:
          "Lo siento, estoy teniendo problemas para responder. Por favor, intente de nuevo o comuníquese al 4644-9158.",
        error: "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}
