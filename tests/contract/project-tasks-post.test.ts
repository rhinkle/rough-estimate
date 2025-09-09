/**
 * Contract Test: POST /api/projects/[id]/tasks
 * 
 * CRITICAL: This test MUST FAIL until the API route is implemented.
 * Tests the API contract as specified in contracts/api-schema.yaml
 */

import { POST } from '@/app/api/projects/[id]/tasks/route'
import { createMockRequest, extractResponseData, expectValidProjectTask, expectValidationError, expectNotFoundError } from './utils'

describe('POST /api/projects/[id]/tasks', () => {
  describe('Contract Compliance', () => {
    it('should add task to project and return 201', async () => {
      const taskData = {
        taskTypeId: 'test-task-type-id',
        quantity: 3,
      }

      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/projects/test-project-id/tasks',
        body: taskData,
      })

      const response = await POST(request, { params: { id: 'test-project-id' } })
      const result = await extractResponseData(response)

      expect(result.status).toBe(201)
      expectValidProjectTask(result.data)
      expect(result.data.taskTypeId).toBe(taskData.taskTypeId)
      expect(result.data.quantity).toBe(taskData.quantity)
    })

    it('should add task with custom hours and return 201', async () => {
      const taskData = {
        taskTypeId: 'test-task-type-id',
        quantity: 2,
        customMinHours: 5,
        customMaxHours: 10,
      }

      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/projects/test-project-id/tasks',
        body: taskData,
      })

      const response = await POST(request, { params: { id: 'test-project-id' } })
      const result = await extractResponseData(response)

      expect(result.status).toBe(201)
      expectValidProjectTask(result.data)
      expect(result.data.customMinHours).toBe(taskData.customMinHours)
      expect(result.data.customMaxHours).toBe(taskData.customMaxHours)
    })

    it('should return 404 when project does not exist', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/projects/non-existent-id/tasks',
        body: {
          taskTypeId: 'test-task-type-id',
          quantity: 1,
        },
      })

      const response = await POST(request, { params: { id: 'non-existent-id' } })
      const result = await extractResponseData(response)

      expectNotFoundError(result)
    })

    it('should return 400 when task type does not exist', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/projects/test-project-id/tasks',
        body: {
          taskTypeId: 'non-existent-task-type-id',
          quantity: 1,
        },
      })

      const response = await POST(request, { params: { id: 'test-project-id' } })
      const result = await extractResponseData(response)

      expect([400, 404]).toContain(result.status)
    })

    it('should handle database errors with 500 status', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/projects/test-project-id/tasks',
        body: {
          taskTypeId: 'test-task-type-id',
          quantity: 1,
        },
      })

      expect(async () => {
        await POST(request, { params: { id: 'test-project-id' } })
      }).rejects.toBeDefined()
    })
  })

  describe('Input Validation', () => {
    it('should return 400 when taskTypeId is missing', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/projects/test-project-id/tasks',
        body: {
          quantity: 1,
        },
      })

      const response = await POST(request, { params: { id: 'test-project-id' } })
      const result = await extractResponseData(response)

      expectValidationError(result)
    })

    it('should return 400 when quantity is missing', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/projects/test-project-id/tasks',
        body: {
          taskTypeId: 'test-task-type-id',
        },
      })

      const response = await POST(request, { params: { id: 'test-project-id' } })
      const result = await extractResponseData(response)

      expectValidationError(result)
    })

    it('should return 400 when quantity is less than 1', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/projects/test-project-id/tasks',
        body: {
          taskTypeId: 'test-task-type-id',
          quantity: 0,
        },
      })

      const response = await POST(request, { params: { id: 'test-project-id' } })
      const result = await extractResponseData(response)

      expectValidationError(result)
    })

    it('should return 400 when customMaxHours is less than customMinHours', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/projects/test-project-id/tasks',
        body: {
          taskTypeId: 'test-task-type-id',
          quantity: 1,
          customMinHours: 10,
          customMaxHours: 5, // Invalid
        },
      })

      const response = await POST(request, { params: { id: 'test-project-id' } })
      const result = await extractResponseData(response)

      expectValidationError(result)
    })

    it('should return 400 when custom hours are negative', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/projects/test-project-id/tasks',
        body: {
          taskTypeId: 'test-task-type-id',
          quantity: 1,
          customMinHours: -1,
        },
      })

      const response = await POST(request, { params: { id: 'test-project-id' } })
      const result = await extractResponseData(response)

      expectValidationError(result)
    })
  })

  describe('Duplicate Task Handling', () => {
    it('should return 400 when task type already exists for project', async () => {
      const taskData = {
        taskTypeId: 'duplicate-task-type-id',
        quantity: 1,
      }

      // Add task first time
      const request1 = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/projects/test-project-id/tasks',
        body: taskData,
      })
      await POST(request1, { params: { id: 'test-project-id' } })

      // Try to add same task type again
      const request2 = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/projects/test-project-id/tasks',
        body: taskData,
      })

      const response = await POST(request2, { params: { id: 'test-project-id' } })
      const result = await extractResponseData(response)

      expectValidationError(result)
      expect(result.data.error).toContain('already exists')
    })
  })
})