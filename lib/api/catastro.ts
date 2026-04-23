'use server'

import { parseStringPromise } from 'xml2js' // Necesitarás instalar: npm install xml2js

/**
 * Obtiene la Referencia Catastral y datos básicos por Coordenadas
 * @param lat Latitud
 * @param lng Longitud
 * @param floor Planta (opcional, ej: "01", "1", "2")
 * @param door Puerta (opcional, ej: "A", "B", "1")
 * @returns {Promise<{reference: string, year: string, surface: string, usage: string} | {error: string}>}
 */
export async function getCatastroDataByCoords(lat: number, lng: number, floor?: string, door?: string) {
  // Validación de coordenadas
  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
    return { error: 'Las coordenadas proporcionadas no son válidas. Deben ser números.' }
  }

  // Validar rango de coordenadas (España aproximadamente: lat 36-44, lng -9 a 4)
  if (lat < 35 || lat > 44 || lng < -10 || lng > 5) {
    return { error: 'Las coordenadas están fuera del rango de España. La API de Catastro solo funciona para territorio español.' }
  }

  try {
    // 1. Obtener RC base del edificio por coordenadas
    const coorUrl = `https://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCoordenadas.asmx/Consulta_RCCOOR?Coordenada_X=${lng}&Coordenada_Y=${lat}&SRS=EPSG:4326`

    const coorRes = await fetch(coorUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    })

    if (!coorRes.ok) {
      console.error(`Error HTTP Catastro: ${coorRes.status} ${coorRes.statusText}`)
      return { error: `Error al consultar Catastro: ${coorRes.status} ${coorRes.statusText}` }
    }

    const coorXml = await coorRes.text()

    if (!coorXml || coorXml.trim().length === 0) {
      return { error: 'La API de Catastro devolvió una respuesta vacía' }
    }

    let coorObj
    try {
      coorObj = await parseStringPromise(coorXml)
    } catch (parseError) {
      console.error('Error parseando XML de Catastro:', parseError)
      console.error('XML recibido:', coorXml.substring(0, 500))
      return { error: 'Error al procesar la respuesta de Catastro. La estructura del XML puede haber cambiado.' }
    }

    // Verificar estructura del XML
    // NOTE: The root element usually is 'consulta_coordenadas' or depending on the library/version it might be nested
    const root = coorObj?.consulta_coordenadas || coorObj?.res_coor || coorObj

    // 1. Check for specific API errors (lerr)
    if (root?.lerr?.[0]?.err?.[0]) {
      const errCode = root.lerr[0].err[0].cod?.[0]
      const errDesc = root.lerr[0].err[0].des?.[0]
      console.warn(`Catastro API returned error: [${errCode}] ${errDesc}`)
      return { error: `Catastro info: ${errDesc || 'No se encontraron datos para estas coordenadas'}` }
    }

    // 2. Check for coordinates data
    if (!root?.coordenadas?.[0]?.coord?.[0]?.pc?.[0]) {
      console.error('Estructura XML inesperada:', JSON.stringify(coorObj, null, 2).substring(0, 500))
      return { error: 'No se encontraron datos catastrales para estas coordenadas. Puede que la ubicación no esté registrada en Catastro.' }
    }

    // Extraemos la Referencia Catastral base del edificio
    const pc = root.coordenadas[0].coord[0].pc[0]
    const pc1 = pc.pc1?.[0]
    const pc2 = pc.pc2?.[0]

    if (!pc1 || !pc2) {
      return { error: 'No se pudo obtener la referencia catastral completa. La ubicación puede no estar registrada en Catastro.' }
    }

    const rcBase = String(pc1) + String(pc2)

    if (!rcBase || rcBase.length < 14) {
      return { error: 'La referencia catastral obtenida no es válida' }
    }

    // 2. Consultar todos los inmuebles de esa RC (Pisos/Locales)
    const listUrl = `https://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejero.asmx/Consulta_DNPLP?RC=${rcBase}`

    const listRes = await fetch(listUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    })

    let rcFinal = rcBase

    if (listRes.ok) {
      try {
        const listXml = await listRes.text()

        if (listXml && listXml.trim().length > 0) {
          const listObj = await parseStringPromise(listXml)
          const inmuebles = listObj?.res_dnplp?.lbi?.[0]?.bi || []

          if (inmuebles.length > 0) {
            // 3. Match inteligente por Planta (PT) y Puerta (PU)
            // Nota: El Catastro a veces usa '01' para '1', normalizamos
            const findExact = inmuebles.find((bi: any) => {
              const p = bi.dt?.[0]?.loi?.[0]?.pt?.[0]?.toString().padStart(2, '0')
              const d = bi.dt?.[0]?.loi?.[0]?.pu?.[0]?.toString().toUpperCase()

              const searchP = floor?.toString().padStart(2, '0')
              const searchD = door?.toString().toUpperCase()

              // Si tenemos floor y door, comparamos ambos
              if (floor && door) {
                return p === searchP && d === searchD
              }
              // Si solo tenemos floor, comparamos solo planta
              if (floor && !door) {
                return p === searchP
              }
              // Si solo tenemos door, comparamos solo puerta
              if (!floor && door) {
                return d === searchD
              }
              // Si no tenemos ninguno, no hay match específico
              return false
            })

            if (findExact) {
              // Extraemos la RC completa del inmueble específico
              const rcInmueble = findExact.idbi?.[0]?.rc?.[0]
              if (rcInmueble) {
                const pc1Inmueble = rcInmueble.pc1?.[0]
                const pc2Inmueble = rcInmueble.pc2?.[0]
                if (pc1Inmueble && pc2Inmueble) {
                  rcFinal = String(pc1Inmueble) + String(pc2Inmueble)
                  console.log(`✅ Inmueble específico encontrado: ${rcFinal} (Planta: ${floor}, Puerta: ${door})`)
                }
              }
            } else if (floor || door) {
              console.warn(`⚠️ No se encontró inmueble exacto para Planta: ${floor}, Puerta: ${door}. Usando referencia del edificio.`)
            }
          }
        }
      } catch (error) {
        console.warn('Error al procesar lista de inmuebles, usando referencia del edificio:', error)
        // Continuamos con la referencia del edificio
      }
    } else {
      console.warn(`⚠️ No se pudo obtener la lista de unidades (${listRes.status}), usando referencia del edificio`)
    }

    // 4. Obtener datos técnicos finales (m2, año, uso) con la RC precisa
    const detailUrl = `https://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejero.asmx/Consulta_DNPRC?RefCat=${rcFinal}`

    let detailRes
    try {
      detailRes = await fetch(detailUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      })
    } catch (fetchError) {
      console.error('Error al obtener detalles de Catastro:', fetchError)
      return { error: 'Error de conexión al consultar los detalles catastrales' }
    }

    if (!detailRes.ok) {
      console.error(`Error HTTP detalles Catastro: ${detailRes.status}`)
      return { error: `Error al obtener detalles catastrales: ${detailRes.status}` }
    }

    const detailXml = await detailRes.text()

    if (!detailXml || detailXml.trim().length === 0) {
      return { error: 'La API de Catastro devolvió detalles vacíos' }
    }

    let detailObj
    try {
      detailObj = await parseStringPromise(detailXml)
    } catch (parseError) {
      console.error('Error parseando XML de detalles:', parseError)
      return { error: 'Error al procesar los detalles catastrales' }
    }

    const data = detailObj?.res_dnprc?.bico?.[0]?.bi?.[0]

    if (!data) {
      return { error: 'No se encontraron datos detallados en Catastro para esta referencia' }
    }

    return {
      reference: rcFinal,
      year: data?.idbi?.[0]?.ant?.[0] || null, // Año de construcción
      surface: data?.idbi?.[0]?.sfc?.[0] || null, // Superficie construida
      usage: data?.idbi?.[0]?.uso?.[0] || null // Uso (Residencial, etc.)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    console.error('Error inesperado en Catastro:', error)
    return { error: `Error inesperado al consultar Catastro: ${errorMessage}` }
  }
}

/**
 * Busca la Referencia Catastral por dirección postal (Calle y Número)
 * @param province Provincia (ej: "MADRID")
 * @param municipality Municipio (ej: "MADRID")
 * @param street Calle (ej: "GRAN VIA")
 * @param number Número (ej: "1")
 * @returns {Promise<{reference: string, success: boolean} | {error: string}>}
 */
export async function getCatastroDataByAddress(
  province: string,
  municipality: string,
  street: string,
  number: string
) {
  try {
    // Validación de parámetros requeridos
    if (!province || !municipality || !street || !number) {
      return { error: 'Faltan parámetros requeridos: provincia, municipio, calle y número son obligatorios' }
    }

    // La API de Catastro requiere Provincia, Municipio, Calle y Número
    // NOTA: Los parámetros deben ir separados por &, no por ?
    const url = `https://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejero.asmx/Consulta_DNPLP` +
      `?Provincia=${encodeURIComponent(province)}` +
      `&Municipio=${encodeURIComponent(municipality)}` +
      `&Calle=${encodeURIComponent(street)}` +
      `&Numero=${encodeURIComponent(number)}`

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    })

    if (!res.ok) {
      console.error(`Error HTTP Catastro (dirección): ${res.status} ${res.statusText}`)
      return { error: `Error al consultar Catastro por dirección: ${res.status} ${res.statusText}` }
    }

    const xml = await res.text()

    if (!xml || xml.trim().length === 0) {
      return { error: 'La API de Catastro devolvió una respuesta vacía' }
    }

    let result
    try {
      result = await parseStringPromise(xml)
    } catch (parseError) {
      console.error('Error parseando XML de Catastro (dirección):', parseError)
      return { error: 'Error al procesar la respuesta de Catastro' }
    }

    // Verificación de errores en el callejero
    if (result?.res_dnplp?.lerr?.[0]?.err?.[0]) {
      const errorMsg = result.res_dnplp.lerr[0].err[0].des?.[0] || 'Error desconocido en la consulta'
      return { error: errorMsg }
    }

    // Extraemos la RC del primer inmueble encontrado en ese número
    const bi = result?.res_dnplp?.lbi?.[0]?.bi?.[0]
    if (!bi) {
      return { error: 'No se encontraron inmuebles en esta dirección' }
    }

    const rc = bi.idbi?.[0]?.rc?.[0]
    if (!rc) {
      return { error: 'No se pudo extraer la referencia catastral' }
    }

    const pc1 = rc.pc1?.[0]
    const pc2 = rc.pc2?.[0]

    if (!pc1 || !pc2) {
      return { error: 'Referencia catastral incompleta' }
    }

    const rcFull = String(pc1) + String(pc2)

    if (!rcFull || rcFull.length < 14) {
      return { error: 'La referencia catastral obtenida no es válida' }
    }

    return { reference: rcFull, success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    console.error('Error inesperado en Catastro (dirección):', error)
    return { error: `Error inesperado al consultar Catastro por dirección: ${errorMessage}` }
  }
}

