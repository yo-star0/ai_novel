'use client'
import { useState, useEffect, useCallback } from 'react'

interface Props {
  chapterId: string
  initialContent: string
  filename: string
}

export default function ChapterEditor({ chapterId, initialContent, filename }: Props) {
  const [content, setContent] = useState(initialContent)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    setHasChanges(content !== initialContent)
  }, [content, initialContent])

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/chapters/${encodeURIComponent(chapterId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (res.ok) {
        setSaved(true)
        setHasChanges(false)
        setTimeout(() => setSaved(false), 2000)
      }
    } finally {
      setSaving(false)
    }
  }, [chapterId, content])

  // Ctrl+S で保存
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (mode === 'edit' && hasChanges) handleSave()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mode, hasChanges, handleSave])

  const wordCount = content.replace(/\s/g, '').length
  const sceneCount = (content.match(/\[SCENE_BREAK:/g) || []).length

  return (
    <div>
      {/* ツールバー */}
      <div className="flex items-center justify-between mb-4 bg-gray-900 border border-gray-800 rounded-lg px-4 py-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMode('view')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
              mode === 'view' ? 'bg-purple-700 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            プレビュー
          </button>
          <button
            onClick={() => setMode('edit')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
              mode === 'edit' ? 'bg-purple-700 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            編集
          </button>
          <span className="text-xs text-gray-600 ml-2">
            {wordCount.toLocaleString()} 字
            {sceneCount > 0 && <span className="ml-2">{sceneCount} シーン</span>}
          </span>
          {hasChanges && <span className="text-xs text-yellow-500 ml-2">未保存の変更あり</span>}
        </div>
        {mode === 'edit' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">Ctrl+S で保存</span>
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                saved
                  ? 'bg-green-700 text-green-100'
                  : saving
                  ? 'bg-gray-700 text-gray-400 cursor-wait'
                  : hasChanges
                  ? 'bg-purple-700 hover:bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-600 cursor-not-allowed'
              }`}
            >
              {saving ? '保存中...' : saved ? '保存しました' : '保存する'}
            </button>
          </div>
        )}
      </div>

      {/* エディタ or プレビュー */}
      {mode === 'edit' ? (
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          className="w-full bg-gray-900 border border-gray-800 rounded-xl p-6 text-gray-200 font-mono text-sm leading-relaxed min-h-[600px] resize-y focus:outline-none focus:border-purple-700"
          spellCheck={false}
        />
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
          <div className="novel-text prose prose-invert max-w-none prose-headings:text-purple-300 prose-blockquote:border-purple-700 prose-strong:text-white whitespace-pre-wrap">
            {content.split('\n').map((line, i) => {
              if (line.startsWith('[SCENE_BREAK:')) {
                const match = line.match(/\[SCENE_BREAK:\s*([^\]]+)\]/)
                const parts = match ? match[1].split(',').map(s => s.trim()) : []
                return (
                  <div key={i} className="my-8 flex items-center gap-4 text-xs text-gray-600">
                    <div className="flex-1 h-px bg-gray-800" />
                    <span className="flex-shrink-0">
                      {parts[0] && <span className="font-mono mr-2 text-gray-500">{parts[0]}</span>}
                      {parts[2] && <span className="text-purple-800">{parts[2]}</span>}
                    </span>
                    <div className="flex-1 h-px bg-gray-800" />
                  </div>
                )
              }
              if (line.startsWith('# ')) {
                return <h1 key={i} className="text-2xl font-bold text-purple-300 mb-4">{line.slice(2)}</h1>
              }
              if (line.startsWith('## ')) {
                return <h2 key={i} className="text-xl font-bold text-purple-300 mb-3">{line.slice(3)}</h2>
              }
              if (line.trim() === '') {
                return <div key={i} className="h-4" />
              }
              return <p key={i} className="mb-0 leading-[2.2]">{line}</p>
            })}
          </div>
        </div>
      )}
    </div>
  )
}
