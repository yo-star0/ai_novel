'use client'
import { useState } from 'react'
import SaveButton from './SaveButton'

interface CharacterData {
  id: string
  basic: {
    name: { full: string; reading: string; nickname: string[] }
    role: string
    gender: string
    age: { value: number; appearance: string }
    occupation: string
  }
  appearance: {
    height_cm: number
    body_type: string
    silhouette_key: string
    hair: { color: string; length: string; style: string }
    eyes: { color: string; shape: string }
    voice: { pitch: string; tone: string }
  }
  psychology: {
    core_desire: string
    core_fear: string
    wound: string
    misbelief: string
    want: string
    need: string
  }
  personality: {
    traits_positive: string[]
    traits_negative: string[]
    contradictions: string
  }
  speech_patterns: {
    first_person: string
    sentence_endings: string
    vocabulary_level: string
    catchphrase: string[]
    speech_samples: { context: string; line: string }[]
  }
  story_arc: {
    initial_state: string
    goal: string
    transformation: string
  }
  sd_prompts: {
    base_positive: string
    base_negative: string
  }
}

const EMPTY: CharacterData = {
  id: '',
  basic: { name: { full: '', reading: '', nickname: [] }, role: 'support', gender: '', age: { value: 0, appearance: '' }, occupation: '' },
  appearance: { height_cm: 0, body_type: '標準', silhouette_key: '', hair: { color: '', length: 'ミディアム', style: '' }, eyes: { color: '', shape: '標準' }, voice: { pitch: '標準', tone: '' } },
  psychology: { core_desire: '', core_fear: '', wound: '', misbelief: '', want: '', need: '' },
  personality: { traits_positive: [], traits_negative: [], contradictions: '' },
  speech_patterns: { first_person: '', sentence_endings: '', vocabulary_level: '標準', catchphrase: [], speech_samples: [
    { context: '挨拶', line: '' }, { context: '怒り', line: '' }, { context: '悲しみ', line: '' }, { context: '喜び', line: '' }
  ]},
  story_arc: { initial_state: '', goal: '', transformation: '' },
  sd_prompts: { base_positive: '', base_negative: 'lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, jpeg artifacts, signature, watermark, blurry' },
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h3 className="text-sm font-bold text-purple-400 mb-4 pb-2 border-b border-gray-800">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, textarea, half }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; textarea?: boolean; half?: boolean
}) {
  const cls = `w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-600 ${textarea ? 'min-h-[80px] resize-y' : ''}`
  return (
    <div className={half ? 'flex-1 min-w-0' : ''}>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      {textarea
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={cls} />
        : <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={cls} />
      }
    </div>
  )
}

function Select({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-600">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

export default function CharacterForm({ initial, onSaved }: { initial?: CharacterData; onSaved?: () => void }) {
  const [data, setData] = useState<CharacterData>(initial || EMPTY)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function set<K extends keyof CharacterData>(section: K, updates: Partial<CharacterData[K]>) {
    setData(prev => ({ ...prev, [section]: { ...prev[section] as object, ...updates } }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/characters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    onSaved?.()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-3xl">
      <Section title="基本情報">
        <div className="flex gap-3">
          <Field half label="名前" value={data.basic.name.full} onChange={v => set('basic', { name: { ...data.basic.name, full: v } })} placeholder="日向 蒼" />
          <Field half label="読み" value={data.basic.name.reading} onChange={v => set('basic', { name: { ...data.basic.name, reading: v } })} placeholder="ひなた あお" />
        </div>
        <div className="flex gap-3">
          <Select label="役割" value={data.basic.role} onChange={v => set('basic', { role: v })} options={['protagonist', 'deuteragonist', 'antagonist', 'support', 'mob']} />
          <Field half label="性別" value={data.basic.gender} onChange={v => set('basic', { gender: v })} placeholder="男性 / 女性 / ..." />
          <div>
            <label className="block text-xs text-gray-500 mb-1">年齢</label>
            <input type="number" value={data.basic.age.value || ''} onChange={e => set('basic', { age: { ...data.basic.age, value: Number(e.target.value) } })}
              className="w-24 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-600" />
          </div>
        </div>
        <Field label="職業・身分" value={data.basic.occupation} onChange={v => set('basic', { occupation: v })} placeholder="学生 / 魔法使い / 騎士 ..." />
      </Section>

      <Section title="外見（アニメ化・挿絵用）">
        <Field label="シルエットの特徴（このキャラを一目で見分ける特徴）" value={data.appearance.silhouette_key} onChange={v => set('appearance', { silhouette_key: v })} placeholder="長い三つ編み、大きなマント" />
        <div className="flex gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">身長 (cm)</label>
            <input type="number" value={data.appearance.height_cm || ''} onChange={e => set('appearance', { height_cm: Number(e.target.value) })}
              className="w-24 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-600" />
          </div>
          <Select label="体型" value={data.appearance.body_type} onChange={v => set('appearance', { body_type: v })} options={['細身', '標準', '筋肉質', 'がっしり', 'ふくよか']} />
        </div>
        <div className="flex gap-3">
          <Field half label="髪の色" value={data.appearance.hair.color} onChange={v => set('appearance', { hair: { ...data.appearance.hair, color: v } })} placeholder="黒 / 銀 / 赤茶" />
          <Select label="髪の長さ" value={data.appearance.hair.length} onChange={v => set('appearance', { hair: { ...data.appearance.hair, length: v } })} options={['超ショート', 'ショート', 'ミディアム', 'セミロング', 'ロング', '超ロング']} />
          <Field half label="髪型" value={data.appearance.hair.style} onChange={v => set('appearance', { hair: { ...data.appearance.hair, style: v } })} placeholder="ポニーテール / ツインテール" />
        </div>
        <div className="flex gap-3">
          <Field half label="目の色" value={data.appearance.eyes.color} onChange={v => set('appearance', { eyes: { ...data.appearance.eyes, color: v } })} placeholder="碧 / 琥珀" />
          <Select label="目の形" value={data.appearance.eyes.shape} onChange={v => set('appearance', { eyes: { ...data.appearance.eyes, shape: v } })} options={['つり目', 'たれ目', '丸目', '細目', '標準']} />
        </div>
      </Section>

      <Section title="内面・心理">
        <Field label="核心欲求（一番欲しいもの）" value={data.psychology.core_desire} onChange={v => set('psychology', { core_desire: v })} placeholder="自由 / 愛されること / 力 / 真実" />
        <Field label="核心恐怖（一番恐れるもの）" value={data.psychology.core_fear} onChange={v => set('psychology', { core_fear: v })} placeholder="孤独 / 無力感 / 裏切り" />
        <Field label="トラウマ（行動原理の根源）" value={data.psychology.wound} onChange={v => set('psychology', { wound: v })} placeholder="幼少期に..." textarea />
        <Field label="誤った信念（物語で乗り越えるもの）" value={data.psychology.misbelief} onChange={v => set('psychology', { misbelief: v })} placeholder="「人を信じれば裏切られる」" />
      </Section>

      <Section title="話し方（最重要 — 執筆時に厳密に従います）">
        <div className="flex gap-3">
          <Field half label="一人称" value={data.speech_patterns.first_person} onChange={v => set('speech_patterns', { first_person: v })} placeholder="俺 / 私 / 僕 / あたし / 吾輩" />
          <Field half label="語尾の特徴" value={data.speech_patterns.sentence_endings} onChange={v => set('speech_patterns', { sentence_endings: v })} placeholder="〜だぜ / 〜ですわ / 〜じゃ" />
          <Select label="語彙レベル" value={data.speech_patterns.vocabulary_level} onChange={v => set('speech_patterns', { vocabulary_level: v })} options={['幼稚', '標準', '知的', '専門的', '時代がかった']} />
        </div>
        <div className="mt-3">
          <label className="block text-xs text-gray-500 mb-2">セリフ例（場面ごと）</label>
          <div className="space-y-2">
            {data.speech_patterns.speech_samples.map((s, i) => (
              <div key={i} className="flex gap-2 items-center">
                <span className="text-xs text-gray-600 w-14 flex-shrink-0">{s.context}</span>
                <span className="text-gray-700">「</span>
                <input value={s.line} onChange={e => {
                  const samples = [...data.speech_patterns.speech_samples]
                  samples[i] = { ...samples[i], line: e.target.value }
                  set('speech_patterns', { speech_samples: samples })
                }}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-600"
                  placeholder={`${s.context}の時のセリフ例`}
                />
                <span className="text-gray-700">」</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section title="物語での役割">
        <Field label="物語冒頭での状態" value={data.story_arc.initial_state} onChange={v => set('story_arc', { initial_state: v })} placeholder="平凡な日常を送っている" />
        <Field label="目標" value={data.story_arc.goal} onChange={v => set('story_arc', { goal: v })} placeholder="失われた記憶を取り戻す" />
        <Field label="成長・変化" value={data.story_arc.transformation} onChange={v => set('story_arc', { transformation: v })} placeholder="他者を信じられるようになる" textarea />
      </Section>

      <Section title="画像生成用（Stable Diffusion）">
        <Field label="外見プロンプト（英語）" value={data.sd_prompts.base_positive} onChange={v => set('sd_prompts', { base_positive: v })} placeholder="1girl, blue eyes, long silver hair, school uniform, ..." textarea />
      </Section>

      <SaveButton saving={saving} saved={saved} label="キャラクターを保存する" />
    </form>
  )
}
