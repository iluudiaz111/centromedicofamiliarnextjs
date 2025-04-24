"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClientSupabaseClient } from "@/lib/supabase"
import { v4 as uuidv4 } from "uuid"

export function ImageUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]

      // Validar que sea una imagen
      if (!selectedFile.type.startsWith("image/")) {
        setError("Por favor seleccione un archivo de imagen válido")
        setFile(null)
        return
      }

      // Validar tamaño (máximo 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("La imagen no debe exceder los 5MB")
        setFile(null)
        return
      }

      setFile(selectedFile)
      setError(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    try {
      setUploading(true)
      setError(null)

      const supabase = createClientSupabaseClient()

      // Crear un nombre único para el archivo
      const fileExt = file.name.split(".").pop()
      const fileName = `${uuidv4()}.${fileExt}`
      const filePath = `images/${fileName}`

      // Subir el archivo a Supabase Storage
      const { error: uploadError } = await supabase.storage.from("centro-medico").upload(filePath, file)

      if (uploadError) {
        throw new Error(uploadError.message)
      }

      // Obtener la URL pública del archivo
      const { data } = supabase.storage.from("centro-medico").getPublicUrl(filePath)

      setUploadedImageUrl(data.publicUrl)
    } catch (error) {
      console.error("Error al subir la imagen:", error)
      setError(error instanceof Error ? error.message : "Error al subir la imagen")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="image-upload" className="block text-sm font-medium mb-1">
          Seleccionar imagen
        </label>
        <Input id="image-upload" type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} />
        {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
      </div>

      {file && (
        <div>
          <p className="text-sm">Archivo seleccionado: {file.name}</p>
          <Button onClick={handleUpload} disabled={uploading} className="mt-2 bg-sky-500 hover:bg-sky-600">
            {uploading ? "Subiendo..." : "Subir imagen"}
          </Button>
        </div>
      )}

      {uploadedImageUrl && (
        <div className="mt-4">
          <h3 className="text-lg font-medium mb-2">Imagen subida</h3>
          <div className="relative h-64 w-full rounded-lg overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={uploadedImageUrl || "/placeholder.svg"}
              alt="Imagen subida"
              className="object-contain w-full h-full"
            />
          </div>
          <p className="text-sm break-all mt-2">URL: {uploadedImageUrl}</p>
        </div>
      )}
    </div>
  )
}
