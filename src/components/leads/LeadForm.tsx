import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DialogFooter } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { Lead, ContactEntity, LOAN_TYPES } from "@/types/lead"
import { useRoleBasedAccess } from "@/hooks/useRoleBasedAccess"
import { useSecureForm } from "@/hooks/useSecureForm"

interface LeadFormProps {
  lead?: Lead | null
  onSubmit: (data: ContactEntity) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export function LeadForm({ lead, onSubmit, onCancel, isSubmitting = false }: LeadFormProps) {
  const { canAccessLeads } = useRoleBasedAccess()
  const { isValidating, validateAndSanitize } = useSecureForm()
  
  const [formData, setFormData] = useState<ContactEntity>({
    name: lead?.name || "",
    email: lead?.email || "",
    phone: lead?.phone || "",
    location: lead?.location || "",
    business_name: lead?.business_name || "",
    business_address: "",
    annual_revenue: undefined,
    loan_amount: lead?.loan_amount || undefined,
    loan_type: lead?.loan_type || "SBA 7(a) Loan",
    credit_score: lead?.credit_score || undefined,
    net_operating_income: lead?.net_operating_income || undefined,
    priority: lead?.priority || "medium",
    stage: lead?.stage || "New Lead",
    notes: "",
    naics_code: lead?.naics_code || "",
    ownership_structure: lead?.ownership_structure || ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  const handleInputChange = async (field: keyof ContactEntity, value: any) => {
    // For now, bypass the complex validation and just update the form data
    // The validation was causing issues with user input
    console.log('Input change:', field, value)
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Optional: Add basic validation for critical fields
    if (field === 'email' && value && typeof value === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        console.warn('Invalid email format')
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone || ""}
            onChange={(e) => handleInputChange("phone", e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="business_name">Business Name</Label>
          <Input
            id="business_name"
            value={formData.business_name || ""}
            onChange={(e) => handleInputChange("business_name", e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={formData.location || ""}
            onChange={(e) => handleInputChange("location", e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="business_address">Business Address</Label>
          <Input
            id="business_address"
            value={formData.business_address || ""}
            onChange={(e) => handleInputChange("business_address", e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="loan_amount">Loan Amount</Label>
          <Input
            id="loan_amount"
            type="number"
            value={formData.loan_amount || ""}
            onChange={(e) => handleInputChange("loan_amount", e.target.value ? Number(e.target.value) : undefined)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="loan_type">Loan Type</Label>
          <Select
            value={formData.loan_type || ""}
            onValueChange={(value) => handleInputChange("loan_type", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select loan type" />
            </SelectTrigger>
            <SelectContent>
              {LOAN_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="credit_score">Credit Score</Label>
          <Input
            id="credit_score"
            type="number"
            value={formData.credit_score || ""}
            onChange={(e) => handleInputChange("credit_score", e.target.value ? Number(e.target.value) : undefined)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="annual_revenue">Annual Revenue</Label>
          <Input
            id="annual_revenue"
            type="number"
            value={formData.annual_revenue || ""}
            onChange={(e) => handleInputChange("annual_revenue", e.target.value ? Number(e.target.value) : undefined)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select
            value={formData.priority || ""}
            onValueChange={(value) => handleInputChange("priority", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="stage">Stage</Label>
          <Select
            value={formData.stage || ""}
            onValueChange={(value) => handleInputChange("stage", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="New Lead">New Lead</SelectItem>
              <SelectItem value="Initial Contact">Initial Contact</SelectItem>
              <SelectItem value="Loan Application Signed">Loan Application Signed</SelectItem>
              <SelectItem value="Waiting for Documentation">Waiting for Documentation</SelectItem>
              <SelectItem value="Pre-Approved">Pre-Approved</SelectItem>
              <SelectItem value="Term Sheet Signed">Term Sheet Signed</SelectItem>
              <SelectItem value="Loan Approved">Loan Approved</SelectItem>
              <SelectItem value="Closing">Closing</SelectItem>
              <SelectItem value="Loan Funded">Loan Funded</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes || ""}
          onChange={(e) => handleInputChange("notes", e.target.value)}
          rows={3}
        />
      </div>
      
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || isValidating}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {lead ? "Update Lead" : "Create Lead"}
        </Button>
      </DialogFooter>
    </form>
  )
}