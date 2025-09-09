# Implementation Plan: Project Estimation Application

**Branch**: `001-build-and-application` | **Date**: 2025-09-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-build-and-application/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
4. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
5. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, or `GEMINI.md` for Gemini CLI).
6. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
7. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
8. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
A web application for project estimation that allows users to select predefined task types, specify quantities, configure time estimates, and view total project estimates. Built with Next.js for the frontend, SQLite for data persistence, and Tailwind CSS for styling.

## Technical Context
**Language/Version**: TypeScript with Node.js 18+
**Primary Dependencies**: Next.js 14+, React 18+, Tailwind CSS 3+
**Storage**: SQLite with Prisma ORM for type-safe database operations
**Testing**: Jest for unit testing, Playwright for E2E testing
**Target Platform**: Web browsers (Chrome, Firefox, Safari, Edge)
**Project Type**: web (Next.js full-stack application)
**Performance Goals**: <2s page load, <100ms database queries
**Constraints**: No authentication required initially, single-user local storage
**Scale/Scope**: Single-user application, ~10-20 predefined task types, unlimited projects

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 1 (Next.js full-stack app)
- Using framework directly? (Next.js API routes, no custom server wrapper)
- Single data model? (Direct Prisma models, no DTOs for initial version)
- Avoiding patterns? (No Repository pattern, direct Prisma client usage)

**Architecture**:
- EVERY feature as library? (Estimation logic as separate lib)
- Libraries listed: 
  - `estimation-engine`: Core calculation logic with CLI
  - `task-config`: Task type management with CLI
- CLI per library: 
  - `estimation-engine --calculate --format json`
  - `task-config --list --add --update --format json`
- Library docs: llms.txt format planned

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? (YES - tests written first)
- Git commits show tests before implementation? (YES - will enforce)
- Order: Contract→Integration→E2E→Unit strictly followed? (YES)
- Real dependencies used? (YES - actual SQLite database)
- Integration tests for: new libraries, API contracts, database schemas
- FORBIDDEN: Implementation before test, skipping RED phase

**Observability**:
- Structured logging included? (Next.js built-in logging + custom structured logs)
- Frontend logs → backend? (Console errors captured in API logs)
- Error context sufficient? (Error boundaries + API error responses)

**Versioning**:
- Version number assigned? (1.0.0)
- BUILD increments on every change? (YES - will use semantic versioning)
- Breaking changes handled? (Database migrations, API versioning)

## Project Structure

### Documentation (this feature)
```
specs/001-build-and-application/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 2: Web application (Next.js full-stack)
src/
├── app/                    # Next.js 14 App Router
│   ├── api/               # API routes
│   ├── estimation/        # Estimation pages
│   ├── config/           # Configuration pages
│   └── globals.css       # Tailwind styles
├── components/            # React components
├── lib/                  # Core libraries
│   ├── estimation-engine/ # Calculation logic
│   └── task-config/      # Task management
├── prisma/               # Database schema
└── types/                # TypeScript types

tests/
├── contract/             # API contract tests
├── integration/          # Feature integration tests
├── e2e/                 # End-to-end tests
└── unit/                # Unit tests
```

**Structure Decision**: Option 2 (Web application) - Next.js full-stack with integrated frontend/backend

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - SQLite integration patterns with Next.js and Prisma
   - Best practices for Tailwind CSS component organization
   - Next.js 14 App Router patterns for database operations
   - Testing strategies for full-stack Next.js applications

2. **Generate and dispatch research agents**:
   ```
   Task: "Research SQLite + Prisma integration for Next.js applications"
   Task: "Find best practices for Tailwind CSS component libraries"
   Task: "Research Next.js App Router patterns for CRUD operations"
   Task: "Find testing patterns for Next.js full-stack applications"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all technical decisions documented

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - TaskType (name, minHours, maxHours, description, category)
   - Project (name, description, createdAt, updatedAt)
   - ProjectTask (projectId, taskTypeId, quantity, customMinHours, customMaxHours)
   - Configuration (key, value) for global settings

2. **Generate API contracts** from functional requirements:
   - GET /api/task-types - List all task types
   - POST /api/task-types - Create new task type
   - PUT /api/task-types/[id] - Update task type
   - GET /api/projects - List projects
   - POST /api/projects - Create project
   - PUT /api/projects/[id] - Update project
   - POST /api/projects/[id]/tasks - Add tasks to project
   - GET /api/projects/[id]/estimate - Calculate project estimate
   - Output OpenAPI schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Create project with task selections
   - Configure task type time estimates
   - Calculate total project estimates
   - Save and retrieve projects

5. **Update agent file incrementally** (O(1) operation):
   - Create `CLAUDE.md` for Claude Code context
   - Add Next.js/SQLite/Tailwind tech stack info
   - Include project structure and conventions
   - Keep under 150 lines for token efficiency

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, CLAUDE.md

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each API contract → contract test task [P]
- Each entity → Prisma model creation task [P]
- Each user story → integration test task
- Implementation tasks to make tests pass
- Database setup and migration tasks
- Frontend component creation tasks

**Ordering Strategy**:
- TDD order: Tests before implementation
- Dependency order: Database schema → API → Components → Pages
- Mark [P] for parallel execution (independent files)
- Database setup first, then parallel API and component work

**Estimated Output**: 25-30 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*No constitutional violations identified - keeping to single project structure*

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command) - research.md created
- [x] Phase 1: Design complete (/plan command) - data-model.md, contracts/, quickstart.md, CLAUDE.md created
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved through research phase
- [x] Complexity deviations documented (none required)

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*