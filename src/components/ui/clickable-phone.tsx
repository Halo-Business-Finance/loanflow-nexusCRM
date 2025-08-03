import React from 'react'
import { formatClickablePhone } from '@/lib/utils'
import { Phone } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ClickablePhoneProps {
  phoneNumber: string
  className?: string
  showIcon?: boolean
  children?: React.ReactNode
}

export function ClickablePhone({ 
  phoneNumber, 
  className, 
  showIcon = false, 
  children 
}: ClickablePhoneProps) {
  if (!phoneNumber) return null

  const { formatted, telLink } = formatClickablePhone(phoneNumber)

  return (
    <a 
      href={telLink}
      className={cn(
        "inline-flex items-center gap-1 text-foreground hover:text-primary transition-colors cursor-pointer",
        className
      )}
      onClick={(e) => {
        // Don't prevent default - let the tel: link work
        e.stopPropagation() // Prevent parent click events
      }}
    >
      {showIcon && <Phone className="w-4 h-4" />}
      {children || formatted}
    </a>
  )
}