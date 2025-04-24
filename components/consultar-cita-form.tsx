"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CheckCircle, Clock, Calendar, User, Stethoscope, FileText, AlertCircle } from "lucide-react"

// Definir el esquema de validación
const formSchema = z.object({
  numeroCita: z
    .string()
    .min(4, {
      message: "El número de cita debe tener al menos 4 dígitos.",
    })
    .max(10, {
      message: "El número de cita no puede exceder los 10 caracteres.",
    })
    .regex(/^\d+$/, {
      message: "El número de cita debe contener solo dígitos.",
    }),
})

// Definir el tipo de datos de la cita
type CitaData = {
  numeroCita: string
  fecha: string
  hora: string
  motivo: string
  estado: string
  paciente: {
    nombre: string
    telefono: string
    email: string
  }
  doctor: {
    nombre: string
    especialidad: string
  }
}

export function ConsultarCitaForm() {
  const [cita, setCita] = useState<CitaData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Inicializar el formulario
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numeroCita: "",
    },
  })

  // Función para manejar el envío del formulario
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setError(null)
    setCita(null)
    setSuccess(false)

    try {
      const response = await fetch("/api/chatbot/buscar-cita", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          numeroCita: values.numeroCita,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        if (response.status === 404) {
          setError(
            `No se encontró ninguna cita con el número ${values.numeroCita}. Por favor, verifique el número e intente nuevamente.`,
          )
        } else {
          setError(data.error || "No se pudo encontrar la cita con el número proporcionado")
        }
        return
      }

      setCita(data.data)
      setSuccess(true)
    } catch (error) {
      console.error("Error al buscar cita:", error)
      setError(error instanceof Error ? error.message : "Ha ocurrido un error inesperado")
    } finally {
      setIsLoading(false)
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
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="numeroCita"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de cita</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: 0042" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full bg-sky-500 hover:bg-sky-600" disabled={isLoading}>
            {isLoading ? "Buscando..." : "Consultar Cita"}
          </Button>
        </form>
      </Form>

      {error && (
        <Alert variant="destructive" className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && cita && (
        <div className="mt-6 space-y-4">
          <Alert className="bg-green-50 text-green-800 border-green-200">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Cita encontrada</AlertTitle>
            <AlertDescription>Se encontró la información de su cita #{cita.numeroCita}</AlertDescription>
          </Alert>

          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b">
              <h3 className="text-lg font-medium">Detalles de la Cita #{cita.numeroCita}</h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <Calendar className="h-5 w-5 text-sky-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Fecha</p>
                    <p className="text-gray-600">{format(new Date(cita.fecha), "PPPP", { locale: es })}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Clock className="h-5 w-5 text-sky-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Hora</p>
                    <p className="text-gray-600">{cita.hora}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <User className="h-5 w-5 text-sky-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Paciente</p>
                    <p className="text-gray-600">{cita.paciente.nombre}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Stethoscope className="h-5 w-5 text-sky-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Doctor</p>
                    <p className="text-gray-600">
                      {cita.doctor.nombre} ({cita.doctor.especialidad})
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 md:col-span-2">
                  <FileText className="h-5 w-5 text-sky-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Motivo</p>
                    <p className="text-gray-600">{cita.motivo}</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t">
                <p className="font-medium mb-2">Estado de la cita:</p>
                <div className={`inline-block px-3 py-1 rounded-full font-medium ${getEstadoColor(cita.estado)}`}>
                  {cita.estado.charAt(0).toUpperCase() + cita.estado.slice(1)}
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 border-t text-sm text-gray-600">
              <p>
                Si necesita modificar o cancelar su cita, por favor llame al 4644-9158 con al menos 24 horas de
                anticipación.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
