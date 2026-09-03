'use client'

import { useCurrency } from '@/lib/context/CurrencyContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui"

export function CurrencySelector() {
    const { currency, setCurrency } = useCurrency()

    const currencies = [
        { code: 'EUR', label: 'Euro (€)', symbol: '€' },
        { code: 'USD', label: 'US Dollar ($)', symbol: '$' },
        { code: 'GBP', label: 'British Pound (£)', symbol: '£' },
        { code: 'CNY', label: 'Chinese Yuan (¥)', symbol: '¥' },
    ]

    return (
        <Card>
            <CardHeader>
                <CardTitle>Moneda</CardTitle>
                <CardDescription>
                    Selecciona la moneda para visualizar precios y analíticas.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Select
                    value={currency}
                    onValueChange={(val: any) => {
                        setCurrency(val)
                    }}
                >
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Selecciona moneda">
                            <span className="flex items-center gap-2">
                                <span className="font-mono">{currencies.find(c => c.code === currency)?.symbol}</span>
                                <span>{currencies.find(c => c.code === currency)?.label}</span>
                            </span>
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        {currencies.map((curr) => (
                            <SelectItem key={curr.code} value={curr.code}>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono w-4">{curr.symbol}</span>
                                    <span>{curr.label}</span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </CardContent>
        </Card>
    )
}
