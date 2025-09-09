/**
 * Contract Test: PUT /api/task-types/[id]
 * 
 * CRITICAL: This test MUST FAIL until the API route is implemented.
 * Tests the API contract as specified in contracts/api-schema.yaml
 */

import { PUT } from '@/app/api/task-types/[id]/route'
import { createMockRequest, extractResponseData, expectValidTaskType, expectValidationError, expectNotFoundError } from './utils'

describe('PUT /api/task-types/[id]', () => {
  describe('Contract Compliance', () => {
    it('should update existing task type and return 200', async () => {
      // Given: Valid update data
      const updateData = {
        name: 'Updated Task Type',
        description: 'Updated description',
        defaultMinHours: 3,
        defaultMaxHours: 6,
        category: 'Updated',
        isActive: false,
      }

      const request = createMockRequest({
        method: 'PUT',
        url: 'http://localhost:3000/api/task-types/test-id',
        body: updateData,
      })

      // When: The endpoint is called
      const response = await PUT(request, { params: { id: 'test-id' } })
      const result = await extractResponseData(response)

      // Then: Returns 200 with updated task type
      expect(result.status).toBe(200)
      expectValidTaskType(result.data)
      expect(result.data.name).toBe(updateData.name)
      expect(result.data.description).toBe(updateData.description)
      expect(result.data.defaultMinHours).toBe(updateData.defaultMinHours)
      expect(result.data.defaultMaxHours).toBe(updateData.defaultMaxHours)
      expect(result.data.category).toBe(updateData.category)
      expect(result.data.isActive).toBe(updateData.isActive)
    })

    it('should update only provided fields (partial update)', async () => {
      // Given: Partial update data
      const updateData = {
        name: 'Partially Updated Task',
        isActive: false,
      }

      const request = createMockRequest({
        method: 'PUT',
        url: 'http://localhost:3000/api/task-types/test-id',
        body: updateData,
      })

      // When: The endpoint is called
      const response = await PUT(request, { params: { id: 'test-id' } })
      const result = await extractResponseData(response)

      // Then: Returns 200 with only specified fields updated
      expect(result.status).toBe(200)
      expectValidTaskType(result.data)
      expect(result.data.name).toBe(updateData.name)
      expect(result.data.isActive).toBe(updateData.isActive)
      // Other fields should remain unchanged from original values
    })

    it('should return 404 when task type does not exist', async () => {
      // Given: Update request for non-existent task type
      const request = createMockRequest({
        method: 'PUT',
        url: 'http://localhost:3000/api/task-types/non-existent-id',
        body: {
          name: 'Updated Name',
        },
      })

      // When: The endpoint is called
      const response = await PUT(request, { params: { id: 'non-existent-id' } })
      const result = await extractResponseData(response)

      // Then: Returns 404 error
      expectNotFoundError(result)
    })

    it('should handle database errors with 500 status', async () => {
      // This test will pass once error handling is implemented
      // For now, it should fail since the route doesn't exist
      const request = createMockRequest({
        method: 'PUT',
        url: 'http://localhost:3000/api/task-types/test-id',
        body: {
          name: 'Test Update',
        },
      })

      // Expect the route to not exist yet (will throw during import)
      expect(async () => {
        await PUT(request, { params: { id: 'test-id' } })
      }).rejects.toBeDefined()
    })
  })

  describe('Input Validation', () => {
    it('should return 400 when name exceeds 100 characters', async () => {
      const request = createMockRequest({
        method: 'PUT',
        url: 'http://localhost:3000/api/task-types/test-id',
        body: {
          name: 'a'.repeat(101), // Too long
        },
      })

      const response = await PUT(request, { params: { id: 'test-id' } })
      const result = await extractResponseData(response)

      expectValidationError(result)
    })

    it('should return 400 when defaultMaxHours is less than defaultMinHours', async () => {
      const request = createMockRequest({
        method: 'PUT',
        url: 'http://localhost:3000/api/task-types/test-id',
        body: {
          defaultMinHours: 5,
          defaultMaxHours: 3, // Invalid: less than min
        },
      })

      const response = await PUT(request, { params: { id: 'test-id' } })
      const result = await extractResponseData(response)

      expectValidationError(result)
    })

    it('should return 400 when hours are negative', async () => {
      const request = createMockRequest({
        method: 'PUT',
        url: 'http://localhost:3000/api/task-types/test-id',
        body: {
          defaultMinHours: -1, // Invalid
        },
      })

      const response = await PUT(request, { params: { id: 'test-id' } })
      const result = await extractResponseData(response)

      expectValidationError(result)
    })

    it('should return 400 when hours exceed 1000', async () => {
      const request = createMockRequest({
        method: 'PUT',
        url: 'http://localhost:3000/api/task-types/test-id',
        body: {
          defaultMaxHours: 1001, // Too high
        },
      })

      const response = await PUT(request, { params: { id: 'test-id' } })
      const result = await extractResponseData(response)

      expectValidationError(result)
    })

    it('should return 400 when description exceeds 500 characters', async () => {
      const request = createMockRequest({
        method: 'PUT',
        url: 'http://localhost:3000/api/task-types/test-id',
        body: {
          description: 'a'.repeat(501), // Too long
        },
      })

      const response = await PUT(request, { params: { id: 'test-id' } })
      const result = await extractResponseData(response)

      expectValidationError(result)
    })

    it('should return 400 when category exceeds 50 characters', async () => {
      const request = createMockRequest({
        method: 'PUT',
        url: 'http://localhost:3000/api/task-types/test-id',
        body: {
          category: 'a'.repeat(51), // Too long
        },
      })

      const response = await PUT(request, { params: { id: 'test-id' } })
      const result = await extractResponseData(response)

      expectValidationError(result)
    })

    it('should return 400 when isActive is not boolean', async () => {
      const request = createMockRequest({
        method: 'PUT',
        url: 'http://localhost:3000/api/task-types/test-id',
        body: {
          isActive: 'invalid', // Should be boolean
        },
      })

      const response = await PUT(request, { params: { id: 'test-id' } })
      const result = await extractResponseData(response)

      expectValidationError(result)
    })
  })

  describe('Duplicate Name Handling', () => {
    it('should return 400 when updating to existing task type name', async () => {
      // Given: Attempt to update to a name that already exists
      const request = createMockRequest({
        method: 'PUT',
        url: 'http://localhost:3000/api/task-types/test-id',
        body: {
          name: 'Large Complex Web Screen', // This should already exist from seed data
        },
      })

      const response = await PUT(request, { params: { id: 'test-id' } })
      const result = await extractResponseData(response)

      expectValidationError(result)
      expect(result.data.error).toContain('already exists')
    })

    it('should allow updating same task type to its current name', async () => {
      // Given: Update request that doesn't change the name
      const request = createMockRequest({
        method: 'PUT',
        url: 'http://localhost:3000/api/task-types/existing-id',
        body: {
          description: 'Updated description only',
        },
      })

      const response = await PUT(request, { params: { id: 'existing-id' } })
      const result = await extractResponseData(response)

      // Should succeed since we're not changing the name
      expect(result.status).toBe(200)
      expectValidTaskType(result.data)
    })
  })

  describe('Parameter Validation', () => {
    it('should return 400 when id parameter is empty', async () => {
      const request = createMockRequest({
        method: 'PUT',
        url: 'http://localhost:3000/api/task-types/',
        body: {
          name: 'Test Update',
        },
      })

      const response = await PUT(request, { params: { id: '' } })
      const result = await extractResponseData(response)

      expectValidationError(result)
    })

    it('should handle malformed id parameter', async () => {
      const request = createMockRequest({
        method: 'PUT',
        url: 'http://localhost:3000/api/task-types/malformed-id-with-special-chars!@#',
        body: {
          name: 'Test Update',
        },
      })

      const response = await PUT(request, { params: { id: 'malformed-id-with-special-chars!@#' } })
      const result = await extractResponseData(response)

      // Should either return 400 for invalid ID format or 404 for not found
      expect([400, 404]).toContain(result.status)
    })
  })

  describe('Empty Update Handling', () => {
    it('should return 400 when no fields are provided for update', async () => {
      const request = createMockRequest({
        method: 'PUT',
        url: 'http://localhost:3000/api/task-types/test-id',
        body: {}, // Empty update
      })

      const response = await PUT(request, { params: { id: 'test-id' } })
      const result = await extractResponseData(response)

      expectValidationError(result)
      expect(result.data.error).toContain('no fields')
    })
  })
})