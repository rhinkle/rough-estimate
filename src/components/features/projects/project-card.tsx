import * as React from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProjectStatus } from '@/types'
import { ProjectStatusBadge } from './project-status-badge'

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

interface ProjectCardProps {
  project: Project
  onEdit?: (project: Project) => void
  onDelete?: (project: Project) => void
  onView?: (project: Project) => void
}

export function ProjectCard({
  project,
  onEdit,
  onDelete,
  onView,
}: ProjectCardProps) {
  const formatHours = (hours: number): string => {
    return hours === Math.floor(hours) ? hours.toString() : hours.toFixed(1)
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString()
  }

  const hoursRange =
    project.totalMinHours === project.totalMaxHours
      ? `${formatHours(project.totalMinHours)}h`
      : `${formatHours(project.totalMinHours)}-${formatHours(project.totalMaxHours)}h`

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{project.name}</CardTitle>
          <ProjectStatusBadge status={project.status} />
        </div>
        {project.description && (
          <CardDescription className="line-clamp-2">
            {project.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="flex-grow">
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Estimated Hours:</span>
            <span className="font-medium">{hoursRange}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Last Updated:</span>
            <span>{formatDate(project.updatedAt)}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        {onView && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView(project)}
            className="flex-1"
          >
            View Details
          </Button>
        )}
        {onEdit && (
          <Button variant="outline" size="sm" onClick={() => onEdit(project)}>
            Edit
          </Button>
        )}
        {onDelete && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(project)}
          >
            Delete
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
