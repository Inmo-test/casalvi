'use client'

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'
import { useCurrency } from '@/lib/context/CurrencyContext'

export function OverviewChart({ data }: { data: any[] }) {
  const { formatPrice } = useCurrency() // Although these are counts (contacts/properties), usually not currency.
  // Wait, OverviewChart is for Contacts and Properties COUNT. Not currency.
  // Checking file content: "Contactos (30 días)", "Propiedades (30 días)". 
  // It is NOT currency. I should NOT modify this file for currency.
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
        <XAxis
          dataKey="date"
          stroke="#9CA3AF"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => {
            const date = new Date(value)
            return `${date.getDate()}/${date.getMonth() + 1}`
          }}
          dy={10}
        />
        <YAxis
          stroke="#9CA3AF"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip
          cursor={{ fill: 'transparent' }}
          contentStyle={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            border: 'none',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            padding: '12px',
          }}
          itemStyle={{ color: '#1F2937', fontWeight: 500, fontSize: '13px' }}
          labelStyle={{ color: '#6B7280', marginBottom: '8px', fontSize: '12px' }}
        />
        <Bar
          dataKey="contactos"
          fill="#4f46e5"
          radius={[4, 4, 0, 0]}
          barSize={32}
          name="Contactos"
        />
        <Bar
          dataKey="propiedades"
          fill="#22c55e"
          radius={[4, 4, 0, 0]}
          barSize={32}
          name="Propiedades"
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

