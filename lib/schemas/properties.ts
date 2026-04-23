import { z } from 'zod'

// Definimos los estados posibles del Pipeline Inmobiliario
// NOTA: Estos valores deben coincidir EXACTAMENTE con los valores aceptados en la BD
// Según full_schema_reference.sql: 'valuation', 'listing', 'active', 'offer', 'reserved', 'sold', 'archive'
export const propertyStatusEnum = z.enum([
  'valuation',     // En valoración
  'listing',       // Encargo / Contrato firmado
  'active',        // Activo / En venta
  'offer',         // Oferta recibida
  'reserved',      // Reservado
  'sold',          // Vendido
  'archive'        // Archivado / Histórico
])

export const propertySchema = z.object({
  // Campos básicos
  address: z.string().min(5, 'La dirección es obligatoria'),
  type: z.string().default('apartment'),

  // Pipeline y Estado
  status: propertyStatusEnum.default('valuation'),

  // Campos Financieros
  price: z.coerce.number().min(0, 'El precio debe ser positivo').default(0),
  valuationPrice: z.coerce.number().optional().nullable(), // Precio captación
  finalPrice: z.coerce.number().optional().nullable(),     // Precio cierre
  commissionAmount: z.coerce.number().optional().nullable(), // Honorarios

  // Detalles físicos
  size: z.coerce.number().optional().nullable(),
  bedrooms: z.coerce.number().min(0).default(0),
  bathrooms: z.coerce.number().min(0).default(0),
  description: z.string().optional().nullable(),

  // Geolocalización
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),

  // Vinculaciones (Foreign Keys)
  ownerContactId: z.string().optional().nullable(), // ID del propietario
  buyerContactId: z.string().optional().nullable(), // ID del comprador (para reservas)

  // Fechas clave
  exclusiveEndDate: z.string().optional().nullable(), // Fin de exclusiva

  // Campos de Dirección Granular (Optional)
  street: z.string().optional().nullable(),
  streetNumber: z.string().optional().nullable(),
  floor: z.string().optional().nullable(),
  door: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  zone: z.string().optional().nullable(),

  // Metadatos Catastrales y Legales
  yearBuilt: z.coerce.number().optional().nullable(),
  usageType: z.string().optional().nullable(),
  cadastralReference: z.string().optional().nullable(),
})

export type PropertyFormValues = z.infer<typeof propertySchema>

// Schema legacy para compatibilidad hacia atrás
export const propertyFormSchema = z.object({
  address: z.string().min(1, 'La dirección es obligatoria'),
  street: z.string().optional(), // Legacy, para compatibilidad
  streetNumber: z.string().optional(),
  floor: z.string().optional(),
  door: z.string().optional(),
  zone: z.string().optional(),
  price: z.string().min(1, 'El precio es requerido'),
  bedrooms: z.string().optional(),
  bathrooms: z.string().optional(),
  ownerContactId: z.string().optional(),
  // Campos de geolocalización (opcionales)
  address_lat: z.string().optional(),
  address_lng: z.string().optional(),
  google_place_id: z.string().optional(),
  formatted_address: z.string().optional(),
})
