import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { TaskTypeList } from './task-type-list'
import { TaskTypeForm } from './task-type-form'
import { CategoryFilter } from './category-filter'
import { CreateTaskTypeRequest, UpdateTaskTypeRequest } from '@/types'

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

interface TaskTypeManagerProps {
  taskTypes: TaskType[]
  loading?: boolean
  onCreateTaskType?: (data: CreateTaskTypeRequest) => void | Promise<void>
  onUpdateTaskType?: (
    id: string,
    data: UpdateTaskTypeRequest
  ) => void | Promise<void>
  onDeleteTaskType?: (id: string) => void | Promise<void>
  onToggleActive?: (id: string, isActive: boolean) => void | Promise<void>
  className?: string
}

type ViewMode = 'list' | 'create' | 'edit'

export function TaskTypeManager({
  taskTypes,
  loading = false,
  onCreateTaskType,
  onUpdateTaskType,
  onDeleteTaskType,
  onToggleActive,
  className,
}: TaskTypeManagerProps) {
  const [viewMode, setViewMode] = React.useState<ViewMode>('list')
  const [editingTaskType, setEditingTaskType] = React.useState<
    TaskType | undefined
  >()
  const [searchQuery, setSearchQuery] = React.useState('')
  const [categoryFilter, setCategoryFilter] = React.useState<string>('ALL')
  const [showInactive, setShowInactive] = React.useState(false)

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

  // Filter task types
  const filteredTaskTypes = React.useMemo(() => {
    return taskTypes.filter(taskType => {
      // Active/inactive filter
      if (!showInactive && !taskType.isActive) return false

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
  }, [taskTypes, searchQuery, categoryFilter, showInactive])

  const handleCreateNew = () => {
    setEditingTaskType(undefined)
    setViewMode('create')
  }

  const handleEdit = (taskType: TaskType) => {
    setEditingTaskType(taskType)
    setViewMode('edit')
  }

  const handleFormSubmit = async (
    data: CreateTaskTypeRequest | UpdateTaskTypeRequest
  ) => {
    try {
      if (viewMode === 'create') {
        await onCreateTaskType?.(data as CreateTaskTypeRequest)
      } else if (viewMode === 'edit' && editingTaskType) {
        await onUpdateTaskType?.(
          editingTaskType.id,
          data as UpdateTaskTypeRequest
        )
      }

      // Return to list view on success
      setViewMode('list')
      setEditingTaskType(undefined)
    } catch (error) {
      console.error('Form submission error:', error)
      // Form will handle displaying errors
    }
  }

  const handleFormCancel = () => {
    setViewMode('list')
    setEditingTaskType(undefined)
  }

  const handleDelete = async (taskType: TaskType) => {
    if (!onDeleteTaskType) return

    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${taskType.name}"? This action cannot be undone.`
    )

    if (confirmDelete) {
      try {
        await onDeleteTaskType(taskType.id)
      } catch (error) {
        console.error('Delete error:', error)
        alert(
          'Failed to delete task type. It may be in use by existing projects.'
        )
      }
    }
  }

  const handleToggleActive = async (taskType: TaskType) => {
    if (!onToggleActive) return

    try {
      await onToggleActive(taskType.id, !taskType.isActive)
    } catch (error) {
      console.error('Toggle active error:', error)
    }
  }

  const activeCounts = {
    total: taskTypes.length,
    active: taskTypes.filter(t => t.isActive).length,
    inactive: taskTypes.filter(t => !t.isActive).length,
  }

  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <div className={className}>
        <TaskTypeForm
          {...(editingTaskType && { taskType: editingTaskType })}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          loading={loading}
        />
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div>
                <CardTitle>Task Type Management</CardTitle>
                <CardDescription>
                  Configure task types for project estimation. Manage
                  categories, default hours, and availability.
                </CardDescription>
              </div>
              {onCreateTaskType && (
                <Button onClick={handleCreateNew}>Create New Task Type</Button>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
              <div className="text-center">
                <p className="text-2xl font-bold">{activeCounts.total}</p>
                <p className="text-sm text-muted-foreground">Total Types</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {activeCounts.active}
                </p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-500">
                  {activeCounts.inactive}
                </p>
                <p className="text-sm text-muted-foreground">Inactive</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filter & Search</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div>
              <Label htmlFor="search">Search Task Types</Label>
              <Input
                id="search"
                type="text"
                placeholder="Search by name, description, or category..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              {/* Category Filter */}
              <div className="flex-1">
                <CategoryFilter
                  categories={categories}
                  selectedCategory={categoryFilter}
                  onCategoryChange={setCategoryFilter}
                />
              </div>

              {/* Show Inactive Toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="show-inactive"
                  checked={showInactive}
                  onChange={e => setShowInactive(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="show-inactive" className="cursor-pointer">
                  Show inactive
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Task Types List */}
        <TaskTypeList
          taskTypes={filteredTaskTypes}
          loading={loading}
          onEdit={handleEdit}
          {...(onDeleteTaskType && { onDelete: handleDelete })}
          {...(onToggleActive && { onToggleActive: handleToggleActive })}
          searchQuery={searchQuery}
          categoryFilter={categoryFilter}
        />
      </div>
    </div>
  )
}
