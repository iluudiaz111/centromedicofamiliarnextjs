"use client"

import type React from "react"

import { useState } from "react"
import { uploadImage } from "@/lib/supabase-storage"
import { createClientSupabaseClient } from "@/lib/supabase"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera } from "lucide-react"

interface DoctorProfileImageProps {
  doctorId: number
  initialImageUrl?: string
  doctorName: string
}

export function DoctorProfileImage({ doctorId, initialImageUrl, doctorName }: DoctorProfileImageProps) {
  const [imageUrl, setImageUrl] = useState<string | undefined>(initialImageUrl)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const file = e.target.files[0]

    // Validar que sea una imagen
    if (!file.type.startsWith("image/")) {
      setError("Por favor seleccione un archivo de imagen válido")
      return
    }

    // Validar tamaño (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError("La imagen no debe exceder los 2MB")
      return
    }

    try {
      setIsUploading(true)
      setError(null)

      // Subir la imagen a Supabase Storage
      const { url, path } = await uploadImage(file, `doctores/${doctorId}`)

      // Actualizar la URL de la imagen en la base de datos
      const supabase = createClientSupabaseClient()
      const { error } = await supabase.from("doctores").update({ imagen_url: url }).eq("id", doctorId)

      if (error) {
        throw new Error("Error al actualizar la imagen del doctor")
      }

      setImageUrl(url)
    } catch (error) {
      console.error("Error:", error)
      setError(error instanceof Error ? error.message : "Error al subir la imagen")
    } finally {
      setIsUploading(false)
    }
  }

  // Obtener iniciales para el avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <Avatar className="w-32 h-32">
          <AvatarImage
            src={imageUrl || "/placeholder.svg"}
            alt={doctorName}
            unoptimized={imageUrl?.startsWith("http")}
          />
          <AvatarFallback className="text-2xl bg-sky-100 text-sky-800">{getInitials(doctorName)}</AvatarFallback>
        </Avatar>

        <label
          htmlFor={`doctor-image-${doctorId}`}
          className="absolute bottom-0 right-0 bg-sky-500 hover:bg-sky-600 text-white rounded-full p-2 cursor-pointer"
        >
          <Camera size={16} />
          <span className="sr-only">Cambiar imagen</span>
        </label>

        <input
          id={`doctor-image-${doctorId}`}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
          disabled={isUploading}
        />
      </div>

      {isUploading && <p className="text-sm mt-2">Subiendo imagen...</p>}
      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
    </div>
  )
}
