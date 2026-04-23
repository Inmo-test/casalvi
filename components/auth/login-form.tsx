'use client'

import { useState } from 'react'
import { Button } from "@casalvi/ui"
import { Input } from "@casalvi/ui"
import { Label } from "@casalvi/ui"
import { Checkbox } from "@casalvi/ui"
import Link from 'next/link'
import { login, signup, signInWithMagicLink } from '@/app/actions/auth'
import { Loader2, Mail, Lock, ArrowRight } from 'lucide-react'

interface LoginFormProps {
  defaultMode?: 'login' | 'signup'
  selectedPlan?: string
}

export function LoginForm({ defaultMode = 'login', selectedPlan }: LoginFormProps) {
  const [isLogin, setIsLogin] = useState(defaultMode === 'login')
  const [error, setError] = useState<string | null>(null)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    if (!isLogin && !termsAccepted) {
      setError('Debes aceptar los términos para continuar')
      setLoading(false)
      return
    }

    if (!isLogin) {
      formData.set('termsAccepted', 'true')
    }

    const result = isLogin ? await login(formData) : await signup(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  async function handleMagicLink(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await signInWithMagicLink(formData)
    setLoading(false)

    if (result?.error) {
      setError(result.error)
    } else if (result?.success) {
      setMagicLinkSent(true)
    }
  }

  return (
    <div className="space-y-6 py-4">
      {error && (
        <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 animate-in slide-in-from-top-2">
          <span>⚠️</span>
          {error}
        </div>
      )}

      {magicLinkSent ? (
        <div className="p-8 text-center bg-emerald-50 border border-emerald-100 rounded-2xl animate-in zoom-in-95">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="h-6 w-6 text-emerald-600" />
          </div>
          <h3 className="text-lg font-medium text-emerald-900 mb-2">¡Enlace enviado!</h3>
          <p className="text-sm text-emerald-700">Revisa tu bandeja de entrada y haz clic en el enlace para acceder.</p>
          <Button variant="ghost" className="mt-4 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100" onClick={() => setMagicLinkSent(false)}>
            Volver
          </Button>
        </div>
      ) : (
        <>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              {!isLogin && selectedPlan && <input type="hidden" name="initialPlan" value={selectedPlan} />}
              {!isLogin && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium text-slate-700 ml-1">Nombre</Label>
                    <div className="relative">
                      <Input
                        id="firstName"
                        name="firstName"
                        type="text"
                        placeholder="Juan"
                        required={!isLogin}
                        className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all shadow-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium text-slate-700 ml-1">Apellido</Label>
                    <div className="relative">
                      <Input
                        id="lastName"
                        name="lastName"
                        type="text"
                        placeholder="Pérez"
                        required={!isLogin}
                        className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700 ml-1">Email Corporativo</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="nombre@inmobiliaria.com"
                    required
                    className="pl-11 h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all shadow-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700 ml-1">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="pl-11 h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all shadow-sm"
                  />
                </div>
              </div>

              {!isLogin && (
                <div className="flex items-start space-x-2 pt-2">
                  <Checkbox
                    id="terms"
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="terms"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-600"
                    >
                      He leído y acepto los <Link href="/legal/terms" target="_blank" className="underline text-[#007AFF] hover:text-blue-800">Términos y Condiciones</Link> y la <Link href="/legal/privacy" target="_blank" className="underline text-[#007AFF] hover:text-blue-800">Política de Privacidad</Link>.
                    </label>
                  </div>
                </div>
              )}
            </div>

            <Button type="submit" className="w-full h-12 rounded-xl text-base font-medium shadow-lg shadow-[#007AFF]/20 bg-[#007AFF] hover:bg-[#0062CC] transition-all hover:scale-[1.02]" disabled={loading}>
              {loading ? <Loader2 className="animate-spin mr-2" /> : null}
              {isLogin ? 'Entrar al Dashboard' : 'Crear Cuenta Gratis'}
              {!loading && <ArrowRight className="ml-2 h-4 w-4 opacity-50" />}
            </Button>
          </form>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-100" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wider">
              <span className="bg-white px-2 text-slate-400 font-medium">
                O acceso rápido
              </span>
            </div>
          </div>

          <form action={handleMagicLink} className="pt-2">
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  name="email"
                  type="email"
                  placeholder="tu@email.com para enlace mágico"
                  required
                  className="h-11 rounded-xl bg-slate-50/50"
                />
                <Button type="submit" variant="outline" className="h-11 px-4 rounded-xl border-slate-200 hover:bg-slate-50 text-slate-600" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" /> : 'Enviar Link'}
                </Button>
              </div>
            </div>
          </form>
        </>
      )}

      <div className="text-center pt-2">
        {isLogin ? (
          <Link
            href="/signup"
            className="text-sm font-medium text-slate-500 hover:text-[#007AFF] transition-colors"
          >
            ¿Aún no tienes cuenta? Regístrate gratis
          </Link>
        ) : (
          <Link
            href="/login"
            className="text-sm font-medium text-slate-500 hover:text-[#007AFF] transition-colors"
          >
            ¿Ya tienes cuenta? Inicia sesión aquí
          </Link>
        )}
      </div>
    </div>
  )
}
