import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const defaultTaskTypes = [
  {
    name: 'Large Complex Web Screen',
    description: 'Complex UI with multiple interactions, forms, and data visualization',
    defaultMinHours: 8,
    defaultMaxHours: 16,
    category: 'Frontend',
  },
  {
    name: 'Simple Web Screen',
    description: 'Basic UI with standard components and minimal logic',
    defaultMinHours: 2,
    defaultMaxHours: 4,
    category: 'Frontend',
  },
  {
    name: 'API Endpoint',
    description: 'RESTful API endpoint with validation and error handling',
    defaultMinHours: 2,
    defaultMaxHours: 4,
    category: 'Backend',
  },
  {
    name: 'Database Design',
    description: 'Schema design, relationships, and migration scripts',
    defaultMinHours: 4,
    defaultMaxHours: 8,
    category: 'Database',
  },
  {
    name: 'Authentication System',
    description: 'User authentication and authorization implementation',
    defaultMinHours: 8,
    defaultMaxHours: 16,
    category: 'Backend',
  },
  {
    name: 'Third-party Integration',
    description: 'Integration with external APIs or services',
    defaultMinHours: 4,
    defaultMaxHours: 12,
    category: 'Backend',
  },
  {
    name: 'Mobile Screen (Native)',
    description: 'Native mobile screen with platform-specific features',
    defaultMinHours: 6,
    defaultMaxHours: 12,
    category: 'Mobile',
  },
  {
    name: 'Data Migration',
    description: 'Migrating data between systems or database versions',
    defaultMinHours: 4,
    defaultMaxHours: 16,
    category: 'Database',
  },
  {
    name: 'Testing Suite',
    description: 'Comprehensive test coverage including unit and integration tests',
    defaultMinHours: 4,
    defaultMaxHours: 8,
    category: 'Testing',
  },
  {
    name: 'DevOps Setup',
    description: 'CI/CD pipeline, deployment scripts, and infrastructure setup',
    defaultMinHours: 8,
    defaultMaxHours: 20,
    category: 'DevOps',
  },
]

const defaultConfigurations = [
  {
    key: 'time_unit',
    value: 'hours',
    description: 'Default time unit for estimates (hours, days)',
  },
  {
    key: 'rounding_precision',
    value: '1',
    description: 'Decimal places for hour calculations',
  },
  {
    key: 'default_project_status',
    value: 'DRAFT',
    description: 'Default status for new projects',
  },
]

async function main() {
  console.log('Start seeding...')

  // Clean existing data
  await prisma.projectTask.deleteMany()
  await prisma.project.deleteMany()
  await prisma.taskType.deleteMany()
  await prisma.configuration.deleteMany()

  // Seed task types
  console.log('Seeding task types...')
  for (const taskType of defaultTaskTypes) {
    const created = await prisma.taskType.create({
      data: taskType,
    })
    console.log(`Created task type: ${created.name}`)
  }

  // Seed configurations
  console.log('Seeding configurations...')
  for (const config of defaultConfigurations) {
    const created = await prisma.configuration.create({
      data: config,
    })
    console.log(`Created configuration: ${created.key}`)
  }

  // Create a sample project for testing
  console.log('Creating sample project...')
  const sampleProject = await prisma.project.create({
    data: {
      name: 'Sample E-commerce Website',
      description: 'A sample project for testing the estimation application',
      status: 'DRAFT',
    },
  })

  // Add some sample tasks to the project
  const taskTypes = await prisma.taskType.findMany()
  const sampleTasks = [
    { taskTypeId: taskTypes[0]?.id, quantity: 5 }, // Large Complex Web Screen
    { taskTypeId: taskTypes[1]?.id, quantity: 8 }, // Simple Web Screen
    { taskTypeId: taskTypes[2]?.id, quantity: 12 }, // API Endpoint
    { taskTypeId: taskTypes[3]?.id, quantity: 1 }, // Database Design
  ]

  for (const task of sampleTasks) {
    if (task.taskTypeId) {
      await prisma.projectTask.create({
        data: {
          projectId: sampleProject.id,
          taskTypeId: task.taskTypeId,
          quantity: task.quantity,
        },
      })
    }
  }

  // Calculate and update project totals
  const projectTasks = await prisma.projectTask.findMany({
    where: { projectId: sampleProject.id },
    include: { taskType: true },
  })

  const totals = projectTasks.reduce(
    (acc, task) => {
      const minHours = task.quantity * (task.customMinHours ?? task.taskType.defaultMinHours)
      const maxHours = task.quantity * (task.customMaxHours ?? task.taskType.defaultMaxHours)
      return {
        min: acc.min + minHours,
        max: acc.max + maxHours,
      }
    },
    { min: 0, max: 0 }
  )

  await prisma.project.update({
    where: { id: sampleProject.id },
    data: {
      totalMinHours: totals.min,
      totalMaxHours: totals.max,
    },
  })

  console.log(`Sample project created with ${projectTasks.length} tasks`)
  console.log(`Total estimate: ${totals.min}h - ${totals.max}h`)
  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })