import { Card, CardContent, CardHeader, CardTitle } from "@casalvi/ui"

interface SettingsProfileCardProps {
  email: string
  userId: string
  firstName?: string
  lastName?: string
}

function getInitials(email: string, firstName?: string, lastName?: string): string {
  if (firstName && lastName) {
    return (firstName[0] + lastName[0]).toUpperCase()
  }
  if (!email) return 'U'
  const parts = email.split('@')[0]
  if (parts.length >= 2) {
    return parts.substring(0, 2).toUpperCase()
  }
  return email.charAt(0).toUpperCase()
}

export function SettingsProfileCard({ email, userId, firstName, lastName }: SettingsProfileCardProps) {
  const initials = getInitials(email, firstName, lastName)
  const displayName = firstName && lastName ? `${firstName} ${lastName}` : 'Usuario sin nombre'

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mi Perfil</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl font-medium shadow-sm">
            {initials}
          </div>

          <div className="flex-1">
            {/* Display Name */}
            <p className="text-lg font-medium text-foreground">{displayName}</p>

            {/* Email */}
            <p className="text-sm text-muted-foreground">{email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Nombre</p>
            <div className="p-2 bg-slate-50 border rounded-md text-sm">{firstName || '-'}</div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Apellido</p>
            <div className="p-2 bg-slate-50 border rounded-md text-sm">{lastName || '-'}</div>
          </div>
        </div>

        {/* User ID */}
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground mb-1">ID de Usuario</p>
          <p className="text-xs font-mono text-muted-foreground break-all">
            {userId}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Útil para soporte técnico
          </p>
        </div>
      </CardContent>
    </Card>
  )
}


