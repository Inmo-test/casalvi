'use client'

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui"

interface ComparisonProps {
    agentStats: {
        conversionRate: number
        avgLeadScore: number
    }
    agencyStats: {
        conversionRate: number
        avgLeadScore: number
    }
}

export function ComparisonChart({ agentStats, agencyStats }: ComparisonProps) {
    const data = [
        {
            name: 'Conversión (%)',
            Agente: agentStats.conversionRate,
            Agencia: agencyStats.conversionRate
        },
        {
            name: 'Calidad Lead (0-100)',
            Agente: agentStats.avgLeadScore,
            Agencia: agencyStats.avgLeadScore
        }
    ]

    return (
        <div className="grid gap-4 md:grid-cols-2">
            {/* 1. Tasa de Conversión */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Eficiencia de Conversión</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[data[0]]}>
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="Agente" fill="#2563eb" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Agencia" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* 2. Calidad de Leads */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Calidad de Cartera</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[data[1]]}>
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis domain={[0, 100]} fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="Agente" fill="#10b981" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Agencia" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* ALERTA DE RENDIMIENTO */}
            {agentStats.conversionRate < agencyStats.conversionRate * 0.8 && (
                <div className="md:col-span-2 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                    <div className="text-amber-600 font-medium">⚠️ Atención Requerida:</div>
                    <div className="text-sm text-amber-800">
                        El rendimiento de conversión de este agente está un 20% por debajo del promedio de la agencia.
                        Se recomienda programar una sesión de coaching.
                    </div>
                </div>
            )}

            {agentStats.avgLeadScore > agencyStats.avgLeadScore * 1.2 && (
                <div className="md:col-span-2 bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3">
                    <div className="text-emerald-600 font-medium">🏆 Alto Rendimiento:</div>
                    <div className="text-sm text-emerald-800">
                        Este agente está atrayendo leads de muy alta calidad, superando significativamente el promedio.
                        ¡Considera premiarlo!
                    </div>
                </div>
            )}
        </div>
    )
}
