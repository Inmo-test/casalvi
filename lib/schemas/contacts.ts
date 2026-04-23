import { z } from 'zod'

/**
 * Esquema de validación Zod para formularios de contactos
 * Separado del componente para evitar dependencias circulares
 */
export const contactFormSchema = z.object({
  role: z.enum(['owner', 'buyer']).default('owner'),
  firstName: z.string().min(1, 'El nombre es requerido'),
  lastName: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  // Dirección
  street: z.string().optional(),
  streetNumber: z.string().optional(),
  floor: z.string().optional(),
  door: z.string().optional(),
  // Campos de geolocalización (opcionales, solo para propietarios)
  address_lat: z.string().optional(),
  address_lng: z.string().optional(),
  google_place_id: z.string().optional(),
  formatted_address: z.string().optional(),
  // Campos de comprador
  budgetMax: z.string().optional(),
  minBedrooms: z.string().optional(),
  minBathrooms: z.string().optional(),
  preferredZones: z.string().optional(),
  // Campos de farming para propietarios
  propertyOccupancy: z.enum(['unknown', 'owned', 'rented', 'competitor']).default('unknown'),
  propertyLeaseEnd: z.string().optional(),
  propertyCompetitorName: z.string().optional(),
  propertyCompetitorExpiry: z.string().optional(),
})

/**
 * Tipo inferido del esquema de contactos
 */
export type ContactFormValues = z.infer<typeof contactFormSchema>


