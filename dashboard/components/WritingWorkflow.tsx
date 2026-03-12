'use client'
import { useState } from 'react'

type Step = 'settings' | 'prompt' | 'paste' | 'done'

export default function WritingWorkflow() {
  const [step, setStep] = useState<Step>('settings')

  // Settings
  const [chapterNum, setChapterNum] = useState(1)
  const [arcNum, setArcNum] = useState(1)
  const [tension, setTension] = useState(5)
  const [emotion, setEmotion] = useState('緊張と期待')
  const [targetWords, setTargetWords] = useState(4000)
  const [outline, setOutline] = useState('')

  // Generated
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  // Paste back
  const [chapterText, setChapterText] = useState('')
  const [chapterTitle, setChapterTitle] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    setGenerating(true)
    const res = await fetch('/api/prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chapterNum, arcNum, tension, emotion, targetWords, outline }),
    })
    const data = await res.json()
    setPrompt(data.prompt)
    setGenerating(false)
    setStep('prompt')
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSaveChapter(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const filename = `ch${arcNum}-${String(chapterNum).padStart(2, '0')}_${chapterTitle || 'タイトル'}.md`
    await fetch('/api/chapters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, content: chapterText }),
    })
    setSaving(false)
    setStep('done')
  }

  // ─── Step 1: Settings ───
  if (step === 'settings') {
    return (
      <form onSubmit={handleGenerate} className="space-y-6 max-w-2xl">
        <StepHeader current={1} />
        <div className="bg-gray-900 border border-purple-800 rounded-xl p-6 space-y-4">
          <h3 className="text-white font-semibold">執筆の設定</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">話数</label>
              <input type="number" min={1} value={chapterNum} onChange={e => setChapterNum(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Arc番号</label>
              <input type="number" min={1} value={arcNum} onChange={e => setArcNum(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">テンション値（0=静寂 → 10=最高潮）</label>
            <input type="range" min={0} max={10} value={tension} onChange={e => setTension(Number(e.target.value))}
              className="w-full accent-purple-600" />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>0 静寂</span>
              <span className="text-purple-400 font-bold text-sm">{tension}</span>
              <span>10 クライマックス</span>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">読者に体験させたい感情</label>
            <input value={emotion} onChange={e => setEmotion(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
              placeholder="例: 絶望の中に芽生える小さな希望" />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">目標文字数</label>
            <select value={targetWords} onChange={e => setTargetWords(Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200">
              <option value={2000}>2,000字（短い）</option>
              <option value={4000}>4,000字（標準）</option>
              <option value={6000}>6,000字（長め）</option>
              <option value={8000}>8,000字（しっかり）</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">今話のあらすじ（任意）</label>
            <textarea value={outline} onChange={e => setOutline(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 min-h-[100px] resize-y"
              placeholder="この話で何が起きるか、簡単に書いてください。空欄にするとAIが自動で構成します。" />
          </div>
        </div>

        <button type="submit" disabled={generating}
          className="w-full bg-purple-700 hover:bg-purple-600 text-white py-3 rounded-xl text-sm font-bold transition-colors disabled:bg-gray-700 disabled:cursor-wait">
          {generating ? '生成中...' : '執筆プロンプトを生成する'}
        </button>
      </form>
    )
  }

  // ─── Step 2: Show prompt, copy ───
  if (step === 'prompt') {
    return (
      <div className="space-y-4 max-w-3xl">
        <StepHeader current={2} />
        <div className="bg-gray-900 border border-green-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-green-400 font-semibold text-sm">生成された執筆プロンプト（{prompt.length.toLocaleString()}字）</h3>
            <button onClick={handleCopy}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                copied ? 'bg-green-700 text-green-100' : 'bg-purple-700 hover:bg-purple-600 text-white'
              }`}>
              {copied ? 'コピーしました' : 'クリップボードにコピー'}
            </button>
          </div>
          <pre className="bg-gray-950 rounded-lg p-4 text-xs text-gray-300 overflow-auto max-h-[400px] whitespace-pre-wrap font-mono">
            {prompt}
          </pre>
        </div>

        <div className="bg-yellow-900/30 border border-yellow-800 rounded-xl p-5 text-sm">
          <p className="text-yellow-300 font-bold mb-2">次にやること:</p>
          <ol className="text-yellow-200/70 space-y-1.5">
            <li>1. 上の「コピー」ボタンを押す</li>
            <li>2. Claude Code の Chat（このチャット画面）に貼り付けて送信する</li>
            <li>3. Claude が書いた本文をコピーして、下の「次へ」を押す</li>
          </ol>
        </div>

        <button onClick={() => setStep('paste')}
          className="w-full bg-purple-700 hover:bg-purple-600 text-white py-3 rounded-xl text-sm font-bold transition-colors">
          Claude が書いた本文を保存する →
        </button>
      </div>
    )
  }

  // ─── Step 3: Paste back ───
  if (step === 'paste') {
    return (
      <form onSubmit={handleSaveChapter} className="space-y-4 max-w-3xl">
        <StepHeader current={3} />
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h3 className="text-white font-semibold">本文を貼り付けてください</h3>
          <div>
            <label className="block text-xs text-gray-500 mb-1">タイトル</label>
            <input value={chapterTitle} onChange={e => setChapterTitle(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
              placeholder="例: 覚醒の朝" />
          </div>
          <textarea value={chapterText} onChange={e => setChapterText(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-200 font-mono min-h-[400px] resize-y"
            placeholder="Claude が書いた本文をここに貼り付けてください" />
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span>{chapterText.replace(/\s/g, '').length.toLocaleString()} 字</span>
            {chapterText.includes('[SCENE_BREAK') && <span className="text-green-600">SCENE_BREAK タグあり</span>}
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => setStep('prompt')} className="px-6 py-3 rounded-xl text-sm border border-gray-700 text-gray-400 hover:bg-gray-800">
            ← 戻る
          </button>
          <button type="submit" disabled={saving || !chapterText.trim()}
            className="flex-1 bg-purple-700 hover:bg-purple-600 disabled:bg-gray-700 text-white py-3 rounded-xl text-sm font-bold transition-colors">
            {saving ? '保存中...' : '保存して完了'}
          </button>
        </div>
      </form>
    )
  }

  // ─── Step 4: Done ───
  return (
    <div className="max-w-2xl space-y-6">
      <StepHeader current={4} />
      <div className="bg-green-900/30 border border-green-800 rounded-xl p-8 text-center">
        <div className="text-4xl mb-3">&#x2714;</div>
        <h3 className="text-green-300 text-xl font-bold mb-2">第{chapterNum}話「{chapterTitle || 'タイトル'}」を保存しました</h3>
        <p className="text-green-200/60 text-sm mb-6">
          story/chapters/ch{arcNum}-{String(chapterNum).padStart(2, '0')}_{chapterTitle || 'タイトル'}.md
        </p>
        <div className="flex gap-3 justify-center">
          <a href="/chapters" className="px-5 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700">
            章一覧を見る
          </a>
          <button onClick={() => { setStep('settings'); setChapterNum(chapterNum + 1); setChapterText(''); setChapterTitle('') }}
            className="px-5 py-2 bg-purple-700 text-white rounded-lg text-sm hover:bg-purple-600">
            次の話を書く（第{chapterNum + 1}話）
          </button>
        </div>
      </div>
    </div>
  )
}

function StepHeader({ current }: { current: number }) {
  const steps = ['設定', 'プロンプト生成', '本文を保存', '完了']
  return (
    <div className="flex items-center gap-2 mb-2">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
            i + 1 < current ? 'bg-green-800 text-green-300' :
            i + 1 === current ? 'bg-purple-700 text-white' : 'bg-gray-800 text-gray-600'
          }`}>{i + 1 < current ? '\u2714' : i + 1}</div>
          <span className={`text-xs ${i + 1 === current ? 'text-white' : 'text-gray-600'}`}>{label}</span>
          {i < steps.length - 1 && <div className="w-8 h-px bg-gray-800" />}
        </div>
      ))}
    </div>
  )
}
