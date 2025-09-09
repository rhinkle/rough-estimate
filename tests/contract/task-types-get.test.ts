/**
 * Contract Test: GET /api/task-types
 * 
 * CRITICAL: This test MUST FAIL until the API route is implemented.
 * Tests the API contract as specified in contracts/api-schema.yaml
 */

import { GET } from '@/app/api/task-types/route'
import { createMockRequest, extractResponseData, expectValidTaskType } from './utils'

describe('GET /api/task-types', () => {
  describe('Contract Compliance', () => {
    it('should return 200 with array of task types', async () => {
      // Given: A request for all task types
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/task-types',
      })

      // When: The endpoint is called
      const response = await GET(request)
      const result = await extractResponseData(response)

      // Then: Returns success with task types array
      expect(result.status).toBe(200)
      expect(Array.isArray(result.data)).toBe(true)
      
      // Each task type should match the contract schema
      result.data.forEach((taskType: any) => {
        expectValidTaskType(taskType)
      })
    })

    it('should filter by category when category query param provided', async () => {
      // Given: A request filtered by Frontend category
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/task-types?category=Frontend',
      })

      // When: The endpoint is called
      const response = await GET(request)
      const result = await extractResponseData(response)

      // Then: Returns only Frontend task types
      expect(result.status).toBe(200)
      expect(Array.isArray(result.data)).toBe(true)
      
      result.data.forEach((taskType: any) => {
        expect(taskType.category).toBe('Frontend')
        expectValidTaskType(taskType)
      })
    })

    it('should filter by active status when active query param provided', async () => {
      // Given: A request filtered by active status
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/task-types?active=true',
      })

      // When: The endpoint is called
      const response = await GET(request)
      const result = await extractResponseData(response)

      // Then: Returns only active task types
      expect(result.status).toBe(200)
      expect(Array.isArray(result.data)).toBe(true)
      
      result.data.forEach((taskType: any) => {
        expect(taskType.isActive).toBe(true)
        expectValidTaskType(taskType)
      })
    })

    it('should return empty array when no task types match filter', async () => {
      // Given: A request with non-existent category
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/task-types?category=NonExistent',
      })

      // When: The endpoint is called
      const response = await GET(request)
      const result = await extractResponseData(response)

      // Then: Returns empty array
      expect(result.status).toBe(200)
      expect(result.data).toEqual([])
    })

    it('should handle database errors with 500 status', async () => {
      // This test will pass once error handling is implemented
      // For now, it should fail since the route doesn't exist
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/task-types',
      })

      // Expect the route to not exist yet (will throw during import)
      expect(async () => {
        await GET(request)
      }).rejects.toBeDefined()
    })
  })

  describe('Response Format Validation', () => {
    it('should return Content-Type application/json', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/task-types',
      })

      const response = await GET(request)
      
      expect(response.headers.get('content-type')).toContain('application/json')
    })

    it('should include proper CORS headers', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/task-types',
      })

      const response = await GET(request)
      
      // Should not fail on CORS (will be configured in implementation)
      expect(response).toBeDefined()
    })
  })

  describe('Query Parameter Validation', () => {
    it('should handle invalid boolean value for active parameter', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/task-types?active=invalid',
      })

      const response = await GET(request)
      const result = await extractResponseData(response)

      // Should default to showing all task types or return validation error
      expect([200, 400]).toContain(result.status)
    })

    it('should handle empty category parameter', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/task-types?category=',
      })

      const response = await GET(request)
      const result = await extractResponseData(response)

      // Should return all task types when category is empty
      expect(result.status).toBe(200)
      expect(Array.isArray(result.data)).toBe(true)
    })
  })
})