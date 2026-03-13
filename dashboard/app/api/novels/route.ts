import { existsSync, readdirSync, readFileSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { PROJECT_ROOT } from '@/lib/paths'

const NOVELS_ROOT = join(PROJECT_ROOT, 'novels')
const ACTIVE_PATH = join(PROJECT_ROOT, '.active_novel')

function ensureNovelsDir() {
  if (!existsSync(NOVELS_ROOT)) mkdirSync(NOVELS_ROOT, { recursive: true })
}

function getActiveNovelId(): string {
  if (existsSync(ACTIVE_PATH)) {
    return readFileSync(ACTIVE_PATH, 'utf-8').trim() || 'default'
  }
  return 'default'
}

function listNovels(): { id: string; title: string; chapterCount: number; createdAt: string }[] {
  ensureNovelsDir()
  const novels: { id: string; title: string; chapterCount: number; createdAt: string }[] = []

  // デフォルト（ルート直下のプロジェクト）を追加
  const defaultBible = join(PROJECT_ROOT, 'bible.md')
  let defaultTitle = 'デフォルト小説'
  if (existsSync(defaultBible)) {
    const match = readFileSync(defaultBible, 'utf-8').match(/\|\s*タイトル\s*\|\s*(.+?)\s*\|/)
    if (match) defaultTitle = match[1].trim()
  }
  const defaultChapters = existsSync(join(PROJECT_ROOT, 'story', 'chapters'))
    ? readdirSync(join(PROJECT_ROOT, 'story', 'chapters')).filter(f => f.endsWith('.md')).length
    : 0
  novels.push({ id: 'default', title: defaultTitle, chapterCount: defaultChapters, createdAt: '' })

  // novels/ 以下を追加
  if (existsSync(NOVELS_ROOT)) {
    for (const dir of readdirSync(NOVELS_ROOT)) {
      const novelPath = join(NOVELS_ROOT, dir)
      const biblePath = join(novelPath, 'bible.md')
      let title = dir
      if (existsSync(biblePath)) {
        const match = readFileSync(biblePath, 'utf-8').match(/\|\s*タイトル\s*\|\s*(.+?)\s*\|/)
        if (match) title = match[1].trim()
      }
      const chaptersPath = join(novelPath, 'story', 'chapters')
      const count = existsSync(chaptersPath)
        ? readdirSync(chaptersPath).filter(f => f.endsWith('.md')).length
        : 0
      // createdAt from directory mtime
      novels.push({ id: dir, title, chapterCount: count, createdAt: '' })
    }
  }

  return novels
}

export async function GET() {
  const novels = listNovels()
  const activeId = getActiveNovelId()
  return NextResponse.json({ novels, activeId })
}

export async function POST(req: NextRequest) {
  const { action, novelId, title } = await req.json()

  if (action === 'switch') {
    writeFileSync(ACTIVE_PATH, novelId, 'utf-8')
    return NextResponse.json({ ok: true, activeId: novelId })
  }

  if (action === 'create') {
    if (!novelId || !title) return NextResponse.json({ error: 'novelId and title required' }, { status: 400 })
    const novelPath = join(NOVELS_ROOT, novelId)
    if (existsSync(novelPath)) return NextResponse.json({ error: 'already exists' }, { status: 409 })

    // ディレクトリ構造を作成
    for (const dir of ['story/chapters', 'story/arcs', 'characters/profiles', 'assets/images', 'exports']) {
      mkdirSync(join(novelPath, dir), { recursive: true })
    }

    // bible.md の初期ファイル
    writeFileSync(join(novelPath, 'bible.md'), `# ${title}\n\n（世界観Bibleをここに記述してください）\n`, 'utf-8')

    // story_tracker.json の初期ファイル
    const tracker = { timeline: [], foreshadowing: [], facts: {}, character_states: {}, chapter_summaries: [] }
    writeFileSync(join(novelPath, 'story', 'story_tracker.json'), JSON.stringify(tracker, null, 2), 'utf-8')

    return NextResponse.json({ ok: true, novelId })
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 })
}
