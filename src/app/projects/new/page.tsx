'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ProjectForm } from '@/components/features/projects/project-form'
import { CreateProjectRequest } from '@/types'

export default function NewProjectPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleSubmit = async (data: CreateProjectRequest) => {
    try {
      setIsSubmitting(true)
      setError(null)

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create project')
      }

      const project = await response.json()

      // Redirect to the new project's detail page
      router.push(`/projects/${project.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push('/projects')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Create New Project
        </h1>
        <p className="text-muted-foreground mt-2">
          Start a new project estimation. You can add task types and configure
          estimates after creating the project.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-md">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <ProjectForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={isSubmitting}
      />
    </div>
  )
}
