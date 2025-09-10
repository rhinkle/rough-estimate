import * as React from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface TaskType {
  id: string
  name: string
  description?: string | null
  defaultMinHours: number
  defaultMaxHours: number
  category?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface TaskTypeCardProps {
  taskType: TaskType
  selected?: boolean
  onToggle?: () => void
  showCategory?: boolean
  className?: string
}

export function TaskTypeCard({
  taskType,
  selected = false,
  onToggle,
  showCategory = false,
  className,
}: TaskTypeCardProps) {
  const formatHours = (hours: number): string => {
    return hours === Math.floor(hours) ? hours.toString() : hours.toFixed(1)
  }

  const hoursRange =
    taskType.defaultMinHours === taskType.defaultMaxHours
      ? `${formatHours(taskType.defaultMinHours)}h`
      : `${formatHours(taskType.defaultMinHours)}-${formatHours(taskType.defaultMaxHours)}h`

  return (
    <Card
      className={cn(
        'transition-all cursor-pointer hover:shadow-md',
        selected && 'ring-2 ring-primary ring-offset-2',
        className
      )}
      onClick={onToggle}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-medium leading-snug">
              {taskType.name}
            </CardTitle>
            {showCategory && taskType.category && (
              <div className="text-xs text-muted-foreground mt-1">
                {taskType.category}
              </div>
            )}
          </div>
          <div className="ml-2 text-right">
            <div className="text-sm font-medium text-primary">{hoursRange}</div>
          </div>
        </div>
      </CardHeader>

      {taskType.description && (
        <CardContent className="pt-0 pb-3">
          <CardDescription className="text-xs line-clamp-2">
            {taskType.description}
          </CardDescription>
        </CardContent>
      )}

      <CardContent className="pt-0">
        {onToggle && (
          <Button
            variant={selected ? 'default' : 'outline'}
            size="sm"
            className="w-full"
            onClick={e => {
              e.stopPropagation()
              onToggle()
            }}
          >
            {selected ? 'Selected' : 'Select'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
