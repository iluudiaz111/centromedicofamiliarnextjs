"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { createClientSupabaseClient } from "@/lib/supabase"
import { Alert, AlertDescription } from "@/components/ui/alert"

const formSchema = z.object({
  email: z.string().email({
    message: "Por favor ingrese un email válido.",
  }),
  password: z.string().min(1, {
    message: "La contraseña es requerida.",
  }),
})

export default function DoctorLoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState("")
  const [doctorList, setDoctorList] = useState<any[]>([])
  const [showDoctorList, setShowDoctorList] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  // Cargar la lista de doctores para facilitar el inicio de sesión
  useEffect(() => {
    const fetchDoctores = async () => {
      try {
        const supabase = createClientSupabaseClient()
        const { data } = await supabase.from("doctores").select("id, nombre, email, password")
        if (data) {
          setDoctorList(data)
        }
      } catch (error) {
        console.error("Error al cargar doctores:", error)
      }
    }

    fetchDoctores()
  }, [])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true)
      setLoginError("")

      // Para propósitos de demostración, permitimos cualquier contraseña
      // En un entorno real, esto sería una mala práctica de seguridad
      const supabase = createClientSupabaseClient()

      // Verificar si el doctor existe
      const { data: doctor, error: doctorError } = await supabase
        .from("doctores")
        .select("id, nombre, email")
        .eq("email", values.email)
        .single()

      if (doctorError || !doctor) {
        throw new Error("No se encontró ningún doctor con ese correo electrónico")
      }

      // En un entorno de producción, aquí verificaríamos la contraseña con bcrypt
      // Para esta demostración, omitimos la verificación de contraseña

      // Guardar información del doctor en localStorage
      localStorage.setItem("doctorId", doctor.id.toString())
      localStorage.setItem("doctorNombre", doctor.nombre)

      toast({
        title: "¡Inicio de sesión exitoso!",
        description: `Bienvenido/a, ${doctor.nombre}`,
      })

      // Redireccionar al dashboard
      router.push("/doctor/dashboard")
    } catch (error) {
      console.error("Error:", error)
      setLoginError(error instanceof Error ? error.message : "Ha ocurrido un error inesperado")
      toast({
        title: "Error de inicio de sesión",
        description: error instanceof Error ? error.message : "Ha ocurrido un error inesperado",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectDoctor = (email: string) => {
    form.setValue("email", email)
    form.setValue("password", "cualquier-contraseña") // Para demostración
  }

  return (
    <div className="container py-12">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-sky-700">Acceso para Médicos</CardTitle>
            <CardDescription className="text-center">Ingrese sus credenciales para acceder al sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4 bg-blue-50 text-blue-800">
              <AlertDescription>
                <p className="text-sm">
                  <strong>Modo demostración:</strong> Para facilitar el acceso, puede seleccionar un doctor de la lista
                  o usar cualquier contraseña.
                </p>
              </AlertDescription>
            </Alert>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo electrónico</FormLabel>
                      <FormControl>
                        <Input placeholder="doctor@ejemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="******" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {loginError && <p className="text-sm text-red-500">{loginError}</p>}
                <Button type="submit" className="w-full bg-sky-500 hover:bg-sky-600" disabled={isLoading}>
                  {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button variant="link" onClick={() => setShowDoctorList(!showDoctorList)}>
              {showDoctorList ? "Ocultar lista de doctores" : "Mostrar lista de doctores"}
            </Button>

            {showDoctorList && doctorList.length > 0 && (
              <div className="w-full border rounded-md p-2">
                <p className="text-sm font-medium mb-2">Seleccione un doctor para iniciar sesión:</p>
                <div className="space-y-1">
                  {doctorList.map((doctor) => (
                    <Button
                      key={doctor.id}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-left"
                      onClick={() => handleSelectDoctor(doctor.email)}
                    >
                      {doctor.nombre} - {doctor.email}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
