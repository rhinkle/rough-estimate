import { db } from '../db'
import type { ProjectEstimate, EstimationBreakdown } from '@/types'

export interface EstimationInput {
  projectId: string
}

export interface TaskEstimation {
  taskTypeId: string
  taskTypeName: string
  quantity: number
  minHours: number
  maxHours: number
  subtotalMinHours: number
  subtotalMaxHours: number
}

export class EstimationEngine {
  async calculateProjectEstimate(projectId: string): Promise<ProjectEstimate> {
    // Get project with all tasks and their task types
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: {
          include: {
            taskType: true,
          },
        },
      },
    })

    if (!project) {
      throw new Error(`Project not found: ${projectId}`)
    }

    const taskBreakdown: EstimationBreakdown[] = []
    let totalMinHours = 0
    let totalMaxHours = 0

    // Calculate breakdown for each task
    for (const projectTask of project.tasks) {
      const minHours = projectTask.customMinHours ?? projectTask.taskType.defaultMinHours
      const maxHours = projectTask.customMaxHours ?? projectTask.taskType.defaultMaxHours
      
      const subtotalMinHours = projectTask.quantity * minHours
      const subtotalMaxHours = projectTask.quantity * maxHours

      taskBreakdown.push({
        taskTypeId: projectTask.taskTypeId,
        taskTypeName: projectTask.taskType.name,
        quantity: projectTask.quantity,
        minHours,
        maxHours,
        subtotalMinHours,
        subtotalMaxHours,
      })

      totalMinHours += subtotalMinHours
      totalMaxHours += subtotalMaxHours
    }

    // Update project totals in database
    await db.project.update({
      where: { id: projectId },
      data: {
        totalMinHours,
        totalMaxHours,
      },
    })

    return {
      projectId,
      totalMinHours,
      totalMaxHours,
      taskBreakdown,
      calculatedAt: new Date().toISOString(),
    }
  }

  async recalculateProjectTotals(projectId: string): Promise<void> {
    await this.calculateProjectEstimate(projectId)
  }
}

export const estimationEngine = new EstimationEngine()