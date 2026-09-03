'use client'

import { Card, CardContent } from "@/components/ui"
import { Label } from "@/components/ui"
import { Input } from "@/components/ui"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui"

interface BuyerFiltersProps {
  minBudget: string
  maxBudget: string
  financialStatus: string
  onMinBudgetChange: (value: string) => void
  onMaxBudgetChange: (value: string) => void
  onFinancialStatusChange: (value: string) => void
}

export function BuyerFilters({
  minBudget,
  maxBudget,
  financialStatus,
  onMinBudgetChange,
  onMaxBudgetChange,
  onFinancialStatusChange,
}: BuyerFiltersProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="minBudget">Presupuesto Mínimo</Label>
            <Input
              id="minBudget"
              type="number"
              placeholder="Ej: 150000"
              value={minBudget}
              onChange={(e) => onMinBudgetChange(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="maxBudget">Presupuesto Máximo</Label>
            <Input
              id="maxBudget"
              type="number"
              placeholder="Ej: 300000"
              value={maxBudget}
              onChange={(e) => onMaxBudgetChange(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="financialStatus">Viabilidad Financiera</Label>
            <Select value={financialStatus} onValueChange={onFinancialStatusChange}>
              <SelectTrigger id="financialStatus">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="approved">✅ Aprobado</SelectItem>
                <SelectItem value="studying">⏳ Pendiente</SelectItem>
                <SelectItem value="negative">❌ Rechazado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


