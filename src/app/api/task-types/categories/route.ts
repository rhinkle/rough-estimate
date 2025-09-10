import { NextResponse } from 'next/server'
import { taskConfiguration } from '@/lib/task-config'

export async function GET() {
  try {
    const categories = await taskConfiguration.getTaskTypeCategories()

    return NextResponse.json(categories)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
