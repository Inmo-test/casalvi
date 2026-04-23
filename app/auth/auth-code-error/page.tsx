import Link from 'next/link'
import { Button } from "@casalvi/ui"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@casalvi/ui"

export default function AuthCodeErrorPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-red-600">Error de Autenticación</CardTitle>
          <CardDescription className="text-center">
            Hubo un problema al procesar tu autenticación
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            El código de autenticación no es válido o ha expirado. Por favor, intenta iniciar sesión nuevamente.
          </p>
          <Button asChild className="w-full">
            <Link href="/">
              Volver al inicio
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}



