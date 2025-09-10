import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const project = await db.project.findUnique({
      where: { id: params.id },
      include: {
        tasks: {
          include: {
            taskType: true,
          },
          orderBy: [
            { taskType: { category: 'asc' } },
            { taskType: { name: 'asc' } },
          ],
        },
        _count: {
          select: { tasks: true },
        },
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json(project)
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
    const { name, description, status } = body

    if (
      name !== undefined &&
      (typeof name !== 'string' || name.trim().length === 0)
    ) {
      return NextResponse.json(
        { error: 'Name must be a non-empty string' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name.trim()
    if (description !== undefined)
      updateData.description = description?.trim() || null
    if (status !== undefined) updateData.status = status

    const project = await db.project.update({
      where: { id: params.id },
      data: updateData,
      include: {
        tasks: {
          include: {
            taskType: true,
          },
          orderBy: [
            { taskType: { category: 'asc' } },
            { taskType: { name: 'asc' } },
          ],
        },
        _count: {
          select: { tasks: true },
        },
      },
    })

    return NextResponse.json(project)
  } catch (error) {
    const status =
      error instanceof Error &&
      error.message.includes('Record to update not found')
        ? 404
        : 400
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
    await db.project.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true }, { status: 204 })
  } catch (error) {
    const status =
      error instanceof Error &&
      error.message.includes('Record to delete does not exist')
        ? 404
        : 500
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status }
    )
  }
}
