import { db } from '../db'
import type { TaskType } from '@prisma/client'

export interface TaskTypeInput {
  name: string
  description?: string
  defaultMinHours: number
  defaultMaxHours: number
  category?: string
  isActive?: boolean
}

export interface TaskTypeUpdate {
  name?: string
  description?: string
  defaultMinHours?: number
  defaultMaxHours?: number
  category?: string
  isActive?: boolean
}

export class TaskConfiguration {
  async listTaskTypes(options?: {
    category?: string
    active?: boolean
  }): Promise<TaskType[]> {
    const where: any = {}
    
    if (options?.category) {
      where.category = options.category
    }
    
    if (options?.active !== undefined) {
      where.isActive = options.active
    }

    return db.taskType.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    })
  }

  async getTaskType(id: string): Promise<TaskType | null> {
    return db.taskType.findUnique({
      where: { id },
    })
  }

  async getTaskTypeByName(name: string): Promise<TaskType | null> {
    return db.taskType.findUnique({
      where: { name },
    })
  }

  async createTaskType(input: TaskTypeInput): Promise<TaskType> {
    // Validate input
    if (input.defaultMaxHours < input.defaultMinHours) {
      throw new Error('Maximum hours must be greater than or equal to minimum hours')
    }

    if (input.defaultMinHours <= 0) {
      throw new Error('Minimum hours must be greater than 0')
    }

    if (input.defaultMaxHours > 1000) {
      throw new Error('Maximum hours cannot exceed 1000')
    }

    return db.taskType.create({
      data: {
        name: input.name,
        description: input.description,
        defaultMinHours: input.defaultMinHours,
        defaultMaxHours: input.defaultMaxHours,
        category: input.category,
        isActive: input.isActive ?? true,
      },
    })
  }

  async updateTaskType(id: string, input: TaskTypeUpdate): Promise<TaskType> {
    const existingTaskType = await this.getTaskType(id)
    if (!existingTaskType) {
      throw new Error(`Task type not found: ${id}`)
    }

    // Validate hours if provided
    const newMinHours = input.defaultMinHours ?? existingTaskType.defaultMinHours
    const newMaxHours = input.defaultMaxHours ?? existingTaskType.defaultMaxHours

    if (newMaxHours < newMinHours) {
      throw new Error('Maximum hours must be greater than or equal to minimum hours')
    }

    if (newMinHours <= 0) {
      throw new Error('Minimum hours must be greater than 0')
    }

    if (newMaxHours > 1000) {
      throw new Error('Maximum hours cannot exceed 1000')
    }

    return db.taskType.update({
      where: { id },
      data: input,
    })
  }

  async deleteTaskType(id: string): Promise<void> {
    // Check if task type is referenced by any project tasks
    const referencedTasks = await db.projectTask.findMany({
      where: { taskTypeId: id },
      take: 1,
    })

    if (referencedTasks.length > 0) {
      throw new Error('Cannot delete task type that is referenced by project tasks')
    }

    await db.taskType.delete({
      where: { id },
    })
  }

  async getTaskTypeCategories(): Promise<string[]> {
    const result = await db.taskType.findMany({
      where: {
        category: { not: null },
        isActive: true,
      },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    })

    return result
      .map(item => item.category)
      .filter(Boolean) as string[]
  }
}

export const taskConfiguration = new TaskConfiguration()