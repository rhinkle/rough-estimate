import * as React from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface TaskType {
  id: string
  name: string
  description?: string | null
  defaultMinHours: number
  defaultMaxHours: number
  category?: string | null
  isActive: boolean
}

interface SelectedTask {
  taskTypeId: string
  taskType: TaskType
  quantity: number
  customMinHours?: number
  customMaxHours?: number
}

interface EstimationBreakdownProps {
  tasks: SelectedTask[]
  totalMinHours: number
  totalMaxHours: number
  showDetails?: boolean
  className?: string
}

export function EstimationBreakdown({
  tasks,
  totalMinHours,
  totalMaxHours,
  showDetails = true,
  className,
}: EstimationBreakdownProps) {
  const formatHours = (hours: number): string => {
    if (!hours) {
      return '0'
    }
    return hours === Math.floor(hours) ? hours.toString() : hours.toFixed(1)
  }

  const formatHoursRange = (min: number, max: number): string => {
    return min === max
      ? `${formatHours(min)}h`
      : `${formatHours(min)}-${formatHours(max)}h`
  }

  const getTaskBreakdown = (task: SelectedTask) => {
    const minHours = task.customMinHours ?? task.taskType.defaultMinHours
    const maxHours = task.customMaxHours ?? task.taskType.defaultMaxHours
    const subtotalMin = task.quantity * minHours
    const subtotalMax = task.quantity * maxHours

    return {
      minHours,
      maxHours,
      subtotalMin,
      subtotalMax,
      isCustom:
        task.customMinHours !== undefined || task.customMaxHours !== undefined,
    }
  }

  if (tasks?.length === 0) {
    return null
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Project Estimation Breakdown</CardTitle>
        <CardDescription>
          Detailed breakdown of time estimates for all selected tasks.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Summary */}
        <div className="p-4 bg-muted rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium">Total Project Estimate</p>
              <p className="text-xs text-muted-foreground">
                Based on {tasks?.length} task type
                {tasks?.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold">
                {formatHoursRange(totalMinHours, totalMaxHours)}
              </p>
              {totalMinHours !== totalMaxHours && (
                <p className="text-xs text-muted-foreground">
                  Range: {Math.round(totalMaxHours - totalMinHours)}h variance
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Breakdown */}
        {showDetails && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task Type</TableHead>
                  <TableHead className="text-center">Quantity</TableHead>
                  <TableHead className="text-center">Hours Each</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks?.map(task => {
                  const breakdown = getTaskBreakdown(task)

                  return (
                    <TableRow key={task.taskTypeId}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">
                            {task.taskType.name}
                          </p>
                          {task.taskType.category && (
                            <p className="text-xs text-muted-foreground">
                              {task.taskType.category}
                            </p>
                          )}
                          {breakdown.isCustom && (
                            <p className="text-xs text-blue-600">
                              Custom hours
                            </p>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        {task.quantity}
                      </TableCell>

                      <TableCell className="text-center">
                        {formatHoursRange(
                          breakdown.minHours,
                          breakdown.maxHours
                        )}
                      </TableCell>

                      <TableCell className="text-right font-medium">
                        {formatHoursRange(
                          breakdown.subtotalMin,
                          breakdown.subtotalMax
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Category Breakdown */}
        <div>
          <h4 className="text-sm font-medium mb-3">Breakdown by Category</h4>
          <div className="space-y-2">
            {(() => {
              const categoryTotals: Record<
                string,
                { min: number; max: number; count: number }
              > = {}

              tasks?.forEach(task => {
                const category = task.taskType.category || 'Other'
                const breakdown = getTaskBreakdown(task)

                if (!categoryTotals[category]) {
                  categoryTotals[category] = { min: 0, max: 0, count: 0 }
                }

                categoryTotals[category].min += breakdown.subtotalMin
                categoryTotals[category].max += breakdown.subtotalMax
                categoryTotals[category].count += task.quantity
              })

              return Object.entries(categoryTotals).map(
                ([category, totals]) => (
                  <div
                    key={category}
                    className="flex justify-between items-center py-1"
                  >
                    <span className="text-sm">
                      {category} ({totals.count} task
                      {totals.count !== 1 ? 's' : ''})
                    </span>
                    <span className="text-sm font-medium">
                      {formatHoursRange(totals.min, totals.max)}
                    </span>
                  </div>
                )
              )
            })()}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
