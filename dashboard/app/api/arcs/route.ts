import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'fs'
import { join } from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { PROJECT_ROOT } from '@/lib/paths'

const ARCS_DIR = join(PROJECT_ROOT, 'story', 'arcs')

function ensureDir() {
  if (!existsSync(ARCS_DIR)) mkdirSync(ARCS_DIR, { recursive: true })
}

export async function GET() {
  ensureDir()
  const files = readdirSync(ARCS_DIR).filter(f => f.endsWith('.md')).sort()
  const arcs = files.map(f => ({
    filename: f,
    content: readFileSync(join(ARCS_DIR, f), 'utf-8'),
  }))
  return NextResponse.json({ arcs })
}

export async function POST(req: NextRequest) {
  ensureDir()
  const { filename, content } = await req.json()
  writeFileSync(join(ARCS_DIR, filename), content, 'utf-8')
  return NextResponse.json({ ok: true })
}
