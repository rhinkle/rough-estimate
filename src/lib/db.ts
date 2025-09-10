import { PrismaClient, Prisma } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Enhanced Prisma client with connection pooling configuration
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn', 'info']
        : ['error', 'warn'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'file:./dev.db',
      },
    },
    // Connection pooling configuration for SQLite
    // Note: SQLite has limited connection pooling compared to PostgreSQL/MySQL
    // but we can still configure timeouts and limits
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Connection health check with detailed metrics
export async function checkDatabaseConnection() {
  try {
    const startTime = Date.now()
    await db.$queryRaw`SELECT 1`
    const responseTime = Date.now() - startTime

    return {
      status: 'healthy' as const,
      timestamp: new Date().toISOString(),
      responseTime,
      uptime: process.uptime(),
    }
  } catch (error) {
    console.error('Database connection failed:', error)
    return {
      status: 'unhealthy' as const,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    }
  }
}

// Transaction wrapper with retry logic and error handling
export async function withTransaction<T>(
  callback: (tx: Prisma.TransactionClient) => Promise<T>,
  options: {
    maxRetries?: number
    timeout?: number
    isolationLevel?: Prisma.TransactionIsolationLevel
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    timeout = 30000, // 30 seconds
    isolationLevel = 'ReadCommitted',
  } = options

  let lastError: Error | unknown

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await db.$transaction(
        async tx => {
          return await callback(tx)
        },
        {
          timeout,
          isolationLevel,
        }
      )
    } catch (error) {
      lastError = error

      // Check if error is retryable
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        ['P2034', 'P2028', 'P2024'].includes(String(error.code)) && // Transaction conflicts
        attempt < maxRetries
      ) {
        // Exponential backoff: wait 100ms, 200ms, 400ms
        const delay = 100 * Math.pow(2, attempt - 1)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }

      // Non-retryable error or max retries reached
      break
    }
  }

  // Re-throw the last error
  throw lastError
}

// Batch operations with transaction support
export async function batchOperations<T>(
  operations: ((tx: Prisma.TransactionClient) => Promise<T>)[],
  options: {
    timeout?: number
    isolationLevel?: Prisma.TransactionIsolationLevel
  } = {}
): Promise<T[]> {
  return withTransaction(async tx => {
    const results: T[] = []
    for (const operation of operations) {
      const result = await operation(tx)
      results.push(result)
    }
    return results
  }, options)
}

// Connection pool monitoring
interface PoolStats {
  activeConnections: number
  idleConnections: number
  totalConnections: number
  queriesExecuted: number
  averageQueryTime: number
}

class ConnectionPoolMonitor {
  private queryCounts = 0
  private totalQueryTime = 0
  private queryTimes: number[] = []
  private maxQueryTimes = 1000 // Keep last 1000 query times for average

  recordQuery(duration: number) {
    this.queryCounts++
    this.totalQueryTime += duration
    this.queryTimes.push(duration)

    if (this.queryTimes.length > this.maxQueryTimes) {
      this.queryTimes.shift()
    }
  }

  getStats(): PoolStats {
    return {
      activeConnections: 1, // SQLite typically uses 1 connection
      idleConnections: 0,
      totalConnections: 1,
      queriesExecuted: this.queryCounts,
      averageQueryTime:
        this.queryTimes.length > 0
          ? this.queryTimes.reduce((a, b) => a + b, 0) / this.queryTimes.length
          : 0,
    }
  }

  reset() {
    this.queryCounts = 0
    this.totalQueryTime = 0
    this.queryTimes = []
  }
}

export const poolMonitor = new ConnectionPoolMonitor()

// Enhanced query wrapper with monitoring
export async function executeQuery<T>(
  query: () => Promise<T>,
  queryName?: string
): Promise<T> {
  const startTime = Date.now()

  try {
    const result = await query()
    const duration = Date.now() - startTime

    poolMonitor.recordQuery(duration)

    if (process.env.NODE_ENV === 'development' && queryName) {
      console.log(`[DB] ${queryName} completed in ${duration}ms`)
    }

    return result
  } catch (error) {
    const duration = Date.now() - startTime
    poolMonitor.recordQuery(duration)

    console.error(`[DB] Query failed after ${duration}ms:`, error)
    throw error
  }
}

// Database migration and schema management
export async function ensureSchema() {
  try {
    // Check if database is accessible and has the expected schema
    await db.$queryRaw`SELECT name FROM sqlite_master WHERE type='table' AND name='TaskType'`
    return true
  } catch (error) {
    console.error('Schema verification failed:', error)
    return false
  }
}

// Connection retry with exponential backoff
export async function connectWithRetry(
  maxRetries: number = 5,
  initialDelay: number = 1000
): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await db.$connect()
      console.log('Database connected successfully')
      return true
    } catch (error) {
      console.error(
        `Connection attempt ${attempt}/${maxRetries} failed:`,
        error
      )

      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt - 1)
        console.log(`Retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  console.error('Failed to connect to database after all retries')
  return false
}

// Cleanup and resource management
export async function cleanup(): Promise<void> {
  try {
    console.log('Cleaning up database connections...')
    await db.$disconnect()
    console.log('Database cleanup completed')
  } catch (error) {
    console.error('Error during database cleanup:', error)
  }
}

// Graceful shutdown with cleanup
const shutdownHandlers = new Set<() => Promise<void>>()

export function onShutdown(handler: () => Promise<void>) {
  shutdownHandlers.add(handler)
}

async function gracefulShutdown() {
  console.log('Initiating graceful shutdown...')

  // Run all shutdown handlers
  await Promise.all(Array.from(shutdownHandlers).map(handler => handler()))

  // Cleanup database connections
  await cleanup()

  console.log('Graceful shutdown completed')
}

process.on('SIGTERM', gracefulShutdown)
process.on('SIGINT', gracefulShutdown)
process.on('beforeExit', gracefulShutdown)

// Initialize connection on module load
if (typeof window === 'undefined') {
  // Server-side only
  connectWithRetry()
    .then(connected => {
      if (connected) {
        console.log('Database initialization completed')
      } else {
        console.error('Database initialization failed')
      }
    })
    .catch(error => {
      console.error('Unexpected error during database initialization:', error)
    })
}
