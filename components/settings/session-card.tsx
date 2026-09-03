'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui"
import { Button } from "@/components/ui"
import { logout } from '@/app/actions/auth'
import { LogOut } from 'lucide-react'

export function SettingsSessionCard() {
  const handleLogout = async () => {
    await logout()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sesión</CardTitle>
      </CardHeader>
      <CardContent>
        <Button
          variant="destructive"
          onClick={handleLogout}
          className="w-full"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar Sesión
        </Button>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Al cerrar sesión, serás redirigido a la página de inicio
        </p>
      </CardContent>
    </Card>
  )
}


