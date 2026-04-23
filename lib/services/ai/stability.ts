import { withRetry } from '@/lib/utils/ai-utils'

// ... (tus otras funciones generatePropertyMap y upscaleImage se quedan igual) ...

/**
 * Genera un plano profesional a partir de un boceto a mano
 * Usa el endpoint de Structure de Stability AI
 */
export async function generateFloorplanFromSketch(imageFile: Blob): Promise<string | null> {
    // 1. Prompt Positivo (Estrategia "Espacio Negativo"):
    // En lugar de centrarnos en las líneas, nos centramos en el ESPACIO VACÍO.
    // "Vast empty white floor" obliga a la IA a limpiar todo lo que no sea una pared maestra.
    const prompt = 'Architectural floor plan. High contrast. The image consists PRIMARILY of vast, empty, pure white floor space. Only the main structural walls remain as thick solid black lines. Clean, minimalist, void of details. Euclidean geometry. 2D flat view.'

    // 2. Negative Prompt (Lista de prohibiciones):
    // Añadimos "clutter" (desorden) y "artifacts".
    const negative_prompt = "furniture, text, numbers, dimensions, arrows, handwriting, sketch lines, noise, blur, texture, shading, gradient, room labels, kitchen, bathroom, toilet, clutter, artifacts, complex details, patterns"

    // 3. FUERZA AL 0.75:
    const controlStrength = "0.75"

    const operation = async () => {
        const formData = new FormData()
        formData.append('image', imageFile)
        formData.append('prompt', prompt)
        formData.append('negative_prompt', negative_prompt)
        formData.append('control_strength', controlStrength)

        // 4. CAMBIO IMPORTANTE: Eliminamos 'style_preset'.
        // El preset 'line-art' estaba interpretando el texto como "arte" y lo conservaba.
        // Al quitarlo, el modelo es más obediente al prompt de "suelo blanco".
        // formData.append('style_preset', 'line-art') <--- ELIMINADO

        // 5. Semilla Aleatoria (Seed):
        // Esto evita que si una generación sale mal, la siguiente sea idéntica.
        formData.append('seed', '0')

        formData.append('output_format', 'webp')

        const response = await fetch('https://api.stability.ai/v2beta/stable-image/control/structure', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
                Accept: 'image/*'
            },
            body: formData
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Stability Structure Error (${response.status}): ${errorText}`)
        }

        const buffer = await response.arrayBuffer()
        const base64 = Buffer.from(buffer).toString('base64')
        return `data:image/webp;base64,${base64}`
    }

    try {
        return await withRetry(operation, 2, 2000)
    } catch (error) {
        console.error('🔥 Fallo definitivo generando plano desde boceto:', error)
        return null
    }
}