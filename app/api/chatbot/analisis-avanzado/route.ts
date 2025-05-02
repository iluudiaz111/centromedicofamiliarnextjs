import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { tipo, parametros, medicoId } = await request.json()

    // Verificar que sea una solicitud de un médico
    if (!medicoId) {
      return NextResponse.json(
        {
          success: false,
          error: "Acceso restringido. Esta información solo está disponible para médicos autorizados.",
        },
        { status: 403 },
      )
    }

    const supabase = createServerSupabaseClient()

    // Verificar que el ID del médico sea válido
    const { data: medico, error: errorMedico } = await supabase
      .from("doctores")
      .select("id, nombre")
      .eq("id", medicoId)
      .single()

    if (errorMedico || !medico) {
      return NextResponse.json(
        {
          success: false,
          error: "Médico no autorizado o ID inválido.",
        },
        { status: 403 },
      )
    }

    // Análisis de tendencias de citas por especialidad
    if (tipo === "tendencia_citas_especialidad") {
      const { periodo = "año" } = parametros || {}

      // Determinar el rango de fechas según el periodo
      const hoy = new Date()
      let fechaInicio

      switch (periodo) {
        case "mes":
          fechaInicio = new Date(hoy)
          fechaInicio.setMonth(hoy.getMonth() - 1)
          break
        case "trimestre":
          fechaInicio = new Date(hoy)
          fechaInicio.setMonth(hoy.getMonth() - 3)
          break
        case "semestre":
          fechaInicio = new Date(hoy)
          fechaInicio.setMonth(hoy.getMonth() - 6)
          break
        case "año":
        default:
          fechaInicio = new Date(hoy)
          fechaInicio.setFullYear(hoy.getFullYear() - 1)
          break
      }

      const fechaInicioStr = fechaInicio.toISOString().split("T")[0]

      // Consultar citas en el periodo especificado
      const { data: citas, error } = await supabase
        .from("citas")
        .select(`
          id,
          fecha,
          estado,
          doctores (
            especialidad
          )
        `)
        .gte("fecha", fechaInicioStr)
        .order("fecha")

      if (error) {
        console.error("Error al obtener citas para análisis de tendencias:", error)
        return NextResponse.json({ success: false, error: "Error al analizar tendencias de citas" }, { status: 500 })
      }

      // Agrupar citas por mes y especialidad
      const citasPorMesYEspecialidad: Record<string, Record<string, number>> = {}

      citas.forEach((cita) => {
        if (!cita.fecha || !cita.doctores?.especialidad) return

        const fecha = new Date(cita.fecha)
        const mesAno = `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, "0")}`
        const especialidad = cita.doctores.especialidad

        if (!citasPorMesYEspecialidad[mesAno]) {
          citasPorMesYEspecialidad[mesAno] = {}
        }

        citasPorMesYEspecialidad[mesAno][especialidad] = (citasPorMesYEspecialidad[mesAno][especialidad] || 0) + 1
      })

      // Ordenar los meses cronológicamente
      const mesesOrdenados = Object.keys(citasPorMesYEspecialidad).sort()

      // Obtener todas las especialidades únicas
      const especialidadesUnicas = new Set<string>()
      Object.values(citasPorMesYEspecialidad).forEach((mesData) => {
        Object.keys(mesData).forEach((esp) => especialidadesUnicas.add(esp))
      })

      // Formatear los datos para el análisis de tendencias
      const tendencias = mesesOrdenados.map((mes) => {
        const datosMes: Record<string, any> = { mes }

        especialidadesUnicas.forEach((esp) => {
          datosMes[esp] = citasPorMesYEspecialidad[mes][esp] || 0
        })

        return datosMes
      })

      return NextResponse.json({
        success: true,
        data: {
          tendencias,
          especialidades: Array.from(especialidadesUnicas),
          periodo,
        },
      })
    }

    // Análisis de reconsultas por especialidad
    if (tipo === "tasa_reconsultas") {
      const { periodo = "año" } = parametros || {}

      // Determinar el rango de fechas según el periodo
      const hoy = new Date()
      let fechaInicio

      switch (periodo) {
        case "mes":
          fechaInicio = new Date(hoy)
          fechaInicio.setMonth(hoy.getMonth() - 1)
          break
        case "trimestre":
          fechaInicio = new Date(hoy)
          fechaInicio.setMonth(hoy.getMonth() - 3)
          break
        case "semestre":
          fechaInicio = new Date(hoy)
          fechaInicio.setMonth(hoy.getMonth() - 6)
          break
        case "año":
        default:
          fechaInicio = new Date(hoy)
          fechaInicio.setFullYear(hoy.getFullYear() - 1)
          break
      }

      const fechaInicioStr = fechaInicio.toISOString().split("T")[0]

      // Consultar citas en el periodo especificado
      const { data: citas, error } = await supabase
        .from("citas")
        .select(`
          id,
          fecha,
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
        .gte("fecha", fechaInicioStr)
        .order("fecha")

      if (error) {
        console.error("Error al obtener citas para análisis de reconsultas:", error)
        return NextResponse.json({ success: false, error: "Error al analizar tasa de reconsultas" }, { status: 500 })
      }

      // Contar consultas por paciente y especialidad
      const consultasPorPacienteYEspecialidad: Record<string, Record<string, number>> = {}

      citas.forEach((cita) => {
        if (!cita.pacientes?.id || !cita.doctores?.especialidad) return

        const pacienteId = cita.pacientes.id.toString()
        const especialidad = cita.doctores.especialidad

        if (!consultasPorPacienteYEspecialidad[pacienteId]) {
          consultasPorPacienteYEspecialidad[pacienteId] = {}
        }

        consultasPorPacienteYEspecialidad[pacienteId][especialidad] =
          (consultasPorPacienteYEspecialidad[pacienteId][especialidad] || 0) + 1
      })

      // Calcular reconsultas por especialidad
      const reconsultasPorEspecialidad: Record<string, any> = {}
      const pacientesPorEspecialidad: Record<string, number> = {}

      Object.values(consultasPorPacienteYEspecialidad).forEach((pacienteData) => {
        Object.entries(pacienteData).forEach(([especialidad, consultas]) => {
          if (!reconsultasPorEspecialidad[especialidad]) {
            reconsultasPorEspecialidad[especialidad] = {
              total_pacientes: 0,
              pacientes_con_reconsulta: 0,
              total_consultas: 0,
            }
          }

          reconsultasPorEspecialidad[especialidad].total_pacientes++
          reconsultasPorEspecialidad[especialidad].total_consultas += consultas

          if (consultas > 1) {
            reconsultasPorEspecialidad[especialidad].pacientes_con_reconsulta++
          }
        })
      })

      // Calcular tasas de reconsulta
      Object.keys(reconsultasPorEspecialidad).forEach((especialidad) => {
        const datos = reconsultasPorEspecialidad[especialidad]
        datos.tasa_reconsulta =
          datos.total_pacientes > 0 ? ((datos.pacientes_con_reconsulta / datos.total_pacientes) * 100).toFixed(2) : 0
        datos.promedio_consultas_por_paciente =
          datos.total_pacientes > 0 ? (datos.total_consultas / datos.total_pacientes).toFixed(2) : 0
      })

      return NextResponse.json({
        success: true,
        data: {
          reconsultas_por_especialidad: reconsultasPorEspecialidad,
          periodo,
        },
      })
    }

    // Análisis de correlación entre edad y frecuencia de consultas
    if (tipo === "correlacion_edad_consultas") {
      // Consultar pacientes con sus edades y número de consultas
      const { data: pacientes, error: errorPacientes } = await supabase.from("pacientes").select(`
          id,
          nombre,
          fecha_nacimiento
        `)

      if (errorPacientes) {
        console.error("Error al obtener pacientes para análisis de correlación:", errorPacientes)
        return NextResponse.json(
          { success: false, error: "Error al analizar correlación edad-consultas" },
          { status: 500 },
        )
      }

      // Consultar citas para cada paciente
      const citasPorPaciente: Record<string, number> = {}

      for (const paciente of pacientes) {
        const { data: citas, error: errorCitas } = await supabase
          .from("citas")
          .select("id")
          .eq("paciente_id", paciente.id)

        if (!errorCitas) {
          citasPorPaciente[paciente.id] = citas?.length || 0
        }
      }

      // Calcular edad de cada paciente y agrupar por rango de edad
      const hoy = new Date()
      const consultasPorRangoEdad: Record<string, { total_pacientes: number; total_consultas: number }> = {
        "0-18": { total_pacientes: 0, total_consultas: 0 },
        "19-35": { total_pacientes: 0, total_consultas: 0 },
        "36-50": { total_pacientes: 0, total_consultas: 0 },
        "51-65": { total_pacientes: 0, total_consultas: 0 },
        "66+": { total_pacientes: 0, total_consultas: 0 },
      }

      pacientes.forEach((paciente) => {
        if (!paciente.fecha_nacimiento) return

        const fechaNac = new Date(paciente.fecha_nacimiento)
        const edad = hoy.getFullYear() - fechaNac.getFullYear()
        const consultas = citasPorPaciente[paciente.id] || 0

        let rangoEdad
        if (edad <= 18) rangoEdad = "0-18"
        else if (edad <= 35) rangoEdad = "19-35"
        else if (edad <= 50) rangoEdad = "36-50"
        else if (edad <= 65) rangoEdad = "51-65"
        else rangoEdad = "66+"

        consultasPorRangoEdad[rangoEdad].total_pacientes++
        consultasPorRangoEdad[rangoEdad].total_consultas += consultas
      })

      // Calcular promedio de consultas por rango de edad
      Object.keys(consultasPorRangoEdad).forEach((rango) => {
        const datos = consultasPorRangoEdad[rango]
        datos.promedio_consultas =
          datos.total_pacientes > 0 ? (datos.total_consultas / datos.total_pacientes).toFixed(2) : "0"
      })

      return NextResponse.json({
        success: true,
        data: {
          consultas_por_rango_edad: consultasPorRangoEdad,
        },
      })
    }

    // Si no se especifica un tipo válido de análisis
    return NextResponse.json({ success: false, error: "Tipo de análisis no válido o no soportado" }, { status: 400 })
  } catch (error) {
    console.error("Error en el endpoint de análisis avanzado:", error)
    return NextResponse.json(
      { success: false, error: "Error al procesar la solicitud de análisis avanzado" },
      { status: 500 },
    )
  }
}
