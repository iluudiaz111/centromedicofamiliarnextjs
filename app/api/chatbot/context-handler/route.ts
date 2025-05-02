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

// Función para detectar preguntas sobre información general del centro
function preguntaPorInfoGeneral(mensaje: string): { esPregunta: boolean; categoria?: string; subcategoria?: string } {
  const mensajeLimpio = mensaje
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  // Categorías de información general
  const categorias: Record<string, string[]> = {
    horario: ["horario", "hora", "atienden", "abierto", "cerrado", "cuando abren", "cuando cierran"],
    ubicacion: ["ubicacion", "ubicación", "dirección", "direccion", "donde", "dónde", "como llegar", "cómo llegar"],
    contacto: ["contacto", "teléfono", "telefono", "llamar", "email", "correo", "whatsapp"],
    documentos_registro: ["documentos", "registro", "registrarme", "que necesito", "qué necesito", "requisitos"],
    metodos_pago: ["pago", "pagar", "efectivo", "tarjeta", "transferencia", "aceptan", "forma de pago"],
    especialidades: ["especialidades", "especialistas", "servicios médicos", "qué ofrecen", "que ofrecen"],
    precios: ["precio", "costo", "cuánto cuesta", "cuanto cuesta", "tarifa", "valor"],
    disponibilidad: ["disponibilidad", "citas disponibles", "hay citas", "agenda", "agendar"],
  }

  // Verificar si la pregunta coincide con alguna categoría
  let categoriaEncontrada: string | undefined
  let subcategoriaEncontrada: string | undefined

  for (const [categoria, palabrasClave] of Object.entries(categorias)) {
    if (palabrasClave.some((palabra) => mensajeLimpio.includes(palabra))) {
      categoriaEncontrada = categoria
      break
    }
  }

  if (!categoriaEncontrada) {
    return { esPregunta: false }
  }

  // Buscar subcategorías específicas
  if (categoriaEncontrada === "horario") {
    if (mensajeLimpio.includes("sabado") || mensajeLimpio.includes("sábado")) {
      subcategoriaEncontrada = "sabado"
    } else if (mensajeLimpio.includes("domingo")) {
      subcategoriaEncontrada = "domingo"
    } else if (
      mensajeLimpio.includes("semana") ||
      mensajeLimpio.includes("lunes") ||
      mensajeLimpio.includes("martes") ||
      mensajeLimpio.includes("miercoles") ||
      mensajeLimpio.includes("miércoles") ||
      mensajeLimpio.includes("jueves") ||
      mensajeLimpio.includes("viernes")
    ) {
      subcategoriaEncontrada = "semana"
    } else {
      subcategoriaEncontrada = "completo"
    }
  } else if (categoriaEncontrada === "precios") {
    // Buscar menciones de servicios específicos
    const servicios = [
      "consulta general",
      "medicina general",
      "pediatría",
      "pediatria",
      "ginecología",
      "ginecologia",
      "cardiología",
      "cardiologia",
      "psicología",
      "psicologia",
      "nutrición",
      "nutricion",
      "dermatología",
      "dermatologia",
      "ultrasonido",
      "laboratorio",
    ]

    for (const servicio of servicios) {
      if (mensajeLimpio.includes(servicio)) {
        subcategoriaEncontrada = servicio
        break
      }
    }
  } else if (categoriaEncontrada === "disponibilidad") {
    if (mensajeLimpio.includes("hoy")) {
      subcategoriaEncontrada = "hoy"
    } else if (mensajeLimpio.includes("mañana") || mensajeLimpio.includes("manana")) {
      subcategoriaEncontrada = "manana"
    } else if (mensajeLimpio.includes("semana")) {
      subcategoriaEncontrada = "semana"
    }
  }

  return {
    esPregunta: true,
    categoria: categoriaEncontrada,
    subcategoria: subcategoriaEncontrada,
  }
}

// Función para detectar preguntas sobre estadísticas
function preguntaPorEstadisticas(mensaje: string): {
  esPregunta: boolean
  tipo?: string
  periodo?: string
  filtros?: Record<string, string>
} {
  const mensajeLimpio = mensaje
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  // Primero verificar si es una pregunta sobre citas olvidadas
  const patronesOlvidoCita = [
    "no recuerdo mi numero de cita",
    "no recuerdo mi cita",
    "olvide mi numero de cita",
    "olvidé mi número de cita",
    "no se mi numero de cita",
    "no sé mi número de cita",
    "perdi mi numero de cita",
    "perdí mi número de cita",
  ]

  if (patronesOlvidoCita.some((patron) => mensajeLimpio.includes(patron))) {
    return { esPregunta: false }
  }

  // Patrones para detectar preguntas sobre estadísticas
  const patronesEstadisticas = [
    "estadisticas",
    "estadísticas",
    "datos generales",
    "informacion general",
    "información general",
    "reporte",
    "resumen",
    "promedio de",
    "total de",
    "cantidad de",
    "porcentaje de",
  ]

  // Verificar si algún patrón coincide explícitamente
  const esPreguntaExplicita = patronesEstadisticas.some((patron) => mensajeLimpio.includes(patron))

  // Si no es una pregunta explícita sobre estadísticas, verificar patrones secundarios
  // pero solo si no parece ser una consulta sobre una cita específica
  if (!esPreguntaExplicita) {
    // Verificar si parece ser una consulta sobre una cita específica
    const patronesCitaEspecifica = [
      "mi cita",
      "cita numero",
      "numero de cita",
      "informacion de mi cita",
      "detalles de mi cita",
      "cuando es mi cita",
      "a que hora es mi cita",
    ]

    const pareceConsultaCita = patronesCitaEspecifica.some((patron) => mensajeLimpio.includes(patron))

    if (pareceConsultaCita) {
      return { esPregunta: false }
    }

    // Patrones secundarios (solo usar si no parece ser una consulta de cita)
    const patronesSecundarios = ["cuantos", "cuántos", "cuantas", "cuántas", "promedio", "numero de", "número de"]

    const esPreguntaSecundaria = patronesSecundarios.some((patron) => mensajeLimpio.includes(patron))

    if (!esPreguntaSecundaria) {
      return { esPregunta: false }
    }
  }

  // Determinar el tipo de estadística
  let tipo: string | undefined
  let periodo: string | undefined
  const filtros: Record<string, string> = {}

  // Tipos de estadísticas
  if (
    mensajeLimpio.includes("doctor") ||
    mensajeLimpio.includes("médico") ||
    mensajeLimpio.includes("medico") ||
    mensajeLimpio.includes("especialista")
  ) {
    tipo = "medicos"

    // Buscar especialidad
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
        filtros.especialidad = esp
        break
      }
    }
  } else if (
    mensajeLimpio.includes("cita") ||
    mensajeLimpio.includes("consulta") ||
    mensajeLimpio.includes("atendido") ||
    mensajeLimpio.includes("atendidos")
  ) {
    tipo = "citas"

    // Determinar periodo
    if (mensajeLimpio.includes("hoy") || mensajeLimpio.includes("dia") || mensajeLimpio.includes("día")) {
      periodo = "diario"
    } else if (mensajeLimpio.includes("semana") || mensajeLimpio.includes("semanal")) {
      periodo = "semanal"
    } else if (mensajeLimpio.includes("mes") || mensajeLimpio.includes("mensual")) {
      periodo = "mensual"
    } else if (mensajeLimpio.includes("año") || mensajeLimpio.includes("anual") || mensajeLimpio.includes("anio")) {
      periodo = "anual"
    }

    // Buscar estado de citas
    if (mensajeLimpio.includes("cancelada") || mensajeLimpio.includes("canceladas")) {
      filtros.nombre = "cancelaciones_ultimo_mes"
    } else if (
      mensajeLimpio.includes("urgencia") ||
      mensajeLimpio.includes("urgencias") ||
      mensajeLimpio.includes("emergencia")
    ) {
      filtros.nombre = "urgencias_semanal"
    } else if (
      mensajeLimpio.includes("no asistencia") ||
      mensajeLimpio.includes("no asistieron") ||
      mensajeLimpio.includes("faltaron")
    ) {
      filtros.nombre = "no_asistencia_semestral"
    } else if (
      mensajeLimpio.includes("tiempo") ||
      mensajeLimpio.includes("espera") ||
      mensajeLimpio.includes("demora")
    ) {
      filtros.nombre = "tiempo_espera_promedio"
    }
  } else if (
    mensajeLimpio.includes("servicio") ||
    mensajeLimpio.includes("precio") ||
    mensajeLimpio.includes("costo") ||
    mensajeLimpio.includes("tarifa")
  ) {
    tipo = "financiero"

    // Buscar servicios específicos
    if (mensajeLimpio.includes("consulta general") || mensajeLimpio.includes("medicina general")) {
      filtros.nombre = "costo_consulta_general"
    } else if (mensajeLimpio.includes("especialidad") || mensajeLimpio.includes("especialista")) {
      filtros.nombre = "costo_consulta_especialidad"
    } else if (mensajeLimpio.includes("urgencia") || mensajeLimpio.includes("emergencia")) {
      filtros.nombre = "costo_urgencias"
    }
  } else if (
    mensajeLimpio.includes("paciente") ||
    mensajeLimpio.includes("cliente") ||
    mensajeLimpio.includes("usuario")
  ) {
    tipo = "pacientes"

    // Buscar tipos específicos de pacientes
    if (mensajeLimpio.includes("mayor") || mensajeLimpio.includes("tercera edad") || mensajeLimpio.includes("60")) {
      filtros.nombre = "mayores_60"
    } else if (mensajeLimpio.includes("menor") || mensajeLimpio.includes("niño") || mensajeLimpio.includes("18")) {
      filtros.nombre = "menores_18"
    } else if (mensajeLimpio.includes("nuevo") || mensajeLimpio.includes("reciente")) {
      filtros.nombre = "nuevos_mensual"
    } else if (mensajeLimpio.includes("total") || mensajeLimpio.includes("registrado")) {
      filtros.nombre = "total_registrados"
    } else if (mensajeLimpio.includes("promedio") || mensajeLimpio.includes("diario")) {
      filtros.nombre = "promedio_diario"
    }

    // Marcar como solicitud de doctor para verificar permisos
    filtros.esDoctor = "true"
  } else if (
    mensajeLimpio.includes("tendencia") ||
    mensajeLimpio.includes("aumento") ||
    mensajeLimpio.includes("incremento") ||
    mensajeLimpio.includes("reducción") ||
    mensajeLimpio.includes("reduccion")
  ) {
    tipo = "tendencias"

    // Buscar tendencias específicas
    if (mensajeLimpio.includes("diabetes")) {
      filtros.nombre = "aumento_diabetes"
    } else if (mensajeLimpio.includes("hipertension") || mensajeLimpio.includes("hipertensión")) {
      filtros.nombre = "aumento_hipertension"
    } else if (
      mensajeLimpio.includes("gripe") ||
      mensajeLimpio.includes("campaña") ||
      mensajeLimpio.includes("prevención")
    ) {
      filtros.nombre = "reduccion_gripe_campana"
    }

    // Marcar como solicitud de doctor para verificar permisos
    filtros.esDoctor = "true"
  } else if (
    mensajeLimpio.includes("satisfaccion") ||
    mensajeLimpio.includes("satisfacción") ||
    mensajeLimpio.includes("calificacion") ||
    mensajeLimpio.includes("calificación") ||
    mensajeLimpio.includes("evaluacion") ||
    mensajeLimpio.includes("evaluación")
  ) {
    tipo = "satisfaccion"

    // Buscar calificaciones específicas
    if (mensajeLimpio.includes("pediatria") || mensajeLimpio.includes("pediatría")) {
      filtros.nombre = "calificacion_pediatria"
    } else if (mensajeLimpio.includes("cardiologia") || mensajeLimpio.includes("cardiología")) {
      filtros.nombre = "calificacion_cardiologia"
    } else if (mensajeLimpio.includes("ginecologia") || mensajeLimpio.includes("ginecología")) {
      filtros.nombre = "calificacion_ginecologia"
    } else if (mensajeLimpio.includes("dermatologia") || mensajeLimpio.includes("dermatología")) {
      filtros.nombre = "calificacion_dermatologia"
    } else {
      filtros.nombre = "calificacion_general"
    }
  } else if (
    mensajeLimpio.includes("temporada") ||
    mensajeLimpio.includes("estacion") ||
    mensajeLimpio.includes("estación") ||
    mensajeLimpio.includes("invierno") ||
    mensajeLimpio.includes("verano") ||
    mensajeLimpio.includes("primavera") ||
    mensajeLimpio.includes("otoño") ||
    mensajeLimpio.includes("otono")
  ) {
    tipo = "temporada"

    // Buscar temporadas específicas
    if (mensajeLimpio.includes("invierno")) {
      filtros.nombre = "consultas_invierno"
    } else if (mensajeLimpio.includes("verano")) {
      filtros.nombre = "consultas_verano"
    } else if (mensajeLimpio.includes("primavera")) {
      filtros.nombre = "consultas_primavera"
    } else if (mensajeLimpio.includes("otoño") || mensajeLimpio.includes("otono")) {
      filtros.nombre = "consultas_otono"
    }
  } else if (
    mensajeLimpio.includes("requisito") ||
    mensajeLimpio.includes("documento") ||
    mensajeLimpio.includes("necesito") ||
    mensajeLimpio.includes("presentar")
  ) {
    tipo = "requisitos"
  }

  return {
    esPregunta: true,
    tipo,
    periodo,
    filtros,
  }
}

// Función para detectar preguntas sobre análisis avanzados (solo para doctores)
function preguntaPorAnalisisAvanzado(mensaje: string): {
  esPregunta: boolean
  tipo?: string
  parametros?: Record<string, string>
} {
  const mensajeLimpio = mensaje
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  // Patrones para detectar preguntas sobre análisis avanzados
  const patronesAnalisis = [
    "correlacion",
    "correlación",
    "tendencia",
    "patron",
    "patrón",
    "analisis",
    "análisis",
    "comportamiento",
    "prediccion",
    "predicción",
    "riesgo",
    "tasa",
    "frecuencia",
    "variacion",
    "variación",
  ]

  // Verificar si algún patrón coincide
  const esPregunta = patronesAnalisis.some((patron) => mensajeLimpio.includes(patron))

  if (!esPregunta) {
    return { esPregunta: false }
  }

  // Determinar el tipo de análisis
  let tipo: string | undefined
  const parametros: Record<string, string> = {}

  // Tipos de análisis avanzados
  if (
    (mensajeLimpio.includes("tendencia") || mensajeLimpio.includes("comportamiento")) &&
    (mensajeLimpio.includes("cita") || mensajeLimpio.includes("consulta")) &&
    (mensajeLimpio.includes("especialidad") || mensajeLimpio.includes("especialidades"))
  ) {
    tipo = "tendencia_citas_especialidad"
  } else if (
    (mensajeLimpio.includes("tasa") || mensajeLimpio.includes("frecuencia")) &&
    (mensajeLimpio.includes("reconsulta") ||
      mensajeLimpio.includes("reconsultas") ||
      mensajeLimpio.includes("volver") ||
      mensajeLimpio.includes("retorno"))
  ) {
    tipo = "tasa_reconsultas"
  } else if (
    (mensajeLimpio.includes("correlacion") ||
      mensajeLimpio.includes("correlación") ||
      mensajeLimpio.includes("relacion") ||
      mensajeLimpio.includes("relación")) &&
    (mensajeLimpio.includes("edad") || mensajeLimpio.includes("años")) &&
    (mensajeLimpio.includes("frecuencia") ||
      mensajeLimpio.includes("numero") ||
      mensajeLimpio.includes("número") ||
      mensajeLimpio.includes("cantidad"))
  ) {
    tipo = "correlacion_edad_consultas"
  }

  // Determinar periodo para el análisis
  if (
    mensajeLimpio.includes("mes") ||
    mensajeLimpio.includes("mensual") ||
    mensajeLimpio.includes("ultimo mes") ||
    mensajeLimpio.includes("último mes")
  ) {
    parametros.periodo = "mes"
  } else if (
    mensajeLimpio.includes("trimestre") ||
    mensajeLimpio.includes("tres meses") ||
    mensajeLimpio.includes("ultimos tres meses") ||
    mensajeLimpio.includes("últimos tres meses")
  ) {
    parametros.periodo = "trimestre"
  } else if (
    mensajeLimpio.includes("semestre") ||
    mensajeLimpio.includes("seis meses") ||
    mensajeLimpio.includes("ultimos seis meses") ||
    mensajeLimpio.includes("últimos seis meses")
  ) {
    parametros.periodo = "semestre"
  } else if (
    mensajeLimpio.includes("año") ||
    mensajeLimpio.includes("anual") ||
    mensajeLimpio.includes("ultimo año") ||
    mensajeLimpio.includes("último año")
  ) {
    parametros.periodo = "año"
  } else {
    // Por defecto, usar año
    parametros.periodo = "año"
  }

  return {
    esPregunta: true,
    tipo,
    parametros,
  }
}

export async function POST(request: Request) {
  try {
    const { mensajeActual, mensajesAnteriores, esDoctor, medicoId } = await request.json()

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

    // Verificar si el mensaje pregunta por estadísticas de la nueva tabla
    const estadisticasQuery = preguntaPorEstadisticas(mensajeActual)
    if (estadisticasQuery.esPregunta) {
      try {
        // Si es una consulta de pacientes y no es doctor, restringir acceso
        if ((estadisticasQuery.tipo === "pacientes" || estadisticasQuery.tipo === "tendencias") && !esDoctor) {
          return NextResponse.json({
            success: true,
            requiereContexto: true,
            respuesta:
              "Lo siento, la información detallada sobre pacientes y tendencias médicas solo está disponible para el personal médico autorizado. ¿Puedo ayudarle con otra consulta?",
          })
        }

        // Usar URL relativa en lugar de absoluta para evitar problemas de CORS
        const response = await fetch(`/api/chatbot/estadisticas-db`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            categoria: estadisticasQuery.tipo,
            periodo: estadisticasQuery.periodo,
            nombre: estadisticasQuery.filtros?.nombre,
            esDoctor: esDoctor ? "true" : "false",
          }),
        })

        if (!response.ok) {
          throw new Error("Error al obtener estadísticas")
        }

        const data = await response.json()

        if (data.success && data.data && data.data.length > 0) {
          // Formatear la respuesta según el tipo de estadística
          let respuesta = ""

          switch (estadisticasQuery.tipo) {
            case "medicos":
              if (estadisticasQuery.filtros?.especialidad) {
                const medicosEspecialidad = data.data.find((item: any) =>
                  item.nombre.toLowerCase().includes(estadisticasQuery.filtros?.especialidad?.toLowerCase()),
                )

                if (medicosEspecialidad) {
                  respuesta = `Actualmente contamos con ${medicosEspecialidad.valor} médicos en la especialidad de ${medicosEspecialidad.nombre.replace("_", " ")}.`
                } else {
                  respuesta = "No encontré información específica sobre esa especialidad."
                }
              } else {
                const totalMedicos = data.data.find((item: any) => item.nombre === "total_especialistas")

                respuesta = `El Centro Médico cuenta con un total de ${totalMedicos?.valor || "varios"} médicos especialistas distribuidos en las siguientes especialidades:\n\n`

                data.data.forEach((item: any) => {
                  if (item.nombre !== "total_especialistas") {
                    respuesta += `- ${item.nombre.replace("_", " ")}: ${item.valor} médicos\n`
                  }
                })
              }
              break

            case "citas":
              if (estadisticasQuery.filtros?.nombre) {
                const estadisticaCita = data.data.find((item: any) => item.nombre === estadisticasQuery.filtros?.nombre)

                if (estadisticaCita) {
                  if (estadisticaCita.nombre === "cancelaciones_ultimo_mes") {
                    respuesta = `En el último mes se han cancelado ${estadisticaCita.valor} citas.`
                  } else if (estadisticaCita.nombre === "urgencias_semanal") {
                    respuesta = `El promedio de consultas de urgencia por semana es de ${estadisticaCita.valor}.`
                  } else if (estadisticaCita.nombre === "no_asistencia_semestral") {
                    respuesta = `En los últimos 6 meses, ${estadisticaCita.valor} pacientes no asistieron a su cita programada.`
                  } else if (estadisticaCita.nombre === "tiempo_espera_promedio") {
                    respuesta = `El tiempo promedio de espera para una consulta es de ${estadisticaCita.valor} minutos.`
                  }
                } else {
                  respuesta = "No encontré información específica sobre ese tipo de citas."
                }
              } else {
                const promedioDiario = data.data.find((item: any) => item.nombre === "promedio_diario")

                respuesta = `Estadísticas de citas:\n\n`
                respuesta += `- Promedio diario: ${promedioDiario?.valor || "N/A"} citas\n`

                data.data.forEach((item: any) => {
                  if (item.nombre !== "promedio_diario") {
                    respuesta += `- ${item.nombre.replace(/_/g, " ")}: ${item.valor}\n`
                  }
                })
              }
              break

            case "financiero":
              if (estadisticasQuery.filtros?.nombre) {
                const estadisticaFinanciera = data.data.find(
                  (item: any) => item.nombre === estadisticasQuery.filtros?.nombre,
                )

                if (estadisticaFinanciera) {
                  respuesta = `El costo de ${estadisticaFinanciera.nombre.replace("costo_", "").replace(/_/g, " ")} es de Q${estadisticaFinanciera.valor}.`
                } else {
                  respuesta = "No encontré información específica sobre ese servicio."
                }
              } else {
                respuesta = "Información de costos:\n\n"

                data.data.forEach((item: any) => {
                  if (item.nombre.startsWith("costo_")) {
                    respuesta += `- ${item.nombre.replace("costo_", "").replace(/_/g, " ")}: Q${item.valor}\n`
                  }
                })

                // Agregar información sobre métodos de pago
                const metodosPago = data.data.filter((item: any) => item.nombre.startsWith("metodo_pago_"))
                if (metodosPago.length > 0) {
                  respuesta += "\nMétodos de pago aceptados:\n"
                  metodosPago.forEach((item: any) => {
                    if (item.valor === 1) {
                      respuesta += `- ${item.nombre.replace("metodo_pago_", "").replace(/_/g, " ")}\n`
                    }
                  })
                }
              }
              break

            case "pacientes":
              if (esDoctor) {
                if (estadisticasQuery.filtros?.nombre) {
                  const estadisticaPaciente = data.data.find(
                    (item: any) => item.nombre === estadisticasQuery.filtros?.nombre,
                  )

                  if (estadisticaPaciente) {
                    if (estadisticaPaciente.nombre === "mayores_60") {
                      respuesta = `Actualmente hay ${estadisticaPaciente.valor} pacientes mayores de 60 años registrados.`
                    } else if (estadisticaPaciente.nombre === "menores_18") {
                      respuesta = `Actualmente hay ${estadisticaPaciente.valor} pacientes menores de 18 años registrados.`
                    } else if (estadisticaPaciente.nombre === "nuevos_mensual") {
                      respuesta = `El promedio de nuevos pacientes registrados por mes es de ${estadisticaPaciente.valor}.`
                    } else if (estadisticaPaciente.nombre === "total_registrados") {
                      respuesta = `El total de pacientes registrados en el sistema es de ${estadisticaPaciente.valor}.`
                    } else if (estadisticaPaciente.nombre === "promedio_diario") {
                      respuesta = `El promedio de pacientes atendidos por día es de ${estadisticaPaciente.valor}.`
                    }
                  } else {
                    respuesta = "No encontré información específica sobre ese tipo de pacientes."
                  }
                } else {
                  const totalPacientes = data.data.find((item: any) => item.nombre === "total_registrados")

                  respuesta = `Estadísticas de pacientes:\n\n`
                  respuesta += `- Total registrados: ${totalPacientes?.valor || "N/A"}\n`
                  respuesta += `- Promedio diario: ${data.data.find((item: any) => item.nombre === "promedio_diario")?.valor || "N/A"}\n`
                  respuesta += `- Mayores de 60 años: ${data.data.find((item: any) => item.nombre === "mayores_60")?.valor || "N/A"}\n`
                  respuesta += `- Menores de 18 años: ${data.data.find((item: any) => item.nombre === "menores_18")?.valor || "N/A"}\n`
                  respuesta += `- Nuevos pacientes por mes: ${data.data.find((item: any) => item.nombre === "nuevos_mensual")?.valor || "N/A"}\n`
                }
              } else {
                respuesta =
                  "Lo siento, la información detallada sobre pacientes solo está disponible para el personal médico autorizado."
              }
              break

            case "tendencias":
              if (esDoctor) {
                if (estadisticasQuery.filtros?.nombre) {
                  const estadisticaTendencia = data.data.find(
                    (item: any) => item.nombre === estadisticasQuery.filtros?.nombre,
                  )

                  if (estadisticaTendencia) {
                    if (estadisticaTendencia.nombre === "aumento_diabetes") {
                      respuesta = `En los últimos 5 años, ha habido un aumento del ${estadisticaTendencia.valor}% en diagnósticos de diabetes.`
                    } else if (estadisticaTendencia.nombre === "aumento_hipertension") {
                      respuesta = `En los últimos 5 años, ha habido un aumento del ${estadisticaTendencia.valor}% en diagnósticos de hipertensión.`
                    } else if (estadisticaTendencia.nombre === "reduccion_gripe_campana") {
                      respuesta = `Las campañas de prevención han logrado una reducción del ${estadisticaTendencia.valor}% en consultas por gripe.`
                    }
                  } else {
                    respuesta = "No encontré información específica sobre esa tendencia."
                  }
                } else {
                  respuesta = "Tendencias médicas:\n\n"

                  data.data.forEach((item: any) => {
                    if (item.nombre.includes("aumento")) {
                      respuesta += `- ${item.nombre.replace("aumento_", "").replace(/_/g, " ")}: aumento del ${item.valor}%\n`
                    } else if (item.nombre.includes("reduccion")) {
                      respuesta += `- ${item.nombre.replace("reduccion_", "").replace(/_/g, " ")}: reducción del ${item.valor}%\n`
                    } else if (item.nombre.includes("reconsultas")) {
                      respuesta += `- ${item.nombre.replace(/_/g, " ")}: ${item.valor}%\n`
                    }
                  })
                }
              } else {
                respuesta =
                  "Lo siento, la información sobre tendencias médicas solo está disponible para el personal médico autorizado."
              }
              break

            case "satisfaccion":
              if (estadisticasQuery.filtros?.nombre) {
                const estadisticaSatisfaccion = data.data.find(
                  (item: any) => item.nombre === estadisticasQuery.filtros?.nombre,
                )

                if (estadisticaSatisfaccion) {
                  respuesta = `La calificación promedio de ${estadisticaSatisfaccion.nombre.replace("calificacion_", "").replace(/_/g, " ")} es de ${estadisticaSatisfaccion.valor} sobre 5.`
                } else {
                  respuesta = "No encontré información específica sobre esa calificación."
                }
              } else {
                const calificacionGeneral = data.data.find((item: any) => item.nombre === "calificacion_general")

                respuesta = `Calificaciones de satisfacción (sobre 5):\n\n`
                respuesta += `- General: ${calificacionGeneral?.valor || "N/A"}\n`

                data.data.forEach((item: any) => {
                  if (item.nombre !== "calificacion_general" && item.nombre.startsWith("calificacion_")) {
                    respuesta += `- ${item.nombre.replace("calificacion_", "").replace(/_/g, " ")}: ${item.valor}\n`
                  }
                })
              }
              break

            case "temporada":
              if (estadisticasQuery.filtros?.nombre) {
                const estadisticaTemporada = data.data.find(
                  (item: any) => item.nombre === estadisticasQuery.filtros?.nombre,
                )

                if (estadisticaTemporada) {
                  respuesta = `El promedio de consultas diarias en ${estadisticaTemporada.nombre.replace("consultas_", "").replace(/_/g, " ")} es de ${estadisticaTemporada.valor}.`
                } else {
                  respuesta = "No encontré información específica sobre esa temporada."
                }
              } else {
                respuesta = "Consultas por temporada (promedio diario):\n\n"

                data.data.forEach((item: any) => {
                  if (item.nombre.startsWith("consultas_")) {
                    respuesta += `- ${item.nombre.replace("consultas_", "").replace(/_/g, " ")}: ${item.valor}\n`
                  }
                })
              }
              break

            case "requisitos":
              respuesta = "Documentos necesarios para registro:\n\n"

              data.data.forEach((item: any) => {
                if (item.valor === 1) {
                  respuesta += `- ${item.descripcion}\n`
                }
              })
              break

            default:
              respuesta =
                "Encontré información estadística, pero no puedo formatearla adecuadamente. Por favor, contacte directamente al Centro Médico al 4644-9158 para más detalles."
          }

          return NextResponse.json({
            success: true,
            requiereContexto: true,
            respuesta,
          })
        }
      } catch (error) {
        console.error("Error al procesar consulta de estadísticas:", error)
        // Continuar con el flujo normal si hay error
      }
    }

    // Verificar si el mensaje pregunta por información general
    const infoGeneralQuery = preguntaPorInfoGeneral(mensajeActual)
    if (infoGeneralQuery.esPregunta) {
      try {
        const response = await fetch("/api/chatbot/info-general", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            categoria: infoGeneralQuery.categoria,
            subcategoria: infoGeneralQuery.subcategoria,
            esDoctor,
          }),
        })

        if (!response.ok) {
          throw new Error("Error al obtener información general")
        }

        const data = await response.json()

        if (data.success) {
          // Formatear la respuesta según la categoría
          let respuesta = ""

          switch (infoGeneralQuery.categoria) {
            case "horario":
              if (infoGeneralQuery.subcategoria === "sabado") {
                respuesta = `El horario de atención los sábados es de ${data.data.sabado}.`
              } else if (infoGeneralQuery.subcategoria === "domingo") {
                respuesta = `${data.data.domingo}. No atendemos los domingos.`
              } else if (infoGeneralQuery.subcategoria === "semana") {
                respuesta = `El horario de atención entre semana es de ${data.data.semana}.`
              } else {
                respuesta = `Nuestro horario de atención es: ${data.data.completo}.`
              }
              break

            case "ubicacion":
              respuesta = `El Centro Médico Familiar está ubicado en: ${data.data.direccion}. ${data.data.referencia}.`
              break

            case "contacto":
              respuesta = `Puede contactarnos al teléfono ${data.data.telefono}, por WhatsApp al ${data.data.whatsapp} o por correo a ${data.data.email}.`
              break

            case "documentos_registro":
              respuesta = "Para registrarse como paciente, necesita presentar los siguientes documentos:\n\n"
              data.data.forEach((doc: string, index: number) => {
                respuesta += `${index + 1}. ${doc}\n`
              })
              break

            case "metodos_pago":
              respuesta = "Aceptamos los siguientes métodos de pago:\n\n"
              data.data.forEach((metodo: string, index: number) => {
                respuesta += `${index + 1}. ${metodo}\n`
              })
              break

            case "especialidades":
              respuesta = "Ofrecemos las siguientes especialidades médicas:\n\n"
              data.data.especialidades.forEach((esp: string, index: number) => {
                respuesta += `${index + 1}. ${esp}\n`
              })
              break

            case "precios":
              if (infoGeneralQuery.subcategoria) {
                const servicio = data.data.servicios.find((s: any) =>
                  s.nombre.toLowerCase().includes(infoGeneralQuery.subcategoria!.toLowerCase()),
                )

                if (servicio) {
                  respuesta = `El precio de ${servicio.nombre} es de Q${servicio.precio} (sin IVA). ${servicio.descripcion}`
                } else {
                  respuesta =
                    "No encontré información sobre el precio de ese servicio específico. Por favor, consulte nuestra lista completa de precios o llame al 4644-9158."
                }
              } else {
                respuesta = "Estos son algunos de nuestros precios (sin IVA):\n\n"
                data.data.servicios.slice(0, 5).forEach((servicio: any) => {
                  respuesta += `- ${servicio.nombre}: Q${servicio.precio}\n`
                })
                respuesta += "\nPara más información, puede llamar al 4644-9158."
              }
              break

            case "disponibilidad":
              if (infoGeneralQuery.subcategoria === "hoy") {
                respuesta = `Hoy tenemos ${data.data.disponibilidad_hoy} espacios disponibles para citas.`
              } else if (infoGeneralQuery.subcategoria === "manana") {
                respuesta = `Para mañana tenemos ${data.data.disponibilidad_manana} espacios disponibles para citas.`
              } else {
                respuesta = "Disponibilidad de citas para esta semana:\n\n"
                Object.entries(data.data.disponibilidad_semana).forEach(([fecha, disponibles]: [string, any]) => {
                  const fechaObj = new Date(fecha)
                  const opciones: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" }
                  const fechaFormateada = fechaObj.toLocaleDateString("es-ES", opciones)
                  respuesta += `- ${fechaFormateada}: ${disponibles} espacios disponibles\n`
                })
              }
              break

            default:
              respuesta =
                "Encontré información relevante, pero no puedo formatearla adecuadamente. Por favor, contacte directamente al 4644-9158 para más detalles."
          }

          return NextResponse.json({
            success: true,
            requiereContexto: true,
            respuesta,
          })
        }
      } catch (error) {
        console.error("Error al procesar consulta de información general:", error)
        // Continuar con el flujo normal si hay error
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
        let query = supabase.from("doctores").select("id, nombre, especialidad")

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
            respuesta += `Especialidad: ${doctor.especialidad}\n\n`
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
