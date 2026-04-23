'use client'

import { useState, useEffect } from 'react'
import { Button } from '@casalvi/ui'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@casalvi/ui'
import { Checkbox } from '@casalvi/ui'
import { Label } from '@casalvi/ui'
import { ShieldCheck, Cookie } from 'lucide-react'

export function CookieBanner() {
    const [isVisible, setIsVisible] = useState(false)
    const [showConfig, setShowConfig] = useState(false)

    // Estado de preferencias (por defecto todo desactivado menos esenciales)
    const [preferences, setPreferences] = useState({
        essential: true, // Siempre true
        analytics: false,
    })

    useEffect(() => {
        // Verificar si ya hay consentimiento guardado
        const savedConsent = localStorage.getItem('cookie-consent')
        if (!savedConsent) {
            // Pequeño delay para no ser intrusivo inmediatamente
            const timer = setTimeout(() => setIsVisible(true), 1000)
            return () => clearTimeout(timer)
        } else {
            // Si existe, cargar preferencias (opcional, por si queremos permitir re-configurar luego)
            try {
                const parsed = JSON.parse(savedConsent)
                setPreferences(prev => ({ ...prev, ...parsed }))
            } catch (e) {
                console.error('Error parsing cookie consent', e)
            }
        }
    }, [])

    const handleAcceptAll = () => {
        const allAccepted = { essential: true, analytics: true }
        saveConsent(allAccepted)
    }

    const handleRejectAll = () => {
        const allRejected = { essential: true, analytics: false }
        saveConsent(allRejected)
    }

    const handleSaveConfig = () => {
        saveConsent(preferences)
        setShowConfig(false)
    }

    const saveConsent = (prefs: typeof preferences) => {
        localStorage.setItem('cookie-consent', JSON.stringify(prefs))
        setPreferences(prefs)
        setIsVisible(false)

        // AQUÍ SE ACTIVARÍAN LOS SCRIPTS REALES
        if (prefs.analytics) {
            console.log('🍪 Analytics Cookies Activadas')
            // Ejemplo: window.gtag('consent', 'update', { ... })
        }
    }

    if (!isVisible) return null

    return (
        <>
            {/* BANNER FIXED BOTTOM */}
            <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 bg-transparent pointer-events-none flex justify-center">
                <div className="bg-white/95 backdrop-blur-md border border-slate-200 shadow-2xl rounded-3xl p-6 max-w-4xl w-full pointer-events-auto flex flex-col md:flex-row items-start md:items-center gap-6 animate-in slide-in-from-bottom-10 fade-in duration-500">

                    {/* Texto e Icono */}
                    <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 text-slate-900 font-medium text-lg">
                            <Cookie className="h-5 w-5 text-amber-500" />
                            <span>Privacidad y Cookies</span>
                        </div>
                        <p className="text-sm text-slate-500 leading-relaxed text-balance">
                            Usamos cookies propias y de terceros para fines analíticos y para mostrarte publicidad personalizada en base a un perfil elaborado a partir de tus hábitos de navegación (por ejemplo, páginas visitadas).
                            Puedes aceptar todas las cookies pulsando el botón "Aceptar todas", rechazar todas pulsando "Rechazar todas" o configurarlas en "Configurar".
                        </p>
                    </div>

                    {/* Botones - Misma Jerarquía Visual Flexible */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
                        <Button
                            variant="outline"
                            onClick={() => setShowConfig(true)}
                            className="rounded-xl font-medium border-slate-300 hover:bg-slate-50 text-slate-700"
                        >
                            Configurar
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleRejectAll}
                            className="rounded-xl font-medium border-slate-300 hover:bg-slate-50 text-slate-700"
                        >
                            Rechazar todas
                        </Button>
                        <Button
                            onClick={handleAcceptAll}
                            className="rounded-xl font-medium bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/10"
                        >
                            Aceptar todas
                        </Button>
                    </div>
                </div>
            </div>

            {/* MODAL DE CONFIGURACIÓN */}
            <Dialog open={showConfig} onOpenChange={setShowConfig}>
                <DialogContent className="sm:max-w-lg rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-medium flex items-center gap-2">
                            <ShieldCheck className="h-6 w-6 text-[#007AFF]" />
                            Configuración de Cookies
                        </DialogTitle>
                        <DialogDescription className="text-base pt-2">
                            Gestiona tus preferencias de privacidad. Las cookies técnicas son necesarias para que el sitio funcione y no pueden desactivarse.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-6 space-y-6">
                        {/* Esenciales */}
                        <div className="flex items-start space-x-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="flex h-6 items-center">
                                <Checkbox id="essential" checked={true} disabled />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="essential" className="font-medium text-base">Esenciales (Técnicas)</Label>
                                <p className="text-sm text-slate-500">
                                    Necesarias para el funcionamiento básico (Login, Pagos, Seguridad). Proveedores: Supabase, Stripe.
                                </p>
                            </div>
                        </div>

                        {/* Analíticas */}
                        <div className="flex items-start space-x-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                            <div className="flex h-6 items-center">
                                <Checkbox
                                    id="analytics"
                                    checked={preferences.analytics}
                                    onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, analytics: checked === true }))}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="analytics" className="font-medium text-base cursor-pointer">Analíticas y Rendimiento</Label>
                                <p className="text-sm text-slate-500">
                                    Nos ayudan a mejorar el sitio entendiendo cómo lo usas. La información se recopila de forma anónima.
                                </p>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={handleRejectAll} className="rounded-xl w-full sm:w-auto">
                            Rechazar todo
                        </Button>
                        <Button onClick={handleSaveConfig} className="rounded-xl bg-[#007AFF] hover:bg-[#0062CC] text-white w-full sm:w-auto">
                            Guardar preferencias
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
