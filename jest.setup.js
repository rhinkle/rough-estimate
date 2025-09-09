import '@testing-library/jest-dom'

// Mock environment variables for tests
process.env.DATABASE_URL = 'file:./test.db'
process.env.NODE_ENV = 'test'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

// Note: Database mocking will be handled per test file as needed

// Global test cleanup
afterEach(() => {
  jest.clearAllMocks()
})