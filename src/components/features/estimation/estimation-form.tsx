import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { TaskSelector } from './task-selector'
import { TaskQuantityInput } from './task-quantity-input'
import { EstimationBreakdown } from './estimation-breakdown'
import { CreateProjectTaskRequest, UpdateProjectTaskRequest } from '@/types'

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

interface ProjectTask {
  id: string
  projectId: string
  taskTypeId: string
  quantity: number
  customMinHours?: number | null
  customMaxHours?: number | null
  taskType: TaskType
}

interface SelectedTask {
  taskTypeId: string
  taskType: TaskType
  quantity: number
  customMinHours?: number
  customMaxHours?: number
}

interface EstimationFormProps {
  projectId: string
  taskTypes: TaskType[]
  existingTasks?: ProjectTask[]
  onSubmit?: (
    tasks: (CreateProjectTaskRequest | UpdateProjectTaskRequest)[]
  ) => void | Promise<void>
  loading?: boolean
  disabled?: boolean
  showBreakdown?: boolean
  className?: string
}

export function EstimationForm({
  projectId: _projectId,
  taskTypes,
  existingTasks = [],
  onSubmit,
  loading = false,
  disabled = false,
  showBreakdown = true,
  className,
}: EstimationFormProps) {
  const [selectedTasks, setSelectedTasks] = React.useState<SelectedTask[]>(
    () => {
      // Initialize with existing project tasks
      return existingTasks.map(task => ({
        taskTypeId: task.taskTypeId,
        taskType: task.taskType,
        quantity: task.quantity,
        ...(task.customMinHours !== null && {
          customMinHours: task.customMinHours,
        }),
        ...(task.customMaxHours !== null && {
          customMaxHours: task.customMaxHours,
        }),
      }))
    }
  )

  const [searchQuery, setSearchQuery] = React.useState('')
  const [categoryFilter, setCategoryFilter] = React.useState<string>('ALL')
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleTaskSelect = (taskType: TaskType) => {
    if (selectedTasks.some(task => task.taskTypeId === taskType.id)) {
      return // Already selected
    }

    setSelectedTasks(prev => [
      ...prev,
      {
        taskTypeId: taskType.id,
        taskType,
        quantity: 1,
      },
    ])
  }

  const handleTaskDeselect = (taskTypeId: string) => {
    setSelectedTasks(prev =>
      prev.filter(task => task.taskTypeId !== taskTypeId)
    )
  }

  const handleQuantityChange = (taskTypeId: string, quantity: number) => {
    setSelectedTasks(prev =>
      prev.map(task =>
        task.taskTypeId === taskTypeId ? { ...task, quantity } : task
      )
    )
  }

  const handleCustomHoursChange = (
    taskTypeId: string,
    minHours?: number,
    maxHours?: number
  ) => {
    setSelectedTasks(prev =>
      prev.map(task => {
        if (task.taskTypeId === taskTypeId) {
          const updated: SelectedTask = {
            taskTypeId: task.taskTypeId,
            taskType: task.taskType,
            quantity: task.quantity,
          }

          if (minHours !== undefined) {
            updated.customMinHours = minHours
          }
          if (maxHours !== undefined) {
            updated.customMaxHours = maxHours
          }

          return updated
        }
        return task
      })
    )
  }

  const handleRemoveTask = (taskTypeId: string) => {
    handleTaskDeselect(taskTypeId)
  }

  const calculateTotals = () => {
    let totalMinHours = 0
    let totalMaxHours = 0

    selectedTasks.forEach(task => {
      const minHours = task.customMinHours ?? task.taskType.defaultMinHours
      const maxHours = task.customMaxHours ?? task.taskType.defaultMaxHours

      totalMinHours += task.quantity * minHours
      totalMaxHours += task.quantity * maxHours
    })

    return { totalMinHours, totalMaxHours }
  }

  const handleSubmit = async () => {
    if (!onSubmit || selectedTasks.length === 0) return

    setIsSubmitting(true)

    try {
      const taskData: (CreateProjectTaskRequest | UpdateProjectTaskRequest)[] =
        selectedTasks.map(task => {
          const base = {
            taskTypeId: task.taskTypeId,
            quantity: task.quantity,
          }

          return {
            ...base,
            ...(task.customMinHours !== undefined && {
              customMinHours: task.customMinHours,
            }),
            ...(task.customMaxHours !== undefined && {
              customMaxHours: task.customMaxHours,
            }),
          }
        })

      await onSubmit(taskData)
    } catch (error) {
      console.error('Failed to submit estimation:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const { totalMinHours, totalMaxHours } = calculateTotals()
  const isFormDisabled = loading || disabled || isSubmitting

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Task Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Add Tasks to Project</CardTitle>
            <CardDescription>
              Select the types of work required and specify quantities.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TaskSelector
              taskTypes={taskTypes}
              selectedTasks={selectedTasks}
              onTaskSelect={handleTaskSelect}
              onTaskDeselect={handleTaskDeselect}
              loading={loading}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              categoryFilter={categoryFilter}
              onCategoryFilterChange={setCategoryFilter}
            />
          </CardContent>
        </Card>

        {/* Selected Tasks Configuration */}
        {selectedTasks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Configure Selected Tasks</CardTitle>
              <CardDescription>
                Adjust quantities and customize hours for each task type.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedTasks.map(task => (
                  <TaskQuantityInput
                    key={task.taskTypeId}
                    taskType={task.taskType}
                    quantity={task.quantity}
                    {...(task.customMinHours !== undefined && {
                      customMinHours: task.customMinHours,
                    })}
                    {...(task.customMaxHours !== undefined && {
                      customMaxHours: task.customMaxHours,
                    })}
                    onQuantityChange={quantity =>
                      handleQuantityChange(task.taskTypeId, quantity)
                    }
                    onCustomHoursChange={(min, max) =>
                      handleCustomHoursChange(task.taskTypeId, min, max)
                    }
                    onRemove={() => handleRemoveTask(task.taskTypeId)}
                    disabled={isFormDisabled}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estimation Breakdown */}
        {showBreakdown && selectedTasks.length > 0 && (
          <EstimationBreakdown
            tasks={selectedTasks}
            totalMinHours={totalMinHours}
            totalMaxHours={totalMaxHours}
          />
        )}

        {/* Submit Section */}
        {selectedTasks.length > 0 && onSubmit && (
          <Card>
            <CardFooter className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {selectedTasks.length} task type
                {selectedTasks.length !== 1 ? 's' : ''} configured
              </div>
              <Button
                onClick={handleSubmit}
                disabled={isFormDisabled || selectedTasks.length === 0}
              >
                {isSubmitting ? 'Updating...' : 'Update Project Tasks'}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  )
}
