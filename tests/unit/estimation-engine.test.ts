import { EstimationEngine } from '@/lib/estimation-engine'
import { db } from '@/lib/db'
import { ProjectStatus } from '@/types'

// Mock the database
jest.mock('@/lib/db', () => ({
  db: {
    project: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

const mockDb = db as jest.Mocked<typeof db>

describe('EstimationEngine', () => {
  let estimationEngine: EstimationEngine

  beforeEach(() => {
    estimationEngine = new EstimationEngine()
    jest.clearAllMocks()
  })

  describe('calculateProjectEstimate', () => {
    const projectId = 'project-1'
    const mockProject = {
      id: projectId,
      name: 'Test Project',
      description: 'A test project',
      status: ProjectStatus.ACTIVE,
      totalMinHours: 0,
      totalMaxHours: 0,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      tasks: [
        {
          id: 'task-1',
          projectId,
          taskTypeId: 'tasktype-1',
          quantity: 2,
          customMinHours: null,
          customMaxHours: null,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          taskType: {
            id: 'tasktype-1',
            name: 'Frontend Component',
            description: 'A basic frontend component',
            defaultMinHours: 2,
            defaultMaxHours: 4,
            category: 'Frontend',
            isActive: true,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          },
        },
        {
          id: 'task-2',
          projectId,
          taskTypeId: 'tasktype-2',
          quantity: 1,
          customMinHours: 8,
          customMaxHours: 12,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          taskType: {
            id: 'tasktype-2',
            name: 'Backend API',
            description: 'A backend API endpoint',
            defaultMinHours: 4,
            defaultMaxHours: 8,
            category: 'Backend',
            isActive: true,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          },
        },
      ],
    }

    it('should calculate project estimate with default hours', async () => {
      mockDb.project.findUnique.mockResolvedValue(mockProject)
      mockDb.project.update.mockResolvedValue(mockProject)

      const result = await estimationEngine.calculateProjectEstimate(projectId)

      expect(result.projectId).toBe(projectId)
      expect(result.totalMinHours).toBe(12) // (2*2) + (1*8) = 4 + 8 = 12
      expect(result.totalMaxHours).toBe(20) // (2*4) + (1*12) = 8 + 12 = 20
      expect(result.taskBreakdown).toHaveLength(2)
      expect(result.calculatedAt).toBeDefined()

      // Check task breakdown details
      const task1Breakdown = result.taskBreakdown[0]
      expect(task1Breakdown.taskTypeId).toBe('tasktype-1')
      expect(task1Breakdown.taskTypeName).toBe('Frontend Component')
      expect(task1Breakdown.quantity).toBe(2)
      expect(task1Breakdown.minHours).toBe(2)
      expect(task1Breakdown.maxHours).toBe(4)
      expect(task1Breakdown.subtotalMinHours).toBe(4)
      expect(task1Breakdown.subtotalMaxHours).toBe(8)

      const task2Breakdown = result.taskBreakdown[1]
      expect(task2Breakdown.taskTypeId).toBe('tasktype-2')
      expect(task2Breakdown.taskTypeName).toBe('Backend API')
      expect(task2Breakdown.quantity).toBe(1)
      expect(task2Breakdown.minHours).toBe(8) // Using custom hours
      expect(task2Breakdown.maxHours).toBe(12) // Using custom hours
      expect(task2Breakdown.subtotalMinHours).toBe(8)
      expect(task2Breakdown.subtotalMaxHours).toBe(12)

      // Verify database update was called
      expect(mockDb.project.update).toHaveBeenCalledWith({
        where: { id: projectId },
        data: {
          totalMinHours: 12,
          totalMaxHours: 20,
        },
      })
    })

    it('should handle empty project tasks', async () => {
      const emptyProject = {
        ...mockProject,
        tasks: [],
      }

      mockDb.project.findUnique.mockResolvedValue(emptyProject)
      mockDb.project.update.mockResolvedValue(emptyProject)

      const result = await estimationEngine.calculateProjectEstimate(projectId)

      expect(result.totalMinHours).toBe(0)
      expect(result.totalMaxHours).toBe(0)
      expect(result.taskBreakdown).toHaveLength(0)
    })

    it('should handle decimal hours correctly', async () => {
      const decimalProject = {
        ...mockProject,
        tasks: [
          {
            id: 'task-1',
            projectId,
            taskTypeId: 'tasktype-1',
            quantity: 3,
            customMinHours: 1.5,
            customMaxHours: 2.25,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
            taskType: {
              id: 'tasktype-1',
              name: 'Small Task',
              description: 'A small task',
              defaultMinHours: 1,
              defaultMaxHours: 2,
              category: 'Testing',
              isActive: true,
              createdAt: new Date('2024-01-01'),
              updatedAt: new Date('2024-01-01'),
            },
          },
        ],
      }

      mockDb.project.findUnique.mockResolvedValue(decimalProject)
      mockDb.project.update.mockResolvedValue(decimalProject)

      const result = await estimationEngine.calculateProjectEstimate(projectId)

      expect(result.totalMinHours).toBe(4.5) // 3 * 1.5 = 4.5
      expect(result.totalMaxHours).toBe(6.75) // 3 * 2.25 = 6.75
    })

    it('should handle large quantities correctly', async () => {
      const largeQuantityProject = {
        ...mockProject,
        tasks: [
          {
            id: 'task-1',
            projectId,
            taskTypeId: 'tasktype-1',
            quantity: 100,
            customMinHours: null,
            customMaxHours: null,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
            taskType: {
              id: 'tasktype-1',
              name: 'Bulk Task',
              description: 'A bulk task',
              defaultMinHours: 0.5,
              defaultMaxHours: 1,
              category: 'Bulk',
              isActive: true,
              createdAt: new Date('2024-01-01'),
              updatedAt: new Date('2024-01-01'),
            },
          },
        ],
      }

      mockDb.project.findUnique.mockResolvedValue(largeQuantityProject)
      mockDb.project.update.mockResolvedValue(largeQuantityProject)

      const result = await estimationEngine.calculateProjectEstimate(projectId)

      expect(result.totalMinHours).toBe(50) // 100 * 0.5 = 50
      expect(result.totalMaxHours).toBe(100) // 100 * 1 = 100
    })

    it('should throw error when project not found', async () => {
      mockDb.project.findUnique.mockResolvedValue(null)

      await expect(
        estimationEngine.calculateProjectEstimate('non-existent')
      ).rejects.toThrow('Project not found: non-existent')

      expect(mockDb.project.update).not.toHaveBeenCalled()
    })

    it('should handle mixed custom and default hours', async () => {
      const mixedProject = {
        ...mockProject,
        tasks: [
          {
            id: 'task-1',
            projectId,
            taskTypeId: 'tasktype-1',
            quantity: 1,
            customMinHours: null, // Use default
            customMaxHours: 6, // Custom max only
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
            taskType: {
              id: 'tasktype-1',
              name: 'Mixed Task',
              description: 'A task with mixed custom/default hours',
              defaultMinHours: 2,
              defaultMaxHours: 4,
              category: 'Mixed',
              isActive: true,
              createdAt: new Date('2024-01-01'),
              updatedAt: new Date('2024-01-01'),
            },
          },
        ],
      }

      mockDb.project.findUnique.mockResolvedValue(mixedProject)
      mockDb.project.update.mockResolvedValue(mixedProject)

      const result = await estimationEngine.calculateProjectEstimate(projectId)

      expect(result.taskBreakdown[0].minHours).toBe(2) // Default
      expect(result.taskBreakdown[0].maxHours).toBe(6) // Custom
      expect(result.totalMinHours).toBe(2)
      expect(result.totalMaxHours).toBe(6)
    })
  })

  describe('recalculateProjectTotals', () => {
    it('should call calculateProjectEstimate', async () => {
      const projectId = 'project-1'
      const spy = jest
        .spyOn(estimationEngine, 'calculateProjectEstimate')
        .mockResolvedValue({} as any)

      await estimationEngine.recalculateProjectTotals(projectId)

      expect(spy).toHaveBeenCalledWith(projectId)
    })
  })
})