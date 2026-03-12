import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'fs'
import { join } from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { PROJECT_ROOT } from '@/lib/paths'

const PROFILES_DIR = join(PROJECT_ROOT, 'characters', 'profiles')
const TEMPLATE_PATH = join(PROJECT_ROOT, 'characters', 'templates', 'character_template.json')

function ensureDir() {
  if (!existsSync(PROFILES_DIR)) mkdirSync(PROFILES_DIR, { recursive: true })
}

export async function GET() {
  ensureDir()
  const files = readdirSync(PROFILES_DIR).filter(f => f.endsWith('.json'))
  const characters = files.map(f => {
    try {
      return JSON.parse(readFileSync(join(PROFILES_DIR, f), 'utf-8'))
    } catch { return null }
  }).filter(Boolean)
  return NextResponse.json({ characters })
}

export async function POST(req: NextRequest) {
  ensureDir()
  const data = await req.json()

  // IDがなければ自動生成
  if (!data.id) {
    const existing = readdirSync(PROFILES_DIR).filter(f => f.endsWith('.json'))
    data.id = `char_${String(existing.length + 1).padStart(3, '0')}`
  }

  const filename = `${data.id}.json`
  writeFileSync(join(PROFILES_DIR, filename), JSON.stringify(data, null, 2), 'utf-8')
  return NextResponse.json({ ok: true, id: data.id, filename })
}
