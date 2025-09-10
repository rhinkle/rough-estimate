# Tasks: Project Estimation Application

**Input**: Design documents from `/specs/001-build-and-application/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/api-schema.yaml, quickstart.md

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Extract: Next.js 14, TypeScript, SQLite, Prisma, Tailwind CSS
   → Project structure: src/app/, src/components/, src/lib/
2. Load design documents:
   → data-model.md: TaskType, Project, ProjectTask, Configuration entities
   → contracts/: 10 API endpoints across 4 resources
   → quickstart.md: 3 core user flows for testing
3. Generate tasks by category:
   → Setup: Next.js project, dependencies, database
   → Tests: API contract tests, integration tests
   → Core: Prisma models, API routes, components
   → Integration: Database connection, error handling
   → Polish: E2E tests, performance optimization
4. Apply TDD rules: Tests before implementation
5. Mark [P] for parallel execution (different files)
6. Number tasks sequentially T001-T030
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- All file paths are absolute from repository root

## Phase 3.1: Project Setup

- [x] **T001** Initialize Next.js 14 project with TypeScript and App Router in `src/`
- [x] **T002** [P] Configure Tailwind CSS with custom theme and component utilities
- [x] **T003** [P] Set up Prisma ORM with SQLite database configuration
- [x] **T004** [P] Configure ESLint, Prettier, and TypeScript strict settings
- [x] **T005** [P] Set up testing environment (Jest, React Testing Library, Playwright)
- [x] **T006** Create Prisma schema with TaskType, Project, ProjectTask, Configuration models in `prisma/schema.prisma`
- [x] **T007** Generate Prisma client and run initial database migration
- [x] **T008** [P] Create database seed script with default task types in `prisma/seed.ts`

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### API Contract Tests (Parallel)
- [x] **T009** [P] Contract test GET /api/task-types in `tests/contract/task-types-get.test.ts`
- [x] **T010** [P] Contract test POST /api/task-types in `tests/contract/task-types-post.test.ts`
- [x] **T011** [P] Contract test PUT /api/task-types/[id] in `tests/contract/task-types-put.test.ts`
- [x] **T012** [P] Contract test GET /api/projects in `tests/contract/projects-get.test.ts`
- [x] **T013** [P] Contract test POST /api/projects in `tests/contract/projects-post.test.ts`
- [x] **T014** [P] Contract test GET /api/projects/[id] in `tests/contract/projects-detail.test.ts`
- [x] **T015** [P] Contract test POST /api/projects/[id]/tasks in `tests/contract/project-tasks-post.test.ts`
- [x] **T016** [P] Contract test GET /api/projects/[id]/estimate in `tests/contract/project-estimate.test.ts`
- [x] **T017** [P] Contract test GET /api/health in `tests/contract/health.test.ts`

### Integration Tests (Parallel)
- [x] **T018** [P] Integration test "Create project with task estimates" in `tests/integration/project-creation.test.ts`
- [x] **T019** [P] Integration test "Configure task type estimates" in `tests/integration/task-configuration.test.ts`
- [x] **T020** [P] Integration test "Calculate project totals" in `tests/integration/estimation-calculation.test.ts`
- [x] **T021** [P] Database connection and health check integration test in `tests/integration/database.test.ts`

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Database Layer (Parallel)
- [x] **T022** [P] Database connection singleton in `src/lib/db.ts`
- [x] **T023** [P] Estimation engine library with CLI in `src/lib/estimation-engine/index.ts`
- [x] **T024** [P] Task configuration library with CLI in `src/lib/task-config/index.ts`

### API Routes (Sequential - shared Next.js routing)
- [x] **T025** Health check endpoint at `src/app/api/health/route.ts`
- [x] **T026** Task types CRUD endpoints at `src/app/api/task-types/route.ts` and `src/app/api/task-types/[id]/route.ts`
- [x] **T027** Projects CRUD endpoints at `src/app/api/projects/route.ts` and `src/app/api/projects/[id]/route.ts`
- [x] **T028** Project tasks endpoints at `src/app/api/projects/[id]/tasks/route.ts`
- [x] **T029** Project estimation endpoint at `src/app/api/projects/[id]/estimate/route.ts`

### Frontend Components (Parallel)
- [x] **T030** [P] Base UI components (Button, Input, Card, Dialog) in `src/components/ui/`
- [ ] **T031** [P] Project list and project card components in `src/components/features/projects/`
- [ ] **T032** [P] Task selector and estimation form components in `src/components/features/estimation/`
- [ ] **T033** [P] Task configuration components in `src/components/features/configuration/`

### Application Pages (Sequential - shared layout)
- [ ] **T034** Root layout with navigation in `src/app/layout.tsx`
- [ ] **T035** Home page with project overview at `src/app/page.tsx`
- [ ] **T036** Projects list page at `src/app/projects/page.tsx`
- [ ] **T037** New project form page at `src/app/projects/new/page.tsx`
- [ ] **T038** Project detail page at `src/app/projects/[id]/page.tsx`
- [ ] **T039** Project estimation interface at `src/app/projects/[id]/estimate/page.tsx`
- [ ] **T040** Task configuration page at `src/app/configuration/page.tsx`

## Phase 3.4: Integration & Error Handling

- [ ] **T041** Input validation with Zod schemas in `src/lib/validations.ts`
- [ ] **T042** Error boundaries and global error handling in `src/components/error-boundary.tsx`
- [ ] **T043** API error responses and logging middleware
- [ ] **T044** Database transaction handling and connection pooling
- [ ] **T045** Server Actions for form submissions and optimistic updates

## Phase 3.5: Polish & Performance

- [ ] **T046** [P] Unit tests for estimation calculations in `tests/unit/estimation-engine.test.ts`
- [ ] **T047** [P] Unit tests for task configuration logic in `tests/unit/task-config.test.ts`
- [ ] **T048** [P] Component unit tests for UI components in `tests/unit/components/`
- [ ] **T049** End-to-end tests for core user flows in `tests/e2e/user-flows.spec.ts`
- [ ] **T050** [P] Performance optimization: database query optimization and caching
- [ ] **T051** [P] Accessibility audit and WCAG compliance improvements
- [ ] **T052** [P] SEO optimization with Next.js metadata API
- [ ] **T053** Production build optimization and bundle analysis

## Dependencies

**Critical Path Dependencies:**
- T001-T008 (Setup) → All other tasks
- T009-T021 (Tests) → T022-T053 (Implementation)
- T022 (DB Connection) → T025-T029 (API Routes)
- T025-T029 (API Routes) → T030-T040 (Frontend)
- T034 (Layout) → T035-T040 (Pages)

**Blocking Relationships:**
- Tests (T009-T021) block ALL implementation
- T022 blocks T025-T029, T041-T045
- T030 blocks T031-T033
- T034 blocks T035-T040
- Implementation (T022-T045) blocks Polish (T046-T053)

## Parallel Execution Examples

### Phase 3.2: Launch All Contract Tests Together
```bash
# Run these 9 contract tests in parallel:
Task: "Contract test GET /api/task-types in tests/contract/task-types-get.test.ts"
Task: "Contract test POST /api/task-types in tests/contract/task-types-post.test.ts"
Task: "Contract test PUT /api/task-types/[id] in tests/contract/task-types-put.test.ts"
Task: "Contract test GET /api/projects in tests/contract/projects-get.test.ts"
Task: "Contract test POST /api/projects in tests/contract/projects-post.test.ts"
Task: "Contract test GET /api/projects/[id] in tests/contract/projects-detail.test.ts"
Task: "Contract test POST /api/projects/[id]/tasks in tests/contract/project-tasks-post.test.ts"
Task: "Contract test GET /api/projects/[id]/estimate in tests/contract/project-estimate.test.ts"
Task: "Contract test GET /api/health in tests/contract/health.test.ts"
```

### Phase 3.3: Launch Database Layer Tasks
```bash
# Run these 3 core library tasks in parallel:
Task: "Database connection singleton in src/lib/db.ts"
Task: "Estimation engine library with CLI in src/lib/estimation-engine/index.ts"
Task: "Task configuration library with CLI in src/lib/task-config/index.ts"
```

### Phase 3.5: Launch Polish Tasks
```bash
# Run these final optimization tasks in parallel:
Task: "Unit tests for estimation calculations in tests/unit/estimation-engine.test.ts"
Task: "Unit tests for task configuration logic in tests/unit/task-config.test.ts"
Task: "Component unit tests for UI components in tests/unit/components/"
Task: "Performance optimization: database query optimization and caching"
Task: "Accessibility audit and WCAG compliance improvements"
Task: "SEO optimization with Next.js metadata API"
Task: "Production build optimization and bundle analysis"
```

## Task Validation Checklist

**Contract Coverage:**
- ✅ All 9 API endpoints have contract tests (T009-T017)
- ✅ All 4 entities have implementation tasks
- ✅ All 3 user flows have integration tests (T018-T020)

**TDD Compliance:**
- ✅ Tests written before implementation (T009-T021 → T022-T053)
- ✅ Each contract test specifies exact file path
- ✅ Tests must fail before implementation begins

**Parallel Execution:**
- ✅ [P] tasks use different files and have no dependencies
- ✅ Sequential tasks modify shared files (Next.js routes, layout)
- ✅ No [P] task conflicts with another [P] task

**Constitutional Compliance:**
- ✅ Library-first architecture (T023-T024 create libraries with CLI)
- ✅ Test-driven development enforced
- ✅ No Repository pattern (direct Prisma usage)
- ✅ Structured logging included in error handling

## Notes

- **File Conflicts**: API routes (T025-T029) and pages (T034-T040) are sequential because they share Next.js routing system
- **Test First**: ALL tests (T009-T021) must be written and failing before ANY implementation starts
- **Commit Strategy**: Commit after each completed task with descriptive message
- **CLI Requirements**: T023-T024 must include CLI interfaces per constitutional requirements
- **Performance**: Database queries must be optimized for <100ms response times
- **Error Handling**: All API endpoints must have proper error responses and logging

This task breakdown provides 53 specific, executable tasks that follow TDD principles and constitutional requirements while maximizing parallel execution opportunities.
