# Project Context: Rough Estimate Application

## Project Overview
A web application for estimating software project timelines. Users select predefined task types (e.g., "Large Complex Web Screen"), specify quantities, and receive time estimates based on configurable minimum/maximum hours per task type. Includes a configuration section for adjusting default time estimates.

## Tech Stack
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS 3
- **Database**: SQLite with Prisma ORM
- **Testing**: Jest (unit), Playwright (E2E)
- **Runtime**: Node.js 18+

## Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (/api/task-types, /api/projects)
│   ├── estimation/        # Estimation pages
│   ├── config/           # Configuration pages
│   └── globals.css       # Tailwind styles
├── components/            # React components
├── lib/                  # Core libraries
│   ├── estimation-engine/ # Calculation logic with CLI
│   └── task-config/      # Task management with CLI
├── prisma/               # Database schema and migrations
└── types/                # TypeScript type definitions

tests/
├── contract/             # API contract tests (OpenAPI validation)
├── integration/          # Feature integration tests
├── e2e/                 # End-to-end tests
└── unit/                # Unit tests

specs/001-build-and-application/  # Feature documentation
├── spec.md              # Business requirements
├── data-model.md        # Database schema
├── plan.md             # Implementation plan
└── contracts/api-schema.yaml  # OpenAPI specification
```

## Database Schema (Prisma/SQLite)
**Key Entities:**
- `TaskType`: Predefined work categories (name, defaultMinHours, defaultMaxHours, category, isActive)
- `Project`: Software projects being estimated (name, description, status, totalMinHours, totalMaxHours)
- `ProjectTask`: Junction entity (projectId, taskTypeId, quantity, customMinHours?, customMaxHours?)
- `Configuration`: Key-value store for global settings

**Relationships:**
- TaskType (1) → ProjectTask (many)
- Project (1) → ProjectTask (many)
- Unique constraint: (projectId, taskTypeId)

## API Patterns
**REST Endpoints** (see `/specs/001-build-and-application/contracts/api-schema.yaml`):
- `GET/POST /api/task-types` - Manage task types
- `GET/POST /api/projects` - Manage projects
- `POST /api/projects/{id}/tasks` - Add tasks to project
- `GET /api/projects/{id}/estimate` - Calculate estimates

**Response Format:**
```typescript
// Success responses include data directly
{ id: string, name: string, ... }

// Error responses follow standard format
{ error: string, details?: Array<{field: string, message: string}>, timestamp: string }
```

## Development Conventions
**File Organization:**
- Pages in `/src/app/` using App Router conventions
- Components in `/src/components/` (kebab-case filenames)
- Business logic in `/src/lib/` as separate libraries with CLI support
- Types in `/src/types/` (shared TypeScript interfaces)

**Naming Patterns:**
- Components: PascalCase (TaskTypeCard.tsx)
- Files: kebab-case (task-type-card.tsx)
- Database: snake_case (task_types, project_tasks)
- API routes: kebab-case (/api/task-types)

**Code Style:**
- TypeScript strict mode
- Prisma for type-safe database operations
- Tailwind CSS classes (prefer utility-first)
- Error boundaries for React components

## Testing Approach
**TDD Order (Constitutional Requirement):**
1. Contract tests (API schema validation)
2. Integration tests (database + API)
3. E2E tests (full user workflows)
4. Unit tests (isolated logic)

**Test Structure:**
- Real dependencies (actual SQLite database)
- RED-GREEN-Refactor cycle enforced
- Contract tests validate OpenAPI schema compliance
- Integration tests cover user stories from spec.md

## Common Tasks
**Development:**
- `npm run dev` - Start Next.js development server
- `npx prisma db push` - Update database schema
- `npx prisma studio` - Database GUI
- `npm run test` - Run Jest unit tests
- `npm run test:e2e` - Run Playwright E2E tests

**Database:**
- Seed data includes 10 default task types (Frontend, Backend, Database, Mobile, Testing, DevOps categories)
- Project totals auto-calculated when ProjectTask records change
- Configuration key-value store for app settings

## Key Files
- `/src/prisma/schema.prisma` - Database schema definition
- `/src/app/layout.tsx` - Root layout with Tailwind CSS
- `/src/lib/estimation-engine/` - Core calculation logic
- `/specs/001-build-and-application/contracts/api-schema.yaml` - API specification
- `/specs/001-build-and-application/data-model.md` - Detailed database documentation

## Architecture Notes
**Libraries as Features:**
- `estimation-engine` - Standalone calculation logic with CLI
- `task-config` - Task type management with CLI
- Each library includes llms.txt documentation

**Performance Targets:**
- <2s page load time
- <100ms database queries
- SQLite sufficient for single-user local storage

**Constitutional Principles:**
- Test-first development (RED-GREEN-Refactor)
- Simple architecture (no over-engineering)
- Real dependencies in tests
- Structured logging for observability
- Semantic versioning (currently v1.0.0)

This application follows a feature-driven development approach with comprehensive testing and clear separation of concerns between UI, business logic, and data layers.