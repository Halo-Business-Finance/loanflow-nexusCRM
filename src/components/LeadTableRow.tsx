import React from "react"
import { useNavigate } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { Lead } from "@/types/lead"

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

  const daysSinceContact = lead.last_contact 
    ? Math.floor((Date.now() - new Date(lead.last_contact).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <tr 
      className={`group border-b border-muted/20 hover:bg-muted/30 hover:outline hover:outline-1 hover:outline-white transition-all cursor-pointer ${
        lead.is_converted_to_client ? 'opacity-60' : ''
      }`}
      onClick={() => navigate(`/leads/${lead.id}`)}
    >
      {/* Lead Info */}
      <td className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border border-muted/30 dark:border-white">
            <AvatarFallback className="bg-primary/10 text-primary dark:text-white font-medium text-sm">
              {getInitials(lead.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-foreground dark:text-white truncate">{lead.name}</span>
              {lead.is_converted_to_client && (
                <Badge variant="default" className="text-xs">Client</Badge>
              )}
            </div>
            {lead.business_name && (
              <div className="text-sm text-muted-foreground dark:text-white truncate">{lead.business_name}</div>
            )}
            <div className="flex items-center gap-1 text-xs text-muted-foreground dark:text-white mt-1">
              <Calendar className="w-3 h-3 text-muted-foreground dark:text-white" />
              <span>
                {daysSinceContact === 0 ? 'Today' : 
                 daysSinceContact === 1 ? '1 day ago' : 
                 `${daysSinceContact} days ago`}
              </span>
            </div>
          </div>
        </div>
      </td>


      {/* Loan Amount */}
      <td className="p-4 text-right">
        {lead.loan_amount && (
          <div className="font-medium text-foreground dark:text-white text-sm">
            ${lead.loan_amount.toLocaleString()}
          </div>
        )}
      </td>

      {/* Loan Type */}
      <td className="p-4">
        {lead.loan_type && (
          <div className="text-sm text-foreground dark:text-white">
            {lead.loan_type}
          </div>
        )}
      </td>

      {/* Stage */}
      <td className="p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={getStageColor(lead.stage)} className="text-xs">
            {lead.stage}
          </Badge>
        </div>
      </td>

      {/* Priority */}
      <td className="p-4">
        <Badge variant={getPriorityColor(lead.priority)} className="text-xs">
          {lead.priority}
        </Badge>
      </td>

      {/* Actions - Empty placeholder for now */}
      <td className="p-4 text-center">
        {/* Actions would go here if needed */}
      </td>

    </tr>
  )
}