import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { PROJECT_ROOT } from '@/lib/paths'

const IMAGES_DIR = join(PROJECT_ROOT, 'assets', 'images')

const MIME_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
}

export async function GET(req: NextRequest, { params }: { params: { filename: string } }) {
  const filename = decodeURIComponent(params.filename)
  // パストラバーサル防止
  if (filename.includes('..') || filename.includes('/')) {
    return NextResponse.json({ error: 'invalid filename' }, { status: 400 })
  }
  const filePath = join(IMAGES_DIR, filename)
  if (!existsSync(filePath)) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  const ext = filename.split('.').pop()?.toLowerCase() || ''
  const mime = MIME_TYPES[ext] || 'application/octet-stream'
  const buffer = readFileSync(filePath)

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': mime,
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
