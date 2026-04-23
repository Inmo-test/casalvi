import { Camera, FileSignature, Megaphone, Activity, CheckCircle2, Archive } from 'lucide-react'

export const PROPERTY_STAGES = {
  // ELIMINADO: 'prospect' (Ahora esto es gestión de Contactos)

  valuation: {
    id: 'valuation',
    label: '1. Valoración (Adquisición)',
    icon: Camera,
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300',
    description: 'Análisis de precio y negociación del encargo.',
    tasks: [
      { id: 'photos', label: 'Subir fotos de la visita' },
      { id: 'price_estimation', label: 'Definir precio de mercado (ACM)' },
      { id: 'proposal', label: 'Presentar propuesta de honorarios' },
    ],
    ai_context: 'valuation',
    next: 'listing'
  },
  listing: {
    id: 'listing',
    label: '2. Encargo',
    icon: FileSignature,
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
    description: 'Formalizando el contrato de venta.',
    tasks: [
      { id: 'sign_contract', label: 'Firmar Nota de Encargo' },
      { id: 'check_docs', label: 'Verificar Nota Simple y CEE' },
      { id: 'keys', label: 'Recogida de llaves' },
    ],
    ai_context: 'legal',
    next: 'active'
  },
  active: {
    id: 'active',
    label: '3. Comercialización',
    icon: Megaphone,
    color: 'bg-blue-100 text-[#0062CC] dark:bg-blue-900/20 dark:text-blue-300',
    description: 'En venta activa. Gestión de visitas.',
    tasks: [
      { id: 'publish', label: 'Publicar en portales' },
      { id: 'matching', label: 'Enviar a compradores (Matching)' },
      { id: 'open_house', label: 'Organizar visitas' },
    ],
    ai_context: 'market_fit',
    next: 'reserved'
  },
  reserved: {
    id: 'reserved',
    label: '4. Reservado',
    icon: Activity,
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300',
    description: 'Oferta aceptada. Preparando notaría.',
    tasks: [
      { id: 'arras', label: 'Firmar Contrato de Arras' },
      { id: 'mortgage', label: 'Seguimiento hipoteca' },
      { id: 'notary', label: 'Enviar documentación a notaría' },
    ],
    ai_context: 'closing_risk',
    next: 'sold'
  },
  sold: {
    id: 'sold',
    label: '5. Vendido',
    icon: CheckCircle2,
    color: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300',
    description: 'Operación cerrada.',
    tasks: [
      { id: 'invoice', label: 'Facturar honorarios' },
      { id: 'review', label: 'Reseña cliente' },
    ],
    ai_context: 'analytics',
    next: 'archive'
  },
  archive: {
    id: 'archive',
    label: '6. Histórico',
    icon: Archive,
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    description: 'Expediente archivado.',
    tasks: [],
    ai_context: 'memory',
    next: null
  }
}
