import { ServiceBanner } from "@/components/service-banner"

export const metadata = {
  title: "Servicios Especiales - Centro Médico Familiar",
  description: "Servicios especiales ofrecidos por el Centro Médico Familiar",
}

export default function ServiciosEspecialesPage() {
  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold text-sky-700 mb-6">Servicios Especiales</h1>

      <div className="space-y-8">
        <ServiceBanner
          imageSrc="/images/servicio-covid-dengue.png"
          imageAlt="Servicio de pruebas COVID-19 y dengue"
          title="Pruebas de COVID-19 y Dengue"
          description="Ofrecemos servicios de hisopado nasofaríngeo para detección de SARS-CoV-2 y pruebas para diagnóstico de dengue con resultados rápidos y confiables."
          linkHref="/agendar-cita"
          linkText="Agendar Prueba"
        />

        <ServiceBanner
          imageSrc="/images/servicio-ultrasonidos.png"
          imageAlt="Servicio de ultrasonidos"
          title="Servicio de Ultrasonidos"
          description="Contamos con servicios de ultrasonido para embarazo, riñones, hígado y abdomen completo durante los turnos de la Doctora Peláez."
          linkHref="/agendar-cita"
          linkText="Agendar Ultrasonido"
        />
      </div>

      <div className="mt-12 bg-sky-50 p-6 rounded-lg">
        <h2 className="text-xl font-bold text-sky-700 mb-4">Información Importante</h2>
        <ul className="list-disc pl-5 space-y-2 text-gray-600">
          <li>Para pruebas de COVID-19 y dengue, no es necesario ayuno previo.</li>
          <li>Para ultrasonidos abdominales, se requiere ayuno de 6 horas.</li>
          <li>Para ultrasonidos obstétricos, se recomienda beber agua 30 minutos antes del estudio.</li>
          <li>Los resultados de las pruebas de COVID-19 están disponibles en 24 horas.</li>
          <li>Para más información sobre precios y disponibilidad, llame al 4644-9158.</li>
        </ul>
      </div>
    </div>
  )
}
