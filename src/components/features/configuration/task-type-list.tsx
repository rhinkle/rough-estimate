import * as React from 'react'
import { Button } from '@/components/ui/button'
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

interface TaskTypeListProps {
  taskTypes: TaskType[]
  loading?: boolean
  onEdit?: (taskType: TaskType) => void
  onDelete?: (taskType: TaskType) => void
  onToggleActive?: (taskType: TaskType) => void
  searchQuery?: string
  categoryFilter?: string
  className?: string
}

export function TaskTypeList({
  taskTypes,
  loading = false,
  onEdit,
  onDelete,
  onToggleActive,
  searchQuery,
  categoryFilter,
  className,
}: TaskTypeListProps) {
  const formatHours = (hours: number): string => {
    return hours === Math.floor(hours) ? hours.toString() : hours.toFixed(1)
  }

  const formatHoursRange = (min: number, max: number): string => {
    return min === max
      ? `${formatHours(min)}h`
      : `${formatHours(min)}-${formatHours(max)}h`
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString()
  }

  if (loading && taskTypes.length === 0) {
    return (
      <Card className={className}>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse">Loading task types...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (taskTypes.length === 0) {
    return (
      <Card className={className}>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-muted-foreground mb-4">
              {searchQuery || categoryFilter !== 'ALL'
                ? 'No task types match your current filters.'
                : 'No task types found. Create your first task type to get started.'}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Task Types</CardTitle>
        <CardDescription>
          {taskTypes.length} task type{taskTypes.length !== 1 ? 's' : ''} found
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-center">Hours Range</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taskTypes.map(taskType => (
                <TableRow
                  key={taskType.id}
                  className={cn(
                    'hover:bg-muted/50',
                    !taskType.isActive && 'opacity-60'
                  )}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium">{taskType.name}</p>
                      {taskType.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 max-w-xs">
                          {taskType.description}
                        </p>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    {taskType.category && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-muted">
                        {taskType.category}
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="text-center font-medium">
                    {formatHoursRange(
                      taskType.defaultMinHours,
                      taskType.defaultMaxHours
                    )}
                  </TableCell>

                  <TableCell className="text-center">
                    <span
                      className={cn(
                        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                        taskType.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      )}
                    >
                      {taskType.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>

                  <TableCell className="text-center text-sm text-muted-foreground">
                    {formatDate(taskType.updatedAt)}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(taskType)}
                        >
                          Edit
                        </Button>
                      )}

                      {onToggleActive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onToggleActive(taskType)}
                          className={cn(
                            taskType.isActive
                              ? 'hover:bg-yellow-100 hover:text-yellow-800'
                              : 'hover:bg-green-100 hover:text-green-800'
                          )}
                        >
                          {taskType.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      )}

                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(taskType)}
                          className="hover:bg-destructive/10 hover:text-destructive"
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
