'use client'
import { useState, useEffect } from 'react'
import SaveButton from './SaveButton'

export default function BibleEditor() {
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/bible').then(r => r.json()).then(d => {
      setContent(d.content || '')
      setLoading(false)
    })
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    await fetch('/api/bible', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) return <div className="text-gray-500 py-8 text-center">読み込み中...</div>

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-950">
          <span className="text-xs text-gray-500 font-mono">bible.md</span>
          <span className="text-xs text-gray-600">{content.length.toLocaleString()} 文字</span>
        </div>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          className="w-full bg-gray-900 text-gray-200 text-sm font-mono p-4 min-h-[600px] resize-y focus:outline-none focus:ring-1 focus:ring-purple-700"
          placeholder="ここに世界観の設定を書いてください。Markdown形式で書けます。"
          spellCheck={false}
        />
      </div>
      <div className="flex items-center gap-3">
        <SaveButton saving={saving} saved={saved} />
        <span className="text-xs text-gray-600">Markdown 形式で記述できます</span>
      </div>
    </form>
  )
}
