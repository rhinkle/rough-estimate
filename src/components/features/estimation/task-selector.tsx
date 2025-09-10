import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { TaskTypeCard } from './task-type-card'

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

interface SelectedTask {
  taskTypeId: string
  taskType: TaskType
  quantity: number
  customMinHours?: number
  customMaxHours?: number
}

interface TaskSelectorProps {
  taskTypes: TaskType[]
  selectedTasks?: SelectedTask[]
  onTaskSelect?: (taskType: TaskType) => void
  onTaskDeselect?: (taskTypeId: string) => void
  loading?: boolean
  searchQuery?: string
  onSearchChange?: (query: string) => void
  categoryFilter?: string
  onCategoryFilterChange?: (category: string | 'ALL') => void
  className?: string
}

export function TaskSelector({
  taskTypes,
  selectedTasks = [],
  onTaskSelect,
  onTaskDeselect,
  loading = false,
  searchQuery = '',
  onSearchChange,
  categoryFilter = 'ALL',
  onCategoryFilterChange,
  className,
}: TaskSelectorProps) {
  const [searchInput, setSearchInput] = React.useState(searchQuery)

  // Get unique categories from task types
  const categories = React.useMemo(() => {
    const uniqueCategories = new Set<string>()
    taskTypes.forEach(taskType => {
      if (taskType.category) {
        uniqueCategories.add(taskType.category)
      }
    })
    return Array.from(uniqueCategories).sort()
  }, [taskTypes])

  // Filter task types based on search and category
  const filteredTaskTypes = React.useMemo(() => {
    return taskTypes.filter(taskType => {
      // Only show active task types
      if (!taskType.isActive) return false

      // Category filter
      if (categoryFilter !== 'ALL') {
        if (taskType.category !== categoryFilter) return false
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesName = taskType.name.toLowerCase().includes(query)
        const matchesDescription =
          taskType.description?.toLowerCase().includes(query) || false
        const matchesCategory =
          taskType.category?.toLowerCase().includes(query) || false

        if (!matchesName && !matchesDescription && !matchesCategory)
          return false
      }

      return true
    })
  }, [taskTypes, searchQuery, categoryFilter])

  // Group task types by category
  const groupedTaskTypes = React.useMemo(() => {
    const grouped: Record<string, TaskType[]> = {}

    filteredTaskTypes.forEach(taskType => {
      const category = taskType.category || 'Other'
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(taskType)
    })

    return grouped
  }, [filteredTaskTypes])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value)
    const timeoutId = setTimeout(() => {
      onSearchChange?.(e.target.value)
    }, 300)

    return () => clearTimeout(timeoutId)
  }

  const isTaskSelected = (taskTypeId: string): boolean => {
    return selectedTasks.some(task => task.taskTypeId === taskTypeId)
  }

  const handleTaskToggle = (taskType: TaskType) => {
    if (isTaskSelected(taskType.id)) {
      onTaskDeselect?.(taskType.id)
    } else {
      onTaskSelect?.(taskType)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse">Loading task types...</div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-lg font-semibold">Select Task Types</h3>
          <p className="text-sm text-muted-foreground">
            Choose the types of work required for your project.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          {/* Search */}
          <div>
            <Label htmlFor="task-search" className="sr-only">
              Search task types
            </Label>
            <Input
              id="task-search"
              type="text"
              placeholder="Search task types..."
              value={searchInput}
              onChange={handleSearchChange}
            />
          </div>

          {/* Category Filter */}
          {categories.length > 0 && onCategoryFilterChange && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant={categoryFilter === 'ALL' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onCategoryFilterChange('ALL')}
              >
                All Categories
              </Button>
              {categories.map(category => (
                <Button
                  key={category}
                  variant={categoryFilter === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onCategoryFilterChange(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Tasks Summary */}
        {selectedTasks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Selected Tasks</CardTitle>
              <CardDescription>
                {selectedTasks.length} task type
                {selectedTasks.length !== 1 ? 's' : ''} selected
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Task Types */}
        {Object.keys(groupedTaskTypes).length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No task types match your current filters.
          </div>
        )}

        {Object.entries(groupedTaskTypes).map(([category, tasks]) => (
          <div key={category} className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              {category}
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              {tasks.map(taskType => (
                <TaskTypeCard
                  key={taskType.id}
                  taskType={taskType}
                  selected={isTaskSelected(taskType.id)}
                  onToggle={() => handleTaskToggle(taskType)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
