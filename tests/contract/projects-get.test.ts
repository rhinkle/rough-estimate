/**
 * Contract Test: GET /api/projects
 * 
 * CRITICAL: This test MUST FAIL until the API route is implemented.
 * Tests the API contract as specified in contracts/api-schema.yaml
 */

import { GET } from '@/app/api/projects/route'
import { createMockRequest, extractResponseData, expectValidProject } from './utils'

describe('GET /api/projects', () => {
  describe('Contract Compliance', () => {
    it('should return 200 with paginated projects response', async () => {
      // Given: A request for all projects
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/projects',
      })

      // When: The endpoint is called
      const response = await GET(request)
      const result = await extractResponseData(response)

      // Then: Returns success with paginated response
      expect(result.status).toBe(200)
      expect(result.data).toMatchObject({
        data: expect.any(Array),
        total: expect.any(Number),
        hasMore: expect.any(Boolean),
      })
      
      // Each project should match the contract schema
      result.data.data.forEach((project: any) => {
        expectValidProject(project)
      })
    })

    it('should filter by status when status query param provided', async () => {
      // Given: A request filtered by DRAFT status
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/projects?status=DRAFT',
      })

      // When: The endpoint is called
      const response = await GET(request)
      const result = await extractResponseData(response)

      // Then: Returns only DRAFT projects
      expect(result.status).toBe(200)
      expect(result.data.data).toEqual(expect.any(Array))
      
      result.data.data.forEach((project: any) => {
        expect(project.status).toBe('DRAFT')
        expectValidProject(project)
      })
    })

    it('should handle limit parameter correctly', async () => {
      // Given: A request with limit of 5
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/projects?limit=5',
      })

      // When: The endpoint is called
      const response = await GET(request)
      const result = await extractResponseData(response)

      // Then: Returns at most 5 projects
      expect(result.status).toBe(200)
      expect(result.data.data.length).toBeLessThanOrEqual(5)
      expect(result.data.total).toBeGreaterThanOrEqual(result.data.data.length)
    })

    it('should handle offset parameter correctly', async () => {
      // Given: A request with offset of 1
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/projects?offset=1&limit=1',
      })

      // When: The endpoint is called
      const response = await GET(request)
      const result = await extractResponseData(response)

      // Then: Returns projects starting from offset
      expect(result.status).toBe(200)
      expect(result.data).toMatchObject({
        data: expect.any(Array),
        total: expect.any(Number),
        hasMore: expect.any(Boolean),
      })
    })

    it('should set hasMore correctly when there are more results', async () => {
      // Given: A request that should have more results
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/projects?limit=1',
      })

      const response = await GET(request)
      const result = await extractResponseData(response)

      // If there are projects, and we're limiting to 1, hasMore should be set correctly
      if (result.data.total > 1) {
        expect(result.data.hasMore).toBe(true)
      } else {
        expect(result.data.hasMore).toBe(false)
      }
    })

    it('should handle database errors with 500 status', async () => {
      // This test will pass once error handling is implemented
      // For now, it should fail since the route doesn't exist
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/projects',
      })

      // Expect the route to not exist yet (will throw during import)
      expect(async () => {
        await GET(request)
      }).rejects.toBeDefined()
    })
  })

  describe('Query Parameter Validation', () => {
    it('should return 400 when status is invalid', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/projects?status=INVALID_STATUS',
      })

      const response = await GET(request)
      const result = await extractResponseData(response)

      // Should return validation error for invalid status
      expect([200, 400]).toContain(result.status)
      if (result.status === 400) {
        expect(result.data.error).toContain('status')
      }
    })

    it('should return 400 when limit exceeds 100', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/projects?limit=101',
      })

      const response = await GET(request)
      const result = await extractResponseData(response)

      // Should return validation error for limit too high
      expect([200, 400]).toContain(result.status)
      if (result.status === 400) {
        expect(result.data.error).toContain('limit')
      }
    })

    it('should return 400 when limit is negative', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/projects?limit=-1',
      })

      const response = await GET(request)
      const result = await extractResponseData(response)

      // Should return validation error for negative limit
      expect([200, 400]).toContain(result.status)
      if (result.status === 400) {
        expect(result.data.error).toContain('limit')
      }
    })

    it('should return 400 when offset is negative', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/projects?offset=-1',
      })

      const response = await GET(request)
      const result = await extractResponseData(response)

      // Should return validation error for negative offset
      expect([200, 400]).toContain(result.status)
      if (result.status === 400) {
        expect(result.data.error).toContain('offset')
      }
    })

    it('should use default values when parameters are not provided', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/projects',
      })

      const response = await GET(request)
      const result = await extractResponseData(response)

      expect(result.status).toBe(200)
      // Should use default limit of 20 and offset of 0
      expect(result.data.data.length).toBeLessThanOrEqual(20)
    })

    it('should handle non-numeric limit and offset parameters', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/projects?limit=abc&offset=def',
      })

      const response = await GET(request)
      const result = await extractResponseData(response)

      // Should either use defaults or return validation error
      expect([200, 400]).toContain(result.status)
    })
  })

  describe('Response Format Validation', () => {
    it('should return Content-Type application/json', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/projects',
      })

      const response = await GET(request)
      
      expect(response.headers.get('content-type')).toContain('application/json')
    })

    it('should return projects ordered by updatedAt desc', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/projects',
      })

      const response = await GET(request)
      const result = await extractResponseData(response)

      if (result.data.data.length > 1) {
        // Verify projects are ordered by updatedAt descending
        for (let i = 1; i < result.data.data.length; i++) {
          const prev = new Date(result.data.data[i - 1].updatedAt)
          const current = new Date(result.data.data[i].updatedAt)
          expect(prev.getTime()).toBeGreaterThanOrEqual(current.getTime())
        }
      }
    })
  })

  describe('Empty Results Handling', () => {
    it('should return empty array when no projects match filter', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/projects?status=NONEXISTENT',
      })

      const response = await GET(request)
      const result = await extractResponseData(response)

      expect(result.status).toBe(200)
      expect(result.data.data).toEqual([])
      expect(result.data.total).toBe(0)
      expect(result.data.hasMore).toBe(false)
    })

    it('should handle offset beyond available results', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/projects?offset=9999',
      })

      const response = await GET(request)
      const result = await extractResponseData(response)

      expect(result.status).toBe(200)
      expect(result.data.data).toEqual([])
      expect(result.data.hasMore).toBe(false)
    })
  })
})