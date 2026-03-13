import { readFileSync, existsSync, readdirSync } from 'fs'
import { join } from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { PROJECT_ROOT } from '@/lib/paths'

/**
 * 章本文から挿絵用SDプロンプトを抽出する
 * prompt_extractor.py のTS版
 */

const ILLUSTRATION_TRIGGERS = [
  /初めて.*?(現れ|登場|姿を見せ)/,
  /(涙|泣き|泣い)/,
  /(叫び|叫ん|叫んだ)/,
  /(笑顔|微笑|ほほ笑)/,
  /(魔法|術|技|攻撃|防御)/,
  /(爆発|閃光|轟音)/,
  /(夕日|夕焼け|朝日|星空|月明かり)/,
  /(剣|刀|銃|武器).*?(振|放)/,
  /(抱きしめ|抱擁|ハグ)/,
  /(絶望|希望|決意)/,
]

const QUALITY_POS = 'masterpiece, best quality, ultra-detailed, 8k wallpaper, professional illustration'
const QUALITY_NEG = 'lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry'

interface SceneBreak {
  id: string
  characters: string[]
  emotion: string
  location: string
  text_context: string
}

function loadCharacterSdPrompts(): Record<string, { positive: string; negative: string }> {
  const dir = join(PROJECT_ROOT, 'characters', 'profiles')
  if (!existsSync(dir)) return {}
  const result: Record<string, { positive: string; negative: string }> = {}
  for (const f of readdirSync(dir).filter(f => f.endsWith('.json'))) {
    try {
      const data = JSON.parse(readFileSync(join(dir, f), 'utf-8'))
      const name = data.basic?.name?.full || ''
      const pos = data.sd_prompts?.base_positive || ''
      const neg = data.sd_prompts?.base_negative || ''
      if (name && pos) result[name] = { positive: pos, negative: neg }
    } catch { /* skip */ }
  }
  return result
}

function parseSceneBreaks(text: string): SceneBreak[] {
  const scenes: SceneBreak[] = []
  const regex = /\[SCENE_BREAK:\s*([^,\]]+),\s*([^,\]]+),\s*([^,\]]+),\s*([^\]]+)\]/g
  let match
  while ((match = regex.exec(text)) !== null) {
    const startIdx = Math.max(0, match.index - 500)
    scenes.push({
      id: match[1].trim(),
      characters: match[2].trim().split(/[・&+]/).map(s => s.trim()),
      emotion: match[3].trim(),
      location: match[4].trim(),
      text_context: text.slice(startIdx, match.index).trim().slice(-200),
    })
  }
  return scenes
}

function emotionToTags(emotion: string): string {
  const map: Record<string, string> = {
    '怒り': 'angry, clenched fists, intense eyes',
    '悲しみ': 'sad, tearful, looking down',
    '喜び': 'happy, smiling, bright eyes',
    '恐怖': 'scared, trembling, wide eyes',
    '驚き': 'surprised, wide eyes, open mouth',
    '緊張': 'tense, serious expression, determined',
    '絶望': 'despair, hollow eyes, slumped shoulders',
    '希望': 'hopeful, soft smile, looking up',
    '決意': 'determined, strong gaze, confident pose',
    '安堵': 'relieved, gentle smile, relaxed posture',
  }
  for (const [key, tags] of Object.entries(map)) {
    if (emotion.includes(key)) return tags
  }
  return 'emotional, expressive'
}

function locationToTags(location: string): string {
  const map: Record<string, string> = {
    '森': 'forest, trees, dappled sunlight, nature',
    '城': 'castle, stone walls, medieval architecture',
    '街': 'town, cobblestone street, buildings',
    '海': 'ocean, waves, beach, horizon',
    '山': 'mountain, rocky terrain, high altitude',
    '洞窟': 'cave, dark, stalactites, underground',
    '教室': 'classroom, school, desks, windows',
    '部屋': 'indoor, room, furniture, window light',
    '戦場': 'battlefield, dramatic sky, debris',
    '神殿': 'temple, sacred, ornate pillars, mystical light',
  }
  for (const [key, tags] of Object.entries(map)) {
    if (location.includes(key)) return tags
  }
  return `${location}, detailed background`
}

function findTriggeredScenes(text: string): { line: string; trigger: string; lineIdx: number }[] {
  const lines = text.split('\n')
  const found: { line: string; trigger: string; lineIdx: number }[] = []
  for (let i = 0; i < lines.length; i++) {
    for (const trigger of ILLUSTRATION_TRIGGERS) {
      if (trigger.test(lines[i])) {
        found.push({ line: lines[i], trigger: trigger.source, lineIdx: i })
        break
      }
    }
  }
  return found
}

export async function POST(req: NextRequest) {
  const { chapterFile } = await req.json()
  const filePath = join(PROJECT_ROOT, 'story', 'chapters', chapterFile)
  if (!existsSync(filePath)) {
    return NextResponse.json({ error: 'chapter not found' }, { status: 404 })
  }
  const text = readFileSync(filePath, 'utf-8')
  const charPrompts = loadCharacterSdPrompts()

  // SCENE_BREAKタグからプロンプト生成
  const scenes = parseSceneBreaks(text)
  const prompts = scenes.map(scene => {
    const charTags = scene.characters
      .map(c => charPrompts[c]?.positive || `1girl, ${c}`)
      .join(', ')
    const emotionTags = emotionToTags(scene.emotion)
    const locationTags = locationToTags(scene.location)

    const positive = `${QUALITY_POS}, ${charTags}, ${emotionTags}, ${locationTags}`
    const negative = QUALITY_NEG

    return {
      scene_id: scene.id,
      characters: scene.characters,
      emotion: scene.emotion,
      location: scene.location,
      context: scene.text_context,
      positive_prompt: positive,
      negative_prompt: negative,
    }
  })

  // トリガーワードによる追加候補
  const triggered = findTriggeredScenes(text)

  return NextResponse.json({ prompts, triggered_scenes: triggered })
}
