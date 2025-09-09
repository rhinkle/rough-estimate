import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    const body = await request.json()
    const { quantity, customMinHours, customMaxHours } = body
    
    // Get existing task to validate
    const existingTask = await db.projectTask.findUnique({
      where: { 
        id: params.taskId,
        projectId: params.id,
      },
      include: {
        taskType: true,
      },
    })

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Project task not found' },
        { status: 404 }
      )
    }

    const updateData: any = {}

    if (quantity !== undefined) {
      if (typeof quantity !== 'number' || quantity <= 0) {
        return NextResponse.json(
          { error: 'quantity must be a positive number' },
          { status: 400 }
        )
      }
      updateData.quantity = quantity
    }

    if (customMinHours !== undefined) {
      updateData.customMinHours = customMinHours
    }

    if (customMaxHours !== undefined) {
      updateData.customMaxHours = customMaxHours
    }

    // Validate custom hours
    const finalMinHours = updateData.customMinHours ?? existingTask.customMinHours ?? existingTask.taskType.defaultMinHours
    const finalMaxHours = updateData.customMaxHours ?? existingTask.customMaxHours ?? existingTask.taskType.defaultMaxHours

    if (finalMinHours <= 0) {
      return NextResponse.json(
        { error: 'Minimum hours must be greater than 0' },
        { status: 400 }
      )
    }

    if (finalMaxHours < finalMinHours) {
      return NextResponse.json(
        { error: 'Maximum hours must be greater than or equal to minimum hours' },
        { status: 400 }
      )
    }

    const projectTask = await db.projectTask.update({
      where: { 
        id: params.taskId,
        projectId: params.id,
      },
      data: updateData,
      include: {
        taskType: true,
      },
    })
    
    return NextResponse.json(projectTask)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    await db.projectTask.delete({
      where: { 
        id: params.taskId,
        projectId: params.id,
      },
    })
    
    return NextResponse.json({ success: true }, { status: 204 })
  } catch (error) {
    const status = error instanceof Error && error.message.includes('Record to delete does not exist') ? 404 : 500
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status }
    )
  }
}