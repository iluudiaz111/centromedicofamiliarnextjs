import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ImageUpload } from "@/components/image-upload"
import { ImageExample } from "@/components/image-example"

export const metadata = {
  title: "Gestión de Imágenes - Centro Médico Familiar",
  description: "Subir y gestionar imágenes para el Centro Médico Familiar",
}

export default function ImagenesPage() {
  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold text-sky-700 mb-6">Gestión de Imágenes</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Subir nueva imagen</CardTitle>
            <CardDescription>
              Sube imágenes para usar en el sitio web. Formatos aceptados: JPG, PNG, GIF. Tamaño máximo: 5MB.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImageUpload />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ejemplos de uso de imágenes</CardTitle>
            <CardDescription>Diferentes formas de mostrar imágenes en el sitio web.</CardDescription>
          </CardHeader>
          <CardContent>
            <ImageExample />
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Guía para insertar imágenes</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <h3>1. Imágenes estáticas en la carpeta public</h3>
            <p>
              Coloca tus imágenes en la carpeta <code>/public/images/</code> y luego úsalas con el componente Image:
            </p>
            <pre className="bg-gray-100 p-2 rounded-md overflow-x-auto">
              {`import Image from "next/image"

<Image 
  src="/images/nombre-archivo.jpg" 
  alt="Descripción de la imagen" 
  width={500} 
  height={300} 
/>`}
            </pre>

            <h3>2. Imágenes subidas a Supabase Storage</h3>
            <p>
              Usa el componente de subida de imágenes para cargar archivos a Supabase Storage y luego usa la URL
              generada:
            </p>
            <pre className="bg-gray-100 p-2 rounded-md overflow-x-auto">
              {`import Image from "next/image"

<Image 
  src="https://url-de-supabase-storage.com/imagen.jpg" 
  alt="Descripción de la imagen" 
  width={500} 
  height={300} 
/>`}
            </pre>

            <h3>3. Imágenes responsivas</h3>
            <p>Para imágenes que se adaptan al contenedor:</p>
            <pre className="bg-gray-100 p-2 rounded-md overflow-x-auto">
              {`<div className="relative h-64 w-full">
  <Image 
    src="/images/imagen.jpg" 
    alt="Descripción" 
    fill 
    className="object-cover" 
  />
</div>`}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
