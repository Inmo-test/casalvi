import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@casalvi/ui"
import { Badge } from "@casalvi/ui"
import { Progress } from "@casalvi/ui"
import { Flame, TrendingUp } from 'lucide-react'

type TopLead = {
  id: string
  first_name: string
  last_name: string | null
  life_stage: string | null
  conversion_probability: number
  user_id?: string
}

interface TopLeadsCardProps {
  leads: TopLead[]
}

import { useI18n } from '@/lib/i18n/I18nContext'

export function TopLeadsCard({ leads }: TopLeadsCardProps) {
  const { t } = useI18n()

  function getLifeStageConfig(stage: string | null) {
    const configs = {
      prospect: { label: t.dashboard.top_leads.stage_prospect, className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
      lead: { label: t.dashboard.top_leads.stage_lead, className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
      customer: { label: t.dashboard.top_leads.stage_customer, className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      inactive: { label: t.dashboard.top_leads.stage_inactive, className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' },
    }
    return configs[stage as keyof typeof configs] || { label: t.dashboard.top_leads.stage_unclassified, className: '' }
  }
  if (leads.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            {t.dashboard.top_leads.title}
          </CardTitle>
          <CardDescription>
            {t.dashboard.top_leads.subtitle}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-6 mb-4">
              <TrendingUp className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">{t.dashboard.top_leads.empty_title}</h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              {t.dashboard.top_leads.empty_desc}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          🔥 {t.dashboard.top_leads.title}
        </CardTitle>
        <CardDescription>
          {t.dashboard.top_leads.subtitle}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {leads.map((lead, index) => {
            const fullName = `${lead.first_name} ${lead.last_name || ''}`.trim()
            const stageConfig = getLifeStageConfig(lead.life_stage)

            return (
              <Link
                key={lead.id}
                href={`/dashboard/contacts/${lead.id}`}
                className="block"
              >
                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer border border-transparent hover:border-border">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-medium text-sm">
                    #{index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <p className="font-medium truncate">{fullName}</p>
                      <Badge variant="secondary" className={stageConfig.className}>
                        {stageConfig.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={lead.conversion_probability} className="h-2 flex-1" />
                      <span className="text-sm font-medium text-green-600 dark:text-green-400 w-12 text-right">
                        {lead.conversion_probability}%
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}


