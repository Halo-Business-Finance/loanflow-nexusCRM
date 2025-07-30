import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Users, DollarSign, Target } from "lucide-react"
import { Lead } from "@/types/lead"

interface LeadStatsProps {
  leads: Lead[]
}

export function LeadStats({ leads }: LeadStatsProps) {
  const totalLeads = leads.length
  const convertedLeads = leads.filter(lead => lead.is_converted_to_client).length
  const totalValue = leads.reduce((sum, lead) => sum + (lead.loan_amount || 0), 0)
  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0

  const stats = [
    {
      title: "Total Leads",
      value: totalLeads,
      icon: Users,
      description: "All active leads"
    },
    {
      title: "Total Value",
      value: `$${totalValue.toLocaleString()}`,
      icon: DollarSign,
      description: "Pipeline value"
    },
    {
      title: "Converted",
      value: convertedLeads,
      icon: Target,
      description: "Leads to clients"
    },
    {
      title: "Conversion Rate",
      value: `${conversionRate}%`,
      icon: TrendingUp,
      description: "Success rate"
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}