/**
 * Contract Test: GET /api/projects/[id]/estimate
 * 
 * CRITICAL: This test MUST FAIL until the API route is implemented.
 * Tests the API contract as specified in contracts/api-schema.yaml
 */

import { GET } from '@/app/api/projects/[id]/estimate/route'
import { createMockRequest, extractResponseData, expectValidEstimate, expectNotFoundError } from './utils'

describe('GET /api/projects/[id]/estimate', () => {
  describe('Contract Compliance', () => {
    it('should return 200 with calculated project estimate', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/projects/test-project-id/estimate',
      })

      const response = await GET(request, { params: { id: 'test-project-id' } })
      const result = await extractResponseData(response)

      expect(result.status).toBe(200)
      expectValidEstimate(result.data)
    })

    it('should include detailed task breakdown in estimate', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/projects/test-project-id/estimate',
      })

      const response = await GET(request, { params: { id: 'test-project-id' } })
      const result = await extractResponseData(response)

      expect(result.status).toBe(200)
      
      result.data.taskBreakdown.forEach((breakdown: any) => {
        expect(breakdown).toMatchObject({
          taskTypeId: expect.any(String),
          taskTypeName: expect.any(String),
          quantity: expect.any(Number),
          minHours: expect.any(Number),
          maxHours: expect.any(Number),
          subtotalMinHours: expect.any(Number),
          subtotalMaxHours: expect.any(Number),
        })
        
        // Verify calculations
        expect(breakdown.subtotalMinHours).toBe(breakdown.quantity * breakdown.minHours)
        expect(breakdown.subtotalMaxHours).toBe(breakdown.quantity * breakdown.maxHours)
      })
    })

    it('should return correct totals that sum task breakdowns', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/projects/test-project-id/estimate',
      })

      const response = await GET(request, { params: { id: 'test-project-id' } })
      const result = await extractResponseData(response)

      expect(result.status).toBe(200)
      
      // Calculate expected totals from breakdown
      const expectedMin = result.data.taskBreakdown.reduce((sum: number, task: any) => sum + task.subtotalMinHours, 0)
      const expectedMax = result.data.taskBreakdown.reduce((sum: number, task: any) => sum + task.subtotalMaxHours, 0)
      
      expect(result.data.totalMinHours).toBe(expectedMin)
      expect(result.data.totalMaxHours).toBe(expectedMax)
    })

    it('should handle project with custom task hours', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/projects/project-with-custom-hours/estimate',
      })

      const response = await GET(request, { params: { id: 'project-with-custom-hours' } })
      const result = await extractResponseData(response)

      expect(result.status).toBe(200)
      expectValidEstimate(result.data)
      
      // Should use custom hours when available, default hours otherwise
      result.data.taskBreakdown.forEach((breakdown: any) => {
        expect(breakdown.minHours).toBeGreaterThan(0)
        expect(breakdown.maxHours).toBeGreaterThanOrEqual(breakdown.minHours)
      })
    })

    it('should return empty estimate for project with no tasks', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/projects/empty-project/estimate',
      })

      const response = await GET(request, { params: { id: 'empty-project' } })
      const result = await extractResponseData(response)

      expect(result.status).toBe(200)
      expect(result.data.totalMinHours).toBe(0)
      expect(result.data.totalMaxHours).toBe(0)
      expect(result.data.taskBreakdown).toEqual([])
    })

    it('should return 404 when project does not exist', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/projects/non-existent-id/estimate',
      })

      const response = await GET(request, { params: { id: 'non-existent-id' } })
      const result = await extractResponseData(response)

      expectNotFoundError(result)
    })

    it('should handle database errors with 500 status', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/projects/test-project-id/estimate',
      })

      expect(async () => {
        await GET(request, { params: { id: 'test-project-id' } })
      }).rejects.toBeDefined()
    })
  })

  describe('Response Format', () => {
    it('should return Content-Type application/json', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/projects/test-project-id/estimate',
      })

      const response = await GET(request, { params: { id: 'test-project-id' } })
      
      expect(response.headers.get('content-type')).toContain('application/json')
    })

    it('should include calculatedAt timestamp', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/projects/test-project-id/estimate',
      })

      const response = await GET(request, { params: { id: 'test-project-id' } })
      const result = await extractResponseData(response)

      expect(result.status).toBe(200)
      
      // calculatedAt should be a valid ISO timestamp
      expect(() => new Date(result.data.calculatedAt)).not.toThrow()
      
      // Should be very recent (within last few seconds)
      const calculatedTime = new Date(result.data.calculatedAt).getTime()
      const now = Date.now()
      expect(Math.abs(now - calculatedTime)).toBeLessThan(5000) // Within 5 seconds
    })
  })

  describe('Calculation Accuracy', () => {
    it('should handle zero quantities correctly', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/projects/project-with-zero-quantity/estimate',
      })

      const response = await GET(request, { params: { id: 'project-with-zero-quantity' } })
      const result = await extractResponseData(response)

      if (result.status === 200) {
        result.data.taskBreakdown.forEach((breakdown: any) => {
          if (breakdown.quantity === 0) {
            expect(breakdown.subtotalMinHours).toBe(0)
            expect(breakdown.subtotalMaxHours).toBe(0)
          }
        })
      }
    })

    it('should handle large quantities without overflow', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/projects/project-with-large-quantities/estimate',
      })

      const response = await GET(request, { params: { id: 'project-with-large-quantities' } })
      const result = await extractResponseData(response)

      if (result.status === 200) {
        expect(result.data.totalMinHours).toBeFinite()
        expect(result.data.totalMaxHours).toBeFinite()
        expect(result.data.totalMinHours).toBeGreaterThanOrEqual(0)
      }
    })

    it('should handle decimal hours correctly', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/projects/project-with-decimal-hours/estimate',
      })

      const response = await GET(request, { params: { id: 'project-with-decimal-hours' } })
      const result = await extractResponseData(response)

      if (result.status === 200) {
        // Should maintain precision for decimal calculations
        result.data.taskBreakdown.forEach((breakdown: any) => {
          expect(Number.isFinite(breakdown.subtotalMinHours)).toBe(true)
          expect(Number.isFinite(breakdown.subtotalMaxHours)).toBe(true)
        })
      }
    })
  })

  describe('Parameter Validation', () => {
    it('should return 400 when id parameter is empty', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/projects//estimate',
      })

      const response = await GET(request, { params: { id: '' } })
      const result = await extractResponseData(response)

      expect([400, 404]).toContain(result.status)
    })

    it('should handle malformed id parameter', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/projects/malformed-id!@#/estimate',
      })

      const response = await GET(request, { params: { id: 'malformed-id!@#' } })
      const result = await extractResponseData(response)

      expect([400, 404]).toContain(result.status)
    })
  })
})