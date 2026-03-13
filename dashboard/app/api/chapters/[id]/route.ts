import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { PROJECT_ROOT } from '@/lib/paths'

const CHAPTERS_DIR = join(PROJECT_ROOT, 'story', 'chapters')

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const filename = decodeURIComponent(params.id) + '.md'
  const filePath = join(CHAPTERS_DIR, filename)
  if (!existsSync(filePath)) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }
  const content = readFileSync(filePath, 'utf-8')
  return NextResponse.json({ filename, content })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const filename = decodeURIComponent(params.id) + '.md'
  const filePath = join(CHAPTERS_DIR, filename)
  if (!existsSync(filePath)) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }
  const { content } = await req.json()
  writeFileSync(filePath, content, 'utf-8')
  return NextResponse.json({ ok: true, filename })
}
