import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { PROJECT_ROOT } from '@/lib/paths'

const BIBLE_PATH = join(PROJECT_ROOT, 'bible.md')

export async function GET() {
  if (!existsSync(BIBLE_PATH)) {
    return NextResponse.json({ content: '' })
  }
  return NextResponse.json({ content: readFileSync(BIBLE_PATH, 'utf-8') })
}

export async function POST(req: NextRequest) {
  const { content } = await req.json()
  writeFileSync(BIBLE_PATH, content, 'utf-8')
  return NextResponse.json({ ok: true })
}
