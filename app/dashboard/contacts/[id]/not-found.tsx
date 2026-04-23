import Link from 'next/link'
import { Button } from "@casalvi/ui"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@casalvi/ui"

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Contacto no encontrado</CardTitle>
          <CardDescription className="text-center">
            El contacto que buscas no existe o no tienes permisos para verlo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <div className="text-6xl">🔍</div>
          </div>
          <Button asChild className="w-full">
            <Link href="/dashboard/contacts">
              Volver a Contactos
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}



