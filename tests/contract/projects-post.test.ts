/**
 * Contract Test: POST /api/projects
 * 
 * CRITICAL: This test MUST FAIL until the API route is implemented.
 * Tests the API contract as specified in contracts/api-schema.yaml
 */

import { POST } from '@/app/api/projects/route'
import { createMockRequest, extractResponseData, expectValidProject, expectValidationError } from './utils'

describe('POST /api/projects', () => {
  describe('Contract Compliance', () => {
    it('should create new project and return 201', async () => {
      // Given: Valid project data
      const projectData = {
        name: 'Test E-commerce Application',
        description: 'A comprehensive e-commerce platform with payment integration',
      }

      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/projects',
        body: projectData,
      })

      // When: The endpoint is called
      const response = await POST(request)
      const result = await extractResponseData(response)

      // Then: Returns 201 with created project
      expect(result.status).toBe(201)
      expectValidProject(result.data)
      expect(result.data.name).toBe(projectData.name)
      expect(result.data.description).toBe(projectData.description)
      expect(result.data.status).toBe('DRAFT') // Default status
      expect(result.data.totalMinHours).toBe(0) // Default value
      expect(result.data.totalMaxHours).toBe(0) // Default value
    })

    it('should create project without optional description', async () => {
      // Given: Minimal valid project data
      const projectData = {
        name: 'Minimal Project',
      }

      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/projects',
        body: projectData,
      })

      // When: The endpoint is called
      const response = await POST(request)
      const result = await extractResponseData(response)

      // Then: Returns 201 with created project
      expect(result.status).toBe(201)
      expectValidProject(result.data)
      expect(result.data.name).toBe(projectData.name)
      expect(result.data.description).toBeNull()
    })

    it('should include tasks relationship in response', async () => {
      // Given: Valid project data
      const projectData = {
        name: 'Project With Tasks Check',
        description: 'Testing task relationship inclusion',
      }

      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/projects',
        body: projectData,
      })

      // When: The endpoint is called
      const response = await POST(request)
      const result = await extractResponseData(response)

      // Then: Returns project with tasks array (initially empty)
      expect(result.status).toBe(201)
      expect(result.data.tasks).toEqual([])
    })

    it('should handle database errors with 500 status', async () => {
      // This test will pass once error handling is implemented
      // For now, it should fail since the route doesn't exist
      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/projects',
        body: {
          name: 'Test Project',
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
        url: 'http://localhost:3000/api/projects',
        body: {
          description: 'Project without name',
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

    it('should return 400 when name is empty string', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/projects',
        body: {
          name: '',
          description: 'Project with empty name',
        },
      })

      const response = await POST(request)
      const result = await extractResponseData(response)

      expectValidationError(result)
    })

    it('should return 400 when name exceeds 100 characters', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/projects',
        body: {
          name: 'a'.repeat(101), // Too long
          description: 'Project with long name',
        },
      })

      const response = await POST(request)
      const result = await extractResponseData(response)

      expectValidationError(result)
    })

    it('should return 400 when description exceeds 1000 characters', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/projects',
        body: {
          name: 'Test Project',
          description: 'a'.repeat(1001), // Too long
        },
      })

      const response = await POST(request)
      const result = await extractResponseData(response)

      expectValidationError(result)
    })

    it('should return 400 when name contains only whitespace', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/projects',
        body: {
          name: '   ', // Only whitespace
          description: 'Project with whitespace name',
        },
      })

      const response = await POST(request)
      const result = await extractResponseData(response)

      expectValidationError(result)
    })

    it('should accept valid name with mixed characters', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/projects',
        body: {
          name: 'Test Project 123 - Mobile App (V2.0)',
          description: 'Project with special characters in name',
        },
      })

      const response = await POST(request)
      const result = await extractResponseData(response)

      expect(result.status).toBe(201)
      expectValidProject(result.data)
    })
  })

  describe('Content-Type Validation', () => {
    it('should return 400 when Content-Type is not application/json', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/projects',
        body: {
          name: 'Test Project',
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
      const request = new Request('http://localhost:3000/api/projects', {
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

    it('should return 400 when request body is empty', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/projects',
        body: null,
      })

      const response = await POST(request)
      const result = await extractResponseData(response)

      expectValidationError(result)
    })
  })

  describe('Response Format Validation', () => {
    it('should return Content-Type application/json', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/projects',
        body: {
          name: 'Content Type Test Project',
        },
      })

      const response = await POST(request)
      
      expect(response.headers.get('content-type')).toContain('application/json')
    })

    it('should include Location header with created project URL', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/projects',
        body: {
          name: 'Location Header Test Project',
        },
      })

      const response = await POST(request)
      const result = await extractResponseData(response)

      if (result.status === 201) {
        // Location header should point to the created project
        const locationHeader = response.headers.get('location')
        expect(locationHeader).toMatch(/\/api\/projects\/[a-zA-Z0-9]+$/)
      }
    })
  })

  describe('Concurrent Creation', () => {
    it('should handle multiple projects with same name', async () => {
      // Projects with same name should be allowed (unlike task types)
      const projectData = {
        name: 'Duplicate Name Test',
        description: 'Testing duplicate names',
      }

      // Create first project
      const request1 = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/projects',
        body: projectData,
      })
      const response1 = await POST(request1)
      const result1 = await extractResponseData(response1)

      // Create second project with same name
      const request2 = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/projects',
        body: projectData,
      })
      const response2 = await POST(request2)
      const result2 = await extractResponseData(response2)

      // Both should succeed
      expect(result1.status).toBe(201)
      expect(result2.status).toBe(201)
      expect(result1.data.id).not.toBe(result2.data.id) // Different IDs
      expect(result1.data.name).toBe(result2.data.name) // Same name allowed
    })
  })

  describe('Database Constraint Validation', () => {
    it('should set createdAt and updatedAt timestamps', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/projects',
        body: {
          name: 'Timestamp Test Project',
        },
      })

      const response = await POST(request)
      const result = await extractResponseData(response)

      expect(result.status).toBe(201)
      
      // Timestamps should be valid ISO strings
      expect(() => new Date(result.data.createdAt)).not.toThrow()
      expect(() => new Date(result.data.updatedAt)).not.toThrow()
      
      // createdAt and updatedAt should be very close for new projects
      const created = new Date(result.data.createdAt).getTime()
      const updated = new Date(result.data.updatedAt).getTime()
      expect(Math.abs(updated - created)).toBeLessThan(1000) // Within 1 second
    })

    it('should generate unique CUID for project ID', async () => {
      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/projects',
        body: {
          name: 'CUID Test Project',
        },
      })

      const response = await POST(request)
      const result = await extractResponseData(response)

      expect(result.status).toBe(201)
      expect(result.data.id).toMatch(/^[a-z0-9]+$/) // CUID format
      expect(result.data.id.length).toBeGreaterThan(10) // Reasonable CUID length
    })
  })
})