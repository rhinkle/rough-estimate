import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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

interface TaskTypeFormProps {
  taskType?: TaskType
  onSubmit: (
    data: CreateTaskTypeRequest | UpdateTaskTypeRequest
  ) => void | Promise<void>
  onCancel?: () => void
  loading?: boolean
  title?: string
  description?: string
}

interface FormData {
  name: string
  description: string
  defaultMinHours: string
  defaultMaxHours: string
  category: string
  isActive: boolean
}

interface FormErrors {
  name?: string
  description?: string
  defaultMinHours?: string
  defaultMaxHours?: string
  category?: string
  general?: string
}

const COMMON_CATEGORIES = [
  'Frontend',
  'Backend',
  'Database',
  'Mobile',
  'Testing',
  'DevOps',
  'Design',
  'Research',
  'Documentation',
  'Integration',
] as const

export function TaskTypeForm({
  taskType,
  onSubmit,
  onCancel,
  loading = false,
  title,
  description,
}: TaskTypeFormProps) {
  const isEditing = !!taskType
  const defaultTitle =
    title || (isEditing ? 'Edit Task Type' : 'Create New Task Type')
  const defaultDescription =
    description ||
    (isEditing
      ? 'Update task type settings and default time estimates.'
      : 'Create a new task type for use in project estimation.')

  const [formData, setFormData] = React.useState<FormData>({
    name: taskType?.name || '',
    description: taskType?.description || '',
    defaultMinHours: taskType?.defaultMinHours?.toString() || '',
    defaultMaxHours: taskType?.defaultMaxHours?.toString() || '',
    category: taskType?.category || '',
    isActive: taskType?.isActive ?? true,
  })

  const [errors, setErrors] = React.useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Task type name is required'
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Name must be 100 characters or less'
    }

    // Description validation
    if (formData.description.trim().length > 500) {
      newErrors.description = 'Description must be 500 characters or less'
    }

    // Hours validation
    const minHours = parseFloat(formData.defaultMinHours)
    const maxHours = parseFloat(formData.defaultMaxHours)

    if (!formData.defaultMinHours || isNaN(minHours)) {
      newErrors.defaultMinHours = 'Minimum hours is required'
    } else if (minHours < 0.1) {
      newErrors.defaultMinHours = 'Minimum hours must be at least 0.1'
    } else if (minHours > 1000) {
      newErrors.defaultMinHours = 'Minimum hours must be 1000 or less'
    }

    if (!formData.defaultMaxHours || isNaN(maxHours)) {
      newErrors.defaultMaxHours = 'Maximum hours is required'
    } else if (maxHours < 0.1) {
      newErrors.defaultMaxHours = 'Maximum hours must be at least 0.1'
    } else if (maxHours > 1000) {
      newErrors.defaultMaxHours = 'Maximum hours must be 1000 or less'
    }

    if (!isNaN(minHours) && !isNaN(maxHours) && maxHours < minHours) {
      newErrors.defaultMaxHours =
        'Maximum hours must be greater than or equal to minimum hours'
    }

    // Category validation
    if (formData.category.trim().length > 50) {
      newErrors.category = 'Category must be 50 characters or less'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const baseData = {
        name: formData.name.trim(),
        defaultMinHours: parseFloat(formData.defaultMinHours),
        defaultMaxHours: parseFloat(formData.defaultMaxHours),
        ...(formData.description.trim() && {
          description: formData.description.trim(),
        }),
        ...(formData.category.trim() && { category: formData.category.trim() }),
      }

      const submitData: CreateTaskTypeRequest | UpdateTaskTypeRequest = baseData

      // Add isActive for updates
      if (isEditing && formData.isActive !== undefined) {
        ;(submitData as UpdateTaskTypeRequest).isActive = formData.isActive
      }

      await onSubmit(submitData)
    } catch (error) {
      console.error('Form submission error:', error)
      setErrors({ general: 'Failed to save task type. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (
    field: keyof FormData,
    value: string | number | boolean
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleCategorySelect = (category: string) => {
    handleInputChange('category', category)
  }

  const isFormDisabled = loading || isSubmitting

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{defaultTitle}</CardTitle>
        <CardDescription>{defaultDescription}</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {errors.general && (
            <div className="p-3 bg-destructive/10 border border-destructive rounded-md">
              <p className="text-sm text-destructive">{errors.general}</p>
            </div>
          )}

          {/* Task Type Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Task Type Name *</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={e => handleInputChange('name', e.target.value)}
              placeholder="e.g., Large Complex Web Screen"
              disabled={isFormDisabled}
              className={errors.name ? 'border-destructive' : ''}
              maxLength={100}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={e => handleInputChange('description', e.target.value)}
              placeholder="Describe what this task type includes and any special considerations..."
              disabled={isFormDisabled}
              className={errors.description ? 'border-destructive' : ''}
              rows={3}
              maxLength={500}
            />
            <div className="flex justify-between">
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description}</p>
              )}
              <p className="text-sm text-muted-foreground ml-auto">
                {formData.description.length}/500
              </p>
            </div>
          </div>

          {/* Hours Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="defaultMinHours">Default Min Hours *</Label>
              <Input
                id="defaultMinHours"
                type="number"
                value={formData.defaultMinHours}
                onChange={e =>
                  handleInputChange('defaultMinHours', e.target.value)
                }
                placeholder="e.g., 2"
                disabled={isFormDisabled}
                className={errors.defaultMinHours ? 'border-destructive' : ''}
                step="0.5"
                min="0.1"
                max="1000"
              />
              {errors.defaultMinHours && (
                <p className="text-sm text-destructive">
                  {errors.defaultMinHours}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultMaxHours">Default Max Hours *</Label>
              <Input
                id="defaultMaxHours"
                type="number"
                value={formData.defaultMaxHours}
                onChange={e =>
                  handleInputChange('defaultMaxHours', e.target.value)
                }
                placeholder="e.g., 8"
                disabled={isFormDisabled}
                className={errors.defaultMaxHours ? 'border-destructive' : ''}
                step="0.5"
                min="0.1"
                max="1000"
              />
              {errors.defaultMaxHours && (
                <p className="text-sm text-destructive">
                  {errors.defaultMaxHours}
                </p>
              )}
            </div>
          </div>

          {/* Category */}
          <div className="space-y-3">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              type="text"
              value={formData.category}
              onChange={e => handleInputChange('category', e.target.value)}
              placeholder="e.g., Frontend, Backend, Database"
              disabled={isFormDisabled}
              className={errors.category ? 'border-destructive' : ''}
              maxLength={50}
            />
            {errors.category && (
              <p className="text-sm text-destructive">{errors.category}</p>
            )}

            {/* Common Categories */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Quick select:</p>
              <div className="flex flex-wrap gap-2">
                {COMMON_CATEGORIES.map(category => (
                  <Button
                    key={category}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleCategorySelect(category)}
                    disabled={isFormDisabled}
                    className="h-7"
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Active Status (only for editing) */}
          {isEditing && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive || false}
                onChange={e => handleInputChange('isActive', e.target.checked)}
                disabled={isFormDisabled}
                className="rounded"
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Active (available for selection in projects)
              </Label>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex gap-3">
          <Button
            type="submit"
            disabled={isFormDisabled}
            className="flex-1 sm:flex-none"
          >
            {isSubmitting
              ? isEditing
                ? 'Updating...'
                : 'Creating...'
              : isEditing
                ? 'Update Task Type'
                : 'Create Task Type'}
          </Button>

          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isFormDisabled}
            >
              Cancel
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  )
}
