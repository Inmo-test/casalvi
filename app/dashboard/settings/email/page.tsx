import { getProfile } from '@/app/actions/settings'
import { EmailSettingsForm } from '@/components/settings/email-settings-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui"

export default async function EmailSettingsPage() {
    const profile = await getProfile()

    if (!profile) return <div>No se encontró el perfil del usuario.</div>

    return (
        <div className="container max-w-4xl py-6 space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-medium tracking-tight">Configuración de Correo</h1>
                <p className="text-muted-foreground">
                    Conecta tu servidor de correo para enviar campañas y gestionar tu bandeja de entrada desde el CRM.
                </p>
            </div>

            <EmailSettingsForm profile={profile} />
        </div>
    )
}
