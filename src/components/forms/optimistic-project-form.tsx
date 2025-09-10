'use client'

import * as React from 'react'
import { useActionState } from 'react'
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
  createProject,
  updateProject,
  type ActionResult,
} from '@/lib/actions/projects'
import { ProjectStatus } from '@/types'

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

interface OptimisticProjectFormProps {
  project?: Project
  onSuccess?: (project: Project) => void
  onCancel?: () => void
}

const initialState: ActionResult = {
  success: false,
}

export function OptimisticProjectForm({
  project,
  onSuccess,
  onCancel,
}: OptimisticProjectFormProps) {
  const isEditing = !!project
  const [isOptimistic, setIsOptimistic] = React.useState(false)

  // Use server action with form state
  const [state, formAction, isPending] = useActionState(
    isEditing ? updateProject.bind(null, project.id) : createProject,
    initialState
  )

  // Handle successful submission
  React.useEffect(() => {
    if (state.success && state.data && !isOptimistic) {
      onSuccess?.(state.data)
    }
  }, [state, onSuccess, isOptimistic])

  // Optimistic submission handler
  const handleOptimisticSubmit = async (formData: FormData) => {
    const name = formData.get('name') as string
    const description = formData.get('description') as string

    if (!name.trim()) {
      return // Let the server action handle validation
    }

    // Create optimistic project
    const optimisticProject: Project = {
      id: isEditing ? project.id : `temp-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || null,
      status: isEditing ? project.status : ProjectStatus.DRAFT,
      totalMinHours: isEditing ? project.totalMinHours : 0,
      totalMaxHours: isEditing ? project.totalMaxHours : 0,
      createdAt: isEditing ? project.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Show optimistic result immediately
    setIsOptimistic(true)
    onSuccess?.(optimisticProject)

    // Then submit to server
    try {
      await formAction(formData)
    } finally {
      setIsOptimistic(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEditing ? 'Edit Project' : 'Create New Project'}
        </CardTitle>
        <CardDescription>
          {isEditing
            ? 'Update your project details and settings.'
            : 'Create a new project to start estimating tasks.'}
        </CardDescription>
      </CardHeader>

      <form action={handleOptimisticSubmit}>
        <CardContent className="space-y-4">
          {state.error && (
            <div className="p-3 bg-destructive/10 border border-destructive rounded-md">
              <p className="text-sm text-destructive">{state.error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              name="name"
              type="text"
              defaultValue={project?.name || ''}
              placeholder="Enter project name"
              disabled={isPending || isOptimistic}
              className={state.fieldErrors?.name ? 'border-destructive' : ''}
              required
            />
            {state.fieldErrors?.name && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.name[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={project?.description || ''}
              placeholder="Enter project description (optional)"
              disabled={isPending || isOptimistic}
              className={
                state.fieldErrors?.description ? 'border-destructive' : ''
              }
              rows={3}
            />
            {state.fieldErrors?.description && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.description[0]}
              </p>
            )}
          </div>

          {isEditing && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                defaultValue={project?.status}
                disabled={isPending || isOptimistic}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value={ProjectStatus.DRAFT}>Draft</option>
                <option value={ProjectStatus.ACTIVE}>Active</option>
                <option value={ProjectStatus.COMPLETED}>Completed</option>
                <option value={ProjectStatus.ARCHIVED}>Archived</option>
              </select>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex gap-3">
          <Button
            type="submit"
            disabled={isPending || isOptimistic}
            className="flex-1"
          >
            {isPending || isOptimistic ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>{isEditing ? 'Update Project' : 'Create Project'}</>
            )}
          </Button>

          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isPending || isOptimistic}
            >
              Cancel
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  )
}

// Example usage component showing optimistic updates
export function OptimisticProjectExample() {
  const [projects, setProjects] = React.useState<Project[]>([])
  const [showForm, setShowForm] = React.useState(false)

  const handleProjectCreated = (project: Project) => {
    setProjects(prev => [project, ...prev])
    setShowForm(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Projects</h2>
        <Button onClick={() => setShowForm(true)}>Add Project</Button>
      </div>

      {showForm && (
        <OptimisticProjectForm
          onSuccess={handleProjectCreated}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="grid gap-4">
        {projects.map(project => (
          <Card key={project.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {project.name}
                {project.id.startsWith('temp-') && (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                    Saving...
                  </span>
                )}
              </CardTitle>
              {project.description && (
                <CardDescription>{project.description}</CardDescription>
              )}
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  )
}
