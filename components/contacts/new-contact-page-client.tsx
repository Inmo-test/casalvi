'use client'

import { ContactForm } from '@/components/contacts/contact-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@casalvi/ui"
import { Button } from "@casalvi/ui"
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export function NewContactPageClient() {
    const router = useRouter()

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            <div className="mb-6">
                <Link href="/dashboard/contacts">
                    <Button variant="ghost" size="sm" className="pl-0 hover:pl-2 transition-all">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Volver al listado
                    </Button>
                </Link>
                <h1 className="text-3xl font-medium tracking-tight mt-2">Nuevo Contacto</h1>
                <p className="text-muted-foreground">
                    Añade un nuevo cliente o propietario a tu base de datos.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Información del Contacto</CardTitle>
                    <CardDescription>
                        Rellena los datos básicos. Si añades la dirección, buscaremos datos de Catastro automáticamente.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ContactForm
                        onSuccess={() => router.push('/dashboard/contacts')}
                        onCancel={() => router.back()}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
