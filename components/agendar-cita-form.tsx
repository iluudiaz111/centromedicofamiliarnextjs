"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  CalendarIcon,
  CheckCircle,
  Clock,
  CalendarPlus2Icon as CalendarIcon2,
  User,
  Stethoscope,
  FileText,
} from "lucide-react"
import { createClientSupabaseClient } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface AgendarCitaFormProps {
  onSuccess?: () => void
}

const formSchema = z.object({
  nombre: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
  email: z.string().email({
    message: "Por favor ingrese un email válido.",
  }),
  telefono: z.string().min(8, {
    message: "Por favor ingrese un número de teléfono válido.",
  }),
  fecha: z.date({
    required_error: "Por favor seleccione una fecha para la cita.",
  }),
  hora: z.string({
    required_error: "Por favor seleccione una hora para la cita.",
  }),
  doctor: z.string({
    required_error: "Por favor seleccione un doctor.",
  }),
  motivo: z
    .string()
    .min(5, {
      message: "Por favor describa brevemente el motivo de su consulta.",
    })
    .max(500, {
      message: "El motivo no puede exceder los 500 caracteres.",
    }),
})

const horarios = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
]

// Tipo para la información de la cita
type CitaInfo = {
  numeroCita: string
  fecha: Date
  hora: string
  motivo: string
  paciente: {
    nombre: string
    email: string
    telefono: string
  }
  doctor: {
    id: number
    nombre: string
    especialidad: string
  }
}

export function AgendarCitaForm({ onSuccess }: AgendarCitaFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [citaInfo, setCitaInfo] = useState<CitaInfo | null>(null)
  const [doctores, setDoctores] = useState<any[]>([])
  const [isLoadingDoctores, setIsLoadingDoctores] = useState(true)
  const [doctorSeleccionado, setDoctorSeleccionado] = useState<any>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      email: "",
      telefono: "",
      motivo: "",
    },
  })

  // Cargar la lista de doctores desde la base de datos
  useEffect(() => {
    const fetchDoctores = async () => {
      try {
        setIsLoadingDoctores(true)
        const supabase = createClientSupabaseClient()
        const { data, error } = await supabase
          .from("doctores")
          .select("id, nombre, especialidad")
          .order("especialidad", { ascending: true })
          .order("nombre", { ascending: true })

        if (error) {
          throw error
        }

        if (data) {
          setDoctores(data)
        }
      } catch (error) {
        console.error("Error al cargar doctores:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los doctores. Por favor, intente de nuevo.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingDoctores(false)
      }
    }

    fetchDoctores()
  }, [])

  // Actualizar el doctor seleccionado cuando cambia la selección
  useEffect(() => {
    const doctorId = form.watch("doctor")
    if (doctorId && doctores.length > 0) {
      const doctor = doctores.find((d) => d.id.toString() === doctorId)
      setDoctorSeleccionado(doctor)
    }
  }, [form.watch("doctor"), doctores])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true)

      const supabase = createClientSupabaseClient()

      // Primero registrar o buscar al paciente
      const { data: pacienteData, error: pacienteError } = await supabase
        .from("pacientes")
        .select("id")
        .eq("email", values.email)
        .maybeSingle()

      let pacienteId

      if (pacienteError) {
        throw new Error("Error al buscar paciente: " + pacienteError.message)
      }

      if (!pacienteData) {
        // Crear nuevo paciente
        const { data: nuevoPaciente, error: nuevoPacienteError } = await supabase
          .from("pacientes")
          .insert({
            nombre: values.nombre,
            email: values.email,
            telefono: values.telefono,
          })
          .select("id")
          .single()

        if (nuevoPacienteError) {
          throw new Error("Error al crear paciente: " + nuevoPacienteError.message)
        }

        pacienteId = nuevoPaciente.id
      } else {
        pacienteId = pacienteData.id
      }

      // Generar número de cita (formato: AAAA)
      const { data: ultimaCita } = await supabase
        .from("citas")
        .select("numero_cita")
        .order("id", { ascending: false })
        .limit(1)

      let numeroCitaGenerado = "0001"
      if (ultimaCita && ultimaCita.length > 0 && ultimaCita[0].numero_cita) {
        const ultimoNumero = Number.parseInt(ultimaCita[0].numero_cita)
        numeroCitaGenerado = (ultimoNumero + 1).toString().padStart(4, "0")
      }

      // Registrar la cita
      const { data: nuevaCita, error: citaError } = await supabase
        .from("citas")
        .insert({
          paciente_id: pacienteId,
          doctor_id: Number.parseInt(values.doctor),
          fecha: format(values.fecha, "yyyy-MM-dd"),
          hora: values.hora,
          motivo: values.motivo,
          estado: "pendiente",
          numero_cita: numeroCitaGenerado,
        })
        .select()
        .single()

      if (citaError) {
        throw new Error("Error al agendar cita: " + citaError.message)
      }

      // Guardar la información de la cita para mostrarla
      setCitaInfo({
        numeroCita: numeroCitaGenerado,
        fecha: values.fecha,
        hora: values.hora,
        motivo: values.motivo,
        paciente: {
          nombre: values.nombre,
          email: values.email,
          telefono: values.telefono,
        },
        doctor: {
          id: Number.parseInt(values.doctor),
          nombre: doctorSeleccionado?.nombre || "Doctor no especificado",
          especialidad: doctorSeleccionado?.especialidad || "Especialidad no especificada",
        },
      })

      toast({
        title: "¡Cita agendada con éxito!",
        description: `Su cita ha sido programada para el ${format(values.fecha, "PPP", { locale: es })} a las ${values.hora}.`,
      })

      // Llamar a la función onSuccess si existe, pero NO resetear el formulario
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error al agendar cita",
        description: error instanceof Error ? error.message : "Ha ocurrido un error inesperado",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Función para obtener el color según el estado de la cita
  const getEstadoColor = (estado: string) => {
    switch (estado.toLowerCase()) {
      case "completada":
        return "text-green-600 bg-green-50"
      case "pendiente":
        return "text-yellow-600 bg-yellow-50"
      case "cancelada":
        return "text-red-600 bg-red-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  return (
    <div className="space-y-8">
      {/* Información de la cita (visible después de agendar) */}
      {citaInfo && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-green-800 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Cita Agendada Exitosamente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white border border-green-100 rounded-lg overflow-hidden">
              <div className="bg-green-100 px-4 py-3 border-b border-green-200">
                <h3 className="text-lg font-medium text-green-800">Detalles de la Cita #{citaInfo.numeroCita}</h3>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-2">
                    <CalendarIcon2 className="h-5 w-5 text-sky-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Fecha</p>
                      <p className="text-gray-600">{format(citaInfo.fecha, "PPPP", { locale: es })}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Clock className="h-5 w-5 text-sky-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Hora</p>
                      <p className="text-gray-600">{citaInfo.hora}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <User className="h-5 w-5 text-sky-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Paciente</p>
                      <p className="text-gray-600">{citaInfo.paciente.nombre}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Stethoscope className="h-5 w-5 text-sky-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Doctor</p>
                      <p className="text-gray-600">
                        {citaInfo.doctor.nombre} ({citaInfo.doctor.especialidad})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 md:col-span-2">
                    <FileText className="h-5 w-5 text-sky-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Motivo</p>
                      <p className="text-gray-600">{citaInfo.motivo}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <p className="font-medium mb-2">Estado de la cita:</p>
                  <div className={`inline-block px-3 py-1 rounded-full font-medium ${getEstadoColor("pendiente")}`}>
                    Pendiente
                  </div>
                </div>
              </div>
              <div className="bg-green-50 px-4 py-3 border-t border-green-100 text-sm text-green-800">
                <p className="font-bold">Número de cita: {citaInfo.numeroCita}</p>
                <p className="mt-1">Guarde este número para consultas futuras.</p>
                <p className="mt-2">
                  Si necesita modificar o cancelar su cita, por favor llame al 4644-9158 con al menos 24 horas de
                  anticipación.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulario para agendar cita */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Juan Pérez" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo electrónico</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="ejemplo@correo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telefono"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input placeholder="12345678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="doctor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Doctor</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={isLoadingDoctores ? "Cargando doctores..." : "Seleccione un doctor"}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {doctores.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id.toString()}>
                          {doctor.nombre} - {doctor.especialidad}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fecha"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha de la cita</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                        >
                          {field.value ? format(field.value, "PPP", { locale: es }) : <span>Seleccione una fecha</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0)) ||
                          date.getDay() === 0 || // Domingo
                          date > new Date(new Date().setMonth(new Date().getMonth() + 2))
                        }
                        locale={es}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hora"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hora de la cita</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione una hora" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {horarios.map((hora) => (
                        <SelectItem key={hora} value={hora}>
                          {hora}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="motivo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Motivo de la consulta</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describa brevemente el motivo de su consulta"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full bg-sky-500 hover:bg-sky-600" disabled={isSubmitting}>
            {isSubmitting ? "Agendando cita..." : "Agendar Cita"}
          </Button>
        </form>
      </Form>
    </div>
  )
}
