'use client'
import { useState } from 'react'

interface ScenePrompt {
  scene_id: string
  characters: string[]
  emotion: string
  location: string
  context: string
  positive_prompt: string
  negative_prompt: string
}

interface Props {
  chapterFile: string
}

export default function PromptViewer({ chapterFile }: Props) {
  const [prompts, setPrompts] = useState<ScenePrompt[]>([])
  const [loading, setLoading] = useState(false)
  const [extracted, setExtracted] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  async function handleExtract() {
    setLoading(true)
    try {
      const res = await fetch('/api/prompts/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterFile }),
      })
      const data = await res.json()
      setPrompts(data.prompts || [])
      setExtracted(true)
    } finally {
      setLoading(false)
    }
  }

  async function copyToClipboard(text: string, id: string) {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // nanobanana用にフォーマット整形
  function formatForNanobanana(p: ScenePrompt): string {
    return `Positive Prompt:\n${p.positive_prompt}\n\nNegative Prompt:\n${p.negative_prompt}`
  }

  if (!extracted) {
    return (
      <button
        onClick={handleExtract}
        disabled={loading}
        className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
          loading ? 'bg-gray-700 text-gray-400 cursor-wait' : 'bg-purple-700 hover:bg-purple-600 text-white'
        }`}
      >
        {loading ? '抽出中...' : '挿絵プロンプトを抽出する'}
      </button>
    )
  }

  if (prompts.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
        <p className="text-gray-500 text-sm">SCENE_BREAK タグが見つかりませんでした</p>
        <p className="text-gray-600 text-xs mt-1">
          本文中に [SCENE_BREAK: シーンID, キャラ名, 感情, 場所] タグを追加してください
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-purple-300 font-semibold text-sm">
          挿絵プロンプト（{prompts.length} シーン）
        </h3>
        <button
          onClick={handleExtract}
          className="text-xs text-gray-500 hover:text-gray-300"
        >
          再抽出
        </button>
      </div>

      {prompts.map((p) => (
        <div key={p.scene_id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
          {/* ヘッダー */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-purple-400 bg-purple-900/30 px-2 py-0.5 rounded">
                {p.scene_id}
              </span>
              <span className="text-xs text-gray-400">
                {p.characters.join(', ')}
              </span>
              <span className="text-xs text-gray-600">
                {p.emotion} / {p.location}
              </span>
            </div>
          </div>

          {/* コンテキスト */}
          {p.context && (
            <p className="text-xs text-gray-600 italic border-l-2 border-gray-800 pl-3">
              {p.context.slice(-100)}
            </p>
          )}

          {/* Positive Prompt */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs text-green-500 font-semibold">Positive Prompt</label>
              <button
                onClick={() => copyToClipboard(p.positive_prompt, `pos-${p.scene_id}`)}
                className={`text-xs px-2 py-0.5 rounded transition-colors ${
                  copiedId === `pos-${p.scene_id}` ? 'text-green-400' : 'text-gray-500 hover:text-white'
                }`}
              >
                {copiedId === `pos-${p.scene_id}` ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="bg-gray-950 rounded p-3 text-xs text-gray-300 whitespace-pre-wrap break-all font-mono">
              {p.positive_prompt}
            </pre>
          </div>

          {/* Negative Prompt */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs text-red-500 font-semibold">Negative Prompt</label>
              <button
                onClick={() => copyToClipboard(p.negative_prompt, `neg-${p.scene_id}`)}
                className={`text-xs px-2 py-0.5 rounded transition-colors ${
                  copiedId === `neg-${p.scene_id}` ? 'text-green-400' : 'text-gray-500 hover:text-white'
                }`}
              >
                {copiedId === `neg-${p.scene_id}` ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="bg-gray-950 rounded p-3 text-xs text-red-300/60 whitespace-pre-wrap break-all font-mono">
              {p.negative_prompt}
            </pre>
          </div>

          {/* nanobanana用一括コピー */}
          <button
            onClick={() => copyToClipboard(formatForNanobanana(p), `all-${p.scene_id}`)}
            className={`w-full py-2 rounded-lg text-xs font-semibold transition-colors border ${
              copiedId === `all-${p.scene_id}`
                ? 'border-green-700 text-green-400 bg-green-900/20'
                : 'border-gray-700 text-gray-400 hover:text-white hover:border-gray-600'
            }`}
          >
            {copiedId === `all-${p.scene_id}` ? 'nanobanana用にコピーしました!' : 'nanobanana用に一括コピー'}
          </button>
        </div>
      ))}
    </div>
  )
}
