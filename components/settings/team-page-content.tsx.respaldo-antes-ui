'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@casalvi/ui"
import { Avatar, AvatarFallback, AvatarImage } from "@casalvi/ui"
import { Badge } from "@casalvi/ui"
import { Button } from "@casalvi/ui"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@casalvi/ui"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@casalvi/ui"
import { InviteMemberDialog } from '@/components/settings/invite-member-dialog'
import { Trash2, Shield, Mail, Clock, ArrowLeft, Loader2, UserCog } from 'lucide-react'
import Link from 'next/link'
import { removeMember, updateMemberRole } from '@/app/actions/team'
import { useToast } from '@/hooks/use-toast'

interface TeamPageContentProps {
  userEmail: string
  agency: any
  userRole: string | null
  members: any[]
  invitations?: any[]
}

export function TeamPageContent({
  userEmail,
  agency,
  userRole,
  members,
  invitations = []
}: TeamPageContentProps) {

  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [updatingRole, setUpdatingRole] = useState<string | null>(null)

  const [memberToRemove, setMemberToRemove] = useState<string | null>(null)

  const confirmRemoval = async () => {
    if (!memberToRemove) return

    const userId = memberToRemove
    setMemberToRemove(null) // Cerrar diálogo
    setIsDeleting(userId) // Mostrar spinner en botón original (si siguiera ahí) o simplemente feedback global

    const result = await removeMember(userId)
    setIsDeleting(null)

    if (result && result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' })
    } else {
      toast({ title: 'Miembro expulsado', description: 'El usuario ha sido eliminado del equipo. Sus datos permanecen en la agencia.' })
    }
  }

  const handleRoleUpdate = async (userId: string, newRole: string) => {
    if (newRole !== 'agent' && newRole !== 'manager') return

    setUpdatingRole(userId)
    const result = await updateMemberRole(userId, newRole as 'agent' | 'manager')
    setUpdatingRole(null)

    if (result && result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' })
    } else {
      toast({ title: 'Rol actualizado', description: 'El rol del usuario ha sido modificado.' })
    }
  }

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">

      {/* HEADER DE LA PÁGINA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Tu Equipo</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona el acceso de tus agentes al CRM.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/settings">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" /> Volver
            </Button>
          </Link>
          {/* Solo Admin/Owner/Manager pueden ver botón invitar (lógica interna del dialogo maneja el resto) */}
          {(userRole === 'owner' || userRole === 'admin' || userRole === 'manager') && (
            <InviteMemberDialog />
          )}
        </div>
      </div>

      {/* 1. LISTA DE MIEMBROS ACTIVOS */}
      <Card>
        <CardHeader>
          <CardTitle>Miembros Activos ({members.length})</CardTitle>
          <CardDescription>Usuarios que actualmente tienen acceso a <strong>{agency.name}</strong>.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member) => {
              // Lógica de visualización de Roles
              const isMe = member.email === userEmail
              const isOwner = member.role === 'owner'
              // Owner y Admin pueden editar roles (menos a owners o a sí mismos)
              const canEditRole = (userRole === 'owner' || userRole === 'admin') && !isOwner && !isMe

              return (
                <div key={member.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/5 transition-colors gap-4">

                  {/* Info Usuario */}
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={member.avatar_url} />
                      <AvatarFallback>{member.name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm flex items-center gap-2">
                        {member.name}
                        {isMe && <span className="text-xs text-muted-foreground">(Tú)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                  </div>

                  {/* Badges y Acciones */}
                  <div className="flex items-center gap-4 justify-between sm:justify-end w-full sm:w-auto">
                    <div className="flex flex-col items-end gap-1">
                      {canEditRole ? (
                        <div className="flex items-center gap-2">
                          {updatingRole === member.user_id && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
                          <Select
                            defaultValue={member.role === 'admin' ? 'manager' : member.role} // Admin legacy -> manager
                            onValueChange={(val) => handleRoleUpdate(member.user_id, val)}
                            disabled={updatingRole === member.user_id}
                          >
                            <SelectTrigger className="h-8 w-[130px]">
                              <SelectValue placeholder="Seleccionar Rol" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="agent">Agente</SelectItem>
                              <SelectItem value="manager">Sub-admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <Badge variant={member.role === 'owner' ? 'default' : (member.role === 'admin' || member.role === 'manager') ? 'secondary' : 'outline'} className="capitalize">
                          {member.role === 'owner' && <Shield className="w-3 h-3 mr-1" />}
                          {(member.role === 'admin' || member.role === 'manager') && <UserCog className="w-3 h-3 mr-1" />}
                          {member.role === 'agent' ? 'Agente' : member.role === 'manager' ? 'Sub-admin' : member.role === 'owner' ? 'Dueño' : member.role}
                        </Badge>
                      )}

                      <span className="text-[10px] text-muted-foreground">
                        Unido el {new Date(member.joined_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Botón Eliminar  */}
                    {/* Owner: Elimina a todos menos a sí mismo */}
                    {/* Admin: Elimina a Agent y Manager */}
                    {/* Manager: Elimina solo a Agent */}
                    {!isMe && (
                      (userRole === 'owner' && !isOwner) ||
                      (userRole === 'admin' && (member.role === 'agent' || member.role === 'manager')) ||
                      (userRole === 'manager' && member.role === 'agent')
                    ) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setMemberToRemove(member.user_id)}
                          disabled={isDeleting === member.user_id}
                          className="text-muted-foreground hover:text-red-600 hover:bg-red-50"
                        >
                          {isDeleting === member.user_id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </Button>
                      )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* 2. LISTA DE INVITACIONES PENDIENTES (DISEÑO NARANJA) */}
      {invitations.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/40 dark:bg-orange-950/10 dark:border-orange-900">
          <CardHeader>
            <CardTitle className="text-orange-800 dark:text-orange-400 text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" /> Invitaciones Pendientes
            </CardTitle>
            <CardDescription className="text-orange-700/80 dark:text-orange-500/80">
              Personas que han sido invitadas pero aún no han aceptado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {invitations.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-3 bg-white dark:bg-card border border-orange-100 dark:border-orange-900/30 rounded-lg shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-100 dark:bg-orange-900/50 p-2 rounded-full text-orange-600 dark:text-orange-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{inv.email}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Rol: <span className="capitalize font-medium">{inv.role === 'agent' ? 'Agente' : inv.role}</span></span>
                        <span className="text-[10px] text-muted-foreground">• Enviado el {new Date(inv.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400">
                    Pendiente
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}


      {/* DIÁLOGO DE CONFIRMACIÓN DE EXPULSIÓN */}
      <AlertDialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Expulsar miembro del equipo?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Esta acción es <strong>irreversible</strong> y eliminará el acceso del usuario inmediatamente.</p>
              <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded text-amber-800 text-sm">
                <span className="font-semibold block mb-1">Nota importante:</span>
                Los contactos, propiedades y datos creados por este agente <strong>permanecerán en tu base de datos</strong> y seguirán siendo propiedad de la agencia (Admin).
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoval}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600 text-white"
            >
              Expulsar Miembro
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}
