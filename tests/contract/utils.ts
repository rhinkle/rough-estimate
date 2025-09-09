import { NextRequest } from 'next/server'

export function createMockRequest(options: {
  method: string
  url: string
  body?: any
  headers?: Record<string, string>
}): NextRequest {
  const { method, url, body, headers = {} } = options
  
  const request = new NextRequest(url, {
    method,
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  
  return request
}

export async function extractResponseData(response: Response) {
  const data = await response.json()
  return {
    status: response.status,
    data,
    headers: Object.fromEntries(response.headers.entries()),
  }
}

export function expectValidTaskType(taskType: any) {
  expect(taskType).toMatchObject({
    id: expect.any(String),
    name: expect.any(String),
    defaultMinHours: expect.any(Number),
    defaultMaxHours: expect.any(Number),
    isActive: expect.any(Boolean),
    createdAt: expect.any(String),
    updatedAt: expect.any(String),
  })
  
  expect(taskType.defaultMinHours).toBeGreaterThan(0)
  expect(taskType.defaultMaxHours).toBeGreaterThanOrEqual(taskType.defaultMinHours)
}

export function expectValidProject(project: any) {
  expect(project).toMatchObject({
    id: expect.any(String),
    name: expect.any(String),
    status: expect.stringMatching(/^(DRAFT|ACTIVE|COMPLETED|ARCHIVED)$/),
    totalMinHours: expect.any(Number),
    totalMaxHours: expect.any(Number),
    createdAt: expect.any(String),
    updatedAt: expect.any(String),
  })
  
  expect(project.totalMinHours).toBeGreaterThanOrEqual(0)
  expect(project.totalMaxHours).toBeGreaterThanOrEqual(project.totalMinHours)
}

export function expectValidProjectTask(projectTask: any) {
  expect(projectTask).toMatchObject({
    id: expect.any(String),
    projectId: expect.any(String),
    taskTypeId: expect.any(String),
    quantity: expect.any(Number),
    createdAt: expect.any(String),
    updatedAt: expect.any(String),
  })
  
  expect(projectTask.quantity).toBeGreaterThanOrEqual(0)
}

export function expectValidEstimate(estimate: any) {
  expect(estimate).toMatchObject({
    projectId: expect.any(String),
    totalMinHours: expect.any(Number),
    totalMaxHours: expect.any(Number),
    taskBreakdown: expect.any(Array),
    calculatedAt: expect.any(String),
  })
  
  expect(estimate.totalMinHours).toBeGreaterThanOrEqual(0)
  expect(estimate.totalMaxHours).toBeGreaterThanOrEqual(estimate.totalMinHours)
}

export function expectValidationError(response: any) {
  expect(response.status).toBe(400)
  expect(response.data).toMatchObject({
    error: expect.any(String),
    timestamp: expect.any(String),
  })
}

export function expectNotFoundError(response: any) {
  expect(response.status).toBe(404)
  expect(response.data).toMatchObject({
    error: expect.any(String),
    timestamp: expect.any(String),
  })
}

export function expectServerError(response: any) {
  expect(response.status).toBe(500)
  expect(response.data).toMatchObject({
    error: expect.any(String),
    timestamp: expect.any(String),
  })
}