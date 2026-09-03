import type { Metadata } from 'next'
import { Work_Sans } from 'next/font/google'
import { Toaster } from "@/components/ui"
import { ThemeProvider } from '@/components/theme-provider'
import { CookieBanner } from '@/components/legal/cookie-banner'
import { GoogleAnalytics } from '@next/third-parties/google'
import { AnalyticsListener } from '@/components/analytics/analytics-listener'
import './globals.css'

const font = Work_Sans({ subsets: ['latin'] })

import { cookies, headers } from 'next/headers'
import { I18nProvider } from '@/lib/i18n/I18nContext'
import { Locale, dictionaries } from '@/lib/i18n/dictionaries'
import { CurrencyProvider } from '@/lib/context/CurrencyContext'

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = cookies()
  const locale = (cookieStore.get('NEXT_LOCALE')?.value || 'es') as Locale
  const dict = dictionaries[locale] || dictionaries['es']
  const meta = dict.metadata

  return {
    metadataBase: new URL('https://casalvi.com'),
    title: {
      default: meta.title_default,
      template: meta.title_template,
    },
    description: meta.description,
    icons: {
      icon: '/icon.webp',
      apple: '/icon.webp',
    },
    keywords: meta.keywords.split(', '),
    authors: [{ name: 'Casalvi Team' }, { name: 'Darwis Araujo', url: 'https://casalvi.com' }],
    creator: 'Casalvi AI',
    publisher: 'Casalvi AI',
    openGraph: {
      type: 'website',
      locale: locale,
      url: 'https://casalvi.com',
      title: meta.og_title,
      description: meta.og_description,
      siteName: 'Casalvi AI',
      images: [
        {
          url: '/casalvi-logo-final.webp',
          width: 1200,
          height: 630,
          alt: 'Casalvi AI Dashboard',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.og_title,
      description: meta.og_description,
      images: ['/casalvi-logo-final.webp'],
      creator: '@casalvi_ai',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }
}
import QueryProvider from '@/providers/query-provider'

// ...



export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = cookies()
  const headersList = headers()
  // Priority: 1. Header (set by middleware immediate detection), 2. Cookie (persisted), 3. Default 'es'
  const locale = (headersList.get('x-next-locale') || cookieStore.get('NEXT_LOCALE')?.value || 'es') as Locale

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={font.className}>
        <GoogleAnalytics gaId="G-0Y4LYDGL6Y" />
        <I18nProvider initialLocale={locale}>
          <CurrencyProvider>
            <QueryProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="light"
                enableSystem={false}
                disableTransitionOnChange
              >
                <AnalyticsListener />
                {children}
                <CookieBanner />
                <Toaster />
                
              </ThemeProvider>
            </QueryProvider>
          </CurrencyProvider>
        </I18nProvider>
      </body>
    </html>
  )
}


