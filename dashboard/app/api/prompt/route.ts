import { readFileSync, existsSync, readdirSync } from 'fs'
import { join } from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { PROJECT_ROOT } from '@/lib/paths'

/**
 * chapter_writer.py と同等のプロンプト生成をTypeScriptで実装
 * Pythonを呼び出さないため、環境依存なくブラウザから直接生成できる
 */

function loadBible(): string {
  const p = join(PROJECT_ROOT, 'bible.md')
  return existsSync(p) ? readFileSync(p, 'utf-8') : ''
}

function loadTracker(): Record<string, unknown> {
  const p = join(PROJECT_ROOT, 'story', 'story_tracker.json')
  if (!existsSync(p)) return {}
  try { return JSON.parse(readFileSync(p, 'utf-8')) } catch { return {} }
}

function loadCharacters(): Record<string, unknown>[] {
  const dir = join(PROJECT_ROOT, 'characters', 'profiles')
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .map(f => { try { return JSON.parse(readFileSync(join(dir, f), 'utf-8')) } catch { return null } })
    .filter(Boolean) as Record<string, unknown>[]
}

function loadPreviousChapter(): string {
  const dir = join(PROJECT_ROOT, 'story', 'chapters')
  if (!existsSync(dir)) return ''
  const files = readdirSync(dir).filter(f => f.endsWith('.md')).sort()
  if (!files.length) return ''
  const text = readFileSync(join(dir, files[files.length - 1]), 'utf-8')
  return text.slice(-1500)
}

function buildCharactersBlock(chars: Record<string, unknown>[]): string {
  if (!chars.length) return '（キャラクター未登録）'
  return chars.map(c => {
    const b = (c.basic || {}) as Record<string, unknown>
    const name = ((b.name || {}) as Record<string, string>).full || '?'
    const role = (b.role || '') as string
    const ps = (c.psychology || {}) as Record<string, string>
    const sp = (c.speech_patterns || {}) as Record<string, unknown>
    const samples = (sp.speech_samples || []) as { context: string; line: string }[]
    const sampleText = samples.filter(s => s.line).map(s => `    ${s.context}: 「${s.line}」`).join('\n')
    return `### ${name}（${role}）
- 一人称: ${sp.first_person || '?'}　語尾: ${sp.sentence_endings || '?'}
- 欲求: ${ps.core_desire || '?'}　恐怖: ${ps.core_fear || '?'}
- トラウマ: ${ps.wound || '?'}
${sampleText ? `- セリフ例:\n${sampleText}` : ''}`
  }).join('\n\n')
}

function buildForeshadowingBlock(tracker: Record<string, unknown>, chapterNum: number): string {
  const fs = (tracker.foreshadowing || []) as { status: string; description: string; planted_chapter: number; resolution_chapter: number | null; id: string }[]
  const toResolve = fs.filter(f => f.status === 'planted' && f.resolution_chapter != null && f.resolution_chapter <= chapterNum)
  const active = fs.filter(f => f.status === 'planted' && (f.resolution_chapter == null || f.resolution_chapter > chapterNum))
  let text = ''
  if (toResolve.length) {
    text += '### 今話で回収すべき伏線\n' + toResolve.map(f => `- ${f.description}（第${f.planted_chapter}話で埋め込み）`).join('\n') + '\n\n'
  }
  if (active.length) {
    text += '### 現在生きている伏線（矛盾させないこと）\n' + active.map(f => `- ${f.description}`).join('\n')
  }
  return text || '（伏線なし）'
}

export async function POST(req: NextRequest) {
  const { chapterNum, arcNum, tension, emotion, targetWords, outline } = await req.json()

  const bible = loadBible()
  const tracker = loadTracker()
  const chars = loadCharacters()
  const prevChapter = loadPreviousChapter()
  const minParagraphs = Math.max(20, Math.floor(targetWords / 200))

  const prompt = `# Claude Code 執筆依頼 — 第${chapterNum}話（Arc ${arcNum}）

あなたは「プロの文芸編集者」と「直木賞級の小説家」の二役を担うAIです。
下記の設定・ルールを完全に把握した上で、第${chapterNum}話を二段階（批評→執筆）で完成させてください。

---

## 絶対ルール（違反禁止）

| 記号 | 正 | 誤 |
|------|----|----|
| 三点リーダー | \`……\`（2個セット） | \`…\`（単体） |
| ダッシュ | \`——\`（2個セット） | \`—\`（単体） |
| 感嘆符・疑問符 | \`！　\` \`？　\`（後に全角スペース） | \`! \`（半角）|
| 行頭字下げ | 　（全角スペース1文字） | なし |
| カギ括弧閉じ | 「セリフ」（句点なし） | 「セリフ。」 |

- 三人称限定視点（POVキャラ以外の内心描写禁止）
- 過去形統一
- Show, don't Tell（感情を行動・表情で表現）
- 説明台詞禁止
- セリフの間に必ず行動・表情・心理を挟む
- 各シーン末尾に \`[SCENE_BREAK: シーンID, キャラ名, 感情, 場所]\` タグを付与

---

## 世界観Bible

${bible.slice(0, 3000) || '（未設定 — ダッシュボードの「世界観」から設定してください）'}

---

## キャラクター設定

${buildCharactersBlock(chars)}

---

## 伏線管理

${buildForeshadowingBlock(tracker, chapterNum)}

---

## 感情曲線設計

- テンション値: **${tension} / 10**
- 読者に体験させたい感情: **${emotion}**

---

${prevChapter ? `## 直前話の末尾（文体参照）\n\n…${prevChapter}\n\n---\n\n` : ''}
${outline ? `## 今話のアウトライン\n\n${outline}\n\n---\n\n` : ''}

## PHASE 1 — 編集者として批評せよ

概要を批評してください:
1. 感情曲線は計算されているか？
2. キャラの行動に動機があるか？
3. Show vs Tell
4. 伏線の活用は適切か？

批評後、Phase 2 に進んでください。

---

## PHASE 2 — 作家として本文を執筆せよ

出力フォーマット:
\`\`\`
# 第${chapterNum}話「（タイトル）」

（本文）

[SCENE_BREAK: scene01, キャラ名, 感情, 場所]

（次シーン）
\`\`\`

品質要件:
- **${targetWords}字以上**・最低${minParagraphs}段落
- 冒頭は感覚描写で掴む
- 最終段落は次話への余韻

自己検閲:
- ……は2個セットか？　——は2個セットか？
- ！？の後に全角スペースがあるか？
- 行頭字下げがあるか？
- POVキャラ以外の内心はないか？
- [SCENE_BREAK] タグは全シーンにあるか？`

  return NextResponse.json({ prompt, charCount: prompt.length })
}
