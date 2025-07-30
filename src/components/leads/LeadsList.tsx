import { Lead } from "@/types/lead"
import { LeadCard } from "@/components/LeadCard"
import { LeadTableRow } from "@/components/LeadTableRow"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface LeadsListProps {
  leads: Lead[]
  viewMode: "grid" | "table"
  onEdit: (lead: Lead) => void
  onDelete: (leadId: string, leadName: string) => void
  onConvert: (lead: Lead) => void
  hasAdminRole: boolean
}

export function LeadsList({ 
  leads, 
  viewMode, 
  onEdit, 
  onDelete, 
  onConvert, 
  hasAdminRole 
}: LeadsListProps) {
  if (leads.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No leads found matching your criteria.</p>
      </div>
    )
  }

  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            onEdit={onEdit}
            onDelete={onDelete}
            onConvert={onConvert}
            hasAdminRole={hasAdminRole}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Contact</TableHead>
            <TableHead>Business</TableHead>
            <TableHead>Last Contact</TableHead>
            <TableHead>Loan Amount</TableHead>
            <TableHead>Loan Type</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <LeadTableRow
              key={lead.id}
              lead={lead}
              onEdit={onEdit}
              onDelete={onDelete}
              onConvert={onConvert}
              hasAdminRole={hasAdminRole}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}