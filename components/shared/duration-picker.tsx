'use client'

import { Label } from "@/components/ui"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui"
import { Calendar } from 'lucide-react'

interface DurationPickerProps {
    value?: string
    onChange?: (value: string) => void
    name?: string
    required?: boolean
    label?: string
}

const DURATION_OPTIONS = [
    { value: '1', label: 'Mañana (1 día)' },
    { value: '2', label: 'Pasado mañana (2 días)' },
    { value: '3', label: 'En 3 días' },
    { value: '7', label: 'Próxima semana (7 días)' },
    { value: '15', label: 'En 15 días' },
    { value: '30', label: 'En 30 días (1 mes)' },
    { value: '45', label: 'En 45 días' },
    { value: '60', label: 'En 2 meses' },
    { value: '90', label: 'En 3 meses' }
]

export function DurationPicker({
    value,
    onChange,
    name = 'duration_days',
    required = false,
    label = 'Cuándo quieres realizar esto?'
}: DurationPickerProps) {
    return (
        <div className="space-y-2">
            {label && (
                <Label htmlFor={name} className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {label}
                </Label>
            )}
            <Select
                name={name}
                value={value}
                onValueChange={onChange}
                required={required}
            >
                <SelectTrigger id={name}>
                    <SelectValue placeholder="Selecciona un plazo..." />
                </SelectTrigger>
                <SelectContent>
                    {DURATION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}

// Helper function to calculate scheduled date from duration
export function calculateScheduledDate(durationDays: number): Date {
    const date = new Date()
    date.setDate(date.getDate() + durationDays)
    return date
}
