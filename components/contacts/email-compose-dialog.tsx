'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui"
import { Button } from "@/components/ui"
import { Input } from "@/components/ui"
import { Label } from "@/components/ui"
import { Textarea } from "@/components/ui"
import { sendBulkEmail, generateEmailDraft } from '@/app/actions/bulk-email'
import { useToast } from '@/hooks/use-toast'
import { Mail, Sparkles, Send, Loader2 } from 'lucide-react'

interface EmailComposeDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    selectedContactIds: string[]
    onEmailSent: () => void
}

export function EmailComposeDialog({ open, onOpenChange, selectedContactIds, onEmailSent }: EmailComposeDialogProps) {
    const [subject, setSubject] = useState('')
    const [body, setBody] = useState('')
    const [loading, setLoading] = useState(false)
    const [aiLoading, setAiLoading] = useState(false)
    const { toast } = useToast()

    const handleGenerateAI = async () => {
        setAiLoading(true)
        const result = await generateEmailDraft("Generar email de captación")
        setAiLoading(false)
        if (result.success) {
            setSubject(result.subject)
            setBody(result.body)
            toast({ title: "✨ Borrador Generado", description: "Personalízalo antes de enviar." })
        }
    }

    const handleSend = async () => {
        if (!subject || !body) return

        setLoading(true)
        const result = await sendBulkEmail(selectedContactIds, subject, body)
        setLoading(false)

        if (result.success) {
            toast({ title: "Emails Enviados", description: result.message })
            onEmailSent()
            onOpenChange(false)
            setSubject('')
            setBody('')
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" })
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Email Masivo ({selectedContactIds.length} destinatarios)
                    </DialogTitle>
                    <DialogDescription>
                        Envía un correo personalizado a tus contactos seleccionados.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>Asunto</Label>
                        <div className="flex gap-2">
                            <Input
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Asunto del correo..."
                            />
                            <Button
                                variant="outline"
                                onClick={handleGenerateAI}
                                disabled={aiLoading}
                                title="Generar con IA"
                                className="shrink-0"
                            >
                                {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-blue-500" />}
                                <span className="sr-only">IA</span>
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Mensaje</Label>
                        <Textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="Escribe tu mensaje aquí... Usa {{name}} para insertar el nombre."
                            rows={8}
                        />
                        <p className="text-xs text-muted-foreground">
                            Tip: Usa <strong>{'{{name}}'}</strong> para personalizar con el nombre del contacto.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSend} disabled={loading || !subject || !body} className="bg-[#007AFF] hover:bg-[#0062CC]">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Send className="mr-2 h-4 w-4" />
                        Enviar Ahora
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
