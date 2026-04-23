'use client'

interface ContactOwnerBadgeProps {
  userId: string
  currentUserId: string | null
}

function getInitials(userId: string): string {
  // Usar primeras 2 letras del user_id
  return userId.substring(0, 2).toUpperCase()
}

export function ContactOwnerBadge({ userId, currentUserId }: ContactOwnerBadgeProps) {
  const isOwn = currentUserId === userId

  if (isOwn) {
    return (
      <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium" title="Tú">
        Tú
      </div>
    )
  }

  const initials = getInitials(userId)

  return (
    <div 
      className="w-7 h-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-medium" 
      title={`Usuario ${userId.substring(0, 8)}...`}
    >
      {initials}
    </div>
  )
}

