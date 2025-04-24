import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Phone, Mail, Clock } from "lucide-react"
import { GoogleMap } from "@/components/google-map"

export const metadata = {
  title: "Contacto - Centro Médico Familiar",
  description: "Información de contacto del Centro Médico Familiar",
}

export default function ContactoPage() {
  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold text-sky-700 mb-6">Contacto</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Información de Contacto</CardTitle>
              <CardDescription>Estamos aquí para atenderle</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-sky-500 mt-0.5" />
                <div>
                  <h3 className="font-medium">Dirección</h3>
                  <p className="text-gray-600">2 av. 5-08 zona 3</p>
                  <p className="text-gray-600">San Juan Sacatepéquez, Guatemala</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-sky-500 mt-0.5" />
                <div>
                  <h3 className="font-medium">Teléfono</h3>
                  <p className="text-gray-600">4644-9158</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-sky-500 mt-0.5" />
                <div>
                  <h3 className="font-medium">Correo Electrónico</h3>
                  <p className="text-gray-600">info@centromedicofamiliar.com</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-sky-500 mt-0.5" />
                <div>
                  <h3 className="font-medium">Horario de Atención</h3>
                  <p className="text-gray-600">Lunes a Viernes: 8:00 AM - 6:00 PM</p>
                  <p className="text-gray-600">Sábados: 8:00 AM - 1:00 PM</p>
                  <p className="text-gray-600">Domingos: Cerrado</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8">
            <h2 className="text-xl font-semibold text-sky-700 mb-4">Preguntas Frecuentes</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">¿Cómo puedo agendar una cita?</h3>
                <p className="text-gray-600">
                  Puede agendar una cita llamando al 4644-9158 o utilizando nuestro formulario en línea en la sección
                  "Agendar Cita".
                </p>
              </div>
              <div>
                <h3 className="font-medium">¿Qué debo llevar a mi primera consulta?</h3>
                <p className="text-gray-600">
                  Documento de identificación, historial médico si lo tiene, y lista de medicamentos que esté tomando
                  actualmente.
                </p>
              </div>
              <div>
                <h3 className="font-medium">¿Aceptan seguros médicos?</h3>
                <p className="text-gray-600">
                  Sí, trabajamos con varias aseguradoras. Por favor llame para verificar si aceptamos su seguro
                  específico.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Ubicación</CardTitle>
              <CardDescription>Encuentre nuestro centro médico</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-gray-200 rounded-md overflow-hidden">
                <GoogleMap
                  address="Centro Médico Familiar, 2 avenida 5-08 zona 3, San Juan Sacatepéquez, Guatemala"
                  height="300px"
                />
              </div>
              <div className="mt-4">
                <h3 className="font-medium">Cómo llegar</h3>
                <p className="text-gray-600 mt-2">
                  Estamos ubicados en la 2 av. 5-08 zona 3 de San Juan Sacatepéquez, a pocas cuadras del parque central.
                  Contamos con estacionamiento para pacientes.
                </p>
                <div className="mt-3">
                  <a
                    href="https://www.google.com/maps/dir/?api=1&destination=Centro+Médico+Familiar,+2+avenida+5-08+zona+3,+San+Juan+Sacatepéquez,+Guatemala"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-600 hover:text-sky-800 font-medium flex items-center"
                  >
                    <MapPin className="h-4 w-4 mr-1" /> Obtener indicaciones en Google Maps
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Emergencias</CardTitle>
              <CardDescription>Información para casos de emergencia</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                En caso de emergencias médicas graves, por favor diríjase al hospital más cercano o llame al número de
                emergencias nacional.
              </p>
              <p className="mt-4 text-gray-600">
                Para consultas urgentes durante nuestro horario de atención, puede comunicarse directamente al
                4644-9158.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
