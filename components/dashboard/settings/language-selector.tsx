'use client'

import { useI18n } from '@/lib/i18n/I18nContext'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui"
import { Globe } from 'lucide-react'

export function LanguageSelector() {
    const { locale, setLocale, t } = useI18n()
    const router = useRouter()

    const languages = [
        { code: 'en', label: 'English', flag: '🇬🇧' },
        { code: 'es', label: 'Español', flag: '🇪🇸' },
        { code: 'fr', label: 'Français', flag: '🇫🇷' },
        { code: 'zh', label: '中文 (Chinese)', flag: '🇨🇳' },
        { code: 'ru', label: 'Русский', flag: '🇷🇺' },
        { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
        { code: 'it', label: 'Italiano', flag: '🇮🇹' },
        { code: 'pl', label: 'Polski', flag: '🇵🇱' },
        { code: 'uk', label: 'Українська', flag: '🇺🇦' },
        { code: 'ro', label: 'Română', flag: '🇷🇴' },
        { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
    ]

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" />
                    <CardTitle>Idioma / Language / Langue</CardTitle>
                </div>
                <CardDescription>
                    Select your preferred language for the Casalvi interface.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-4">
                    <Select
                        value={locale}
                        onValueChange={(val: any) => {
                            setLocale(val)
                            router.refresh() // Force server components to re-render with new locale
                        }}
                    >
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select language">
                                <span className="flex items-center gap-2">
                                    <span>{languages.find(l => l.code === locale)?.flag}</span>
                                    <span>{languages.find(l => l.code === locale)?.label}</span>
                                </span>
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {languages.map((lang) => (
                                <SelectItem key={lang.code} value={lang.code}>
                                    <div className="flex items-center gap-2">
                                        <span>{lang.flag}</span>
                                        <span>{lang.label}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
        </Card>
    )
}
