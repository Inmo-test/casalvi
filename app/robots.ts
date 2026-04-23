import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/dashboard/', '/admin/', '/onboarding/'],
        },
        sitemap: 'https://casalvi.com/sitemap.xml',
    }
}
