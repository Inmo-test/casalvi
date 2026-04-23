import { SupabaseClient } from '@supabase/supabase-js'

export type ValidationResult = {
  success: boolean
  error?: string
}

export async function validateStageTransition(
  propertyId: string, 
  targetStage: string, 
  supabase: SupabaseClient
): Promise<ValidationResult> {
  
  // 1. Obtener datos actuales de la propiedad
  const { data: property, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', propertyId)
    .single()

  if (error || !property) {
    return { success: false, error: 'Propiedad no encontrada' }
  }

  // 2. SWITCH DE REGLAS SEGÚN DESTINO
  switch (targetStage) {
    
    // --- REGLA 1: Para LISTING (Encargo) ---
    case 'listing':
      if (!property.valuation_price || property.valuation_price <= 0) {
        return { 
          success: false, 
          error: '⛔ Faltan datos: Debes establecer un PRECIO DE VALORACIÓN antes de firmar el encargo.' 
        }
      }
      break

    // --- REGLA 2: Para ACTIVE (En Venta) ---
    case 'active':
      // Verificamos si tiene foto de portada o precio
      if (!property.price || property.price <= 0) {
         return { success: false, error: '⛔ Error: La propiedad debe tener un PRECIO DE VENTA.' }
      }
      if (!property.commission_amount) {
         return { success: false, error: '⛔ Error: Define la COMISIÓN antes de publicar.' }
      }
      // Opcional: Validar fotos si tienes tabla de storage
      // if (!property.images || property.images.length === 0) ...
      break

    // --- REGLA 3: Para RESERVED ---
    case 'reserved':
      // Validamos que se esté intentando reservar CON comprador (esto suele venir en el update body,
      // pero aquí validamos si la propiedad YA tiene comprador si no se pasó en el update actual.
      // Como esta función corre ANTES del update, asumimos que la action updatePropertyStatus
      // se encarga de pasar el buyerId. Aquí validamos datos estáticos).
      
      // Nota: La validación de buyer_id se hace mejor en la propia action porque el dato viene en el payload,
      // no necesariamente en la DB todavía. Aquí validamos consistencia.
      break

    // --- REGLA 4: Para SOLD (Vendido) ---
    case 'sold':
      if (!property.final_price || property.final_price <= 0) {
        // Si no tiene precio final, intentamos usar el de reserva o venta como fallback,
        // pero lo ideal es exigir el precio real de cierre.
        return { 
          success: false, 
          error: '⛔ Cierre incompleto: Introduce el PRECIO FINAL DE VENTA.' 
        }
      }
      break
  }

  return { success: true }
}
