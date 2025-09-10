import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tasks = await db.projectTask.findMany({
      where: { projectId: params.id },
      include: {
        taskType: true,
      },
      orderBy: [
        { taskType: { category: 'asc' } },
        { taskType: { name: 'asc' } },
      ],
    })

    return NextResponse.json(tasks)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { taskTypeId, quantity, customMinHours, customMaxHours } = body

    if (!taskTypeId || typeof taskTypeId !== 'string') {
      return NextResponse.json(
        { error: 'taskTypeId is required and must be a string' },
        { status: 400 }
      )
    }

    if (!quantity || typeof quantity !== 'number' || quantity <= 0) {
      return NextResponse.json(
        { error: 'quantity is required and must be a positive number' },
        { status: 400 }
      )
    }

    // Verify project exists
    const project = await db.project.findUnique({
      where: { id: params.id },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Verify task type exists
    const taskType = await db.taskType.findUnique({
      where: { id: taskTypeId },
    })

    if (!taskType) {
      return NextResponse.json(
        { error: 'Task type not found' },
        { status: 404 }
      )
    }

    // Validate custom hours if provided
    if (customMinHours !== undefined || customMaxHours !== undefined) {
      const minHours = customMinHours ?? taskType.defaultMinHours
      const maxHours = customMaxHours ?? taskType.defaultMaxHours

      if (minHours <= 0) {
        return NextResponse.json(
          { error: 'Custom minimum hours must be greater than 0' },
          { status: 400 }
        )
      }

      if (maxHours < minHours) {
        return NextResponse.json(
          {
            error:
              'Custom maximum hours must be greater than or equal to minimum hours',
          },
          { status: 400 }
        )
      }
    }

    const projectTask = await db.projectTask.create({
      data: {
        projectId: params.id,
        taskTypeId,
        quantity,
        customMinHours,
        customMaxHours,
      },
      include: {
        taskType: true,
      },
    })

    return NextResponse.json(projectTask, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    )
  }
}
