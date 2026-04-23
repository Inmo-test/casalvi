'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@casalvi/ui"
import { Badge } from "@casalvi/ui"
import { TrendingUp, TrendingDown, Minus, Target, Zap } from 'lucide-react'
import { cn } from '@/lib/cn'

interface ContactScoreCardProps {
    contact: any
}

export function ContactScoreCard({ contact }: ContactScoreCardProps) {
    // Usamos conversion_probability para coincidir con el listado principal, o fallback a lead_score
    const score = contact.conversion_probability || contact.lead_score || 0

    // Determinar color y mensaje según el score
    const getScoreDetails = (score: number) => {
        if (score >= 80) {
            return {
                color: "text-green-700",
                bgColor: "bg-green-50",
                borderColor: "border-green-200",
                icon: TrendingUp,
                iconColor: "text-green-600",
                label: "Calificación Excelente",
                message: "Contacto muy prometedor con alto potencial de conversión",
                priority: "Alta"
            }
        } else if (score >= 60) {
            return {
                color: "text-blue-700",
                bgColor: "bg-blue-50",
                borderColor: "border-blue-200",
                icon: TrendingUp,
                iconColor: "text-blue-600",
                label: "Buena Calificación",
                message: "Contacto con buen potencial, continuar seguimiento",
                priority: "Media-Alta"
            }
        } else if (score >= 40) {
            return {
                color: "text-yellow-700",
                bgColor: "bg-yellow-50",
                borderColor: "border-yellow-200",
                icon: Minus,
                iconColor: "text-yellow-600",
                label: "Calificación Media",
                message: "Requiere más interacción para evaluar el interés real",
                priority: "Media"
            }
        } else {
            return {
                color: "text-red-700",
                bgColor: "bg-red-50",
                borderColor: "border-red-200",
                icon: TrendingDown,
                iconColor: "text-red-600",
                label: "Calificación Baja",
                message: "Contacto frío, considerar estrategia de reactivación",
                priority: "Baja"
            }
        }
    }

    const details = getScoreDetails(score)
    const IconComponent = details.icon

    // Calcular porcentaje para la barra de progreso
    const progressWidth = Math.min(100, Math.max(0, score))

    return (
        <Card className={cn("shadow-sm border-2", details.borderColor, details.bgColor)}>
            <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                    <div className={cn("p-2 rounded-full", details.bgColor)}>
                        <Target className={cn("h-4 w-4", details.iconColor)} />
                    </div>
                    Análisis de IA
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">

                {/* Score principal */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={cn("h-16 w-16 rounded-full border-4 flex items-center justify-center font-bold text-xl", details.borderColor, details.bgColor, details.color)}>
                            {score}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <IconComponent className={cn("h-4 w-4", details.iconColor)} />
                                <span className={cn("font-semibold text-sm", details.color)}>{details.label}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{details.message}</p>
                        </div>
                    </div>
                </div>

                {/* Barra de progreso */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Calidad del Lead</span>
                        <span className={cn("font-medium", details.color)}>{score}/100</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                            className={cn("h-full transition-all duration-500 rounded-full",
                                score >= 80 ? "bg-green-500" :
                                    score >= 60 ? "bg-blue-500" :
                                        score >= 40 ? "bg-yellow-500" :
                                            "bg-red-500"
                            )}
                            style={{ width: `${progressWidth}%` }}
                        />
                    </div>
                </div>

                {/* Badge de prioridad */}
                <div className="flex items-center gap-2 pt-2 border-t">
                    <Zap className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Prioridad:</span>
                    <Badge variant="outline" className={cn("text-xs", details.color, details.borderColor)}>
                        {details.priority}
                    </Badge>
                </div>

            </CardContent>
        </Card>
    )
}
