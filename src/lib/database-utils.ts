import { Prisma } from '@prisma/client'
import { withTransaction, db, executeQuery } from './db'
import { handleDatabaseError } from './api-middleware'

// Common database operations with transaction support
export class DatabaseUtils {
  // Create project with tasks in a single transaction
  static async createProjectWithTasks(
    projectData: {
      name: string
      description?: string
      status?: string
    },
    tasks: Array<{
      taskTypeId: string
      quantity: number
      customMinHours?: number
      customMaxHours?: number
    }> = []
  ) {
    try {
      return await withTransaction(async tx => {
        // Create the project
        const project = await tx.project.create({
          data: {
            name: projectData.name,
            description: projectData.description,
            status: projectData.status || 'DRAFT',
            totalMinHours: 0,
            totalMaxHours: 0,
          },
        })

        // Create project tasks if provided
        if (tasks.length > 0) {
          await tx.projectTask.createMany({
            data: tasks.map(task => ({
              ...task,
              projectId: project.id,
            })),
          })

          // Recalculate project totals
          await this.recalculateProjectTotals(project.id, tx)
        }

        // Return project with tasks
        return await tx.project.findUnique({
          where: { id: project.id },
          include: {
            tasks: {
              include: {
                taskType: true,
              },
            },
          },
        })
      })
    } catch (error) {
      handleDatabaseError(error)
    }
  }

  // Update project with task changes in a transaction
  static async updateProjectWithTasks(
    projectId: string,
    projectData: {
      name?: string
      description?: string
      status?: string
    },
    taskUpdates: Array<{
      id?: string // If provided, update existing; if not, create new
      taskTypeId: string
      quantity: number
      customMinHours?: number
      customMaxHours?: number
    }> = [],
    taskIdsToDelete: string[] = []
  ) {
    try {
      return await withTransaction(async tx => {
        // Update project data
        await tx.project.update({
          where: { id: projectId },
          data: projectData,
        })

        // Delete specified tasks
        if (taskIdsToDelete.length > 0) {
          await tx.projectTask.deleteMany({
            where: {
              id: { in: taskIdsToDelete },
              projectId,
            },
          })
        }

        // Process task updates
        for (const taskUpdate of taskUpdates) {
          if (taskUpdate.id) {
            // Update existing task
            await tx.projectTask.update({
              where: { id: taskUpdate.id },
              data: {
                quantity: taskUpdate.quantity,
                customMinHours: taskUpdate.customMinHours,
                customMaxHours: taskUpdate.customMaxHours,
              },
            })
          } else {
            // Create new task
            await tx.projectTask.create({
              data: {
                projectId,
                taskTypeId: taskUpdate.taskTypeId,
                quantity: taskUpdate.quantity,
                customMinHours: taskUpdate.customMinHours,
                customMaxHours: taskUpdate.customMaxHours,
              },
            })
          }
        }

        // Recalculate project totals
        await this.recalculateProjectTotals(projectId, tx)

        // Return updated project with tasks
        return await tx.project.findUnique({
          where: { id: projectId },
          include: {
            tasks: {
              include: {
                taskType: true,
              },
            },
          },
        })
      })
    } catch (error) {
      handleDatabaseError(error)
    }
  }

  // Recalculate project totals based on tasks
  static async recalculateProjectTotals(
    projectId: string,
    tx?: Prisma.TransactionClient
  ) {
    const client = tx || db

    try {
      // Get all tasks for the project
      const tasks = await client.projectTask.findMany({
        where: { projectId },
        include: { taskType: true },
      })

      let totalMinHours = 0
      let totalMaxHours = 0

      for (const task of tasks) {
        const minHours = task.customMinHours ?? task.taskType.defaultMinHours
        const maxHours = task.customMaxHours ?? task.taskType.defaultMaxHours

        totalMinHours += minHours * task.quantity
        totalMaxHours += maxHours * task.quantity
      }

      // Update project totals
      await client.project.update({
        where: { id: projectId },
        data: {
          totalMinHours,
          totalMaxHours,
        },
      })

      return { totalMinHours, totalMaxHours }
    } catch (error) {
      handleDatabaseError(error)
    }
  }

  // Bulk update task types with validation
  static async bulkUpdateTaskTypes(
    updates: Array<{
      id: string
      name?: string
      description?: string
      defaultMinHours?: number
      defaultMaxHours?: number
      category?: string
      isActive?: boolean
    }>
  ) {
    try {
      return await withTransaction(async tx => {
        const results = []

        for (const update of updates) {
          // Validate that max hours >= min hours if both are provided
          if (
            update.defaultMinHours !== undefined &&
            update.defaultMaxHours !== undefined
          ) {
            if (update.defaultMaxHours < update.defaultMinHours) {
              throw new Error(
                `Task type ${update.id}: Maximum hours must be >= minimum hours`
              )
            }
          }

          const result = await tx.taskType.update({
            where: { id: update.id },
            data: {
              name: update.name,
              description: update.description,
              defaultMinHours: update.defaultMinHours,
              defaultMaxHours: update.defaultMaxHours,
              category: update.category,
              isActive: update.isActive,
            },
          })

          results.push(result)
        }

        // Recalculate affected project totals
        const affectedProjects = await tx.projectTask.findMany({
          where: {
            taskTypeId: { in: updates.map(u => u.id) },
            customMinHours: null, // Only projects using default hours
            customMaxHours: null,
          },
          select: { projectId: true },
          distinct: ['projectId'],
        })

        for (const project of affectedProjects) {
          await this.recalculateProjectTotals(project.projectId, tx)
        }

        return results
      })
    } catch (error) {
      handleDatabaseError(error)
    }
  }

  // Archive old projects and clean up data
  static async archiveOldProjects(daysOld: number = 365) {
    try {
      return await withTransaction(async tx => {
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - daysOld)

        // Find old projects to archive
        const oldProjects = await tx.project.findMany({
          where: {
            updatedAt: { lt: cutoffDate },
            status: { not: 'ARCHIVED' },
          },
          select: { id: true, name: true },
        })

        if (oldProjects.length === 0) {
          return { archived: 0, projects: [] }
        }

        // Archive the projects
        await tx.project.updateMany({
          where: {
            id: { in: oldProjects.map(p => p.id) },
          },
          data: {
            status: 'ARCHIVED',
          },
        })

        return {
          archived: oldProjects.length,
          projects: oldProjects,
        }
      })
    } catch (error) {
      handleDatabaseError(error)
    }
  }

  // Database maintenance operations
  static async performMaintenance() {
    try {
      return await withTransaction(async tx => {
        // Clean up orphaned project tasks (shouldn't happen with proper foreign keys)
        const orphanedTasks = await tx.projectTask.findMany({
          where: {
            project: null,
          },
        })

        if (orphanedTasks.length > 0) {
          await tx.projectTask.deleteMany({
            where: {
              id: { in: orphanedTasks.map(t => t.id) },
            },
          })
        }

        // Recalculate all project totals to ensure consistency
        const projects = await tx.project.findMany({
          select: { id: true },
        })

        for (const project of projects) {
          await this.recalculateProjectTotals(project.id, tx)
        }

        return {
          orphanedTasksRemoved: orphanedTasks.length,
          projectTotalsRecalculated: projects.length,
        }
      })
    } catch (error) {
      handleDatabaseError(error)
    }
  }

  // Get database statistics
  static async getDatabaseStats() {
    try {
      return await executeQuery(async () => {
        const [
          projectCount,
          taskTypeCount,
          projectTaskCount,
          activeProjects,
          completedProjects,
        ] = await Promise.all([
          db.project.count(),
          db.taskType.count(),
          db.projectTask.count(),
          db.project.count({ where: { status: 'ACTIVE' } }),
          db.project.count({ where: { status: 'COMPLETED' } }),
        ])

        return {
          projects: {
            total: projectCount,
            active: activeProjects,
            completed: completedProjects,
            draft: await db.project.count({ where: { status: 'DRAFT' } }),
            archived: await db.project.count({ where: { status: 'ARCHIVED' } }),
          },
          taskTypes: {
            total: taskTypeCount,
            active: await db.taskType.count({ where: { isActive: true } }),
            inactive: await db.taskType.count({ where: { isActive: false } }),
          },
          projectTasks: {
            total: projectTaskCount,
          },
        }
      }, 'getDatabaseStats')
    } catch (error) {
      handleDatabaseError(error)
    }
  }
}

// Export commonly used transaction patterns
export const transactionPatterns = {
  // Safe project creation with rollback on failure
  createProject: DatabaseUtils.createProjectWithTasks,

  // Update project with automatic total recalculation
  updateProject: DatabaseUtils.updateProjectWithTasks,

  // Bulk operations with consistency guarantees
  bulkUpdate: DatabaseUtils.bulkUpdateTaskTypes,

  // Maintenance operations
  maintenance: DatabaseUtils.performMaintenance,
  archiveOld: DatabaseUtils.archiveOldProjects,
}

// Helper for common queries with error handling
export async function safeQuery<T>(
  queryFn: () => Promise<T>,
  queryName?: string
): Promise<T> {
  try {
    return await executeQuery(queryFn, queryName)
  } catch (error) {
    handleDatabaseError(error)
  }
}

// Pagination helper with transaction support
export async function paginatedQuery<T>(
  queryFn: (skip: number, take: number) => Promise<T[]>,
  countFn: () => Promise<number>,
  page: number = 1,
  limit: number = 10
): Promise<{
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}> {
  try {
    const skip = (page - 1) * limit

    const [data, total] = await Promise.all([
      executeQuery(() => queryFn(skip, limit), 'paginatedQuery:data'),
      executeQuery(countFn, 'paginatedQuery:count'),
    ])

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  } catch (error) {
    handleDatabaseError(error)
  }
}
