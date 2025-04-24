import { createClientSupabaseClient } from "@/lib/supabase"

// Función para subir una imagen a Supabase Storage
export async function uploadImage(file: File, folder = "images") {
  try {
    const supabase = createClientSupabaseClient()

    // Crear un nombre único para el archivo
    const fileExt = file.name.split(".").pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`
    const filePath = `${folder}/${fileName}`

    // Subir el archivo
    const { error } = await supabase.storage.from("centro-medico").upload(filePath, file)

    if (error) {
      throw error
    }

    // Obtener la URL pública
    const { data } = supabase.storage.from("centro-medico").getPublicUrl(filePath)

    return {
      url: data.publicUrl,
      path: filePath,
    }
  } catch (error) {
    console.error("Error al subir imagen:", error)
    throw error
  }
}

// Función para eliminar una imagen de Supabase Storage
export async function deleteImage(path: string) {
  try {
    const supabase = createClientSupabaseClient()

    const { error } = await supabase.storage.from("centro-medico").remove([path])

    if (error) {
      throw error
    }

    return true
  } catch (error) {
    console.error("Error al eliminar imagen:", error)
    throw error
  }
}

// Función para listar imágenes de una carpeta
export async function listImages(folder = "images") {
  try {
    const supabase = createClientSupabaseClient()

    const { data, error } = await supabase.storage.from("centro-medico").list(folder)

    if (error) {
      throw error
    }

    return data.map((file) => ({
      name: file.name,
      path: `${folder}/${file.name}`,
      url: supabase.storage.from("centro-medico").getPublicUrl(`${folder}/${file.name}`).data.publicUrl,
      size: file.metadata.size,
      createdAt: file.created_at,
    }))
  } catch (error) {
    console.error("Error al listar imágenes:", error)
    throw error
  }
}
