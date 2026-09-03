'use client'

import { useState } from 'react'
import { Button } from "@/components/ui"
import { Input } from "@/components/ui"
import { Label } from "@/components/ui"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui"
import { useToast } from '@/hooks/use-toast'
import { Loader2, CheckCircle2, AlertCircle, Save, Info, Key, Globe, LayoutTemplate } from 'lucide-react'
import { updateEmailRef, testEmailConnection } from '@/app/actions/settings'
import type { Database } from '@/types/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']

interface EmailSettingsFormProps {
    profile: Profile
}

export function EmailSettingsForm({ profile }: EmailSettingsFormProps) {
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)
    const [testing, setTesting] = useState(false)
    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [dialogOpen, setDialogOpen] = useState(false)

    const [formData, setFormData] = useState({
        smtp_host: profile.smtp_host || '',
        smtp_port: profile.smtp_port || 587,
        smtp_user: profile.smtp_user || '',
        smtp_password: profile.smtp_password || '',
        imap_host: profile.imap_host || '',
        imap_port: profile.imap_port || 993,
        imap_user: profile.imap_user || '',
        imap_password: profile.imap_password || '',
        email_signature: profile.email_signature || '',
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        // Handle port numbers
        const val = (name.includes('port')) ? parseInt(value) || 0 : value
        setFormData(prev => ({ ...prev, [name]: val }))
        setConnectionStatus('idle') // Reset status on edit
    }

    const applyQuickConfig = (provider: 'gmail' | 'outlook') => {
        if (provider === 'gmail') {
            setFormData(prev => ({
                ...prev,
                smtp_host: 'smtp.gmail.com',
                smtp_port: 587,
                imap_host: 'imap.gmail.com',
                imap_port: 993
            }))
            toast({ title: "Configurado para Gmail", description: "Hosts y puertos actualizados. Ahora usa tu email y App Password." })
        } else if (provider === 'outlook') {
            setFormData(prev => ({
                ...prev,
                smtp_host: 'smtp.office365.com',
                smtp_port: 587,
                imap_host: 'outlook.office365.com',
                imap_port: 993
            }))
            toast({ title: "Configurado para Outlook", description: "Hosts y puertos actualizados." })
        }
    }

    const handleTestConnection = async () => {
        if (!formData.smtp_user || !formData.smtp_password) {
            toast({ title: "Faltan credenciales", description: "Ingresa usuario y contraseña primero.", variant: "destructive" })
            return
        }
        if (!formData.smtp_host || !formData.imap_host) {
            toast({ title: "Faltan servidores", description: "Asegúrate de configurar los Hosts SMTP e IMAP (o usa Configuración Rápida).", variant: "destructive" })
            return
        }

        setTesting(true)
        setConnectionStatus('idle')

        // Sync user/pass if empty in IMAP but present in SMTP (common case)
        const credentials = {
            ...formData,
            imap_user: formData.imap_user || formData.smtp_user,
            imap_password: formData.imap_password || formData.smtp_password
        }

        const result = await testEmailConnection(credentials)
        setTesting(false)

        if (result.success) {
            setConnectionStatus('success')
            toast({ title: "✅ Conexión Exitosa", description: "Tus credenciales funcionan correctamente." })
        } else {
            setConnectionStatus('error')
            toast({ title: "❌ Error de Conexión", description: result.error, variant: "destructive" })
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const result = await updateEmailRef(formData)
        setLoading(false)

        if (result.success) {
            toast({ title: "Configuración guardada", description: "Tus credenciales de correo se han actualizado." })
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" })
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">

            {/* Quick Actions & Help */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-muted/30 p-4 rounded-lg border">
                <div className="space-y-1">
                    <h3 className="font-semibold text-sm">Configuración Rápida</h3>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => applyQuickConfig('gmail')}>
                            <Globe className="h-3 w-3 mr-2 text-red-500" />
                            Gmail
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => applyQuickConfig('outlook')}>
                            <LayoutTemplate className="h-3 w-3 mr-2 text-blue-500" />
                            Outlook / Office 365
                        </Button>
                    </div>
                </div>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="secondary" size="sm" className="w-full sm:w-auto">
                            <Key className="h-4 w-4 mr-2" />
                            ¿Qué contraseña uso?
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Seguridad: Uso de contraseñas de aplicación</DialogTitle>
                            <DialogDescription>
                                Por seguridad, la mayoría de proveedores modernos (Google, Microsoft) bloquean el inicio de sesión directo. Debes generar una contraseña específica.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid md:grid-cols-2 gap-6 py-4">
                            <div className="space-y-3 p-4 border rounded-md bg-red-50/50 border-red-100">
                                <h4 className="font-semibold flex items-center text-red-700">
                                    <Globe className="h-4 w-4 mr-2" /> Google (Gmail/GSuites)
                                </h4>
                                <ol className="list-decimal list-inside text-sm space-y-1 text-muted-foreground">
                                    <li>Ve a tu Cuenta de Google {'>'} Seguridad.</li>
                                    <li>Activa <strong>Verificación en 2 pasos</strong>.</li>
                                    <li>Busca la opción <strong>Contraseñas de aplicaciones</strong>.</li>
                                    <li>Selecciona 'Correo' y 'Ordenador personalizado'.</li>
                                    <li>Copia la clave de 16 letras generada.</li>
                                </ol>
                            </div>
                            <div className="space-y-3 p-4 border rounded-md bg-blue-50/50 border-blue-100">
                                <h4 className="font-semibold flex items-center text-[#0062CC]">
                                    <LayoutTemplate className="h-4 w-4 mr-2" /> Outlook / Office 365
                                </h4>
                                <ol className="list-decimal list-inside text-sm space-y-1 text-muted-foreground">
                                    <li>Ve a Seguridad Avanzada en Microsoft.</li>
                                    <li>Habilita la <strong>Autenticación en dos pasos</strong>.</li>
                                    <li>En 'Contraseñas de aplicaciones', crea una nueva.</li>
                                    <li>Usa esa contraseña aquí en el CRM.</li>
                                </ol>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <Tabs defaultValue="smtp" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="smtp">Envío (SMTP)</TabsTrigger>
                    <TabsTrigger value="imap">Recepción (IMAP)</TabsTrigger>
                    <TabsTrigger value="general">Firma y General</TabsTrigger>
                </TabsList>

                <TabsContent value="smtp">
                    <Card>
                        <CardHeader>
                            <CardTitle>Configuración de envío (SMTP)</CardTitle>
                            <CardDescription>Para enviar correos masivos y respuestas desde el CRM.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="smtp_host">Servidor (Host)</Label>
                                    <Input id="smtp_host" name="smtp_host" placeholder="smtp.gmail.com" value={formData.smtp_host} onChange={handleChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="smtp_port">Puerto</Label>
                                    <Input id="smtp_port" name="smtp_port" type="number" placeholder="587" value={formData.smtp_port} onChange={handleChange} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="smtp_user">Usuario</Label>
                                <Input id="smtp_user" name="smtp_user" placeholder="tu@email.com" value={formData.smtp_user} onChange={handleChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="smtp_password">Contraseña (o App Password)</Label>
                                <Input id="smtp_password" name="smtp_password" type="password" value={formData.smtp_password} onChange={handleChange} />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="imap">
                    <Card>
                        <CardHeader>
                            <CardTitle>Configuración de recepción (IMAP)</CardTitle>
                            <CardDescription>Para leer respuestas y mostrar tu bandeja de entrada.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="imap_host">Servidor (Host)</Label>
                                    <Input id="imap_host" name="imap_host" placeholder="imap.gmail.com" value={formData.imap_host} onChange={handleChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="imap_port">Puerto</Label>
                                    <Input id="imap_port" name="imap_port" type="number" placeholder="993" value={formData.imap_port} onChange={handleChange} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="imap_user">Usuario</Label>
                                <Input id="imap_user" name="imap_user" placeholder="tu@email.com" value={formData.imap_user} onChange={handleChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="imap_password">Contraseña</Label>
                                <div className="flex gap-2">
                                    <Input id="imap_password" name="imap_password" type="password" value={formData.imap_password} onChange={handleChange} className="flex-1" />
                                    <Button type="button" variant="outline"
                                        onClick={() => setFormData(p => ({ ...p, imap_password: p.smtp_password, imap_user: p.smtp_user }))}
                                        title="Copiar de SMTP"
                                    >
                                        Copiar SMTP
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">Generalmente es la misma que la de SMTP.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="general">
                    <Card>
                        <CardHeader>
                            <CardTitle>Personalización</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email_signature">Firma HTML</Label>
                                <Input id="email_signature" name="email_signature" placeholder="<p>Saludos,<br>Tu Nombre</p>" value={formData.email_signature} onChange={handleChange} />
                                <p className="text-xs text-muted-foreground">Admite HTML básico para tu firma.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="flex items-center justify-between border-t pt-6">
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant={connectionStatus === 'success' ? 'outline' : 'secondary'}
                        onClick={handleTestConnection}
                        disabled={testing}
                        className={connectionStatus === 'success' ? 'border-green-500 text-green-600 bg-green-50' : ''}
                    >
                        {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> :
                            connectionStatus === 'success' ? <CheckCircle2 className="mr-2 h-4 w-4" /> :
                                connectionStatus === 'error' ? <AlertCircle className="mr-2 h-4 w-4" /> :
                                    <Info className="mr-2 h-4 w-4" />
                        }
                        {testing ? "Probando..." : "Probar Conexión"}
                    </Button>
                    {connectionStatus === 'error' && (
                        <span className="text-xs text-red-500 font-medium animate-pulse">Falló la conexión</span>
                    )}
                </div>

                <Button type="submit" disabled={loading} className="bg-[#007AFF] hover:bg-[#0062CC]">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Configuración
                </Button>
            </div>
        </form>
    )
}
