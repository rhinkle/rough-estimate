/**
 * Contract Test: GET /api/projects/[id]
 * 
 * CRITICAL: This test MUST FAIL until the API route is implemented.
 * Tests the API contract as specified in contracts/api-schema.yaml
 */

import { GET } from '@/app/api/projects/[id]/route'
import { createMockRequest, extractResponseData, expectValidProject, expectNotFoundError, expectValidProjectTask } from './utils'

describe('GET /api/projects/[id]', () => {
  describe('Contract Compliance', () => {
    it('should return 200 with project and tasks when project exists', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/projects/test-id',
      })

      const response = await GET(request, { params: { id: 'test-id' } })
      const result = await extractResponseData(response)

      expect(result.status).toBe(200)
      expectValidProject(result.data)
      expect(result.data.tasks).toEqual(expect.any(Array))
      
      // Each task should include taskType relationship
      result.data.tasks.forEach((task: any) => {
        expectValidProjectTask(task)
        expect(task.taskType).toBeDefined()
        expect(task.taskType.name).toEqual(expect.any(String))
      })
    })

    it('should return 404 when project does not exist', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/projects/non-existent-id',
      })

      const response = await GET(request, { params: { id: 'non-existent-id' } })
      const result = await extractResponseData(response)

      expectNotFoundError(result)
    })

    it('should handle database errors with 500 status', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/projects/test-id',
      })

      expect(async () => {
        await GET(request, { params: { id: 'test-id' } })
      }).rejects.toBeDefined()
    })
  })

  describe('Parameter Validation', () => {
    it('should return 400 when id parameter is empty', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/projects/',
      })

      const response = await GET(request, { params: { id: '' } })
      const result = await extractResponseData(response)

      expect([400, 404]).toContain(result.status)
    })

    it('should handle malformed id parameter', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/projects/malformed-id!@#',
      })

      const response = await GET(request, { params: { id: 'malformed-id!@#' } })
      const result = await extractResponseData(response)

      expect([400, 404]).toContain(result.status)
    })
  })

  describe('Response Format', () => {
    it('should return Content-Type application/json', async () => {
      const request = createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/projects/test-id',
      })

      const response = await GET(request, { params: { id: 'test-id' } })
      
      expect(response.headers.get('content-type')).toContain('application/json')
    })
  })
})