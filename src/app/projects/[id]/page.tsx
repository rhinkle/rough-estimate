'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ProjectStatusBadge } from '@/components/features/projects/project-status-badge'
import { ProjectForm } from '@/components/features/projects/project-form'
import { ProjectStatus, UpdateProjectRequest } from '@/types'

interface Project {
  id: string
  name: string
  description?: string | null
  status: ProjectStatus
  totalMinHours: number
  totalMaxHours: number
  createdAt: string
  updatedAt: string
  _count?: {
    tasks: number
  }
}

interface ProjectTask {
  id: string
  quantity: number
  customMinHours?: number | null
  customMaxHours?: number | null
  taskType: {
    id: string
    name: string
    defaultMinHours: number
    defaultMaxHours: number
    category?: string | null
  }
}

export default function ProjectDetailPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const [project, setProject] = React.useState<Project | null>(null)
  const [tasks, setTasks] = React.useState<ProjectTask[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [isEditing, setIsEditing] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const fetchProject = React.useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [projectResponse, tasksResponse] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/projects/${projectId}/tasks`),
      ])

      if (!projectResponse.ok) {
        if (projectResponse.status === 404) {
          throw new Error('Project not found')
        }
        throw new Error('Failed to fetch project')
      }

      const projectData = await projectResponse.json()
      setProject(projectData)

      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json()
        setTasks(tasksData)
      } else {
        setTasks([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  React.useEffect(() => {
    if (projectId) {
      fetchProject()
    }
  }, [projectId, fetchProject])

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
  }

  const handleUpdateProject = async (data: UpdateProjectRequest) => {
    try {
      setIsSubmitting(true)
      setError(null)

      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update project')
      }

      const updatedProject = await response.json()
      setProject(updatedProject)
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!project) return

    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${project.name}"? This action cannot be undone.`
    )

    if (!confirmDelete) return

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete project')
      }

      router.push('/projects')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete project')
    }
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatHours = (hours: number): string => {
    return hours === Math.floor(hours) ? hours.toString() : hours.toFixed(1)
  }

  const hoursRange = project
    ? project.totalMinHours === project.totalMaxHours
      ? `${formatHours(project.totalMinHours)}h`
      : `${formatHours(project.totalMinHours)}-${formatHours(project.totalMaxHours)}h`
    : ''

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">
            {error || 'Project not found'}
          </h1>
          <div className="space-x-4">
            <Link href="/projects">
              <Button variant="outline">Back to Projects</Button>
            </Link>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
      </div>
    )
  }

  if (isEditing) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Edit Project</h1>
          <p className="text-muted-foreground mt-2">
            Update project details and settings.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-md">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <ProjectForm
          project={project}
          onSubmit={handleUpdateProject}
          onCancel={handleCancelEdit}
          loading={isSubmitting}
        />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight">
                {project.name}
              </h1>
              <ProjectStatusBadge status={project.status} />
            </div>
            {project.description && (
              <p className="text-muted-foreground">{project.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Link href={`/projects/${project.id}/estimate`}>
              <Button>Manage Estimates</Button>
            </Link>
            <Button variant="outline" onClick={handleEdit}>
              Edit Project
            </Button>
          </div>
        </div>

        {/* Project Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Estimated Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{hoursRange}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Task Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasks.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Last Updated
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-medium">
                {formatDate(project.updatedAt)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tasks Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Project Tasks</CardTitle>
            <CardDescription>
              Task types and quantities configured for this project
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tasks.length > 0 ? (
              <div className="space-y-4">
                {tasks.map(task => {
                  const minHours =
                    task.customMinHours ?? task.taskType.defaultMinHours
                  const maxHours =
                    task.customMaxHours ?? task.taskType.defaultMaxHours
                  const taskHours =
                    minHours === maxHours
                      ? `${formatHours(minHours * task.quantity)}h`
                      : `${formatHours(minHours * task.quantity)}-${formatHours(maxHours * task.quantity)}h`

                  return (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{task.taskType.name}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span>Quantity: {task.quantity}</span>
                          {task.taskType.category && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-muted">
                              {task.taskType.category}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{taskHours}</div>
                        {(task.customMinHours || task.customMaxHours) && (
                          <div className="text-xs text-muted-foreground">
                            Custom rates
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  No tasks configured yet. Add task types to start estimating.
                </p>
                <Link href={`/projects/${project.id}/estimate`}>
                  <Button>Add Task Types</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Link href="/projects">
            <Button variant="outline">Back to Projects</Button>
          </Link>
          <Button variant="destructive" onClick={handleDelete}>
            Delete Project
          </Button>
        </div>
      </div>
    </div>
  )
}
