import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Casalvi CRM',
        short_name: 'Casalvi',
        description: 'El CRM Inmobiliario impulsado por IA y Voz.',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#020617', // slate-950
        icons: [
            {
                src: '/icon.svg',
                sizes: 'any',
                type: 'image/svg+xml',
            },
            {
                src: '/icon.webp', // Fallback/Standard
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icon.webp', // Large
                sizes: '512x512',
                type: 'image/png',
            }
        ],
    }
}
