'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ProjectList } from '@/components/features/projects/project-list'
import { PaginatedResponse, ProjectStatus } from '@/types'

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

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = React.useState<PaginatedResponse<Project>>({
    data: [],
    total: 0,
    hasMore: false,
  })
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [statusFilter, setStatusFilter] = React.useState<ProjectStatus | 'ALL'>(
    'ALL'
  )
  const [searchQuery, setSearchQuery] = React.useState('')

  const fetchProjects = React.useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (statusFilter !== 'ALL') {
        params.append('status', statusFilter)
      }
      if (searchQuery) {
        params.append('search', searchQuery)
      }

      const response = await fetch(`/api/projects?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch projects')
      }

      const data = await response.json()

      // Transform the data to match PaginatedResponse format
      const paginatedData: PaginatedResponse<Project> = {
        data: data,
        total: data.length,
        hasMore: false, // Since we're not implementing pagination yet
      }

      setProjects(paginatedData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setProjects({ data: [], total: 0, hasMore: false })
    } finally {
      setLoading(false)
    }
  }, [statusFilter, searchQuery])

  React.useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const handleStatusFilter = (status: ProjectStatus | 'ALL') => {
    setStatusFilter(status)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const handleCreateNew = () => {
    router.push('/projects/new')
  }

  const handleEditProject = (project: Project) => {
    // For now, redirect to project detail page where editing can happen
    router.push(`/projects/${project.id}`)
  }

  const handleDeleteProject = async (project: Project) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${project.name}"? This action cannot be undone.`
    )

    if (!confirmDelete) return

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete project')
      }

      // Refresh the projects list
      fetchProjects()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete project')
    }
  }

  const handleViewProject = (project: Project) => {
    router.push(`/projects/${project.id}`)
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Error</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-primary hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ProjectList
        projects={projects}
        loading={loading}
        onStatusFilter={handleStatusFilter}
        onSearch={handleSearch}
        onCreateNew={handleCreateNew}
        onEditProject={handleEditProject}
        onDeleteProject={handleDeleteProject}
        onViewProject={handleViewProject}
        currentStatusFilter={statusFilter}
        searchQuery={searchQuery}
      />
    </div>
  )
}
