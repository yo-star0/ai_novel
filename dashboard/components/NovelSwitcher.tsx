'use client'
import { useState, useEffect } from 'react'

interface Novel {
  id: string
  title: string
  chapterCount: number
  createdAt: string
}

export default function NovelSwitcher() {
  const [novels, setNovels] = useState<Novel[]>([])
  const [activeId, setActiveId] = useState('default')
  const [showNew, setShowNew] = useState(false)
  const [newId, setNewId] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const [switching, setSwitching] = useState(false)

  useEffect(() => {
    fetch('/api/novels').then(r => r.json()).then(data => {
      setNovels(data.novels || [])
      setActiveId(data.activeId || 'default')
    })
  }, [])

  async function handleSwitch(id: string) {
    if (id === activeId) return
    setSwitching(true)
    await fetch('/api/novels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'switch', novelId: id }),
    })
    setSwitching(false)
    setActiveId(id)
    // ページをリロードして新しいコンテキストを反映
    window.location.reload()
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newId.trim() || !newTitle.trim()) return
    setCreating(true)
    const res = await fetch('/api/novels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', novelId: newId.trim(), title: newTitle.trim() }),
    })
    const data = await res.json()
    if (res.ok) {
      setNovels([...novels, { id: newId.trim(), title: newTitle.trim(), chapterCount: 0, createdAt: '' }])
      setShowNew(false)
      setNewId('')
      setNewTitle('')
    } else {
      alert(data.error || 'エラーが発生しました')
    }
    setCreating(false)
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        {novels.map(novel => (
          <div
            key={novel.id}
            className={`flex items-center justify-between p-4 rounded-xl border transition-colors cursor-pointer ${
              novel.id === activeId
                ? 'border-purple-600 bg-purple-900/20'
                : 'border-gray-800 bg-gray-900 hover:border-gray-700'
            }`}
            onClick={() => handleSwitch(novel.id)}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">{novel.title}</span>
                {novel.id === activeId && (
                  <span className="text-xs bg-purple-700 text-purple-100 px-2 py-0.5 rounded-full">
                    アクティブ
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                ID: {novel.id} · {novel.chapterCount} 話
              </div>
            </div>
            {novel.id !== activeId && (
              <button
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                disabled={switching}
              >
                切替える
              </button>
            )}
          </div>
        ))}
      </div>

      {showNew ? (
        <form onSubmit={handleCreate} className="bg-gray-900 border border-purple-800 rounded-xl p-4 space-y-3">
          <h4 className="text-sm font-semibold text-purple-300">新しい小説を作成</h4>
          <div>
            <label className="block text-xs text-gray-500 mb-1">小説ID（英数字・ハイフン）</label>
            <input
              value={newId}
              onChange={e => setNewId(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 font-mono"
              placeholder="my-novel-2"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">タイトル</label>
            <input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
              placeholder="新しい小説のタイトル"
              required
            />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowNew(false)}
              className="px-4 py-2 border border-gray-700 text-gray-400 rounded-lg text-sm hover:bg-gray-800">
              キャンセル
            </button>
            <button type="submit" disabled={creating}
              className="flex-1 bg-purple-700 hover:bg-purple-600 text-white rounded-lg text-sm py-2 font-semibold disabled:bg-gray-700">
              {creating ? '作成中...' : '作成する'}
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowNew(true)}
          className="w-full border border-dashed border-gray-700 rounded-xl py-3 text-sm text-gray-500 hover:text-purple-400 hover:border-purple-700 transition-colors"
        >
          + 新しい小説を追加
        </button>
      )}
    </div>
  )
}
