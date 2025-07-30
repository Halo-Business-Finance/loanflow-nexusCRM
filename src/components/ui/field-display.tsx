import { ReactNode } from "react"
import { LucideIcon } from "lucide-react"
import { Input } from "./input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"
import { Textarea } from "./textarea"

interface FieldDisplayProps {
  label: string
  value: string | number | null | undefined
  isEditing?: boolean
  onValueChange?: (value: string) => void
  icon?: LucideIcon
  placeholder?: string
  type?: "text" | "email" | "tel" | "number" | "textarea" | "select"
  selectOptions?: Array<{ value: string; label: string }>
  formatter?: (value: any) => string
  className?: string
}

export function FieldDisplay({
  label,
  value,
  isEditing = false,
  onValueChange,
  icon: Icon,
  placeholder,
  type = "text",
  selectOptions = [],
  formatter,
  className = "",
}: FieldDisplayProps) {
  const formattedValue = formatter ? formatter(value) : (value || 'N/A')
  const inputValue = typeof value === 'number' ? value.toString() : (value || '')

  const renderEditingComponent = () => {
    switch (type) {
      case "textarea":
        return (
          <Textarea
            value={inputValue}
            onChange={(e) => onValueChange?.(e.target.value)}
            placeholder={placeholder}
            rows={3}
          />
        )
      case "select":
        return (
          <Select value={inputValue} onValueChange={onValueChange}>
            <SelectTrigger>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {selectOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      default:
        return (
          <Input
            type={type}
            value={inputValue}
            onChange={(e) => onValueChange?.(e.target.value)}
            placeholder={placeholder}
          />
        )
    }
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
      <div className="flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        {isEditing ? (
          renderEditingComponent()
        ) : (
          <p className="font-medium">{formattedValue}</p>
        )}
      </div>
    </div>
  )
}

interface FieldSectionProps {
  title: string
  icon?: LucideIcon
  children: ReactNode
  className?: string
}

export function FieldSection({ title, icon: Icon, children, className = "" }: FieldSectionProps) {
  return (
    <div className={`space-y-3 pt-4 border-t ${className}`}>
      <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4" />}
        {title}
      </h4>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}