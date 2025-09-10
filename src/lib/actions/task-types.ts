'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { taskConfiguration } from '@/lib/task-config'
import { z } from 'zod'

export type ActionResult<T = any> = {
  success: boolean
  data?: T
  error?: string
  fieldErrors?: Record<string, string[]>
}

// Validation schemas
const CreateTaskTypeSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Task type name is required')
      .max(100, 'Name too long'),
    description: z.string().max(500, 'Description too long').optional(),
    defaultMinHours: z
      .number()
      .min(0.1, 'Minimum hours must be at least 0.1')
      .max(1000, 'Minimum hours cannot exceed 1000'),
    defaultMaxHours: z
      .number()
      .min(0.1, 'Maximum hours must be at least 0.1')
      .max(1000, 'Maximum hours cannot exceed 1000'),
    category: z.string().max(50, 'Category too long').optional(),
    isActive: z.boolean().optional().default(true),
  })
  .refine(data => data.defaultMaxHours >= data.defaultMinHours, {
    message: 'Maximum hours must be greater than or equal to minimum hours',
    path: ['defaultMaxHours'],
  })

const UpdateTaskTypeSchema = z.object({
  name: z
    .string()
    .min(1, 'Task type name is required')
    .max(100, 'Name too long')
    .optional(),
  description: z.string().max(500, 'Description too long').optional(),
  defaultMinHours: z
    .number()
    .min(0.1, 'Minimum hours must be at least 0.1')
    .max(1000, 'Minimum hours cannot exceed 1000')
    .optional(),
  defaultMaxHours: z
    .number()
    .min(0.1, 'Maximum hours must be at least 0.1')
    .max(1000, 'Maximum hours cannot exceed 1000')
    .optional(),
  category: z.string().max(50, 'Category too long').optional(),
  isActive: z.boolean().optional(),
})

export async function createTaskType(
  prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  try {
    const validatedFields = CreateTaskTypeSchema.safeParse({
      name: formData.get('name'),
      description: formData.get('description'),
      defaultMinHours: Number(formData.get('defaultMinHours')),
      defaultMaxHours: Number(formData.get('defaultMaxHours')),
      category: formData.get('category'),
      isActive: formData.get('isActive') === 'true',
    })

    if (!validatedFields.success) {
      return {
        success: false,
        error: 'Invalid form data',
        fieldErrors: validatedFields.error.flatten().fieldErrors,
      }
    }

    const {
      name,
      description,
      defaultMinHours,
      defaultMaxHours,
      category,
      isActive,
    } = validatedFields.data

    // Check if task type name already exists
    const existingTaskType = await taskConfiguration.getTaskTypeByName(
      name.trim()
    )
    if (existingTaskType) {
      return {
        success: false,
        error: 'A task type with this name already exists',
        fieldErrors: {
          name: ['Task type name must be unique'],
        },
      }
    }

    const taskType = await taskConfiguration.createTaskType({
      name: name.trim(),
      description: description?.trim(),
      defaultMinHours,
      defaultMaxHours,
      category: category?.trim(),
      isActive,
    })

    revalidatePath('/configuration')
    revalidateTag('task-types')

    return {
      success: true,
      data: taskType,
    }
  } catch (error) {
    console.error('Failed to create task type:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to create task type. Please try again.',
    }
  }
}

export async function updateTaskType(
  taskTypeId: string,
  prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  try {
    const validatedFields = UpdateTaskTypeSchema.safeParse({
      name: formData.get('name') || undefined,
      description: formData.get('description') || undefined,
      defaultMinHours: formData.get('defaultMinHours')
        ? Number(formData.get('defaultMinHours'))
        : undefined,
      defaultMaxHours: formData.get('defaultMaxHours')
        ? Number(formData.get('defaultMaxHours'))
        : undefined,
      category: formData.get('category') || undefined,
      isActive: formData.get('isActive')
        ? formData.get('isActive') === 'true'
        : undefined,
    })

    if (!validatedFields.success) {
      return {
        success: false,
        error: 'Invalid form data',
        fieldErrors: validatedFields.error.flatten().fieldErrors,
      }
    }

    // Get current task type for validation
    const existingTaskType = await taskConfiguration.getTaskType(taskTypeId)
    if (!existingTaskType) {
      return {
        success: false,
        error: 'Task type not found',
      }
    }

    const updateData = validatedFields.data

    // Validate hours constraint manually since we need to consider existing values
    const newMinHours =
      updateData.defaultMinHours ?? existingTaskType.defaultMinHours
    const newMaxHours =
      updateData.defaultMaxHours ?? existingTaskType.defaultMaxHours

    if (newMaxHours < newMinHours) {
      return {
        success: false,
        error: 'Maximum hours must be greater than or equal to minimum hours',
        fieldErrors: {
          defaultMaxHours: [
            'Maximum hours must be greater than or equal to minimum hours',
          ],
        },
      }
    }

    // Check for name uniqueness if name is being updated
    if (updateData.name && updateData.name.trim() !== existingTaskType.name) {
      const nameExists = await taskConfiguration.getTaskTypeByName(
        updateData.name.trim()
      )
      if (nameExists) {
        return {
          success: false,
          error: 'A task type with this name already exists',
          fieldErrors: {
            name: ['Task type name must be unique'],
          },
        }
      }
    }

    // Clean up the data
    const cleanUpdateData = Object.fromEntries(
      Object.entries(updateData)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [
          key,
          typeof value === 'string' ? value.trim() : value,
        ])
    )

    const taskType = await taskConfiguration.updateTaskType(
      taskTypeId,
      cleanUpdateData
    )

    revalidatePath('/configuration')
    revalidateTag('task-types')

    return {
      success: true,
      data: taskType,
    }
  } catch (error) {
    console.error('Failed to update task type:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to update task type. Please try again.',
    }
  }
}

export async function deleteTaskType(
  taskTypeId: string
): Promise<ActionResult> {
  try {
    await taskConfiguration.deleteTaskType(taskTypeId)

    revalidatePath('/configuration')
    revalidateTag('task-types')

    return {
      success: true,
    }
  } catch (error) {
    console.error('Failed to delete task type:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to delete task type. It may be in use by projects.',
    }
  }
}

export async function toggleTaskTypeActive(
  taskTypeId: string,
  isActive: boolean
): Promise<ActionResult> {
  try {
    const taskType = await taskConfiguration.updateTaskType(taskTypeId, {
      isActive,
    })

    revalidatePath('/configuration')
    revalidateTag('task-types')

    return {
      success: true,
      data: taskType,
    }
  } catch (error) {
    console.error('Failed to toggle task type status:', error)
    return {
      success: false,
      error: 'Failed to update task type status. Please try again.',
    }
  }
}

// Optimistic helper for client components
export async function createTaskTypeOptimistic(data: {
  name: string
  description?: string
  defaultMinHours: number
  defaultMaxHours: number
  category?: string
  isActive?: boolean
}): Promise<ActionResult> {
  try {
    const validatedFields = CreateTaskTypeSchema.safeParse(data)

    if (!validatedFields.success) {
      return {
        success: false,
        error: 'Invalid data',
        fieldErrors: validatedFields.error.flatten().fieldErrors,
      }
    }

    const {
      name,
      description,
      defaultMinHours,
      defaultMaxHours,
      category,
      isActive,
    } = validatedFields.data

    // Check if task type name already exists
    const existingTaskType = await taskConfiguration.getTaskTypeByName(
      name.trim()
    )
    if (existingTaskType) {
      return {
        success: false,
        error: 'A task type with this name already exists',
        fieldErrors: {
          name: ['Task type name must be unique'],
        },
      }
    }

    const taskType = await taskConfiguration.createTaskType({
      name: name.trim(),
      description: description?.trim(),
      defaultMinHours,
      defaultMaxHours,
      category: category?.trim(),
      isActive,
    })

    revalidatePath('/configuration')
    revalidateTag('task-types')

    return {
      success: true,
      data: taskType,
    }
  } catch (error) {
    console.error('Failed to create task type:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to create task type. Please try again.',
    }
  }
}

export async function updateTaskTypeOptimistic(
  taskTypeId: string,
  data: Partial<{
    name: string
    description: string
    defaultMinHours: number
    defaultMaxHours: number
    category: string
    isActive: boolean
  }>
): Promise<ActionResult> {
  try {
    const validatedFields = UpdateTaskTypeSchema.safeParse(data)

    if (!validatedFields.success) {
      return {
        success: false,
        error: 'Invalid data',
        fieldErrors: validatedFields.error.flatten().fieldErrors,
      }
    }

    // Get current task type for validation
    const existingTaskType = await taskConfiguration.getTaskType(taskTypeId)
    if (!existingTaskType) {
      return {
        success: false,
        error: 'Task type not found',
      }
    }

    const updateData = validatedFields.data

    // Validate hours constraint
    const newMinHours =
      updateData.defaultMinHours ?? existingTaskType.defaultMinHours
    const newMaxHours =
      updateData.defaultMaxHours ?? existingTaskType.defaultMaxHours

    if (newMaxHours < newMinHours) {
      return {
        success: false,
        error: 'Maximum hours must be greater than or equal to minimum hours',
        fieldErrors: {
          defaultMaxHours: [
            'Maximum hours must be greater than or equal to minimum hours',
          ],
        },
      }
    }

    // Check for name uniqueness if name is being updated
    if (updateData.name && updateData.name.trim() !== existingTaskType.name) {
      const nameExists = await taskConfiguration.getTaskTypeByName(
        updateData.name.trim()
      )
      if (nameExists) {
        return {
          success: false,
          error: 'A task type with this name already exists',
          fieldErrors: {
            name: ['Task type name must be unique'],
          },
        }
      }
    }

    // Clean up the data
    const cleanUpdateData = Object.fromEntries(
      Object.entries(updateData)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [
          key,
          typeof value === 'string' ? value.trim() : value,
        ])
    )

    const taskType = await taskConfiguration.updateTaskType(
      taskTypeId,
      cleanUpdateData
    )

    revalidatePath('/configuration')
    revalidateTag('task-types')

    return {
      success: true,
      data: taskType,
    }
  } catch (error) {
    console.error('Failed to update task type:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to update task type. Please try again.',
    }
  }
}
