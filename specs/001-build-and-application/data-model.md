# Data Model: Project Estimation Application

**Date**: 2025-09-09  
**Feature**: Project Estimation Application  
**Database**: SQLite with Prisma ORM

## Entity Relationship Overview

```
TaskType (1) ──< ProjectTask >── (1) Project
                     │
                     └── Configuration (global settings)
```

## Core Entities

### TaskType
Represents predefined categories of work with default time estimates.

**Fields**:
- `id: String` - Primary key (CUID)
- `name: String` - Display name (unique, e.g., "Large Complex Web Screen")
- `description: String?` - Optional detailed description
- `defaultMinHours: Float` - Minimum estimated hours for this task type
- `defaultMaxHours: Float` - Maximum estimated hours for this task type  
- `category: String?` - Optional grouping (e.g., "Frontend", "Backend", "Database")
- `isActive: Boolean` - Whether this task type is available for selection (default: true)
- `createdAt: DateTime` - Record creation timestamp
- `updatedAt: DateTime` - Last modification timestamp

**Relationships**:
- One-to-many with `ProjectTask` (a task type can be used in multiple projects)

**Indexes**:
- Unique index on `name`
- Index on `isActive` for filtering
- Index on `category` for grouping

**Validation Rules**:
- `name` must be 1-100 characters
- `defaultMinHours` must be > 0
- `defaultMaxHours` must be >= `defaultMinHours`
- `defaultMaxHours` must be <= 1000 hours (sanity check)

### Project
Represents a software project being estimated.

**Fields**:
- `id: String` - Primary key (CUID)
- `name: String` - Project name (e.g., "E-commerce Website")
- `description: String?` - Optional project description
- `status: ProjectStatus` - Current project status (enum)
- `totalMinHours: Float` - Calculated minimum total hours (default: 0)
- `totalMaxHours: Float` - Calculated maximum total hours (default: 0)
- `createdAt: DateTime` - Project creation timestamp
- `updatedAt: DateTime` - Last modification timestamp

**Relationships**:
- One-to-many with `ProjectTask` (a project contains multiple task estimates)

**Indexes**:
- Index on `status` for filtering
- Index on `updatedAt` for ordering
- Index on `name` for searching

**Validation Rules**:
- `name` must be 1-100 characters
- `totalMinHours` and `totalMaxHours` are calculated fields, updated via triggers/application logic

### ProjectTask
Junction entity linking projects to task types with quantities and custom estimates.

**Fields**:
- `id: String` - Primary key (CUID)
- `projectId: String` - Foreign key to Project
- `taskTypeId: String` - Foreign key to TaskType
- `quantity: Int` - Number of instances of this task type
- `customMinHours: Float?` - Optional override of task type's default min hours
- `customMaxHours: Float?` - Optional override of task type's default max hours
- `createdAt: DateTime` - Record creation timestamp
- `updatedAt: DateTime` - Last modification timestamp

**Relationships**:
- Many-to-one with `Project` (cascade delete when project is deleted)
- Many-to-one with `TaskType` (restrict delete if tasks reference it)

**Indexes**:
- Unique composite index on `(projectId, taskTypeId)` - one task type per project
- Index on `projectId` for project queries
- Index on `taskTypeId` for task type usage tracking

**Validation Rules**:
- `quantity` must be >= 0
- `customMinHours` if provided must be > 0
- `customMaxHours` if provided must be >= `customMinHours`
- Either use default hours from TaskType or both custom min/max hours

### Configuration
Key-value store for global application settings.

**Fields**:
- `id: String` - Primary key (CUID)
- `key: String` - Configuration key (unique)
- `value: String` - Configuration value (stored as JSON string)
- `description: String?` - Optional description of the setting
- `createdAt: DateTime` - Setting creation timestamp
- `updatedAt: DateTime` - Last modification timestamp

**Indexes**:
- Unique index on `key`

**Validation Rules**:
- `key` must be 1-50 characters, alphanumeric with underscores
- `value` must be valid JSON string

**Predefined Configuration Keys**:
- `default_task_types` - JSON array of default task types to seed
- `time_unit` - Display unit for time estimates (hours, days)
- `rounding_precision` - Decimal places for hour calculations
- `export_format` - Default format for estimate exports

## Enums

### ProjectStatus
```typescript
enum ProjectStatus {
  DRAFT     // Project is being created/edited
  ACTIVE    // Project estimation is finalized
  COMPLETED // Project development is finished
  ARCHIVED  // Project is archived
}
```

## Computed Fields

### Project Totals
Projects have calculated fields that are updated when ProjectTask records change:

```sql
-- Calculation logic (implemented in application code)
totalMinHours = SUM(
  quantity * COALESCE(customMinHours, taskType.defaultMinHours)
) FOR ALL ProjectTasks

totalMaxHours = SUM(
  quantity * COALESCE(customMaxHours, taskType.defaultMaxHours)  
) FOR ALL ProjectTasks
```

## Database Schema (Prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model TaskType {
  id              String    @id @default(cuid())
  name            String    @unique
  description     String?
  defaultMinHours Float
  defaultMaxHours Float
  category        String?
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  projectTasks    ProjectTask[]
  
  @@map("task_types")
}

model Project {
  id            String        @id @default(cuid())
  name          String
  description   String?
  status        ProjectStatus @default(DRAFT)
  totalMinHours Float         @default(0)
  totalMaxHours Float         @default(0)
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  
  tasks         ProjectTask[]
  
  @@map("projects")
}

model ProjectTask {
  id             String   @id @default(cuid())
  projectId      String
  taskTypeId     String
  quantity       Int
  customMinHours Float?
  customMaxHours Float?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  project        Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  taskType       TaskType @relation(fields: [taskTypeId], references: [id])
  
  @@unique([projectId, taskTypeId])
  @@map("project_tasks")
}

model Configuration {
  id          String   @id @default(cuid())
  key         String   @unique
  value       String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("configurations")
}

enum ProjectStatus {
  DRAFT
  ACTIVE
  COMPLETED
  ARCHIVED
}
```

## Seed Data

### Default Task Types
```json
[
  {
    "name": "Large Complex Web Screen",
    "description": "Complex UI with multiple interactions, forms, and data visualization",
    "defaultMinHours": 8,
    "defaultMaxHours": 16,
    "category": "Frontend"
  },
  {
    "name": "Simple Web Screen",
    "description": "Basic UI with standard components and minimal logic",
    "defaultMinHours": 2,
    "defaultMaxHours": 4,
    "category": "Frontend"
  },
  {
    "name": "API Endpoint",
    "description": "RESTful API endpoint with validation and error handling",
    "defaultMinHours": 2,
    "defaultMaxHours": 4,
    "category": "Backend"
  },
  {
    "name": "Database Design",
    "description": "Schema design, relationships, and migration scripts",
    "defaultMinHours": 4,
    "defaultMaxHours": 8,
    "category": "Database"
  },
  {
    "name": "Authentication System",
    "description": "User authentication and authorization implementation",
    "defaultMinHours": 8,
    "defaultMaxHours": 16,
    "category": "Backend"
  },
  {
    "name": "Third-party Integration",
    "description": "Integration with external APIs or services",
    "defaultMinHours": 4,
    "defaultMaxHours": 12,
    "category": "Backend"
  },
  {
    "name": "Mobile Screen (Native)",
    "description": "Native mobile screen with platform-specific features",
    "defaultMinHours": 6,
    "defaultMaxHours": 12,
    "category": "Mobile"
  },
  {
    "name": "Data Migration",
    "description": "Migrating data between systems or database versions",
    "defaultMinHours": 4,
    "defaultMaxHours": 16,
    "category": "Database"
  },
  {
    "name": "Testing Suite",
    "description": "Comprehensive test coverage including unit and integration tests",
    "defaultMinHours": 4,
    "defaultMaxHours": 8,
    "category": "Testing"
  },
  {
    "name": "DevOps Setup",
    "description": "CI/CD pipeline, deployment scripts, and infrastructure setup",
    "defaultMinHours": 8,
    "defaultMaxHours": 20,
    "category": "DevOps"
  }
]
```

## Data Integrity Constraints

### Application-Level Constraints
- Project totals must be recalculated when ProjectTask records change
- TaskType cannot be deleted if referenced by active ProjectTask records
- Custom hours in ProjectTask must be positive numbers
- Project status transitions must follow allowed workflows

### Database-Level Constraints
- Foreign key constraints with appropriate cascade/restrict rules
- Unique constraints to prevent duplicate task types per project
- Check constraints for positive numeric values
- NOT NULL constraints on required fields

## Migration Strategy

### Initial Setup
1. Create tables with indexes
2. Seed default task types
3. Create default configuration entries
4. Set up any required database triggers

### Future Migrations
- Add new task type categories as needed
- Extend configuration options
- Add audit trails if needed
- Performance optimization indexes

This data model supports the core functionality while remaining flexible for future enhancements.