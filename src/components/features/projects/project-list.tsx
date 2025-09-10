import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ProjectStatus, PaginatedResponse } from '@/types'
import { ProjectCard } from './project-card'

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

interface ProjectListProps {
  projects: PaginatedResponse<Project>
  loading?: boolean
  onLoadMore?: () => void
  onStatusFilter?: (status: ProjectStatus | 'ALL') => void
  onSearch?: (query: string) => void
  onCreateNew?: () => void
  onEditProject?: (project: Project) => void
  onDeleteProject?: (project: Project) => void
  onViewProject?: (project: Project) => void
  currentStatusFilter?: ProjectStatus | 'ALL'
  searchQuery?: string
}

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Projects' },
  { value: ProjectStatus.DRAFT, label: 'Draft' },
  { value: ProjectStatus.ACTIVE, label: 'Active' },
  { value: ProjectStatus.COMPLETED, label: 'Completed' },
  { value: ProjectStatus.ARCHIVED, label: 'Archived' },
] as const

export function ProjectList({
  projects,
  loading = false,
  onLoadMore,
  onStatusFilter,
  onSearch,
  onCreateNew,
  onEditProject,
  onDeleteProject,
  onViewProject,
  currentStatusFilter = 'ALL',
  searchQuery = '',
}: ProjectListProps) {
  const [searchInput, setSearchInput] = React.useState(searchQuery)

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch?.(searchInput)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value)
    // Debounced search - trigger after user stops typing for 300ms
    const timeoutId = setTimeout(() => {
      onSearch?.(e.target.value)
    }, 300)

    return () => clearTimeout(timeoutId)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage your project estimations and track progress.
          </p>
        </div>
        {onCreateNew && (
          <Button onClick={onCreateNew}>Create New Project</Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1">
          <div className="relative">
            <Label htmlFor="search" className="sr-only">
              Search projects
            </Label>
            <Input
              id="search"
              type="text"
              placeholder="Search projects..."
              value={searchInput}
              onChange={handleSearchChange}
              className="pr-10"
            />
          </div>
        </form>

        {/* Status Filter */}
        {onStatusFilter && (
          <div className="flex gap-2 flex-wrap">
            {STATUS_OPTIONS.map(({ value, label }) => (
              <Button
                key={value}
                variant={currentStatusFilter === value ? 'default' : 'outline'}
                size="sm"
                onClick={() => onStatusFilter(value)}
              >
                {label}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && projects.data.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse">Loading projects...</div>
        </div>
      )}

      {/* Empty State */}
      {!loading && projects.data.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-muted-foreground mb-4">
            {searchQuery || currentStatusFilter !== 'ALL'
              ? 'No projects match your current filters.'
              : 'No projects found. Create your first project to get started.'}
          </div>
          {onCreateNew && !searchQuery && currentStatusFilter === 'ALL' && (
            <Button onClick={onCreateNew}>Create Your First Project</Button>
          )}
        </div>
      )}

      {/* Project Grid */}
      {projects.data.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.data.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              {...(onEditProject && { onEdit: onEditProject })}
              {...(onDeleteProject && { onDelete: onDeleteProject })}
              {...(onViewProject && { onView: onViewProject })}
            />
          ))}
        </div>
      )}

      {/* Load More */}
      {projects.hasMore && onLoadMore && (
        <div className="flex justify-center pt-6">
          <Button variant="outline" onClick={onLoadMore} disabled={loading}>
            {loading ? 'Loading...' : 'Load More Projects'}
          </Button>
        </div>
      )}

      {/* Results Summary */}
      {projects.data.length > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          Showing {projects.data.length} of {projects.total} projects
        </div>
      )}
    </div>
  )
}
