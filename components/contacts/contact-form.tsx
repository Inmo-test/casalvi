'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@casalvi/ui"
import { Input } from "@casalvi/ui"
import { Label } from "@casalvi/ui"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@casalvi/ui"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@casalvi/ui"
import { createContact, updateContact } from '@/app/actions/contacts'
import { Loader2, Save } from 'lucide-react'
import dynamic from 'next/dynamic'
import type { AddressAutocompleteResult } from '@/components/common/address-autocomplete'
import { useToast } from '@/hooks/use-toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'

// Carga dinámica del mapa
const AddressAutocomplete = dynamic(
    () => import('@/components/common/address-autocomplete').then(mod => ({ default: mod.AddressAutocomplete })),
    {
        ssr: false,
        loading: () => <Input placeholder="Cargando autocompletado..." disabled />
    }
)

interface ContactFormProps {
    initialData?: any | null
    onSuccess?: () => void
    onCancel?: () => void
    isEditing?: boolean
}

export function ContactForm({
    initialData,
    onSuccess,
    onCancel,
    isEditing = false
}: ContactFormProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const router = useRouter()
    const { toast } = useToast()

    // Estado del formulario
    const [formData, setFormData] = useState({
        role: initialData?.role || 'owner',
        firstName: initialData?.first_name || '',
        lastName: initialData?.last_name || '',
        email: initialData?.email || '',
        phone: initialData?.phone || '',
        street: initialData?.street || '',
        streetNumber: initialData?.street_number || '',
        floor: initialData?.floor || '',
        door: initialData?.door || '',
        propertyOccupancy: initialData?.property_occupancy || 'unknown',
        propertyLeaseEnd: initialData?.property_lease_end ? new Date(initialData.property_lease_end).toISOString().split('T')[0] : '',
        propertyCompetitorName: initialData?.property_competitor_name || '',
        propertyCompetitorExpiry: initialData?.property_competitor_expiry ? new Date(initialData.property_competitor_expiry).toISOString().split('T')[0] : '',
        budgetMax: initialData?.budget_max?.toString() || '',
        minBedrooms: initialData?.min_bedrooms?.toString() || '',
        minBathrooms: initialData?.min_bathrooms?.toString() || '',
        preferredZones: Array.isArray(initialData?.preferred_zones) ? initialData.preferred_zones.join(', ') : (initialData?.preferred_zones || ''),
        city: initialData?.city || '',
        minSurface: initialData?.min_surface?.toString() || '',
        address_lat: initialData?.address_lat || null as number | null,
        address_lng: initialData?.address_lng || null as number | null,
        google_place_id: initialData?.google_place_id || null as string | null,
        formatted_address: initialData?.formatted_address || null as string | null,
    })

    // --- MUTATION: CREATE/UPDATE ---
    const queryClient = useQueryClient()

    const { mutate: mutateContact } = useMutation({
        mutationFn: async (data: FormData) => {
            const result = isEditing
                ? await updateContact(initialData.id, data)
                : await createContact(data)

            if ('error' in result && result.error) {
                throw new Error(result.error)
            }
            return result
        },
        onMutate: async (newData) => {
            // 1. Cancelar refetches en curso
            await queryClient.cancelQueries({ queryKey: ['contacts'] })

            // 2. Snapshot del valor anterior
            const previousContacts = queryClient.getQueryData<any[]>(['contacts']) || []

            // 3. Optimistic Update
            queryClient.setQueryData(['contacts'], (old: any[] = []) => {
                const optimisticContact = {
                    id: isEditing ? initialData.id : `temp-${Date.now()}`,
                    first_name: newData.get('firstName'),
                    last_name: newData.get('lastName'),
                    email: newData.get('email'),
                    phone: newData.get('phone'),
                    role: newData.get('role'),
                    created_at: new Date().toISOString(),
                    // ... otros campos
                }

                if (isEditing) {
                    return old.map(c => c.id === initialData.id ? { ...c, ...optimisticContact } : c)
                } else {
                    return [optimisticContact, ...old]
                }
            })

            // 4. CERRAR MODAL INMEDIATAMENTE (Optimistic UI Extremo)
            if (onSuccess) onSuccess()

            return { previousContacts }
        },
        onError: (err: Error, newTodo: FormData, context: { previousContacts: any[] } | undefined) => {
            // Rollback
            queryClient.setQueryData(['contacts'], context?.previousContacts)
            toast({
                variant: "destructive",
                title: "Error al guardar",
                description: err.message,
            })
        },
        onSettled: () => {
            // Siempre revalidar al final para asegurar consistencia
            queryClient.invalidateQueries({ queryKey: ['contacts'] })
            queryClient.invalidateQueries({ queryKey: ['subscription-status'] })
            // router.refresh() removed - TanStack Query invalidation is sufficient
        }
    })

    // --- HANDLE SUBMIT ---
    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true) // UI loading for button disable
        setError(null)

        const dataToSend = new FormData()

        // Construcción manual del FormData (Igual que antes)
        dataToSend.append('role', formData.role || 'owner')
        dataToSend.append('firstName', formData.firstName || '')
        if (formData.lastName) dataToSend.append('lastName', formData.lastName)
        if (formData.email) dataToSend.append('email', formData.email)
        if (formData.phone) dataToSend.append('phone', formData.phone)

        if (formData.role === 'owner') {
            Object.entries({
                street: formData.street,
                streetNumber: formData.streetNumber,
                floor: formData.floor,
                door: formData.door,
            }).forEach(([key, value]) => { if (value) dataToSend.append(key, value as string) })

            if (formData.address_lat) dataToSend.append('address_lat', formData.address_lat.toString())
            if (formData.address_lng) dataToSend.append('address_lng', formData.address_lng.toString())
            if (formData.google_place_id) dataToSend.append('google_place_id', formData.google_place_id)
            if (formData.formatted_address) dataToSend.append('formatted_address', formData.formatted_address)

            if (formData.propertyOccupancy) dataToSend.append('propertyOccupancy', formData.propertyOccupancy)
            if (formData.propertyOccupancy === 'rented' && formData.propertyLeaseEnd) dataToSend.append('propertyLeaseEnd', formData.propertyLeaseEnd)
            if (formData.propertyOccupancy === 'competitor') {
                if (formData.propertyCompetitorName) dataToSend.append('propertyCompetitorName', formData.propertyCompetitorName)
                if (formData.propertyCompetitorExpiry) dataToSend.append('propertyCompetitorExpiry', formData.propertyCompetitorExpiry)
            }
        }

        if (formData.role === 'buyer') {
            Object.entries({
                budgetMax: formData.budgetMax,
                minBedrooms: formData.minBedrooms,
                minBathrooms: formData.minBathrooms,
                preferredZones: formData.preferredZones,
                city: formData.city,
                minSurface: formData.minSurface,
            }).forEach(([key, value]) => { if (value) dataToSend.append(key, value as string) })
        }

        // Ejecutar Mutación
        mutateContact(dataToSend)
        // Nota: setLoading(false) no es necesario aquí porque el modal se cierra en onMutate
        // Si hay error, el modal ya se cerró. (Trade-off aceptado por performance)
    }

    const detailsTabLabel = formData.role === 'owner' ? 'Inmueble & Farming' : 'Preferencias de Compra'

    return (
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="details">{detailsTabLabel}</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4 mt-4">
                    {/* ROL */}
                    <div className="grid gap-2">
                        <Label>Rol</Label>
                        <Select value={formData.role} onValueChange={(val) => setFormData({ ...formData, role: val })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="owner">Propietario</SelectItem>
                                <SelectItem value="buyer">Comprador</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* DATOS BÁSICOS */}
                    <div className="grid gap-2">
                        <Label>Nombre <span className="text-red-500">*</span></Label>
                        <Input value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} required disabled={loading} />
                    </div>
                    <div className="grid gap-2">
                        <Label>Apellidos</Label>
                        <Input value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} disabled={loading} />
                    </div>
                    <div className="grid gap-2">
                        <Label>Email</Label>
                        <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} disabled={loading} />
                    </div>
                    <div className="grid gap-2">
                        <Label>Teléfono</Label>
                        <Input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} disabled={loading} />
                    </div>
                </TabsContent>

                <TabsContent value="details" className="space-y-4 mt-4">
                    {formData.role === 'owner' ? (
                        <>
                            {/* GOOGLE MAPS */}
                            <div className="grid gap-2">
                                <div className="flex items-center justify-between">
                                    <Label>Dirección (Google Maps)</Label>
                                    {formData.address_lat && formData.address_lng && (
                                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                            ✓ Coordenadas GPS guardadas
                                        </span>
                                    )}
                                </div>
                                <AddressAutocomplete
                                    onAddressSelect={(res: AddressAutocompleteResult) => {
                                        setFormData({
                                            ...formData,
                                            address_lat: res.latitude,
                                            address_lng: res.longitude,
                                            google_place_id: res.google_place_id,
                                            formatted_address: res.formatted_address,
                                            // Si el usuario no ha editado manualmente la calle, actualizarla desde formatted_address
                                            street: formData.street || res.formatted_address.split(',')[0]
                                        })
                                    }}
                                    defaultValue={formData.formatted_address || ''}
                                    disabled={loading}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Selecciona una dirección desde el autocompletado para guardar las coordenadas GPS necesarias para Catastro.
                                </p>
                            </div>
                            {/* CAMPOS MANUALES */}
                            <div className="grid gap-2">
                                <Label>Calle</Label>
                                <Input value={formData.street} onChange={e => setFormData({ ...formData, street: e.target.value })} disabled={loading} />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div><Label>Nº</Label><Input value={formData.streetNumber} onChange={e => setFormData({ ...formData, streetNumber: e.target.value })} disabled={loading} /></div>
                                <div><Label>Piso</Label><Input value={formData.floor} onChange={e => setFormData({ ...formData, floor: e.target.value })} disabled={loading} /></div>
                                <div><Label>Puerta</Label><Input value={formData.door} onChange={e => setFormData({ ...formData, door: e.target.value })} disabled={loading} /></div>
                            </div>

                            {/* FARMING */}
                            <div className="grid gap-2 border-t pt-4">
                                <Label>Ocupación</Label>
                                <Select value={formData.propertyOccupancy} onValueChange={val => setFormData({ ...formData, propertyOccupancy: val })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="vacant">Vacío</SelectItem>
                                        <SelectItem value="rented">Alquilado</SelectItem>
                                        <SelectItem value="owner">Vive Propietario</SelectItem>
                                        <SelectItem value="competitor">Otra Agencia</SelectItem>
                                        <SelectItem value="unknown">Desconocido</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* CAMPOS COMPRADOR */}
                            <div className="grid gap-2"><Label>Presupuesto Máx</Label><Input type="number" value={formData.budgetMax} onChange={e => setFormData({ ...formData, budgetMax: e.target.value })} disabled={loading} /></div>
                            <div className="grid grid-cols-2 gap-2">
                                <div><Label>Habitaciones</Label><Input type="number" value={formData.minBedrooms} onChange={e => setFormData({ ...formData, minBedrooms: e.target.value })} disabled={loading} /></div>
                                <div><Label>Baños</Label><Input type="number" value={formData.minBathrooms} onChange={e => setFormData({ ...formData, minBathrooms: e.target.value })} disabled={loading} /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div><Label>Superficie Mín (m²)</Label><Input type="number" step="5" value={formData.minSurface} onChange={e => setFormData({ ...formData, minSurface: e.target.value })} disabled={loading} /></div>
                                <div><Label>Ciudad Pref.</Label><Input value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} disabled={loading} placeholder="Ej. Madrid" /></div>
                            </div>
                            <div className="grid gap-2"><Label>Zonas (Barrios)</Label><Input value={formData.preferredZones} onChange={e => setFormData({ ...formData, preferredZones: e.target.value })} disabled={loading} placeholder="Ej. Salamanca, Retiro" /></div>
                        </>
                    )}
                </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 mt-6">
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>Cancelar</Button>
                )}
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isEditing ? 'Actualizar' : 'Crear'}
                </Button>
            </div>
        </form>
    )
}
