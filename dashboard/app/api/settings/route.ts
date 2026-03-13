import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const ENV_PATH = join(process.cwd(), '.env.local')

function parseEnv(): Record<string, string> {
  if (!existsSync(ENV_PATH)) return {}
  const content = readFileSync(ENV_PATH, 'utf-8')
  const result: Record<string, string> = {}
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq > 0) {
      result[trimmed.slice(0, eq)] = trimmed.slice(eq + 1)
    }
  }
  return result
}

function writeEnv(vars: Record<string, string>) {
  const lines = [
    '# 画像生成API設定（差し替え可能）',
    '# Google Gemini API（無料枠）',
    `GEMINI_API_KEY=${vars.GEMINI_API_KEY || ''}`,
    '',
    '# Stable Diffusion WebUI API（ローカル）',
    `SD_API_BASE=${vars.SD_API_BASE || 'http://localhost:7860'}`,
    '',
    '# API切り替え: "gemini" | "sd_webui" | "manual"',
    `IMAGE_GEN_MODE=${vars.IMAGE_GEN_MODE || 'manual'}`,
    '',
  ]
  writeFileSync(ENV_PATH, lines.join('\n'), 'utf-8')
}

export async function GET() {
  const vars = parseEnv()
  // APIキーはマスクして返す
  const masked: Record<string, string> = { ...vars }
  if (masked.GEMINI_API_KEY) {
    const key = masked.GEMINI_API_KEY
    masked.GEMINI_API_KEY = key.slice(0, 8) + '...' + key.slice(-4)
  }
  return NextResponse.json({ settings: masked })
}

export async function POST(req: NextRequest) {
  const { settings } = await req.json()
  const current = parseEnv()

  // マスクされていない値のみ更新
  for (const [key, val] of Object.entries(settings as Record<string, string>)) {
    if (val && !val.includes('...')) {
      current[key] = val
    }
  }

  writeEnv(current)
  return NextResponse.json({ ok: true })
}
