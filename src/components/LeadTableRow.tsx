import React from "react"
import { useNavigate } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { PhoneDialer } from "@/components/PhoneDialer"
import { EmailComposer } from "@/components/EmailComposer"
import { 
  User, 
  Mail, 
  Phone, 
  ArrowRight, 
  Trash2,
  Edit,
  MoreHorizontal,
  Calendar
} from "lucide-react"
import { formatPhoneNumber } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

interface LeadTableRowProps {
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

export function LeadTableRow({ lead, onEdit, onDelete, onConvert, hasAdminRole }: LeadTableRowProps) {
  const navigate = useNavigate()

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const daysSinceContact = Math.floor((Date.now() - new Date(lead.last_contact).getTime()) / (1000 * 60 * 60 * 24))

  return (
    <tr 
      className={`group border-b border-muted/20 hover:bg-muted/30 transition-colors cursor-pointer ${
        lead.is_converted_to_client ? 'opacity-60' : ''
      }`}
      onClick={() => navigate(`/leads/${lead.id}`)}
    >
      {/* Name & Business */}
      <td className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border border-muted/30">
            <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
              {getInitials(lead.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-foreground truncate">{lead.name}</span>
              {lead.is_converted_to_client && (
                <Badge variant="default" className="text-xs">Client</Badge>
              )}
            </div>
            {lead.business_name && (
              <div className="text-sm text-muted-foreground truncate">{lead.business_name}</div>
            )}
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Calendar className="w-3 h-3 text-muted-foreground" />
              <span>
                {daysSinceContact === 0 ? 'Today' : 
                 daysSinceContact === 1 ? '1 day ago' : 
                 `${daysSinceContact} days ago`}
              </span>
            </div>
          </div>
        </div>
      </td>

      {/* Contact Info */}
      <td className="p-4">
        <div className="text-sm text-muted-foreground truncate">
          Contact info available in details
        </div>
      </td>

      {/* Loan Info */}
      <td className="p-4">
        <div className="space-y-1">
          {lead.loan_type && (
            <div className="text-xs text-card-foreground bg-muted/50 px-2 py-1 rounded font-medium">
              {lead.loan_type}
            </div>
          )}
          {lead.loan_amount && (
            <div className="font-medium text-card-foreground text-sm">
              ${lead.loan_amount.toLocaleString()}
            </div>
          )}
        </div>
      </td>

      {/* Stage & Priority */}
      <td className="p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={getStageColor(lead.stage)} className="text-xs">
            {lead.stage}
          </Badge>
          <Badge variant={getPriorityColor(lead.priority)} className="text-xs">
            {lead.priority}
          </Badge>
        </div>
      </td>

    </tr>
  )
}