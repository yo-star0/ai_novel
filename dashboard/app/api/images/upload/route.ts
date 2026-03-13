import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { PROJECT_ROOT } from '@/lib/paths'

const IMAGES_DIR = join(PROJECT_ROOT, 'assets', 'images')

export async function POST(req: NextRequest) {
  if (!existsSync(IMAGES_DIR)) mkdirSync(IMAGES_DIR, { recursive: true })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const metaJson = formData.get('meta') as string | null

  if (!file) {
    return NextResponse.json({ error: 'ファイルが指定されていません' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!ext || !['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
    return NextResponse.json({ error: '対応形式: png, jpg, webp' }, { status: 400 })
  }

  // ファイル名: 元のファイル名をサニタイズ
  const safeName = file.name.replace(/[^a-zA-Z0-9_\-.\u3000-\u9FFF]/g, '_')
  const filePath = join(IMAGES_DIR, safeName)

  const buffer = Buffer.from(await file.arrayBuffer())
  writeFileSync(filePath, buffer)

  // メタデータがあれば保存
  if (metaJson) {
    try {
      const meta = JSON.parse(metaJson)
      meta.generated_at = new Date().toISOString()
      const metaPath = filePath.replace(/\.(png|jpg|jpeg|webp)$/i, '.json')
      writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf-8')
    } catch { /* メタデータ解析エラーは無視 */ }
  }

  return NextResponse.json({ ok: true, filename: safeName })
}
