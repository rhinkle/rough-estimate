'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { TaskTypeManager } from '@/components/features/configuration/task-type-manager'
import { ConfigurationSettings } from '@/components/features/configuration/configuration-settings'
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

interface Configuration {
  id: string
  key: string
  value: string
  description?: string | null
  createdAt: string
  updatedAt: string
}

type ConfigurationTab = 'task-types' | 'settings'

export default function ConfigurationPage() {
  const [activeTab, setActiveTab] =
    React.useState<ConfigurationTab>('task-types')
  const [taskTypes, setTaskTypes] = React.useState<TaskType[]>([])
  const [configurations, setConfigurations] = React.useState<Configuration[]>(
    []
  )
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const fetchTaskTypes = React.useCallback(async () => {
    try {
      const response = await fetch('/api/task-types')
      if (!response.ok) throw new Error('Failed to fetch task types')
      const data = await response.json()
      setTaskTypes(data)
    } catch (err) {
      console.error('Error fetching task types:', err)
      setTaskTypes([])
    }
  }, [])

  const fetchConfigurations = React.useCallback(async () => {
    try {
      // Note: This endpoint doesn't exist yet, but we'll create a placeholder
      const response = await fetch('/api/configuration')
      if (response.ok) {
        const data = await response.json()
        setConfigurations(data)
      } else {
        setConfigurations([])
      }
    } catch (err) {
      console.error('Error fetching configurations:', err)
      setConfigurations([])
    }
  }, [])

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      await Promise.all([fetchTaskTypes(), fetchConfigurations()])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [fetchTaskTypes, fetchConfigurations])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCreateTaskType = async (data: CreateTaskTypeRequest) => {
    try {
      const response = await fetch('/api/task-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create task type')
      }

      await fetchTaskTypes()
    } catch (err) {
      throw err // Re-throw to be handled by the component
    }
  }

  const handleUpdateTaskType = async (
    id: string,
    data: UpdateTaskTypeRequest
  ) => {
    try {
      const response = await fetch(`/api/task-types/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update task type')
      }

      await fetchTaskTypes()
    } catch (err) {
      throw err // Re-throw to be handled by the component
    }
  }

  const handleDeleteTaskType = async (id: string) => {
    try {
      const response = await fetch(`/api/task-types/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete task type')
      }

      await fetchTaskTypes()
    } catch (err) {
      throw err // Re-throw to be handled by the component
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/task-types/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update task type')
      }

      await fetchTaskTypes()
    } catch (err) {
      throw err // Re-throw to be handled by the component
    }
  }

  const handleUpdateConfiguration = async (key: string, value: string) => {
    try {
      // This would create or update a configuration setting
      const response = await fetch('/api/configuration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key, value }),
      })

      if (response.ok) {
        await fetchConfigurations()
      } else {
        throw new Error('Failed to update configuration')
      }
    } catch (err) {
      throw err // Re-throw to be handled by the component
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuration</h1>
          <p className="text-muted-foreground mt-2">
            Manage task types and application settings to customize your
            estimation experience.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive rounded-md">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
          <Button
            variant={activeTab === 'task-types' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('task-types')}
          >
            Task Types
          </Button>
          <Button
            variant={activeTab === 'settings' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </Button>
        </div>

        {/* Tab Content */}
        {activeTab === 'task-types' && (
          <div>
            <TaskTypeManager
              taskTypes={taskTypes}
              loading={loading}
              onCreateTaskType={handleCreateTaskType}
              onUpdateTaskType={handleUpdateTaskType}
              onDeleteTaskType={handleDeleteTaskType}
              onToggleActive={handleToggleActive}
            />
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <ConfigurationSettings
              configurations={configurations}
              loading={loading}
              onUpdateConfiguration={handleUpdateConfiguration}
            />
          </div>
        )}

        {/* Help Section */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration Help</CardTitle>
            <CardDescription>
              Tips for managing your estimation configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Task Types</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Create task types for different types of work</li>
                  <li>• Set realistic min/max hour estimates</li>
                  <li>• Use categories to organize similar tasks</li>
                  <li>• Deactivate unused task types instead of deleting</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Settings</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Adjust time units and rounding precision</li>
                  <li>• Set default project status for new projects</li>
                  <li>• Configure export formats for estimates</li>
                  <li>• Changes are saved automatically</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
