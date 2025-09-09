# Quickstart Guide: Project Estimation Application

**Date**: 2025-09-09  
**Feature**: Project Estimation Application  
**Purpose**: Step-by-step guide to set up, run, and test the application

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Git for version control
- Basic familiarity with Next.js and React

## Quick Setup (5 minutes)

### 1. Project Initialization

```bash
# Navigate to project directory
cd rough-estimate

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Initialize database
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

### 2. Start Development Server

```bash
# Start Next.js development server
npm run dev

# Open browser to http://localhost:3000
```

### 3. Verify Installation

Navigate to `http://localhost:3000` and verify:
- ✅ Home page loads successfully
- ✅ Can navigate to Projects section
- ✅ Can access Configuration section
- ✅ Database connection is working

## Core User Flows

### Flow 1: Create Your First Project Estimate

**Goal**: Create a project estimate for an "E-commerce Website"

**Steps**:
1. **Navigate to Projects**
   - Click "Projects" in the navigation
   - Should see empty project list with "New Project" button

2. **Create New Project**
   - Click "New Project" button
   - Fill form:
     - Name: "E-commerce Website"
     - Description: "Full-featured online store with payment processing"
   - Click "Create Project"
   - Should redirect to project detail page

3. **Add Task Estimates**
   - Click "Add Estimation" or "Edit Tasks" button
   - Select task types and quantities:
     - Large Complex Web Screen: 5 (product pages, checkout, admin)
     - Simple Web Screen: 8 (static pages, forms)
     - API Endpoint: 12 (user auth, products, orders, payments)
     - Database Design: 1 (schema and relationships)
     - Authentication System: 1 (user management)
     - Third-party Integration: 2 (payment gateway, shipping API)

4. **Review Estimate**
   - Should see total estimate range (e.g., "156h - 312h")
   - Verify task breakdown shows each selected task
   - Should display both minimum and maximum estimates

5. **Save Project**
   - Click "Save Estimation"
   - Should see success message
   - Project status should update to "ACTIVE"

**Expected Result**: 
- Project created with realistic time estimate
- Total hours in range of 150-320 hours
- Individual task breakdown visible
- Project saved and retrievable

### Flow 2: Configure Task Type Estimates

**Goal**: Customize default time estimates to match your team's velocity

**Steps**:
1. **Navigate to Configuration**
   - Click "Configuration" in navigation
   - Should see list of default task types

2. **Update Task Type**
   - Find "Large Complex Web Screen" task type
   - Click "Edit" button
   - Update estimates:
     - Min Hours: 12 (was 8)
     - Max Hours: 24 (was 16)
     - Description: Add note about team's complexity standards
   - Click "Save Changes"

3. **Verify Changes Applied**
   - Navigate back to existing project
   - View estimation details
   - Should see updated calculations with new hourly rates
   - Total estimate should be recalculated automatically

4. **Add Custom Task Type**
   - In Configuration, click "Add Task Type"
   - Create new task:
     - Name: "Code Review Process"
     - Category: "Quality Assurance"
     - Min Hours: 1
     - Max Hours: 2
     - Description: "Code review and QA feedback cycle"
   - Save new task type

5. **Use Custom Task in Project**
   - Return to project estimation
   - New task type should appear in available selections
   - Add quantity for new task type
   - Verify it contributes to total estimate

**Expected Result**:
- Task type estimates updated successfully
- Existing projects reflect new calculations
- Custom task types can be created and used
- Configuration changes persist across sessions

### Flow 3: Manage Multiple Projects

**Goal**: Demonstrate project organization and comparison capabilities

**Steps**:
1. **Create Multiple Projects**
   - Create "Mobile App" project with mobile-focused tasks
   - Create "API Service" project with backend-focused tasks
   - Create "Landing Page" project with simple frontend tasks

2. **Compare Estimates**
   - Navigate to Projects list
   - Should see all projects with their total estimates
   - Verify different project types show appropriate hour ranges
   - Projects should be sortable by name, date, or estimate

3. **Update Project Status**
   - Move one project to "COMPLETED" status
   - Archive an old project
   - Verify status filtering works correctly

4. **Project Search and Filter**
   - Use search to find projects by name
   - Filter by status (DRAFT, ACTIVE, COMPLETED)
   - Verify pagination works with many projects

**Expected Result**:
- Multiple projects managed efficiently
- Clear comparison of different project sizes
- Status management working correctly
- Good organization and findability

## API Testing with curl

### Test Core API Endpoints

```bash
# 1. Health check
curl -X GET http://localhost:3000/api/health

# Expected: {"status":"healthy","timestamp":"...","database":"healthy"}

# 2. List task types
curl -X GET http://localhost:3000/api/task-types

# Expected: Array of default task types with hours and categories

# 3. Create a project
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test API Project",
    "description": "Testing API endpoints"
  }'

# Expected: Created project with ID and default fields

# 4. Add task to project (use project ID from step 3)
curl -X POST http://localhost:3000/api/projects/PROJECT_ID/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "taskTypeId": "TASK_TYPE_ID",
    "quantity": 3
  }'

# Expected: Created project task with calculations

# 5. Get project estimate
curl -X GET http://localhost:3000/api/projects/PROJECT_ID/estimate

# Expected: Complete estimate breakdown with totals
```

## Database Verification

### Check Database State

```bash
# Connect to SQLite database
npx prisma studio

# Or use CLI to check data
npx prisma db seed --preview-feature

# Verify tables exist
sqlite3 prisma/dev.db ".tables"
# Expected: configurations, project_tasks, projects, task_types

# Check sample data
sqlite3 prisma/dev.db "SELECT name, defaultMinHours, defaultMaxHours FROM task_types LIMIT 5;"
```

### Sample Queries

```sql
-- Check project with tasks
SELECT 
  p.name as project_name,
  tt.name as task_name,
  pt.quantity,
  pt.quantity * tt.defaultMinHours as min_hours,
  pt.quantity * tt.defaultMaxHours as max_hours
FROM projects p
JOIN project_tasks pt ON p.id = pt.projectId
JOIN task_types tt ON pt.taskTypeId = tt.id
WHERE p.name = 'E-commerce Website';

-- Verify totals calculation
SELECT 
  name,
  totalMinHours,
  totalMaxHours,
  (SELECT SUM(pt.quantity * tt.defaultMinHours) 
   FROM project_tasks pt 
   JOIN task_types tt ON pt.taskTypeId = tt.id 
   WHERE pt.projectId = projects.id) as calculated_min
FROM projects;
```

## Troubleshooting

### Common Issues

**1. Database Connection Error**
```bash
Error: Can't reach database server at `file:./dev.db`
```
**Solution**: Run database setup
```bash
npx prisma migrate dev
npx prisma generate
```

**2. Missing Task Types**
```bash
Error: No task types found
```
**Solution**: Seed the database
```bash
npx prisma db seed
```

**3. Port Already in Use**
```bash
Error: Port 3000 is already in use
```
**Solution**: Use different port
```bash
PORT=3001 npm run dev
```

**4. TypeScript Errors After Schema Changes**
```bash
Error: Property 'taskType' does not exist
```
**Solution**: Regenerate Prisma client
```bash
npx prisma generate
```

### Verify Test Environment

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit          # Component and utility tests
npm run test:integration   # API and database tests  
npm run test:e2e          # End-to-end user flows

# Check test coverage
npm run test:coverage
```

## Success Criteria

After completing this quickstart, you should have:

✅ **Functional Application**
- Next.js app running on localhost:3000
- Database initialized with seed data
- All main pages accessible and working

✅ **Core Features Working**
- Create and manage projects
- Add task estimates to projects
- Configure task types and hourly estimates
- View calculated project totals

✅ **API Functioning**
- All endpoints responding correctly
- Database operations working
- Error handling in place

✅ **Test Coverage**
- Unit tests passing
- Integration tests verifying API contracts
- E2E tests covering user flows

✅ **Development Environment**
- Hot reloading working
- TypeScript compilation successful
- Database migrations running smoothly

## Next Steps

1. **Explore Advanced Features**: Try custom task types, project templates, export functionality
2. **Performance Testing**: Create projects with many tasks, test with large datasets
3. **UI Customization**: Modify Tailwind styles, add new components
4. **API Extension**: Add new endpoints, implement additional features
5. **Deployment**: Deploy to Vercel, set up production database

## Getting Help

- **Documentation**: Check `/docs` folder for detailed guides
- **API Reference**: See OpenAPI schema in `/contracts/api-schema.yaml`
- **Issues**: Report bugs or request features in project repository
- **Development**: Review code comments and TypeScript types for implementation details

This quickstart should get you up and running in under 10 minutes with a fully functional project estimation application!