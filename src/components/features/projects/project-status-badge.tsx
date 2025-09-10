import * as React from 'react'
import { cn } from '@/lib/utils'
import { ProjectStatus } from '@/types'

interface ProjectStatusBadgeProps {
  status: ProjectStatus
  className?: string
}

const statusConfig = {
  [ProjectStatus.DRAFT]: {
    label: 'Draft',
    className: 'bg-gray-100 text-gray-800 border-gray-200',
  },
  [ProjectStatus.ACTIVE]: {
    label: 'Active',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  [ProjectStatus.COMPLETED]: {
    label: 'Completed',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  [ProjectStatus.ARCHIVED]: {
    label: 'Archived',
    className: 'bg-gray-100 text-gray-600 border-gray-200',
  },
} as const

export function ProjectStatusBadge({
  status,
  className,
}: ProjectStatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
