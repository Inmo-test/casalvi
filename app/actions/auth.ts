'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

import { z } from 'zod'

import { createAgency } from '@/app/actions/team'

const RegisterSchema = z.object({
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  termsAccepted: z.literal('true', { errorMap: () => ({ message: 'Debes aceptar los términos' }) }),
})

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { data: authData, error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message }
  }

  // --- SINGLE SESSION ENFORCEMENT ---
  if (authData.user) {
    const sessionId = crypto.randomUUID()

    // 1. Guardar en Base de Datos
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ active_session_id: sessionId })
      .eq('id', authData.user.id)

    if (profileError) {
      console.error('Error setting session ID in DB:', profileError)
      // Opcional: Bloquear login si falla esto
    } else {
      // 2. Guardar en Cookie
      cookies().set('device_session_id', sessionId, {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30 // 30 días
      })
    }
  }
  // ----------------------------------

  revalidatePath('/dashboard', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const rawData = {
    firstName: formData.get('firstName') as string,
    lastName: formData.get('lastName') as string,
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    termsAccepted: formData.get('termsAccepted') as string,
  }

  const validation = RegisterSchema.safeParse(rawData)

  if (!validation.success) {
    return { error: validation.error.errors[0].message }
  }

  const data = {
    email: rawData.email,
    password: rawData.password,
    options: {
      data: {
        first_name: rawData.firstName,
        last_name: rawData.lastName,
      }
    }
  }

  // 1. Create the user in auth
  const { data: authData, error } = await supabase.auth.signUp(data)

  if (error) {
    console.error('Signup Error:', error.message)
    return { error: error.message }
  }

  console.log('Signup Success. Processing Post-Signup Logic...')

  // --- SINGLE SESSION ENFORCEMENT ---
  if (authData.user && authData.session) {
    const sessionId = crypto.randomUUID()

    // El perfil se crea por trigger, esperamos un momento o reintentamos si falla?
    // Supabase trigger es sincrono usualmente en la misma transaccion si es postgres puro, 
    // pero auth.users es esquema auth y profiles publica.
    // Intentamos update
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ active_session_id: sessionId })
      .eq('id', authData.user.id)

    if (!profileError) {
      cookies().set('device_session_id', sessionId, {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30
      })
    } else {
      console.warn('Could not set session ID on signup (Profile might not be ready):', profileError)
      // No es crítico en signup, el middleware puede redirigir a login si falta y ahí se arregla
    }
  }
  // ----------------------------------

  const agencyName = `Agencia de ${rawData.firstName}`
  await createAgency(agencyName, 'starter')
  revalidatePath('/dashboard', 'layout')
  redirect('/dashboard?signup=success')
}

export async function signInWithGoogle() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.url) {
    redirect(data.url)
  }
}

export async function signInWithMagicLink(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true, message: 'Revisa tu email para el enlace mágico' }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}


