import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { formatValidationErrors } from './validations'

// Logging utilities
export interface LogContext {
  method: string
  url: string
  timestamp: string
  userAgent?: string
  ip?: string
  duration?: number
  status?: number
  error?: string
  userId?: string
  requestId: string
}

export class Logger {
  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  static createContext(request: NextRequest): LogContext {
    return {
      method: request.method,
      url: request.url,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent') || undefined,
      ip: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
      requestId: this.generateRequestId(),
    }
  }

  static info(message: string, context?: Partial<LogContext>) {
    const logEntry = {
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...context,
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`[INFO] ${message}`, context || '')
    } else {
      console.log(JSON.stringify(logEntry))
    }
  }

  static error(message: string, error?: Error, context?: Partial<LogContext>) {
    const logEntry = {
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
      ...context,
    }

    if (process.env.NODE_ENV === 'development') {
      console.error(`[ERROR] ${message}`, error || '', context || '')
    } else {
      console.error(JSON.stringify(logEntry))
    }
  }

  static warn(message: string, context?: Partial<LogContext>) {
    const logEntry = {
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      ...context,
    }

    if (process.env.NODE_ENV === 'development') {
      console.warn(`[WARN] ${message}`, context || '')
    } else {
      console.warn(JSON.stringify(logEntry))
    }
  }

  static debug(message: string, context?: Partial<LogContext>) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, context || '')
    }
  }
}

// Error response utilities
export interface ApiErrorResponse {
  error: string
  details?: Array<{ field: string; message: string }>
  timestamp: string
  requestId?: string
}

export class ApiError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public details?: Array<{ field: string; message: string }>
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class ValidationError extends ApiError {
  constructor(errors: ZodError) {
    const details = formatValidationErrors(errors)
    super('Validation failed', 400, details)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends ApiError {
  constructor(resource?: string) {
    super(resource ? `${resource} not found` : 'Resource not found', 404)
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends ApiError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409)
    this.name = 'ConflictError'
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden') {
    super(message, 403)
    this.name = 'ForbiddenError'
  }
}

export class TooManyRequestsError extends ApiError {
  constructor(message: string = 'Too many requests') {
    super(message, 429)
    this.name = 'TooManyRequestsError'
  }
}

// Error response formatting
export function createErrorResponse(
  error: unknown,
  context?: LogContext
): NextResponse<ApiErrorResponse> {
  const timestamp = new Date().toISOString()
  let statusCode = 500
  let message = 'Internal server error'
  let details: Array<{ field: string; message: string }> | undefined

  if (error instanceof ApiError) {
    statusCode = error.statusCode
    message = error.message
    details = error.details
  } else if (error instanceof ZodError) {
    statusCode = 400
    message = 'Validation failed'
    details = formatValidationErrors(error)
  } else if (error instanceof Error) {
    // Log the actual error for debugging but don't expose it
    Logger.error('Unexpected error', error, context)
    message = 'Internal server error'
  }

  const errorResponse: ApiErrorResponse = {
    error: message,
    details,
    timestamp,
    requestId: context?.requestId,
  }

  // Log error context
  Logger.error(
    message,
    error instanceof Error ? error : new Error(String(error)),
    {
      ...context,
      status: statusCode,
    }
  )

  return NextResponse.json(errorResponse, { status: statusCode })
}

// Success response formatting
export function createSuccessResponse<T>(
  data: T,
  statusCode: number = 200,
  context?: LogContext
): NextResponse<{ data: T; timestamp: string }> {
  const response = {
    data,
    timestamp: new Date().toISOString(),
  }

  // Log successful request
  Logger.info(`${context?.method} ${context?.url} - ${statusCode}`, {
    ...context,
    status: statusCode,
  })

  return NextResponse.json(response, { status: statusCode })
}

// Paginated response formatting
export function createPaginatedResponse<T>(
  data: T[],
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  },
  statusCode: number = 200,
  context?: LogContext
): NextResponse<{
  data: T[]
  pagination: typeof pagination
  timestamp: string
}> {
  const response = {
    data,
    pagination,
    timestamp: new Date().toISOString(),
  }

  Logger.info(
    `${context?.method} ${context?.url} - ${statusCode} (paginated)`,
    {
      ...context,
      status: statusCode,
    }
  )

  return NextResponse.json(response, { status: statusCode })
}

// Request/Response middleware wrapper
export function withErrorHandling<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const startTime = Date.now()
    const context = Logger.createContext(request)

    Logger.info(`${request.method} ${request.url} - Started`, context)

    try {
      const response = await handler(request, ...args)

      const duration = Date.now() - startTime
      const finalContext = {
        ...context,
        duration,
        status: response.status,
      }

      Logger.info(
        `${request.method} ${request.url} - Completed (${duration}ms)`,
        finalContext
      )

      // Add request ID to response headers
      response.headers.set('X-Request-ID', context.requestId)

      return response
    } catch (error) {
      const duration = Date.now() - startTime
      const finalContext = {
        ...context,
        duration,
        error: error instanceof Error ? error.message : String(error),
      }

      return createErrorResponse(error, finalContext)
    }
  }
}

// Rate limiting middleware (simple in-memory implementation)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function withRateLimit(
  limit: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
) {
  return function <T extends any[]>(
    handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
      const ip =
        request.ip || request.headers.get('x-forwarded-for') || 'unknown'
      const now = Date.now()
      const key = `rate_limit:${ip}`

      const current = rateLimitStore.get(key)

      if (!current || now > current.resetTime) {
        // Reset window
        rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
      } else if (current.count >= limit) {
        // Rate limit exceeded
        throw new TooManyRequestsError(
          `Rate limit exceeded. Try again in ${Math.ceil(
            (current.resetTime - now) / 1000
          )} seconds.`
        )
      } else {
        // Increment count
        current.count++
      }

      return handler(request, ...args)
    }
  }
}

// Request validation middleware
export function withValidation<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    // Add basic request validation
    const contentType = request.headers.get('content-type')

    if (
      ['POST', 'PUT', 'PATCH'].includes(request.method) &&
      contentType &&
      contentType.includes('application/json')
    ) {
      try {
        // Validate JSON is parseable
        await request.clone().json()
      } catch (error) {
        throw new ApiError('Invalid JSON body', 400)
      }
    }

    return handler(request, ...args)
  }
}

// Compose middleware
export function createApiHandler<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>,
  options: {
    rateLimit?: { limit: number; windowMs: number }
    skipValidation?: boolean
  } = {}
) {
  let composedHandler = handler

  // Apply middleware in reverse order (last applied runs first)
  if (!options.skipValidation) {
    composedHandler = withValidation(composedHandler)
  }

  if (options.rateLimit) {
    composedHandler = withRateLimit(
      options.rateLimit.limit,
      options.rateLimit.windowMs
    )(composedHandler)
  }

  composedHandler = withErrorHandling(composedHandler)

  return composedHandler
}

// Database error handling
export function handleDatabaseError(error: unknown): never {
  Logger.error(
    'Database error occurred',
    error instanceof Error ? error : new Error(String(error))
  )

  if (error && typeof error === 'object') {
    const err = error as any

    // Prisma specific errors
    if (err.code === 'P2002') {
      throw new ConflictError('A record with this data already exists')
    }

    if (err.code === 'P2025') {
      throw new NotFoundError()
    }

    if (err.code === 'P2003') {
      throw new ConflictError('Cannot delete record due to related data')
    }

    // SQLite specific errors
    if (err.errno === 19) {
      // CONSTRAINT violation
      throw new ConflictError('Data constraint violation')
    }
  }

  // Generic database error
  throw new ApiError('Database operation failed', 500)
}

// Cleanup utility for rate limiting store
export function cleanupRateLimitStore() {
  const now = Date.now()
  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

// Auto-cleanup every 5 minutes
if (typeof window === 'undefined') {
  // Only run on server side
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000)
}
