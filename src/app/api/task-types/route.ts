import { NextRequest, NextResponse } from 'next/server'
import { taskConfiguration } from '@/lib/task-config'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const activeParam = searchParams.get('active')
    
    const options: any = {}
    if (category) options.category = category
    if (activeParam !== null) options.active = activeParam === 'true'

    const taskTypes = await taskConfiguration.listTaskTypes(options)
    
    return NextResponse.json(taskTypes)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const taskType = await taskConfiguration.createTaskType(body)
    
    return NextResponse.json(taskType, { status: 201 })
  } catch (error) {
    const status = error instanceof Error && error.message.includes('unique constraint') ? 409 : 400
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status }
    )
  }
}