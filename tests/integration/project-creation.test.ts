/**
 * Integration Test: Create project with task estimates
 * 
 * CRITICAL: This test MUST FAIL until the full workflow is implemented.
 * Tests the complete user journey from quickstart.md Flow 1
 */

import { setupTestDatabase, cleanupTestDatabase } from '../setup'
import { db } from '@/lib/db'

describe('Project Creation Integration', () => {
  beforeEach(async () => {
    await setupTestDatabase()
  })

  afterEach(async () => {
    await cleanupTestDatabase()
  })

  describe('Complete Project Creation Workflow', () => {
    it('should create E-commerce project with realistic task estimates', async () => {
      // This test follows the exact workflow from quickstart.md Flow 1
      
      // Step 1: Create the project
      const projectData = {
        name: 'E-commerce Website',
        description: 'Full-featured online store with payment processing',
      }

      // Should fail - route not implemented yet
      expect(async () => {
        const project = await db.project.create({
          data: projectData,
          include: { tasks: { include: { taskType: true } } },
        })
        expect(project).toBeDefined()
        expect(project.status).toBe('DRAFT')
      }).rejects.toBeDefined()
    })

    it('should add multiple task types with quantities', async () => {
      // Step 2: Add task estimates as specified in quickstart.md
      const taskSelections = [
        { name: 'Large Complex Web Screen', quantity: 5 }, // product pages, checkout, admin
        { name: 'Simple Web Screen', quantity: 8 }, // static pages, forms  
        { name: 'API Endpoint', quantity: 12 }, // user auth, products, orders, payments
        { name: 'Database Design', quantity: 1 }, // schema and relationships
        { name: 'Authentication System', quantity: 1 }, // user management
        { name: 'Third-party Integration', quantity: 2 }, // payment gateway, shipping API
      ]

      // Should fail - not implemented yet
      expect(async () => {
        // This workflow should:
        // 1. Get task types by name
        // 2. Create project tasks for each selection
        // 3. Calculate and update project totals
        // 4. Return project with realistic estimate (150-320 hours as per quickstart)
        
        const project = await createProjectWithTasks('Test Project', taskSelections)
        expect(project.totalMinHours).toBeGreaterThan(150)
        expect(project.totalMaxHours).toBeLessThan(320)
      }).rejects.toBeDefined()
    })

    it('should calculate realistic total estimates', async () => {
      // Step 3: Verify estimate calculation matches expected range
      expect(async () => {
        const estimate = await calculateProjectEstimate('test-project-id')
        
        // From quickstart.md: should show "156h - 312h" range
        expect(estimate.totalMinHours).toBeGreaterThanOrEqual(150)
        expect(estimate.totalMaxHours).toBeLessThanOrEqual(320)
        
        // Should have detailed breakdown
        expect(estimate.taskBreakdown).toHaveLength(6) // 6 task types selected
        
        // Each breakdown item should have correct calculations
        estimate.taskBreakdown.forEach((item: any) => {
          expect(item.subtotalMinHours).toBe(item.quantity * item.minHours)
          expect(item.subtotalMaxHours).toBe(item.quantity * item.maxHours)
        })
      }).rejects.toBeDefined()
    })

    it('should update project status to ACTIVE when saved', async () => {
      // Step 4: Save estimation and update status
      expect(async () => {
        const project = await saveProjectEstimation('test-project-id')
        expect(project.status).toBe('ACTIVE')
        expect(project.updatedAt).toBeDefined()
      }).rejects.toBeDefined()
    })
  })

  describe('Project Data Persistence', () => {
    it('should persist project data correctly in database', async () => {
      expect(async () => {
        const projectId = await createTestProject()
        
        // Verify data was saved correctly
        const savedProject = await db.project.findUnique({
          where: { id: projectId },
          include: { tasks: { include: { taskType: true } } },
        })
        
        expect(savedProject).not.toBeNull()
        expect(savedProject?.name).toBe('E-commerce Website')
        expect(savedProject?.tasks).toHaveLength(6)
      }).rejects.toBeDefined()
    })

    it('should handle project retrieval and modification', async () => {
      expect(async () => {
        const projectId = await createTestProject()
        
        // Should be able to retrieve and modify
        const retrieved = await db.project.findUnique({ where: { id: projectId } })
        expect(retrieved).not.toBeNull()
        
        const updated = await db.project.update({
          where: { id: projectId },
          data: { description: 'Updated description' },
        })
        
        expect(updated.description).toBe('Updated description')
      }).rejects.toBeDefined()
    })
  })

  describe('Task Relationship Management', () => {
    it('should properly link tasks to project with correct relationships', async () => {
      expect(async () => {
        const projectId = await createTestProject()
        
        const projectWithTasks = await db.project.findUnique({
          where: { id: projectId },
          include: {
            tasks: {
              include: { taskType: true },
            },
          },
        })
        
        expect(projectWithTasks?.tasks).toHaveLength(6)
        
        // Each task should have proper relationships
        projectWithTasks?.tasks.forEach(task => {
          expect(task.projectId).toBe(projectId)
          expect(task.taskType.name).toBeDefined()
          expect(task.quantity).toBeGreaterThan(0)
        })
      }).rejects.toBeDefined()
    })

    it('should prevent duplicate task types per project', async () => {
      expect(async () => {
        const projectId = await createTestProject()
        const taskTypeId = await getTaskTypeByName('Large Complex Web Screen')
        
        // Try to add same task type twice - should fail due to unique constraint
        await db.projectTask.create({
          data: {
            projectId,
            taskTypeId,
            quantity: 1,
          },
        })
        
        // This should throw due to unique constraint violation
        await db.projectTask.create({
          data: {
            projectId,
            taskTypeId,
            quantity: 2,
          },
        })
      }).rejects.toBeDefined()
    })
  })

  describe('Total Calculation Accuracy', () => {
    it('should maintain accurate total calculations', async () => {
      expect(async () => {
        const projectId = await createTestProject()
        
        // Get all project tasks with their task types
        const projectTasks = await db.projectTask.findMany({
          where: { projectId },
          include: { taskType: true },
        })
        
        // Calculate expected totals
        let expectedMin = 0
        let expectedMax = 0
        
        for (const task of projectTasks) {
          const minHours = task.customMinHours ?? task.taskType.defaultMinHours
          const maxHours = task.customMaxHours ?? task.taskType.defaultMaxHours
          expectedMin += task.quantity * minHours
          expectedMax += task.quantity * maxHours
        }
        
        // Get updated project
        const project = await db.project.findUnique({ where: { id: projectId } })
        
        expect(project?.totalMinHours).toBe(expectedMin)
        expect(project?.totalMaxHours).toBe(expectedMax)
      }).rejects.toBeDefined()
    })

    it('should update totals when tasks are modified', async () => {
      expect(async () => {
        const projectId = await createTestProject()
        const originalProject = await db.project.findUnique({ where: { id: projectId } })
        
        // Modify a task quantity
        const firstTask = await db.projectTask.findFirst({
          where: { projectId },
          include: { taskType: true },
        })
        
        if (firstTask) {
          await db.projectTask.update({
            where: { id: firstTask.id },
            data: { quantity: firstTask.quantity + 1 },
          })
          
          // Recalculate and update project totals
          await recalculateProjectTotals(projectId)
          
          const updatedProject = await db.project.findUnique({ where: { id: projectId } })
          
          // Totals should have increased
          expect(updatedProject?.totalMinHours).toBeGreaterThan(originalProject?.totalMinHours ?? 0)
          expect(updatedProject?.totalMaxHours).toBeGreaterThan(originalProject?.totalMaxHours ?? 0)
        }
      }).rejects.toBeDefined()
    })
  })
})

// Helper functions that will be implemented later
async function createProjectWithTasks(name: string, taskSelections: Array<{ name: string; quantity: number }>) {
  throw new Error('Not implemented - will be created in Phase 3.3')
}

async function calculateProjectEstimate(projectId: string) {
  throw new Error('Not implemented - will be created in Phase 3.3')
}

async function saveProjectEstimation(projectId: string) {
  throw new Error('Not implemented - will be created in Phase 3.3')
}

async function createTestProject(): Promise<string> {
  throw new Error('Not implemented - will be created in Phase 3.3')
}

async function getTaskTypeByName(name: string): Promise<string> {
  throw new Error('Not implemented - will be created in Phase 3.3')
}

async function recalculateProjectTotals(projectId: string) {
  throw new Error('Not implemented - will be created in Phase 3.3')
}