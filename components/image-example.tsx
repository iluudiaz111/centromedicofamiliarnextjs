import Image from "next/image"

export function ImageExample() {
  return (
    <div className="space-y-8">
      {/* Imagen local desde la carpeta public */}
      <div>
        <h3 className="text-lg font-medium mb-2">Imagen local desde public</h3>
        <div className="relative h-64 w-full rounded-lg overflow-hidden">
          <Image src="/images/doctor.jpg" alt="Doctor atendiendo a un paciente" fill className="object-cover" />
        </div>
        <p className="text-sm text-gray-500 mt-1">Esta imagen está almacenada en /public/images/doctor.jpg</p>
      </div>

      {/* Imagen remota con URL */}
      <div>
        <h3 className="text-lg font-medium mb-2">Imagen remota</h3>
        <div className="relative h-64 w-full rounded-lg overflow-hidden">
          <Image
            src="https://images.unsplash.com/photo-1576091160550-2173dba999ef"
            alt="Equipo médico"
            fill
            className="object-cover"
          />
        </div>
        <p className="text-sm text-gray-500 mt-1">Esta imagen se carga desde una URL externa</p>
      </div>
    </div>
  )
}
