import { TaskConfiguration } from '@/lib/task-config'
import { db } from '@/lib/db'
import type { TaskType } from '@prisma/client'

// Mock the database
jest.mock('@/lib/db', () => ({
  db: {
    taskType: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    projectTask: {
      findMany: jest.fn(),
    },
  },
}))

const mockDb = db as jest.Mocked<typeof db>

describe('TaskConfiguration', () => {
  let taskConfig: TaskConfiguration

  beforeEach(() => {
    taskConfig = new TaskConfiguration()
    jest.clearAllMocks()
  })

  const mockTaskType: TaskType = {
    id: 'task-1',
    name: 'Frontend Component',
    description: 'A basic frontend component',
    defaultMinHours: 2,
    defaultMaxHours: 4,
    category: 'Frontend',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  }

  describe('listTaskTypes', () => {
    it('should list all task types without filters', async () => {
      mockDb.taskType.findMany.mockResolvedValue([mockTaskType])

      const result = await taskConfig.listTaskTypes()

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(mockTaskType)
      expect(mockDb.taskType.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      })
    })

    it('should filter by category', async () => {
      mockDb.taskType.findMany.mockResolvedValue([mockTaskType])

      await taskConfig.listTaskTypes({ category: 'Frontend' })

      expect(mockDb.taskType.findMany).toHaveBeenCalledWith({
        where: { category: 'Frontend' },
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      })
    })

    it('should filter by active status', async () => {
      mockDb.taskType.findMany.mockResolvedValue([mockTaskType])

      await taskConfig.listTaskTypes({ active: true })

      expect(mockDb.taskType.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      })
    })

    it('should filter by both category and active status', async () => {
      mockDb.taskType.findMany.mockResolvedValue([mockTaskType])

      await taskConfig.listTaskTypes({
        category: 'Frontend',
        active: false,
      })

      expect(mockDb.taskType.findMany).toHaveBeenCalledWith({
        where: { category: 'Frontend', isActive: false },
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      })
    })
  })

  describe('getTaskType', () => {
    it('should get task type by id', async () => {
      mockDb.taskType.findUnique.mockResolvedValue(mockTaskType)

      const result = await taskConfig.getTaskType('task-1')

      expect(result).toEqual(mockTaskType)
      expect(mockDb.taskType.findUnique).toHaveBeenCalledWith({
        where: { id: 'task-1' },
      })
    })

    it('should return null when task type not found', async () => {
      mockDb.taskType.findUnique.mockResolvedValue(null)

      const result = await taskConfig.getTaskType('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('getTaskTypeByName', () => {
    it('should get task type by name', async () => {
      mockDb.taskType.findUnique.mockResolvedValue(mockTaskType)

      const result = await taskConfig.getTaskTypeByName('Frontend Component')

      expect(result).toEqual(mockTaskType)
      expect(mockDb.taskType.findUnique).toHaveBeenCalledWith({
        where: { name: 'Frontend Component' },
      })
    })

    it('should return null when task type not found by name', async () => {
      mockDb.taskType.findUnique.mockResolvedValue(null)

      const result = await taskConfig.getTaskTypeByName('Non-existent')

      expect(result).toBeNull()
    })
  })

  describe('createTaskType', () => {
    const validInput = {
      name: 'New Task Type',
      description: 'A new task type',
      defaultMinHours: 1,
      defaultMaxHours: 3,
      category: 'Testing',
      isActive: true,
    }

    it('should create task type with valid input', async () => {
      mockDb.taskType.create.mockResolvedValue(mockTaskType)

      const result = await taskConfig.createTaskType(validInput)

      expect(result).toEqual(mockTaskType)
      expect(mockDb.taskType.create).toHaveBeenCalledWith({
        data: {
          name: validInput.name,
          description: validInput.description,
          defaultMinHours: validInput.defaultMinHours,
          defaultMaxHours: validInput.defaultMaxHours,
          category: validInput.category,
          isActive: validInput.isActive,
        },
      })
    })

    it('should create task type with default values', async () => {
      const minimalInput = {
        name: 'Minimal Task',
        defaultMinHours: 1,
        defaultMaxHours: 2,
      }

      mockDb.taskType.create.mockResolvedValue(mockTaskType)

      await taskConfig.createTaskType(minimalInput)

      expect(mockDb.taskType.create).toHaveBeenCalledWith({
        data: {
          name: minimalInput.name,
          description: null,
          defaultMinHours: minimalInput.defaultMinHours,
          defaultMaxHours: minimalInput.defaultMaxHours,
          category: null,
          isActive: true,
        },
      })
    })

    it('should throw error when max hours less than min hours', async () => {
      const invalidInput = {
        ...validInput,
        defaultMinHours: 5,
        defaultMaxHours: 3, // Less than min
      }

      await expect(taskConfig.createTaskType(invalidInput)).rejects.toThrow(
        'Maximum hours must be greater than or equal to minimum hours'
      )

      expect(mockDb.taskType.create).not.toHaveBeenCalled()
    })

    it('should throw error when min hours is zero or negative', async () => {
      const invalidInput = {
        ...validInput,
        defaultMinHours: 0,
      }

      await expect(taskConfig.createTaskType(invalidInput)).rejects.toThrow(
        'Minimum hours must be greater than 0'
      )

      expect(mockDb.taskType.create).not.toHaveBeenCalled()
    })

    it('should throw error when max hours exceeds 1000', async () => {
      const invalidInput = {
        ...validInput,
        defaultMinHours: 999,
        defaultMaxHours: 1001, // Exceeds limit
      }

      await expect(taskConfig.createTaskType(invalidInput)).rejects.toThrow(
        'Maximum hours cannot exceed 1000'
      )

      expect(mockDb.taskType.create).not.toHaveBeenCalled()
    })
  })

  describe('updateTaskType', () => {
    const updateInput = {
      name: 'Updated Task Type',
      defaultMinHours: 3,
      defaultMaxHours: 6,
    }

    it('should update task type with valid input', async () => {
      mockDb.taskType.findUnique.mockResolvedValue(mockTaskType)
      mockDb.taskType.update.mockResolvedValue({
        ...mockTaskType,
        ...updateInput,
      })

      const result = await taskConfig.updateTaskType('task-1', updateInput)

      expect(result.name).toBe(updateInput.name)
      expect(mockDb.taskType.update).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        data: updateInput,
      })
    })

    it('should throw error when task type not found', async () => {
      mockDb.taskType.findUnique.mockResolvedValue(null)

      await expect(
        taskConfig.updateTaskType('non-existent', updateInput)
      ).rejects.toThrow('Task type not found: non-existent')

      expect(mockDb.taskType.update).not.toHaveBeenCalled()
    })

    it('should validate hours when updating', async () => {
      mockDb.taskType.findUnique.mockResolvedValue(mockTaskType)

      const invalidUpdate = {
        defaultMinHours: 10,
        defaultMaxHours: 5, // Less than min
      }

      await expect(
        taskConfig.updateTaskType('task-1', invalidUpdate)
      ).rejects.toThrow(
        'Maximum hours must be greater than or equal to minimum hours'
      )

      expect(mockDb.taskType.update).not.toHaveBeenCalled()
    })

    it('should validate partial updates correctly', async () => {
      const existingTaskType = {
        ...mockTaskType,
        defaultMinHours: 2,
        defaultMaxHours: 4,
      }
      mockDb.taskType.findUnique.mockResolvedValue(existingTaskType)

      // Update only max hours to be less than existing min hours
      const partialUpdate = {
        defaultMaxHours: 1, // Less than existing min of 2
      }

      await expect(
        taskConfig.updateTaskType('task-1', partialUpdate)
      ).rejects.toThrow(
        'Maximum hours must be greater than or equal to minimum hours'
      )

      expect(mockDb.taskType.update).not.toHaveBeenCalled()
    })

    it('should validate zero/negative hours on update', async () => {
      mockDb.taskType.findUnique.mockResolvedValue(mockTaskType)

      const invalidUpdate = {
        defaultMinHours: -1,
      }

      await expect(
        taskConfig.updateTaskType('task-1', invalidUpdate)
      ).rejects.toThrow('Minimum hours must be greater than 0')
    })

    it('should validate max hours limit on update', async () => {
      mockDb.taskType.findUnique.mockResolvedValue(mockTaskType)

      const invalidUpdate = {
        defaultMaxHours: 1001,
      }

      await expect(
        taskConfig.updateTaskType('task-1', invalidUpdate)
      ).rejects.toThrow('Maximum hours cannot exceed 1000')
    })
  })

  describe('deleteTaskType', () => {
    it('should delete task type when not referenced', async () => {
      mockDb.projectTask.findMany.mockResolvedValue([])
      mockDb.taskType.delete.mockResolvedValue(mockTaskType)

      await taskConfig.deleteTaskType('task-1')

      expect(mockDb.projectTask.findMany).toHaveBeenCalledWith({
        where: { taskTypeId: 'task-1' },
        take: 1,
      })
      expect(mockDb.taskType.delete).toHaveBeenCalledWith({
        where: { id: 'task-1' },
      })
    })

    it('should throw error when task type is referenced', async () => {
      const referencedTask = {
        id: 'project-task-1',
        projectId: 'project-1',
        taskTypeId: 'task-1',
        quantity: 1,
        customMinHours: null,
        customMaxHours: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockDb.projectTask.findMany.mockResolvedValue([referencedTask])

      await expect(taskConfig.deleteTaskType('task-1')).rejects.toThrow(
        'Cannot delete task type that is referenced by project tasks'
      )

      expect(mockDb.taskType.delete).not.toHaveBeenCalled()
    })
  })

  describe('getTaskTypeCategories', () => {
    it('should return unique categories from active task types', async () => {
      const categorizedTaskTypes = [
        { category: 'Backend' },
        { category: 'Frontend' },
        { category: 'Testing' },
      ]

      mockDb.taskType.findMany.mockResolvedValue(categorizedTaskTypes)

      const result = await taskConfig.getTaskTypeCategories()

      expect(result).toEqual(['Backend', 'Frontend', 'Testing'])
      expect(mockDb.taskType.findMany).toHaveBeenCalledWith({
        where: {
          category: { not: null },
          isActive: true,
        },
        select: { category: true },
        distinct: ['category'],
        orderBy: { category: 'asc' },
      })
    })

    it('should handle empty categories result', async () => {
      mockDb.taskType.findMany.mockResolvedValue([])

      const result = await taskConfig.getTaskTypeCategories()

      expect(result).toEqual([])
    })

    it('should filter out null categories', async () => {
      const mixedCategories = [
        { category: 'Backend' },
        { category: 'Frontend' },
      ]

      mockDb.taskType.findMany.mockResolvedValue(mixedCategories)

      const result = await taskConfig.getTaskTypeCategories()

      expect(result).toEqual(['Backend', 'Frontend'])
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle decimal hours correctly', async () => {
      const decimalInput = {
        name: 'Decimal Task',
        defaultMinHours: 1.5,
        defaultMaxHours: 2.75,
      }

      mockDb.taskType.create.mockResolvedValue(mockTaskType)

      await taskConfig.createTaskType(decimalInput)

      expect(mockDb.taskType.create).toHaveBeenCalledWith({
        data: {
          name: decimalInput.name,
          description: null,
          defaultMinHours: 1.5,
          defaultMaxHours: 2.75,
          category: null,
          isActive: true,
        },
      })
    })

    it('should handle equal min and max hours', async () => {
      const equalHoursInput = {
        name: 'Fixed Duration Task',
        defaultMinHours: 5,
        defaultMaxHours: 5,
      }

      mockDb.taskType.create.mockResolvedValue(mockTaskType)

      await taskConfig.createTaskType(equalHoursInput)

      expect(mockDb.taskType.create).toHaveBeenCalledWith({
        data: {
          name: equalHoursInput.name,
          description: null,
          defaultMinHours: 5,
          defaultMaxHours: 5,
          category: null,
          isActive: true,
        },
      })
    })

    it('should handle boundary values correctly', async () => {
      const boundaryInput = {
        name: 'Boundary Task',
        defaultMinHours: 0.1, // Just above zero
        defaultMaxHours: 1000, // At the limit
      }

      mockDb.taskType.create.mockResolvedValue(mockTaskType)

      await taskConfig.createTaskType(boundaryInput)

      expect(mockDb.taskType.create).toHaveBeenCalledWith({
        data: {
          name: boundaryInput.name,
          description: null,
          defaultMinHours: 0.1,
          defaultMaxHours: 1000,
          category: null,
          isActive: true,
        },
      })
    })
  })
})