'use server'

import { createClient } from '@/lib/supabase/server'

export async function uploadPropertyImage(formData: FormData) {
  const supabase = await createClient()

  // 1. Validar usuario
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autorizado' }

  const file = formData.get('file') as File
  const propertyId = formData.get('propertyId') as string

  if (!file || !propertyId) return { error: 'Faltan datos' }

  // 2. Generar nombre único para el archivo
  // Estructura: property_id/timestamp-filename.jpg
  const fileExt = file.name.split('.').pop()
  const fileName = `${propertyId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

  // 3. Subir a Supabase Storage
  const { data, error } = await supabase
    .storage
    .from('properties')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    console.error('Upload error:', error)
    return { error: 'Error al subir imagen' }
  }

  // 4. Obtener URL Pública
  const { data: { publicUrl } } = supabase
    .storage
    .from('properties')
    .getPublicUrl(data.path)

  // 5. Actualizar la propiedad con la foto principal
  // (Si es la primera foto, la ponemos como principal 'photo_url')
  
  // Primero leemos la propiedad para ver si ya tiene foto
  const { data: property } = await supabase
    .from('properties')
    .select('photo_url')
    .eq('id', propertyId)
    .single()

  if (!property?.photo_url) {
    await supabase
      .from('properties')
      .update({ photo_url: publicUrl })
      .eq('id', propertyId)
  }

  // (Opcional: Aquí añadirías la URL al array 'images' si lo usas)
  return { success: true, url: publicUrl }
}

