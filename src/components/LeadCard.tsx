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

  const daysSinceContact = Math.floor((Date.now() - new Date(lead.last_contact).getTime()) / (1000 * 60 * 60 * 24))

  return (
    <Card className={`group hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 cursor-pointer animate-fade-in border-muted/20 hover:border-primary/30 ${lead.is_converted_to_client ? 'opacity-70 bg-muted/30' : 'hover:scale-[1.02]'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3" onClick={() => navigate(`/leads/${lead.id}`)}>
            <Avatar className="h-12 w-12 border-2 border-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {getInitials(lead.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground truncate">{lead.name}</h3>
                {lead.is_converted_to_client && (
                  <Badge variant="default" className="text-xs">Client</Badge>
                )}
              </div>
              {lead.business_name && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                  <Building className="w-3 h-3 text-white" />
                  <span className="truncate">{lead.business_name}</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3 text-white" />
                <span>
                  {daysSinceContact === 0 ? 'Today' : 
                   daysSinceContact === 1 ? '1 day ago' : 
                   `${daysSinceContact} days ago`}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <Badge variant={getPriorityColor(lead.priority)} className="flex items-center gap-1">
              {getPriorityIcon(lead.priority)}
              {lead.priority}
            </Badge>
            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="w-4 h-4 text-white" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Contact Info */}
        <div className="space-y-2">
          <EmailComposer 
            trigger={
              <button className="flex items-center gap-2 text-sm hover:text-primary transition-colors w-full text-left">
                <Mail className="w-4 h-4 text-white" />
                <span className="text-foreground truncate">{lead.email}</span>
              </button>
            }
          />
          
          {lead.phone && (
            <PhoneDialer 
              trigger={
                <button className="flex items-center gap-2 text-sm hover:text-primary transition-colors w-full text-left">
                  <Phone className="w-4 h-4 text-white" />
                  <span className="text-foreground">{formatPhoneNumber(lead.phone)}</span>
                </button>
              }
            />
          )}
          
          {lead.location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-white" />
              <span className="text-foreground truncate">{lead.location}</span>
            </div>
          )}
        </div>

        {/* Financial Info */}
        {(lead.loan_amount || lead.credit_score) && (
          <div className="pt-2 border-t border-muted/30">
            {lead.loan_amount && (
              <div className="flex items-center justify-between text-sm mb-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-white" />
                  <span className="text-muted-foreground">Loan Amount</span>
                </div>
                <span className="font-semibold text-foreground">${lead.loan_amount.toLocaleString()}</span>
              </div>
            )}
            
            {lead.credit_score && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Credit Score</span>
                <span className={`font-semibold ${lead.credit_score >= 700 ? 'text-green-600' : lead.credit_score >= 600 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {lead.credit_score}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Stage & Actions */}
        <div className="pt-3 border-t border-muted/30">
          <div className="flex items-center justify-between mb-3">
            <Badge variant={getStageColor(lead.stage)} className="text-xs">
              {lead.stage}
            </Badge>
            {lead.loan_type && (
              <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                {lead.loan_type}
              </span>
            )}
          </div>
          
          {/* Quick Actions */}
          <div className="flex gap-2">
            <PhoneDialer 
              trigger={
                <Button size="sm" variant="outline" className="flex-1 text-xs h-8 text-white border-white hover:bg-white hover:text-black">
                  <Phone className="w-3 h-3 mr-1 text-white" />
                  Call
                </Button>
              }
            />
            <EmailComposer 
              trigger={
                <Button size="sm" variant="outline" className="flex-1 text-xs h-8 text-white border-white hover:bg-white hover:text-black">
                  <Mail className="w-3 h-3 mr-1 text-white" />
                  Email
                </Button>
              }
            />
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1 text-xs h-8 text-white border-white hover:bg-white hover:text-black"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(lead)
              }}
            >
              Edit
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}