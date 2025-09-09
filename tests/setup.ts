import { execSync } from 'child_process'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./test.db',
    },
  },
})

export async function setupTestDatabase() {
  try {
    // Run migrations on test database
    execSync('DATABASE_URL="file:./test.db" npx prisma migrate deploy', {
      stdio: 'inherit',
    })
    
    // Seed test data if needed
    await seedTestData()
  } catch (error) {
    console.error('Failed to setup test database:', error)
    throw error
  }
}

export async function cleanupTestDatabase() {
  try {
    // Clean up test data
    await prisma.projectTask.deleteMany()
    await prisma.project.deleteMany()
    await prisma.taskType.deleteMany()
    await prisma.configuration.deleteMany()
  } catch (error) {
    console.error('Failed to cleanup test database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

async function seedTestData() {
  // Create minimal test data
  await prisma.taskType.create({
    data: {
      id: 'test-task-type-1',
      name: 'Test Task Type',
      description: 'A test task type',
      defaultMinHours: 2,
      defaultMaxHours: 4,
      category: 'Test',
    },
  })
}