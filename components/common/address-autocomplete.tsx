'use client'

import { useState, useEffect, useRef } from 'react'
import { useLoadScript } from '@react-google-maps/api'
import { Input } from "@casalvi/ui"
import { cn } from '@/lib/cn'

// Tipos para las bibliotecas de Google Maps
type Libraries = ('places' | 'drawing' | 'geometry' | 'localContext' | 'visualization')[]

// Constante estática para evitar recargas
const libraries: any[] = ['places']

export interface AddressAutocompleteResult {
  formatted_address: string
  latitude: number
  longitude: number
  google_place_id: string
}

interface AddressAutocompleteProps {
  onAddressSelect: (result: AddressAutocompleteResult) => void
  onInputChange?: (value: string) => void
  defaultValue?: string
  placeholder?: string
  className?: string
  disabled?: boolean
  error?: string
  name?: string
}

function PlacesAutocompleteInput({
  onAddressSelect,
  onInputChange,
  defaultValue = '',
  placeholder = 'Buscar dirección...',
  className,
  disabled = false,
  error,
  name,
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(defaultValue)
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  // PATRÓN STABLE REF: Guardamos los callbacks en refs para no romper el useEffect
  // Esto evita que el widget se reinicialice si el padre re-renderiza
  const onAddressSelectRef = useRef(onAddressSelect)
  const onInputChangeRef = useRef(onInputChange)

  // Actualizamos los refs cuando cambian las props
  useEffect(() => {
    onAddressSelectRef.current = onAddressSelect
    onInputChangeRef.current = onInputChange
  }, [onAddressSelect, onInputChange])

  // Inicializar Autocomplete (SOLO UNA VEZ)
  useEffect(() => {
    if (!inputRef.current || !window.google?.maps?.places) return

    // Evitar doble inicialización
    if (autocompleteRef.current) return

    // Configuración robusta
    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      fields: ['formatted_address', 'geometry', 'place_id', 'name'],
      // 'geocode' permite direcciones, 'establishment' permite negocios/lugares
      types: ['geocode', 'establishment'],
      componentRestrictions: { country: 'es' },
    })

    // Listener de selección
    const listener = autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace()

      // Validación de seguridad
      if (!place || !place.geometry || !place.geometry.location) {
        // Si el usuario da Enter sin seleccionar o Google falla
        return
      }

      const lat = place.geometry.location.lat()
      const lng = place.geometry.location.lng()
      // Usar formatted_address es lo más seguro, fallback al name
      const addressText = place.formatted_address || place.name || ''
      const placeId = place.place_id || ''

      // 1. Actualizar estado local
      setInputValue(addressText)

      // 2. Actualizar campo hidden (si existe)
      if (name) {
        const hiddenInput = document.querySelector(`input[name="${name}"][type="hidden"]`) as HTMLInputElement
        if (hiddenInput) hiddenInput.value = addressText
      }

      // 3. Notificar al padre (usando el Ref estable)
      if (onInputChangeRef.current) {
        onInputChangeRef.current(addressText)
      }

      onAddressSelectRef.current({
        formatted_address: addressText,
        latitude: lat,
        longitude: lng,
        google_place_id: placeId,
      })

      console.log('📍 Dirección seleccionada:', addressText)
    })

    // Cleanup: Solo al desmontar el componente
    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current)
        autocompleteRef.current = null
      }
    }
  }, [name]) // Dependencias mínimas. NO incluir callbacks.

  // Sincronizar defaultValue solo si cambia externamente de forma drástica
  useEffect(() => {
    if (defaultValue && defaultValue !== inputValue) {
      setInputValue(defaultValue)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValue])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    if (onInputChangeRef.current) onInputChangeRef.current(newValue)

    if (name) {
      const hiddenInput = document.querySelector(`input[name="${name}"][type="hidden"]`) as HTMLInputElement
      if (hiddenInput) hiddenInput.value = newValue
    }
  }

  return (
    <div className={cn('w-full', className)}>
      {name && <input type="hidden" name={name} value={inputValue} />}
      <Input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(error && 'border-red-500')}
        autoComplete="off"
        // Prevenir que algunos navegadores interfieran con el autocompletado nativo
        list="autocompleteOff"
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  )
}

export function AddressAutocomplete(props: AddressAutocompleteProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  })

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return <div className="p-2 text-red-500">Falta API Key de Google Maps</div>
  }

  if (loadError) {
    return <div className="p-2 text-red-500">Error cargando Maps: {loadError.message}</div>
  }

  if (!isLoaded) {
    return (
      <Input
        disabled
        placeholder="Cargando mapas..."
        className={props.className}
      />
    )
  }

  return <PlacesAutocompleteInput {...props} />
}
