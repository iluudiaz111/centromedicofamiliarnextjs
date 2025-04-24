import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { query, queryType } = await request.json()
    const supabase = createServerSupabaseClient()
    let result = null

    // Manejar diferentes tipos de consultas
    switch (queryType) {
      case "doctores_por_especialidad":
        // Contar doctores por especialidad
        const { data: doctoresPorEspecialidad } = await supabase
          .from("doctores")
          .select("especialidad, id")
          .order("especialidad")

        if (doctoresPorEspecialidad) {
          const conteo: Record<string, number> = {}
          doctoresPorEspecialidad.forEach((doc) => {
            conteo[doc.especialidad] = (conteo[doc.especialidad] || 0) + 1
          })
          result = conteo
        }
        break

      case "citas_por_estado":
        // Contar citas por estado
        const { data: citasPorEstado } = await supabase.from("citas").select("estado, id").order("estado")

        if (citasPorEstado) {
          const conteo: Record<string, number> = {}
          citasPorEstado.forEach((cita) => {
            conteo[cita.estado] = (conteo[cita.estado] || 0) + 1
          })
          result = conteo
        }
        break

      case "pacientes_con_alergias":
        // Contar pacientes con alergias
        const { data: pacientesConAlergias } = await supabase
          .from("paciente_alergia")
          .select("paciente_id")
          .order("paciente_id")

        if (pacientesConAlergias) {
          const pacientesUnicos = new Set(pacientesConAlergias.map((pa) => pa.paciente_id))
          result = {
            total: pacientesUnicos.size,
          }
        }
        break

      case "medicamento_mas_recetado":
        // Encontrar el medicamento más recetado
        const { data: recetasMedicamentos } = await supabase
          .from("receta_medicamento")
          .select("medicamento_id, receta_id")

        if (recetasMedicamentos) {
          const conteo: Record<number, number> = {}
          recetasMedicamentos.forEach((rm) => {
            conteo[rm.medicamento_id] = (conteo[rm.medicamento_id] || 0) + 1
          })

          let maxCount = 0
          let medicamentoMasRecetadoId = 0

          Object.entries(conteo).forEach(([medId, count]) => {
            if (count > maxCount) {
              maxCount = count
              medicamentoMasRecetadoId = Number.parseInt(medId)
            }
          })

          if (medicamentoMasRecetadoId > 0) {
            const { data: medicamento } = await supabase
              .from("medicamentos")
              .select("nombre, tipo")
              .eq("id", medicamentoMasRecetadoId)
              .single()

            if (medicamento) {
              result = {
                nombre: medicamento.nombre,
                tipo: medicamento.tipo,
                recetas: maxCount,
              }
            }
          }
        }
        break

      case "especialidad_mejor_calificada":
        // Encontrar la especialidad mejor calificada
        const { data: encuestas } = await supabase.from("encuestas_satisfaccion").select("doctor_id, calificacion")

        if (encuestas && encuestas.length > 0) {
          const calificacionesPorDoctor: Record<number, number[]> = {}

          encuestas.forEach((e) => {
            if (!calificacionesPorDoctor[e.doctor_id]) {
              calificacionesPorDoctor[e.doctor_id] = []
            }
            calificacionesPorDoctor[e.doctor_id].push(e.calificacion)
          })

          const promedioPorDoctor: Record<number, number> = {}

          Object.entries(calificacionesPorDoctor).forEach(([doctorId, calificaciones]) => {
            const promedio = calificaciones.reduce((sum, cal) => sum + cal, 0) / calificaciones.length
            promedioPorDoctor[Number.parseInt(doctorId)] = promedio
          })

          // Obtener especialidad de cada doctor
          const doctoresIds = Object.keys(promedioPorDoctor).map((id) => Number.parseInt(id))
          const { data: doctoresInfo } = await supabase
            .from("doctores")
            .select("id, nombre, especialidad")
            .in("id", doctoresIds)

          if (doctoresInfo) {
            const calificacionesPorEspecialidad: Record<string, { sum: number; count: number }> = {}

            doctoresInfo.forEach((doctor) => {
              const especialidad = doctor.especialidad
              const calificacion = promedioPorDoctor[doctor.id]

              if (!calificacionesPorEspecialidad[especialidad]) {
                calificacionesPorEspecialidad[especialidad] = { sum: 0, count: 0 }
              }

              calificacionesPorEspecialidad[especialidad].sum += calificacion
              calificacionesPorEspecialidad[especialidad].count += 1
            })

            let mejorEspecialidad = ""
            let mejorCalificacion = 0

            Object.entries(calificacionesPorEspecialidad).forEach(([especialidad, datos]) => {
              const promedio = datos.sum / datos.count
              if (promedio > mejorCalificacion) {
                mejorCalificacion = promedio
                mejorEspecialidad = especialidad
              }
            })

            result = {
              especialidad: mejorEspecialidad,
              calificacion: mejorCalificacion.toFixed(2),
            }
          }
        }
        break

      default:
        // Consulta simple
        result = { message: "Tipo de consulta no soportado" }
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error("Error en la consulta:", error)
    return NextResponse.json({ success: false, error: "Error al procesar la consulta" }, { status: 500 })
  }
}
