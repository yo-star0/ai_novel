import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { PROJECT_ROOT } from '@/lib/paths'

const CHAPTERS_DIR = join(PROJECT_ROOT, 'story', 'chapters')

export async function POST(req: NextRequest) {
  if (!existsSync(CHAPTERS_DIR)) mkdirSync(CHAPTERS_DIR, { recursive: true })
  const { filename, content } = await req.json()
  writeFileSync(join(CHAPTERS_DIR, filename), content, 'utf-8')
  return NextResponse.json({ ok: true, path: `story/chapters/${filename}` })
}
