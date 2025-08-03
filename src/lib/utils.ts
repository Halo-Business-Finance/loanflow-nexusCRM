import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '0'
  }
  
  const num = typeof value === 'string' ? parseFloat(value) : value
  
  if (isNaN(num)) {
    return '0'
  }
  
  return num.toLocaleString()
}

export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '$0'
  }
  
  const num = typeof value === 'string' ? parseFloat(value) : value
  
  if (isNaN(num)) {
    return '$0'
  }
  
  return `$${num.toLocaleString()}`
}

export function formatPhoneNumber(value: string): string {
  // Remove all non-digits
  const phoneNumber = value.replace(/\D/g, '')
  
  // Format based on length
  if (phoneNumber.length < 4) {
    return phoneNumber
  } else if (phoneNumber.length < 7) {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`
  } else {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`
  }
}

// Create a tel: link for direct calling
export function createTelLink(phoneNumber: string): string {
  if (!phoneNumber) return ""
  // Remove all non-numeric characters for the tel: link
  const cleanPhone = phoneNumber.replace(/\D/g, '')
  return `tel:+1${cleanPhone}`
}

// Format and create clickable phone link
export function formatClickablePhone(phoneNumber: string): { formatted: string; telLink: string } {
  const formatted = formatPhoneNumber(phoneNumber)
  const telLink = createTelLink(phoneNumber)
  return { formatted, telLink }
}
