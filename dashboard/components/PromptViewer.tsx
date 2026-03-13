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
  const [expandedId, setExpandedId] = useState<string | null>(null)

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
      if (data.prompts?.length > 0) setExpandedId(data.prompts[0].scene_id)
    } finally {
      setLoading(false)
    }
  }

  async function copyToClipboard(text: string, id: string) {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  function formatForNanobanana(p: ScenePrompt): string {
    return `Positive Prompt:\n${p.positive_prompt}\n\nNegative Prompt:\n${p.negative_prompt}`
  }

  if (!extracted) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        {/* 使い方説明 */}
        <div className="flex items-start gap-4 mb-5">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-900/40 border border-purple-700 flex items-center justify-center text-purple-400 text-lg">
            🖼
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm mb-1">挿絵プロンプトを自動生成</h3>
            <p className="text-gray-500 text-xs leading-relaxed">
              本文中の <code className="bg-gray-800 px-1 rounded">[SCENE_BREAK]</code> タグからシーンを検出し、
              nanobanana・Stable Diffusion 向けのプロンプトを自動生成します。
              生成後は <strong className="text-gray-300">「nanobanana用に一括コピー」</strong> ボタンで即座にコピーできます。
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleExtract}
            disabled={loading}
            className={`w-full py-3 rounded-xl text-sm font-bold transition-colors ${
              loading ? 'bg-gray-700 text-gray-400 cursor-wait' : 'bg-purple-700 hover:bg-purple-600 text-white'
            }`}
          >
            {loading ? '解析中...' : '挿絵プロンプトを抽出する'}
          </button>
          <p className="text-center text-xs text-gray-600">
            ※ SCENE_BREAK タグがない場合は検出されません。
            <a href="/help#illustration" className="text-purple-500 hover:text-purple-400 ml-1">使い方を見る</a>
          </p>
        </div>
      </div>
    )
  }

  if (prompts.length === 0) {
    return (
      <div className="bg-gray-900 border border-yellow-800/50 rounded-xl p-6 text-center space-y-3">
        <div className="text-3xl">🔍</div>
        <p className="text-yellow-300 text-sm font-semibold">SCENE_BREAK タグが見つかりませんでした</p>
        <p className="text-gray-500 text-xs">
          本文中に以下の形式でタグを追加すると挿絵プロンプトが生成されます。
        </p>
        <pre className="bg-gray-950 rounded p-3 text-xs text-green-400 font-mono text-left inline-block">
          {`[SCENE_BREAK: scene01, キャラ名, 感情, 場所]`}
        </pre>
        <p className="text-xs text-gray-600">
          Claudeが書いた本文には自動でこのタグが含まれます。
        </p>
        <button onClick={handleExtract} className="text-xs text-purple-400 hover:text-purple-300">
          再抽出する
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-purple-300 font-semibold text-sm">
            {prompts.length} シーンのプロンプトを生成
          </span>
          <span className="text-xs text-gray-600 bg-gray-900 px-2 py-0.5 rounded border border-gray-800">
            nanobanana / Stable Diffusion 対応
          </span>
        </div>
        <button onClick={handleExtract} className="text-xs text-gray-500 hover:text-gray-300">
          再抽出
        </button>
      </div>

      {/* 使い方バナー */}
      <div className="bg-blue-900/20 border border-blue-800/50 rounded-xl p-3 flex items-center gap-3">
        <span className="text-blue-400 text-xl flex-shrink-0">💡</span>
        <p className="text-xs text-blue-300/80">
          各シーンの <strong>「nanobanana用に一括コピー」</strong> を押してプロンプトをコピー →
          nanobanana 等に貼り付けて画像生成 → 完成した画像を
          <a href="/gallery" className="underline ml-1">ギャラリーにアップロード</a>
        </p>
      </div>

      {/* プロンプトリスト */}
      {prompts.map((p) => {
        const isExpanded = expandedId === p.scene_id
        return (
          <div key={p.scene_id} className={`bg-gray-900 border rounded-xl overflow-hidden transition-colors ${
            isExpanded ? 'border-purple-700' : 'border-gray-800'
          }`}>
            {/* シーンヘッダー（常時表示） */}
            <button
              className="w-full text-left p-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
              onClick={() => setExpandedId(isExpanded ? null : p.scene_id)}
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-purple-400 bg-purple-900/30 px-2 py-0.5 rounded">
                  {p.scene_id}
                </span>
                <span className="text-sm text-white">{p.characters.join(', ')}</span>
                <span className="text-xs text-gray-500">{p.emotion}</span>
                <span className="text-xs text-gray-600">@ {p.location}</span>
              </div>
              <span className="text-gray-600 text-xs">{isExpanded ? '▲ 閉じる' : '▼ プロンプトを見る'}</span>
            </button>

            {/* 展開コンテンツ */}
            {isExpanded && (
              <div className="border-t border-gray-800 p-4 space-y-3">
                {/* コンテキスト */}
                {p.context && (
                  <p className="text-xs text-gray-600 italic border-l-2 border-gray-700 pl-3">
                    …{p.context.slice(-120)}
                  </p>
                )}

                {/* nanobanana 一括コピー（最も目立つ位置に） */}
                <button
                  onClick={() => copyToClipboard(formatForNanobanana(p), `all-${p.scene_id}`)}
                  className={`w-full py-2.5 rounded-xl text-sm font-bold transition-colors border-2 ${
                    copiedId === `all-${p.scene_id}`
                      ? 'border-green-600 text-green-300 bg-green-900/30'
                      : 'border-purple-600 text-purple-300 hover:bg-purple-900/30'
                  }`}
                >
                  {copiedId === `all-${p.scene_id}`
                    ? '✓ nanobanana用にコピーしました！'
                    : '📋 nanobanana用に一括コピー（Positive + Negative）'
                  }
                </button>

                {/* Positive Prompt */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-green-400 font-semibold">Positive Prompt</label>
                    <button
                      onClick={() => copyToClipboard(p.positive_prompt, `pos-${p.scene_id}`)}
                      className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                        copiedId === `pos-${p.scene_id}`
                          ? 'border-green-700 text-green-400'
                          : 'border-gray-700 text-gray-500 hover:text-white'
                      }`}
                    >
                      {copiedId === `pos-${p.scene_id}` ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <pre className="bg-gray-950 rounded-lg p-3 text-xs text-gray-300 whitespace-pre-wrap break-all font-mono leading-relaxed">
                    {p.positive_prompt}
                  </pre>
                </div>

                {/* Negative Prompt */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-red-400 font-semibold">Negative Prompt</label>
                    <button
                      onClick={() => copyToClipboard(p.negative_prompt, `neg-${p.scene_id}`)}
                      className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                        copiedId === `neg-${p.scene_id}`
                          ? 'border-green-700 text-green-400'
                          : 'border-gray-700 text-gray-500 hover:text-white'
                      }`}
                    >
                      {copiedId === `neg-${p.scene_id}` ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <pre className="bg-gray-950 rounded-lg p-3 text-xs text-red-300/50 whitespace-pre-wrap break-all font-mono leading-relaxed">
                    {p.negative_prompt}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
