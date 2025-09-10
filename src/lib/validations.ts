import { z } from 'zod'

// Common validation patterns
const idSchema = z.string().min(1, 'ID is required')
const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name is too long')
  .trim()
const descriptionSchema = z
  .string()
  .max(500, 'Description is too long')
  .trim()
  .optional()
const hoursSchema = z
  .number()
  .min(0.1, 'Hours must be at least 0.1')
  .max(10000, 'Hours cannot exceed 10,000')
const quantitySchema = z
  .number()
  .int('Quantity must be a whole number')
  .min(1, 'Quantity must be at least 1')
  .max(1000, 'Quantity cannot exceed 1,000')

// Task Type Schemas
export const createTaskTypeSchema = z
  .object({
    name: nameSchema,
    description: descriptionSchema,
    defaultMinHours: hoursSchema,
    defaultMaxHours: hoursSchema,
    category: z.string().max(50, 'Category is too long').trim().optional(),
    isActive: z.boolean().default(true),
  })
  .refine(data => data.defaultMaxHours >= data.defaultMinHours, {
    message: 'Maximum hours must be greater than or equal to minimum hours',
    path: ['defaultMaxHours'],
  })

export const updateTaskTypeSchema = createTaskTypeSchema.partial()

export const taskTypeParamsSchema = z.object({
  id: idSchema,
})

// Project Schemas
export const createProjectSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
})

export const updateProjectSchema = z.object({
  name: nameSchema.optional(),
  description: descriptionSchema,
  status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
})

export const projectParamsSchema = z.object({
  id: idSchema,
})

// Project Task Schemas
export const createProjectTaskSchema = z
  .object({
    taskTypeId: idSchema,
    quantity: quantitySchema,
    customMinHours: hoursSchema.optional(),
    customMaxHours: hoursSchema.optional(),
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
        'Custom maximum hours must be greater than or equal to custom minimum hours',
      path: ['customMaxHours'],
    }
  )

export const updateProjectTaskSchema = createProjectTaskSchema
  .omit({ taskTypeId: true })
  .partial()

export const projectTaskParamsSchema = z.object({
  projectId: idSchema,
  taskId: idSchema.optional(),
})

// Query parameter schemas
export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().min(1, 'Page must be at least 1')),
  limit: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val, 10) : 10))
    .pipe(z.number().min(1).max(100, 'Limit must be between 1 and 100')),
})

export const taskTypeQuerySchema = z.object({
  category: z.string().optional(),
  isActive: z
    .string()
    .optional()
    .transform(val => val === 'true')
    .pipe(z.boolean().optional()),
  search: z.string().optional(),
})

export const projectQuerySchema = z.object({
  status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
  search: z.string().optional(),
})

// Configuration schemas
export const configurationSchema = z.object({
  key: z.string().min(1, 'Configuration key is required'),
  value: z.string().min(1, 'Configuration value is required'),
})

// API Response schemas
export const apiErrorSchema = z.object({
  error: z.string(),
  details: z
    .array(
      z.object({
        field: z.string(),
        message: z.string(),
      })
    )
    .optional(),
  timestamp: z.string().datetime(),
})

export const successResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    timestamp: z.string().datetime(),
  })

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(
  itemSchema: T
) =>
  z.object({
    data: z.array(itemSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
    timestamp: z.string().datetime(),
  })

// Health check schema
export const healthCheckSchema = z.object({
  status: z.enum(['healthy', 'unhealthy']),
  timestamp: z.string().datetime(),
  database: z.enum(['connected', 'disconnected']),
  uptime: z.number(),
})

// Type exports for use in other files
export type CreateTaskType = z.infer<typeof createTaskTypeSchema>
export type UpdateTaskType = z.infer<typeof updateTaskTypeSchema>
export type CreateProject = z.infer<typeof createProjectSchema>
export type UpdateProject = z.infer<typeof updateProjectSchema>
export type CreateProjectTask = z.infer<typeof createProjectTaskSchema>
export type UpdateProjectTask = z.infer<typeof updateProjectTaskSchema>
export type TaskTypeQuery = z.infer<typeof taskTypeQuerySchema>
export type ProjectQuery = z.infer<typeof projectQuerySchema>
export type Pagination = z.infer<typeof paginationSchema>
export type ApiError = z.infer<typeof apiErrorSchema>
export type HealthCheck = z.infer<typeof healthCheckSchema>

// Validation helper functions
export function validateRequest<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: string[] } {
  try {
    const result = schema.safeParse(data)
    if (result.success) {
      return { success: true, data: result.data }
    } else {
      return {
        success: false,
        errors: result.error.errors.map(
          err => `${err.path.join('.')}: ${err.message}`
        ),
      }
    }
  } catch (error) {
    return {
      success: false,
      errors: ['Invalid input data'],
    }
  }
}

export function formatValidationErrors(
  errors: z.ZodError
): Array<{ field: string; message: string }> {
  return errors.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
  }))
}

// URL parameter validation helper
export function validateParams<T extends z.ZodTypeAny>(
  schema: T,
  params: Record<string, string | string[] | undefined>
): { success: true; data: z.infer<T> } | { success: false; errors: string[] } {
  return validateRequest(schema, params)
}

// Query string validation helper
export function validateQuery<T extends z.ZodTypeAny>(
  schema: T,
  searchParams: URLSearchParams
): { success: true; data: z.infer<T> } | { success: false; errors: string[] } {
  const query = Object.fromEntries(searchParams.entries())
  return validateRequest(schema, query)
}

// Form data validation helper
export function validateFormData<T extends z.ZodTypeAny>(
  schema: T,
  formData: FormData
): { success: true; data: z.infer<T> } | { success: false; errors: string[] } {
  const data: Record<string, any> = {}

  for (const [key, value] of formData.entries()) {
    // Handle multiple values with same key
    if (data[key]) {
      if (Array.isArray(data[key])) {
        data[key].push(value)
      } else {
        data[key] = [data[key], value]
      }
    } else {
      data[key] = value
    }
  }

  return validateRequest(schema, data)
}

// JSON body validation helper
export async function validateJsonBody<T extends z.ZodTypeAny>(
  schema: T,
  request: Request
): Promise<
  { success: true; data: z.infer<T> } | { success: false; errors: string[] }
> {
  try {
    const body = await request.json()
    return validateRequest(schema, body)
  } catch (error) {
    return {
      success: false,
      errors: ['Invalid JSON body'],
    }
  }
}
