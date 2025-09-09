import { NextRequest, NextResponse } from 'next/server'
import { estimationEngine } from '@/lib/estimation-engine'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const estimate = await estimationEngine.calculateProjectEstimate(params.id)
    
    return NextResponse.json(estimate)
  } catch (error) {
    let status = 500
    if (error instanceof Error && error.message.includes('not found')) {
      status = 404
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await estimationEngine.recalculateProjectTotals(params.id)
    
    return NextResponse.json({ success: true, message: 'Project totals recalculated' })
  } catch (error) {
    let status = 500
    if (error instanceof Error && error.message.includes('not found')) {
      status = 404
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status }
    )
  }
}