import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { PROJECT_ROOT } from '@/lib/paths'

const TRACKER_PATH = join(PROJECT_ROOT, 'story', 'story_tracker.json')

export async function GET() {
  if (!existsSync(TRACKER_PATH)) {
    return NextResponse.json({ tracker: null })
  }
  try {
    return NextResponse.json({ tracker: JSON.parse(readFileSync(TRACKER_PATH, 'utf-8')) })
  } catch {
    return NextResponse.json({ tracker: null })
  }
}

export async function POST(req: NextRequest) {
  const { tracker } = await req.json()
  writeFileSync(TRACKER_PATH, JSON.stringify(tracker, null, 2), 'utf-8')
  return NextResponse.json({ ok: true })
}
