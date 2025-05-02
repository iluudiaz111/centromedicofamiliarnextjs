import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ImageCarousel } from "@/components/image-carousel"

export default function Home() {
  // Imágenes para el carrusel
  const carouselImages = [
    {
      src: "/images/servicio-covid-dengue.png",
      alt: "Servicio de pruebas COVID-19 y dengue",
    },
    {
      src: "/images/servicio-ultrasonidos.png",
      alt: "Servicio de ultrasonidos",
    },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-sky-100 to-white py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="space-y-4">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-sky-700">
                Centro Médico Familiar
              </h1>
              <p className="text-gray-600 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Brindamos atención médica integral para toda la familia con profesionales altamente calificados. Su
                salud es nuestra prioridad.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Link href="/agendar-cita">
                  <Button className="bg-sky-500 hover:bg-sky-600">Agendar Cita</Button>
                </Link>
                <Link href="/servicios">
                  <Button variant="outline" className="border-sky-500 text-sky-500 hover:bg-sky-50">
                    Nuestros Servicios
                  </Button>
                </Link>
              </div>
            </div>
            <div className="mx-auto lg:mx-0 relative h-[300px] md:h-[400px] w-full rounded-xl overflow-hidden">
              <ImageCarousel images={carouselImages} />
            </div>
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-12 md:py-16 bg-gradient-to-b from-white to-sky-50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-sky-700">
              Nuestros Servicios
            </h2>
            <p className="max-w-[700px] text-gray-600 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Ofrecemos una amplia gama de servicios médicos para el cuidado integral de su salud.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
            {[
              {
                title: "Medicina General",
                description: "Atención médica para toda la familia con enfoque preventivo y curativo.",
                icon: "stethoscope",
              },
              {
                title: "Pediatría",
                description: "Cuidado especializado para niños y adolescentes desde el nacimiento.",
                icon: "baby",
              },
              {
                title: "Ginecología",
                description: "Atención integral para la salud de la mujer en todas las etapas de la vida.",
                icon: "female",
              },
              {
                title: "Laboratorio Clínico",
                description: "Análisis clínicos con resultados precisos y en tiempo oportuno.",
                icon: "test-tube",
              },
              {
                title: "Cardiología",
                description: "Diagnóstico y tratamiento de enfermedades cardiovasculares.",
                icon: "heart",
              },
              {
                title: "Nutrición",
                description: "Asesoría nutricional personalizada para mejorar su salud y bienestar.",
                icon: "apple",
              },
            ].map((service, index) => (
              <Card key={index} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sky-600">{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{service.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex justify-center mt-8">
            <Link href="/servicios">
              <Button className="bg-sky-500 hover:bg-sky-600">Ver Todos los Servicios</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-12 md:py-16 bg-sky-600 text-white">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">¿Necesita una cita médica?</h2>
            <p className="max-w-[700px] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Agende su cita en línea de manera rápida y sencilla o llámenos al 4644-9158.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link href="/citas">
                <Button className="bg-white text-sky-600 hover:bg-sky-100">Gestionar Citas</Button>
              </Link>
              <Link href="/contacto">
                <Button variant="outline" className="bg-transparent text-white border-white hover:bg-white/10">
                  Contactar
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
