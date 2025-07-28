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
