// Project status enum for type safety
export const ProjectStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  ARCHIVED: 'ARCHIVED',
} as const

export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus]

// API Response types
export interface ApiResponse<T> {
  data?: T
  error?: string
  details?: Array<{
    field: string
    message: string
  }>
  timestamp: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  hasMore: boolean
}

// Estimation types
export interface EstimationBreakdown {
  taskTypeId: string
  taskTypeName: string
  quantity: number
  minHours: number
  maxHours: number
  subtotalMinHours: number
  subtotalMaxHours: number
}

export interface ProjectEstimate {
  projectId: string
  totalMinHours: number
  totalMaxHours: number
  taskBreakdown: EstimationBreakdown[]
  calculatedAt: string
}

// Form types
export interface CreateTaskTypeRequest {
  name: string
  description?: string
  defaultMinHours: number
  defaultMaxHours: number
  category?: string
}

export interface UpdateTaskTypeRequest extends Partial<CreateTaskTypeRequest> {
  isActive?: boolean
}

export interface CreateProjectRequest {
  name: string
  description?: string
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
  status?: ProjectStatus
}

export interface CreateProjectTaskRequest {
  taskTypeId: string
  quantity: number
  customMinHours?: number
  customMaxHours?: number
}

export interface UpdateProjectTaskRequest {
  quantity?: number
  customMinHours?: number
  customMaxHours?: number
}
