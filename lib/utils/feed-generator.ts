export function mapKyeroType(dbType: string | null): string {
  if (!dbType) return 'apartment'

  const type = dbType.toLowerCase().trim()

  const mapping: Record<string, string> = {
    'piso': 'apartment',
    'apartamento': 'apartment',
    'estudio': 'apartment',
    'atico': 'penthouse',
    'duplex': 'duplex',
    'chalet': 'villa',
    'villa': 'villa',
    'casa': 'villa',
    'adosado': 'townhouse',
    'pareado': 'townhouse',
    'terreno': 'land',
    'solar': 'land',
    'finca': 'farmhouse',
    'rustica': 'country_house',
    'local': 'commercial',
    'oficina': 'commercial',
    'nave': 'industrial',
    'garaje': 'garage',
    'trastero': 'garage'
  }

  // Búsqueda parcial si no es exacto
  for (const [key, value] of Object.entries(mapping)) {
    if (type.includes(key)) return value
  }

  return 'apartment' // Fallback seguro
}

export function generatePropertyXml(p: any): string {
  // ID y Ref
  const id = p.id
  const ref = p.id.split('-')[0] // Versión corta del UUID

  // Fechas
  const date = new Date(p.created_at).toISOString().split('T')[0]
  const lastModified = p.updated_at
    ? new Date(p.updated_at).toISOString().replace('T', ' ').split('.')[0]
    : new Date().toISOString().replace('T', ' ').split('.')[0]

  // Precios y Tipos
  const price = Math.round(Number(p.price) || 0)
  const type = mapKyeroType(p.type || p.description || '')

  // Descripción (IA First)
  // Descripción (Prioridad: Marketing Copy > Descripción Manual > Fallback)
  // Nota: Eliminamos el prefijo de título/dirección para que sea exactamente lo que el usuario/IA escribió.
  const rawDesc = p.marketing_description || p.description || `Propiedad en ${p.zone || 'venta'}. Contáctanos para más información.`

  // Limpieza CDATA
  const cleanContent = (str: string) => str ? str.replace(/]]>/g, '') : ''

  const desc = `<![CDATA[${cleanContent(rawDesc)}]]>`

  // Ubicación
  const town = p.zone || 'Unknown'
  const lat = p.lat ? `<latitude>${p.lat}</latitude>` : ''
  const lng = p.lng ? `<longitude>${p.lng}</longitude>` : ''
  const locationXml = `
      <location>
         ${lat}
         ${lng}
      </location>`

  // Imágenes (Galería Completa)
  // Ordenamos por display_order si existe, si no por defecto
  const sortedImages = p.property_images?.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0)) || []

  const imagesXml = sortedImages.length > 0
    ? sortedImages.map((img: any, index: number) =>
      `<image id="${index + 1}"><url>${img.url}</url></image>`
    ).join('')
    : ''

  // Superficie
  const built = p.surface_area ? `<built>${p.surface_area}</built>` : ''

  return `    <property>
      <id>${id}</id>
      <date>${date}</date>
      <ref>${ref}</ref>
      <price>${price}</price>
      <currency>EUR</currency>
      <type>${type}</type>
      <town>${town}</town>
      <beds>${p.bedrooms || 0}</beds>
      <baths>${p.bathrooms || 0}</baths>
      <pool>0</pool>
      <surface_area>
        ${built}
      </surface_area>
      <energy_rating>
        <consumption>X</consumption>
        <emissions>X</emissions>
      </energy_rating>
      <desc>
        <es>${desc}</es>
      </desc>
      <images>
         ${imagesXml}
      </images>
      ${locationXml}
      <last_modified>${lastModified}</last_modified>
    </property>`
}
