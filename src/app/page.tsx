import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

async function getProjectStats() {
  try {
    const response = await fetch(`http://localhost:3000/api/projects`, {
      cache: 'no-store',
    })
    if (!response.ok) throw new Error('Failed to fetch projects')
    const projects = await response.json()

    const stats = {
      total: projects.length,
      active: projects.filter((p: any) => p.status === 'ACTIVE').length,
      draft: projects.filter((p: any) => p.status === 'DRAFT').length,
      completed: projects.filter((p: any) => p.status === 'COMPLETED').length,
      recent: projects.slice(0, 3),
    }
    return stats
  } catch (error) {
    console.error('Error fetching project stats:', error)
    return {
      total: 0,
      active: 0,
      draft: 0,
      completed: 0,
      recent: [],
    }
  }
}

async function getTaskTypeStats() {
  try {
    const response = await fetch(`http://localhost:3000/api/task-types`, {
      cache: 'no-store',
    })
    if (!response.ok) throw new Error('Failed to fetch task types')
    const taskTypes = await response.json()

    const stats = {
      total: taskTypes.length,
      active: taskTypes.filter((t: any) => t.isActive).length,
      categories: [
        ...new Set(taskTypes.map((t: any) => t.category).filter(Boolean)),
      ].length,
    }
    return stats
  } catch (error) {
    console.error('Error fetching task type stats:', error)
    return {
      total: 0,
      active: 0,
      categories: 0,
    }
  }
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString()
}

export default async function Home() {
  const [projectStats, taskTypeStats] = await Promise.all([
    getProjectStats(),
    getTaskTypeStats(),
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">
            Welcome to Rough Estimate
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Quickly estimate project timelines with predefined task types and
            customizable hour ranges
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/projects/new">
            <Button size="lg" className="w-full sm:w-auto">
              Create New Project
            </Button>
          </Link>
          <Link href="/projects">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              View All Projects
            </Button>
          </Link>
          <Link href="/configuration">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Configure Task Types
            </Button>
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Total Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projectStats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Active Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {projectStats.active}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Task Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{taskTypeStats.active}</div>
              <p className="text-xs text-muted-foreground">
                {taskTypeStats.total} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {taskTypeStats.categories}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Projects */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Recent Projects</CardTitle>
              <CardDescription>
                Your most recently updated projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              {projectStats.recent.length > 0 ? (
                <div className="space-y-4">
                  {projectStats.recent.map((project: any) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{project.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Updated {formatDate(project.updatedAt)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            project.status === 'ACTIVE'
                              ? 'bg-blue-100 text-blue-800'
                              : project.status === 'COMPLETED'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {project.status}
                        </span>
                        <Link href={`/projects/${project.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    No projects yet. Create your first project to get started.
                  </p>
                  <Link href="/projects/new">
                    <Button>Create Project</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>
                Quick guide to using Rough Estimate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium">Configure Task Types</h4>
                    <p className="text-sm text-muted-foreground">
                      Set up default time estimates for different types of work
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium">Create a Project</h4>
                    <p className="text-sm text-muted-foreground">
                      Start estimating by creating a new project
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium">Add Tasks & Get Estimates</h4>
                    <p className="text-sm text-muted-foreground">
                      Select task types and quantities to see time estimates
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
