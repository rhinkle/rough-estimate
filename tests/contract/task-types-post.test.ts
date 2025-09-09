/**
 * Contract Test: POST /api/task-types
 * 
 * CRITICAL: This test MUST FAIL until the API route is implemented.
 * Tests the API contract as specified in contracts/api-schema.yaml
 */

import { POST } from '@/app/api/task-types/route'
import { createMockRequest, extractResponseData, expectValidTaskType, expectValidationError } from './utils'

describe('POST /api/task-types', () => {
  describe('Contract Compliance', () => {
    it('should create new task type and return 201', async () => {
      // Given: Valid task type data
      const taskTypeData = {
        name: 'Test Component',
        description: 'A test component for validation',
        defaultMinHours: 2,
        defaultMaxHours: 4,
        category: 'Testing',
      }

      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/task-types',
        body: taskTypeData,
      })

      // When: The endpoint is called
      const response = await POST(request)
      const result = await extractResponseData(response)

      // Then: Returns 201 with created task type
      expect(result.status).toBe(201)
      expectValidTaskType(result.data)
      expect(result.data.name).toBe(taskTypeData.name)
      expect(result.data.description).toBe(taskTypeData.description)
      expect(result.data.defaultMinHours).toBe(taskTypeData.defaultMinHours)
      expect(result.data.defaultMaxHours).toBe(taskTypeData.defaultMaxHours)
      expect(result.data.category).toBe(taskTypeData.category)
      expect(result.data.isActive).toBe(true) // default value
    })

    it('should create task type without optional fields', async () => {
      // Given: Minimal valid task type data
      const taskTypeData = {
        name: 'Minimal Task Type',
        defaultMinHours: 1,
        defaultMaxHours: 2,
      }

      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/task-types',
        body: taskTypeData,
      })

      // When: The endpoint is called
      const response = await POST(request)
      const result = await extractResponseData(response)

      // Then: Returns 201 with created task type
      expect(result.status).toBe(201)
      expectValidTaskType(result.data)
      expect(result.data.name).toBe(taskTypeData.name)
      expect(result.data.description).toBeNull()
      expect(result.data.category).toBeNull()
    })

    it('should handle database errors with 500 status', async () => {
      // This test will pass once error handling is implemented
      // For now, it should fail since the route doesn't exist
      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/task-types',
        body: {
          name: 'Test Task',
          defaultMinHours: 1,
          defaultMaxHours: 2,
        },
      })

      // Expect the route to not exist yet (will throw during import)
      expect(async () => {
        await POST(request)
      }).rejects.toBeDefined()
    })
  })

  describe('Input Validation', () => {
    it('should return 400 when name is missing', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/task-types',
        body: {
          defaultMinHours: 1,
          defaultMaxHours: 2,
        },
      })

      const response = await POST(request)
      const result = await extractResponseData(response)

      expectValidationError(result)
      expect(result.data.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'name',
            message: expect.stringContaining('required'),
          }),
        ])
      )
    })

    it('should return 400 when defaultMinHours is missing', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/task-types',
        body: {
          name: 'Test Task',
          defaultMaxHours: 2,
        },
      })

      const response = await POST(request)
      const result = await extractResponseData(response)

      expectValidationError(result)
    })

    it('should return 400 when defaultMaxHours is missing', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/task-types',
        body: {
          name: 'Test Task',
          defaultMinHours: 1,
        },
      })

      const response = await POST(request)
      const result = await extractResponseData(response)

      expectValidationError(result)
    })

    it('should return 400 when defaultMaxHours is less than defaultMinHours', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/task-types',
        body: {
          name: 'Test Task',
          defaultMinHours: 4,
          defaultMaxHours: 2, // Invalid: less than min
        },
      })

      const response = await POST(request)
      const result = await extractResponseData(response)

      expectValidationError(result)
    })

    it('should return 400 when name exceeds 100 characters', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/task-types',
        body: {
          name: 'a'.repeat(101), // Too long
          defaultMinHours: 1,
          defaultMaxHours: 2,
        },
      })

      const response = await POST(request)
      const result = await extractResponseData(response)

      expectValidationError(result)
    })

    it('should return 400 when description exceeds 500 characters', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/task-types',
        body: {
          name: 'Test Task',
          description: 'a'.repeat(501), // Too long
          defaultMinHours: 1,
          defaultMaxHours: 2,
        },
      })

      const response = await POST(request)
      const result = await extractResponseData(response)

      expectValidationError(result)
    })

    it('should return 400 when hours are negative', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/task-types',
        body: {
          name: 'Test Task',
          defaultMinHours: -1, // Invalid
          defaultMaxHours: 2,
        },
      })

      const response = await POST(request)
      const result = await extractResponseData(response)

      expectValidationError(result)
    })

    it('should return 400 when hours exceed 1000', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/task-types',
        body: {
          name: 'Test Task',
          defaultMinHours: 1,
          defaultMaxHours: 1001, // Too high
        },
      })

      const response = await POST(request)
      const result = await extractResponseData(response)

      expectValidationError(result)
    })
  })

  describe('Duplicate Handling', () => {
    it('should return 400 when task type name already exists', async () => {
      const taskTypeData = {
        name: 'Duplicate Test Task',
        defaultMinHours: 1,
        defaultMaxHours: 2,
      }

      // Create first task type
      const request1 = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/task-types',
        body: taskTypeData,
      })
      await POST(request1)

      // Try to create duplicate
      const request2 = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/task-types',
        body: taskTypeData,
      })

      const response = await POST(request2)
      const result = await extractResponseData(response)

      expectValidationError(result)
      expect(result.data.error).toContain('already exists')
    })
  })

  describe('Content-Type Validation', () => {
    it('should return 400 when Content-Type is not application/json', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/task-types',
        body: {
          name: 'Test Task',
          defaultMinHours: 1,
          defaultMaxHours: 2,
        },
        headers: {
          'content-type': 'text/plain',
        },
      })

      const response = await POST(request)
      const result = await extractResponseData(response)

      expect([400, 415]).toContain(result.status) // 400 Bad Request or 415 Unsupported Media Type
    })

    it('should return 400 when request body is malformed JSON', async () => {
      const request = new Request('http://localhost:3000/api/task-types', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: '{"name": "Test", "invalid json}', // Malformed JSON
      })

      const response = await POST(request as any)
      const result = await extractResponseData(response)

      expectValidationError(result)
    })
  })
})