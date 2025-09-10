import { NextRequest, NextResponse } from 'next/server'
import { taskConfiguration } from '@/lib/task-config'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskType = await taskConfiguration.getTaskType(params.id)

    if (!taskType) {
      return NextResponse.json(
        { error: 'Task type not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(taskType)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    const taskType = await taskConfiguration.updateTaskType(params.id, body)

    return NextResponse.json(taskType)
  } catch (error) {
    const status =
      error instanceof Error && error.message.includes('not found') ? 404 : 400
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await taskConfiguration.deleteTaskType(params.id)

    return NextResponse.json({ success: true }, { status: 204 })
  } catch (error) {
    let status = 500
    if (error instanceof Error) {
      if (error.message.includes('not found')) status = 404
      if (error.message.includes('referenced by')) status = 409
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status }
    )
  }
}
