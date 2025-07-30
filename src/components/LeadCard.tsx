import React from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { PhoneDialer } from "@/components/PhoneDialer"
import { EmailComposer } from "@/components/EmailComposer"
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  DollarSign, 
  Building, 
  Calendar,
  TrendingUp,
  AlertCircle,
  Star,
  MoreHorizontal
} from "lucide-react"
import { formatPhoneNumber } from "@/lib/utils"

interface Lead {
  id: string
  contact_entity_id: string
  user_id: string
  name: string
  email: string
  phone?: string
  location?: string
  business_name?: string
  loan_amount?: number
  loan_type?: string
  stage: string
  priority: string
  credit_score?: number
  last_contact: string
  is_converted_to_client: boolean
}

interface LeadCardProps {
  lead: Lead
  onEdit: (lead: Lead) => void
  onDelete: (leadId: string, leadName: string) => void
  onConvert: (lead: Lead) => void
  hasAdminRole: boolean
}

const getPriorityColor = (priority: string) => {
  switch (priority.toLowerCase()) {
    case 'high': return 'destructive'
    case 'medium': return 'default'
    case 'low': return 'secondary'
    default: return 'secondary'
  }
}

const getStageColor = (stage: string) => {
  switch (stage) {
    case 'Initial Contact': return 'secondary'
    case 'Qualified': return 'default'
    case 'Application': return 'default'
    case 'Pre-approval': return 'default'
    case 'Documentation': return 'default'
    case 'Closing': return 'default'
    case 'Funded': return 'default'
    default: return 'secondary'
  }
}

const getPriorityIcon = (priority: string) => {
  switch (priority.toLowerCase()) {
    case 'high': return <AlertCircle className="w-3 h-3" />
    case 'medium': return <TrendingUp className="w-3 h-3" />
    case 'low': return <Star className="w-3 h-3" />
    default: return <Star className="w-3 h-3" />
  }
}

export function LeadCard({ lead, onEdit, onDelete, onConvert, hasAdminRole }: LeadCardProps) {
  const navigate = useNavigate()

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const daysSinceContact = lead.last_contact 
    ? Math.floor((Date.now() - new Date(lead.last_contact).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <Card 
      className={`group hover:shadow-lg hover:shadow-white/20 transition-all duration-300 cursor-pointer animate-fade-in border-muted/20 hover:border-white bg-transparent overflow-hidden ${lead.is_converted_to_client ? 'opacity-70' : 'hover:scale-[1.02]'}`}
      onClick={() => navigate(`/leads/${lead.id}`)}
    >
      <CardHeader className="pb-3 px-4 pt-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {getInitials(lead.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 pr-2">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground dark:text-white truncate">{lead.name}</h3>
                {lead.is_converted_to_client && (
                  <Badge variant="default" className="text-xs">Client</Badge>
                )}
              </div>
              {lead.business_name && (
                <div className="flex items-center gap-1 text-sm text-black dark:text-white mb-1">
                  <Building className="w-3 h-3 text-black dark:text-white" />
                  <span className="truncate">{lead.business_name}</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-xs text-black dark:text-white">
                <Calendar className="w-3 h-3 text-black dark:text-white" />
                <span>
                  {daysSinceContact === 0 ? 'Today' : 
                   daysSinceContact === 1 ? '1 day ago' : 
                   `${daysSinceContact} days ago`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 px-4 pb-4">
        {/* Financial Info */}
        {(lead.loan_amount || lead.loan_type) && (
          <div className="pt-2 border-t border-muted/30">
            {lead.loan_type && (
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-black dark:text-white">Loan Type</span>
                <span className="font-semibold text-black dark:text-white">{lead.loan_type}</span>
              </div>
            )}
            
            {lead.loan_amount && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground dark:text-white" />
                  <span className="text-black dark:text-white">Loan Amount</span>
                </div>
                <span className="font-semibold text-black dark:text-white">${lead.loan_amount.toLocaleString()}</span>
              </div>
            )}
          </div>
        )}

        {/* Stage & Priority */}
        <div className="pt-3 border-t border-muted/30">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant={getStageColor(lead.stage)} className="text-xs">
              {lead.stage}
            </Badge>
            <Badge variant={getPriorityColor(lead.priority)} className="flex items-center gap-1 text-xs">
              {getPriorityIcon(lead.priority)}
              {lead.priority}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}