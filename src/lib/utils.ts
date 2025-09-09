import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatHours(hours: number): string {
  if (hours < 1) {
    return `${(hours * 60).toFixed(0)}min`
  }
  if (hours % 1 === 0) {
    return `${hours}h`
  }
  return `${hours.toFixed(1)}h`
}

export function formatEstimate(minHours: number, maxHours: number): string {
  return `${formatHours(minHours)} - ${formatHours(maxHours)}`
}