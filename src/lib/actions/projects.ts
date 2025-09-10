'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { db } from '@/lib/db'
import { estimationEngine } from '@/lib/estimation-engine'
import { ProjectStatus } from '@/types'
import { z } from 'zod'

// Validation schemas
const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
})

const UpdateProjectSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(100, 'Name too long')
    .optional(),
  description: z.string().max(500, 'Description too long').optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
})

const CreateProjectTaskSchema = z
  .object({
    taskTypeId: z.string().min(1, 'Task type is required'),
    quantity: z
      .number()
      .min(1, 'Quantity must be at least 1')
      .max(1000, 'Quantity too high'),
    customMinHours: z.number().min(0.1).max(1000).optional(),
    customMaxHours: z.number().min(0.1).max(1000).optional(),
  })
  .refine(
    data => {
      if (data.customMinHours && data.customMaxHours) {
        return data.customMaxHours >= data.customMinHours
      }
      return true
    },
    {
      message:
        'Custom max hours must be greater than or equal to custom min hours',
      path: ['customMaxHours'],
    }
  )

export type ActionResult<T = any> = {
  success: boolean
  data?: T
  error?: string
  fieldErrors?: Record<string, string[]>
}

export async function createProject(
  prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  try {
    const validatedFields = CreateProjectSchema.safeParse({
      name: formData.get('name'),
      description: formData.get('description'),
    })

    if (!validatedFields.success) {
      return {
        success: false,
        error: 'Invalid form data',
        fieldErrors: validatedFields.error.flatten().fieldErrors,
      }
    }

    const { name, description } = validatedFields.data

    const project = await db.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        status: ProjectStatus.DRAFT,
        totalMinHours: 0,
        totalMaxHours: 0,
      },
    })

    revalidatePath('/projects')
    revalidateTag('projects')

    return {
      success: true,
      data: project,
    }
  } catch (error) {
    console.error('Failed to create project:', error)
    return {
      success: false,
      error: 'Failed to create project. Please try again.',
    }
  }
}

export async function updateProject(
  projectId: string,
  prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  try {
    const validatedFields = UpdateProjectSchema.safeParse({
      name: formData.get('name'),
      description: formData.get('description'),
      status: formData.get('status'),
    })

    if (!validatedFields.success) {
      return {
        success: false,
        error: 'Invalid form data',
        fieldErrors: validatedFields.error.flatten().fieldErrors,
      }
    }

    const updateData = Object.fromEntries(
      Object.entries(validatedFields.data).filter(
        ([, value]) => value !== undefined
      )
    )

    if (updateData.name) {
      updateData.name = updateData.name.trim()
    }
    if (updateData.description) {
      updateData.description = updateData.description.trim() || null
    }

    const project = await db.project.update({
      where: { id: projectId },
      data: updateData,
    })

    revalidatePath(`/projects/${projectId}`)
    revalidatePath('/projects')
    revalidateTag('projects')

    return {
      success: true,
      data: project,
    }
  } catch (error) {
    console.error('Failed to update project:', error)
    return {
      success: false,
      error: 'Failed to update project. Please try again.',
    }
  }
}

export async function deleteProject(projectId: string): Promise<ActionResult> {
  try {
    await db.project.delete({
      where: { id: projectId },
    })

    revalidatePath('/projects')
    revalidateTag('projects')

    return {
      success: true,
    }
  } catch (error) {
    console.error('Failed to delete project:', error)
    return {
      success: false,
      error: 'Failed to delete project. It may be referenced by other data.',
    }
  }
}

export async function addProjectTask(
  projectId: string,
  prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  try {
    const validatedFields = CreateProjectTaskSchema.safeParse({
      taskTypeId: formData.get('taskTypeId'),
      quantity: Number(formData.get('quantity')),
      customMinHours: formData.get('customMinHours')
        ? Number(formData.get('customMinHours'))
        : undefined,
      customMaxHours: formData.get('customMaxHours')
        ? Number(formData.get('customMaxHours'))
        : undefined,
    })

    if (!validatedFields.success) {
      return {
        success: false,
        error: 'Invalid form data',
        fieldErrors: validatedFields.error.flatten().fieldErrors,
      }
    }

    const { taskTypeId, quantity, customMinHours, customMaxHours } =
      validatedFields.data

    // Check if task type already exists for this project
    const existingTask = await db.projectTask.findFirst({
      where: {
        projectId,
        taskTypeId,
      },
    })

    if (existingTask) {
      return {
        success: false,
        error: 'This task type is already added to the project',
      }
    }

    const projectTask = await db.projectTask.create({
      data: {
        projectId,
        taskTypeId,
        quantity,
        customMinHours,
        customMaxHours,
      },
      include: {
        taskType: true,
      },
    })

    // Recalculate project totals
    await estimationEngine.recalculateProjectTotals(projectId)

    revalidatePath(`/projects/${projectId}`)
    revalidatePath(`/projects/${projectId}/estimate`)
    revalidateTag('projects')
    revalidateTag(`project-${projectId}`)

    return {
      success: true,
      data: projectTask,
    }
  } catch (error) {
    console.error('Failed to add project task:', error)
    return {
      success: false,
      error: 'Failed to add task to project. Please try again.',
    }
  }
}

export async function updateProjectTask(
  projectId: string,
  taskId: string,
  prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  try {
    const validatedFields = CreateProjectTaskSchema.partial().safeParse({
      quantity: formData.get('quantity')
        ? Number(formData.get('quantity'))
        : undefined,
      customMinHours: formData.get('customMinHours')
        ? Number(formData.get('customMinHours'))
        : undefined,
      customMaxHours: formData.get('customMaxHours')
        ? Number(formData.get('customMaxHours'))
        : undefined,
    })

    if (!validatedFields.success) {
      return {
        success: false,
        error: 'Invalid form data',
        fieldErrors: validatedFields.error.flatten().fieldErrors,
      }
    }

    const updateData = Object.fromEntries(
      Object.entries(validatedFields.data).filter(
        ([, value]) => value !== undefined
      )
    )

    const projectTask = await db.projectTask.update({
      where: { id: taskId },
      data: updateData,
      include: {
        taskType: true,
      },
    })

    // Recalculate project totals
    await estimationEngine.recalculateProjectTotals(projectId)

    revalidatePath(`/projects/${projectId}`)
    revalidatePath(`/projects/${projectId}/estimate`)
    revalidateTag('projects')
    revalidateTag(`project-${projectId}`)

    return {
      success: true,
      data: projectTask,
    }
  } catch (error) {
    console.error('Failed to update project task:', error)
    return {
      success: false,
      error: 'Failed to update task. Please try again.',
    }
  }
}

export async function removeProjectTask(
  projectId: string,
  taskId: string
): Promise<ActionResult> {
  try {
    await db.projectTask.delete({
      where: { id: taskId },
    })

    // Recalculate project totals
    await estimationEngine.recalculateProjectTotals(projectId)

    revalidatePath(`/projects/${projectId}`)
    revalidatePath(`/projects/${projectId}/estimate`)
    revalidateTag('projects')
    revalidateTag(`project-${projectId}`)

    return {
      success: true,
    }
  } catch (error) {
    console.error('Failed to remove project task:', error)
    return {
      success: false,
      error: 'Failed to remove task from project. Please try again.',
    }
  }
}

export async function recalculateProjectEstimate(
  projectId: string
): Promise<ActionResult> {
  try {
    const estimate = await estimationEngine.calculateProjectEstimate(projectId)

    revalidatePath(`/projects/${projectId}`)
    revalidatePath(`/projects/${projectId}/estimate`)
    revalidateTag('projects')
    revalidateTag(`project-${projectId}`)

    return {
      success: true,
      data: estimate,
    }
  } catch (error) {
    console.error('Failed to recalculate project estimate:', error)
    return {
      success: false,
      error: 'Failed to recalculate estimate. Please try again.',
    }
  }
}

// Optimistic helper for client components
export async function createProjectOptimistic(data: {
  name: string
  description?: string
}): Promise<ActionResult> {
  try {
    const validatedFields = CreateProjectSchema.safeParse(data)

    if (!validatedFields.success) {
      return {
        success: false,
        error: 'Invalid data',
        fieldErrors: validatedFields.error.flatten().fieldErrors,
      }
    }

    const { name, description } = validatedFields.data

    const project = await db.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        status: ProjectStatus.DRAFT,
        totalMinHours: 0,
        totalMaxHours: 0,
      },
    })

    revalidatePath('/projects')
    revalidateTag('projects')

    return {
      success: true,
      data: project,
    }
  } catch (error) {
    console.error('Failed to create project:', error)
    return {
      success: false,
      error: 'Failed to create project. Please try again.',
    }
  }
}
