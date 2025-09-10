# Rough Estimate Application

A web application for estimating software project timelines. Users can select predefined task types, specify quantities, and receive time estimates based on configurable minimum/maximum hours per task type.

## Features

- **Project Estimation**: Create projects and estimate timelines using predefined task types
- **Task Configuration**: Manage task types with customizable time estimates
- **Real-time Calculations**: Automatic calculation of project totals with min/max ranges
- **Categories**: Organize task types by categories (Frontend, Backend, Database, Mobile, Testing, DevOps)

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS 3
- **Database**: SQLite with Prisma ORM
- **Testing**: Jest (unit), Playwright (E2E)
- **Runtime**: Node.js 18+

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd rough-estimate
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   # Generate Prisma client
   npx prisma generate

   # Push database schema to SQLite
   npx prisma db push

   # Seed the database with default task types
   npx prisma db seed
   ```

### Running the Application

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Available Scripts

- `npm run dev` - Start Next.js development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run test` - Run Jest unit tests
- `npm run test:e2e` - Run Playwright end-to-end tests
- `npm run lint` - Run ESLint
- `npx prisma studio` - Open Prisma database GUI

### Database Management

- **View database**: `npx prisma studio`
- **Reset database**: `npx prisma migrate reset`
- **Update schema**: `npx prisma db push`

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── projects/          # Project pages
│   ├── configuration/     # Configuration pages
│   └── globals.css       # Tailwind styles
├── components/            # React components
│   ├── features/         # Feature-specific components
│   └── ui/              # Reusable UI components
├── lib/                  # Core libraries
│   ├── estimation-engine/ # Calculation logic
│   └── task-config/      # Task management
├── prisma/               # Database schema and migrations
└── types/                # TypeScript type definitions
```

## Usage

### Creating a Project

1. Navigate to the Projects page
2. Click "New Project"
3. Enter project name and description
4. Add tasks by selecting task types and quantities
5. View estimated time ranges

### Configuring Task Types

1. Go to Configuration page
2. Add, edit, or deactivate task types
3. Set minimum and maximum hours for each task type
4. Organize tasks by categories

### API Endpoints

The application provides REST APIs:

- `GET/POST /api/projects` - Manage projects
- `GET/POST /api/task-types` - Manage task types
- `POST /api/projects/{id}/tasks` - Add tasks to projects
- `GET /api/projects/{id}/estimate` - Calculate estimates

Full API documentation is available in `/specs/001-build-and-application/contracts/api-schema.yaml`

## Testing

The project follows Test-Driven Development (TDD) with comprehensive testing:

```bash
# Run all tests
npm run test

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:contract
```

### Test Structure

1. **Contract Tests**: Validate API schema compliance
2. **Integration Tests**: Test database and API interactions
3. **E2E Tests**: Full user workflow testing
4. **Unit Tests**: Isolated logic testing

## Development

### CLI Libraries

The project includes CLI-enabled libraries:

```bash
# Estimation engine CLI
node src/lib/estimation-engine/cli.ts

# Task configuration CLI
node src/lib/task-config/cli.ts
```

### Code Conventions

- **Components**: PascalCase (TaskTypeCard.tsx)
- **Files**: kebab-case (task-type-card.tsx)
- **Database**: snake_case (task_types, project_tasks)
- **API routes**: kebab-case (/api/task-types)

## Database Schema

Key entities:
- **TaskType**: Predefined work categories with time estimates
- **Project**: Software projects being estimated
- **ProjectTask**: Junction linking projects to tasks with quantities
- **Configuration**: Key-value store for global settings

## Contributing

1. Follow the TDD approach (RED-GREEN-Refactor)
2. Write contract tests first
3. Use real dependencies in tests
4. Follow existing code conventions
5. Update documentation as needed

## License

MIT License

Copyright (c) 2025 Rough Estimate

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
