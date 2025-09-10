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
import {
  ProjectStatus,
  CreateProjectRequest,
  UpdateProjectRequest,
} from '@/types'

interface Project {
  id: string
  name: string
  description?: string | null
  status: ProjectStatus
  totalMinHours: number
  totalMaxHours: number
  createdAt: string
  updatedAt: string
}

interface ProjectFormProps {
  project?: Project
  onSubmit: (
    data: CreateProjectRequest | UpdateProjectRequest
  ) => void | Promise<void>
  onCancel?: () => void
  loading?: boolean
  title?: string
  description?: string
}

interface FormData {
  name: string
  description: string
  status: ProjectStatus
}

interface FormErrors {
  name?: string
  description?: string
  status?: string
}

const STATUS_OPTIONS = [
  { value: ProjectStatus.DRAFT, label: 'Draft' },
  { value: ProjectStatus.ACTIVE, label: 'Active' },
  { value: ProjectStatus.COMPLETED, label: 'Completed' },
  { value: ProjectStatus.ARCHIVED, label: 'Archived' },
] as const

export function ProjectForm({
  project,
  onSubmit,
  onCancel,
  loading = false,
  title,
  description,
}: ProjectFormProps) {
  const isEditing = !!project
  const defaultTitle =
    title || (isEditing ? 'Edit Project' : 'Create New Project')
  const defaultDescription =
    description ||
    (isEditing
      ? 'Update project information and settings.'
      : 'Create a new project to start estimating development time.')

  const [formData, setFormData] = React.useState<FormData>({
    name: project?.name || '',
    description: project?.description || '',
    status: project?.status || ProjectStatus.DRAFT,
  })

  const [errors, setErrors] = React.useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required'
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Project name must be 100 characters or less'
    }

    // Description validation
    if (formData.description.trim().length > 1000) {
      newErrors.description = 'Description must be 1000 characters or less'
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
        ...(formData.description.trim() && {
          description: formData.description.trim(),
        }),
      }

      const submitData: CreateProjectRequest | UpdateProjectRequest = baseData

      // Add status for updates
      if (isEditing) {
        ;(submitData as UpdateProjectRequest).status = formData.status
      }

      await onSubmit(submitData)
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleStatusChange = (status: ProjectStatus) => {
    setFormData(prev => ({ ...prev, status }))
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
          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={e => handleInputChange('name', e.target.value)}
              placeholder="e.g., E-commerce Website"
              disabled={isFormDisabled}
              className={errors.name ? 'border-destructive' : ''}
              maxLength={100}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Project Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={e => handleInputChange('description', e.target.value)}
              placeholder="Describe your project goals, scope, and key requirements..."
              disabled={isFormDisabled}
              className={errors.description ? 'border-destructive' : ''}
              rows={4}
              maxLength={1000}
            />
            <div className="flex justify-between">
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description}</p>
              )}
              <p className="text-sm text-muted-foreground ml-auto">
                {formData.description.length}/1000
              </p>
            </div>
          </div>

          {/* Status (only for editing) */}
          {isEditing && (
            <div className="space-y-3">
              <Label>Project Status</Label>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map(({ value, label }) => (
                  <Button
                    key={value}
                    type="button"
                    variant={formData.status === value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleStatusChange(value)}
                    disabled={isFormDisabled}
                  >
                    {label}
                  </Button>
                ))}
              </div>
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
                ? 'Update Project'
                : 'Create Project'}
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
