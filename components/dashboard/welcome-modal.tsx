'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import confetti from 'canvas-confetti'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@casalvi/ui'
import { Button } from '@casalvi/ui'
import { Sparkles, Trophy, Rocket, Building } from 'lucide-react'
import { useI18n } from '@/lib/i18n/I18nContext'

export function WelcomeModal({ plan }: { plan: string }) {
  const { t } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check if we should show welcome
    const showWelcome = searchParams.get('showWelcome')
    const checkoutSuccess = searchParams.get('checkout') === 'success'

    if (showWelcome === 'true' || checkoutSuccess) {
      setIsOpen(true)

      // Fire confetti
      const duration = 3 * 1000
      const animationEnd = Date.now() + duration
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

      const interval: any = setInterval(function () {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) {
          return clearInterval(interval)
        }

        const particleCount = 50 * (timeLeft / duration)

        // since particles fall down, start a bit higher than random
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } })
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } })
      }, 250)

      // Clean up URL param without refresh
      const newParams = new URLSearchParams(searchParams.toString())
      newParams.delete('showWelcome')
      newParams.delete('checkout')
      router.replace(`/dashboard?${newParams.toString()}`, { scroll: false })
    }
  }, [searchParams, router])

  const handleClose = () => {
    setIsOpen(false)
  }

  const getPlanDetails = () => {
    switch (plan) {
      case 'pro':
        return {
          title: t.dashboard.welcome_modal.title_pro,
          description: t.dashboard.welcome_modal.desc_pro,
          icon: <Sparkles className="h-12 w-12 text-yellow-500" />
        }
      case 'business':
        return {
          title: t.dashboard.welcome_modal.title_business,
          description: t.dashboard.welcome_modal.desc_business,
          icon: <Rocket className="h-12 w-12 text-blue-500" />
        }
      case 'agency':
        return {
          title: t.dashboard.welcome_modal.title_agency,
          description: t.dashboard.welcome_modal.desc_agency,
          icon: <Building className="h-12 w-12 text-purple-500" />
        }
      default:
        return {
          title: t.dashboard.welcome_modal.title_default,
          description: t.dashboard.welcome_modal.desc_default,
          icon: <Trophy className="h-12 w-12 text-green-500" />
        }
    }
  }

  const details = getPlanDetails()

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md text-center">
        <div className="flex justify-center my-4">
          <div className="p-4 bg-slate-50 rounded-full animate-bounce">
            {details.icon}
          </div>
        </div>
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">{details.title}</DialogTitle>
          <DialogDescription className="text-center text-lg mt-2">
            {details.description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center mt-6">
          <Button type="button" size="lg" onClick={handleClose} className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium">
            {t.dashboard.welcome_modal.button_start}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
