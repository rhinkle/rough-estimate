'use client'

import * as React from 'react'
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
import { EstimationForm } from '@/components/features/estimation/estimation-form'
import { EstimationBreakdown } from '@/components/features/estimation/estimation-breakdown'
import {
  ProjectStatus,
  ProjectEstimate,
  CreateProjectTaskRequest,
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

interface TaskType {
  id: string
  name: string
  description?: string | null
  defaultMinHours: number
  defaultMaxHours: number
  category?: string | null
  isActive: boolean
}

interface ProjectTask {
  id: string
  quantity: number
  customMinHours?: number | null
  customMaxHours?: number | null
  taskType: TaskType
}

export default function ProjectEstimatePage() {
  const params = useParams()
  const projectId = params.id as string

  const [project, setProject] = React.useState<Project | null>(null)
  const [projectTasks, setProjectTasks] = React.useState<ProjectTask[]>([])
  const [taskTypes, setTaskTypes] = React.useState<TaskType[]>([])
  const [estimate, setEstimate] = React.useState<ProjectEstimate | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [
        projectResponse,
        tasksResponse,
        taskTypesResponse,
        estimateResponse,
      ] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/projects/${projectId}/tasks`),
        fetch('/api/task-types?active=true'),
        fetch(`/api/projects/${projectId}/estimate`),
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
        setProjectTasks(tasksData)
      } else {
        setProjectTasks([])
      }

      if (taskTypesResponse.ok) {
        const taskTypesData = await taskTypesResponse.json()
        setTaskTypes(taskTypesData)
      } else {
        setTaskTypes([])
      }

      if (estimateResponse.ok) {
        const estimateData = await estimateResponse.json()
        setEstimate(estimateData)
      } else {
        setEstimate(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  React.useEffect(() => {
    if (projectId) {
      fetchData()
    }
  }, [projectId, fetchData])

  const handleAddTask = async (data: CreateProjectTaskRequest) => {
    try {
      setError(null)

      const response = await fetch(`/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add task')
      }

      // Refresh data
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const handleUpdateTask = async (
    taskId: string,
    data: CreateProjectTaskRequest
  ) => {
    try {
      setError(null)

      const response = await fetch(
        `/api/projects/${projectId}/tasks/${taskId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update task')
      }

      // Refresh data
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const handleRemoveTask = async (taskId: string) => {
    try {
      setError(null)

      const response = await fetch(
        `/api/projects/${projectId}/tasks/${taskId}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to remove task')
      }

      // Refresh data
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const formatHours = (hours: number): string => {
    return hours === Math.floor(hours) ? hours.toString() : hours.toFixed(1)
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

  const hoursRange =
    project.totalMinHours === project.totalMaxHours
      ? `${formatHours(project.totalMinHours)}h`
      : `${formatHours(project.totalMinHours)}-${formatHours(project.totalMaxHours)}h`

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Project Estimation
            </h1>
            <p className="text-muted-foreground mt-2">
              Configure task types and quantities for{' '}
              <span className="font-medium">{project.name}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/projects/${project.id}`}>
              <Button variant="outline">Back to Project</Button>
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive rounded-md">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Current Estimate Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Current Estimate</CardTitle>
            <CardDescription>
              Total estimated hours for this project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{hoursRange}</div>
                <p className="text-sm text-muted-foreground">Total Hours</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{projectTasks.length}</div>
                <p className="text-sm text-muted-foreground">Task Types</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {projectTasks.reduce((sum, task) => sum + task.quantity, 0)}
                </div>
                <p className="text-sm text-muted-foreground">Total Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Estimation Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add Task Types</CardTitle>
                <CardDescription>
                  Select task types and specify quantities to build your project
                  estimate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EstimationForm
                  taskTypes={taskTypes}
                  projectTasks={projectTasks}
                  onAddTask={handleAddTask}
                  onUpdateTask={handleUpdateTask}
                  onRemoveTask={handleRemoveTask}
                />
              </CardContent>
            </Card>
          </div>

          {/* Estimation Breakdown */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Estimation Breakdown</CardTitle>
                <CardDescription>
                  Detailed breakdown of your project estimate
                </CardDescription>
              </CardHeader>
              <CardContent>
                {estimate ? (
                  <EstimationBreakdown estimate={estimate} />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      Add task types to see the estimation breakdown
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        {taskTypes.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>No Task Types Available</CardTitle>
              <CardDescription>
                You need to configure task types before you can create estimates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-muted-foreground mb-4">
                  Set up task types with default hour ranges to start estimating
                  projects.
                </p>
                <Link href="/configuration">
                  <Button>Configure Task Types</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
