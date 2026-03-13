'use client'
import { useState, useEffect } from 'react'

interface Foreshadowing {
  id: string
  description: string
  importance: string
  status: string
  planted_chapter: number
  resolution_chapter: number | null
  hint_text: string
}

interface TimelineEvent {
  id: string
  chapter: number
  date_in_story: string
  description: string
  involved_characters: string[]
  location: string
}

interface CharacterState {
  location: string
  physical_condition: string
  emotional_state: string
  goals_current: string
}

interface Tracker {
  timeline: TimelineEvent[]
  foreshadowing: Foreshadowing[]
  facts: Record<string, string>
  character_states: Record<string, CharacterState>
  chapter_summaries: { chapter: number; summary: string }[]
}

export default function TrackerEditor() {
  const [tracker, setTracker] = useState<Tracker | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [tab, setTab] = useState<'foreshadowing' | 'characters' | 'timeline' | 'facts'>('foreshadowing')

  useEffect(() => {
    fetch('/api/tracker').then(r => r.json()).then(data => {
      const t = data.tracker || data
      // 各配列フィールドの安全な初期化
      setTracker({
        timeline: Array.isArray(t.timeline) ? t.timeline : [],
        foreshadowing: Array.isArray(t.foreshadowing) ? t.foreshadowing : [],
        facts: (t.facts && typeof t.facts === 'object') ? t.facts : {},
        character_states: (t.character_states && typeof t.character_states === 'object') ? t.character_states : {},
        chapter_summaries: Array.isArray(t.chapter_summaries) ? t.chapter_summaries : [],
      })
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  async function handleSave() {
    if (!tracker) return
    setSaving(true)
    await fetch('/api/tracker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tracker),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) return <div className="text-gray-500 py-8 text-center">読み込み中...</div>
  if (!tracker) return <div className="text-gray-500 py-8 text-center">story_tracker.json が見つかりません</div>

  const planted = tracker.foreshadowing.filter(f => f.status === 'planted')
  const resolved = tracker.foreshadowing.filter(f => f.status === 'resolved')

  function addForeshadowing() {
    if (!tracker) return
    const newId = `FS${String(tracker.foreshadowing.length + 1).padStart(3, '0')}`
    setTracker({
      ...tracker,
      foreshadowing: [...tracker.foreshadowing, {
        id: newId,
        description: '',
        importance: 'minor',
        status: 'planted',
        planted_chapter: 1,
        resolution_chapter: null,
        hint_text: '',
      }],
    })
  }

  function updateForeshadowing(index: number, updates: Partial<Foreshadowing>) {
    if (!tracker) return
    const fs = [...tracker.foreshadowing]
    fs[index] = { ...fs[index], ...updates }
    setTracker({ ...tracker, foreshadowing: fs })
  }

  function removeForeshadowing(index: number) {
    if (!tracker) return
    const fs = [...tracker.foreshadowing]
    fs.splice(index, 1)
    setTracker({ ...tracker, foreshadowing: fs })
  }

  function addCharacter() {
    if (!tracker) return
    const name = prompt('キャラクター名を入力:')
    if (!name) return
    setTracker({
      ...tracker,
      character_states: {
        ...tracker.character_states,
        [name]: { location: '', physical_condition: '良好', emotional_state: '', goals_current: '' },
      },
    })
  }

  function updateCharState(charId: string, updates: Partial<CharacterState>) {
    if (!tracker) return
    setTracker({
      ...tracker,
      character_states: {
        ...tracker.character_states,
        [charId]: { ...tracker.character_states[charId], ...updates },
      },
    })
  }

  function addTimeline() {
    if (!tracker) return
    const newId = `TL${String(tracker.timeline.length + 1).padStart(3, '0')}`
    setTracker({
      ...tracker,
      timeline: [...tracker.timeline, {
        id: newId,
        chapter: 1,
        date_in_story: '',
        description: '',
        involved_characters: [],
        location: '',
      }],
    })
  }

  function updateTimeline(index: number, updates: Partial<TimelineEvent>) {
    if (!tracker) return
    const tl = [...tracker.timeline]
    tl[index] = { ...tl[index], ...updates }
    setTracker({ ...tracker, timeline: tl })
  }

  function removeTimeline(index: number) {
    if (!tracker) return
    const tl = [...tracker.timeline]
    tl.splice(index, 1)
    setTracker({ ...tracker, timeline: tl })
  }

  function addFact() {
    if (!tracker) return
    const key = prompt('事実のキー（例: hero_birthplace）:')
    if (!key) return
    setTracker({
      ...tracker,
      facts: { ...tracker.facts, [key]: '' },
    })
  }

  function updateFact(key: string, value: string) {
    if (!tracker) return
    setTracker({
      ...tracker,
      facts: { ...tracker.facts, [key]: value },
    })
  }

  const inputClass = 'bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 w-full'
  const tabs = [
    { id: 'foreshadowing' as const, label: '伏線', count: tracker.foreshadowing.length },
    { id: 'characters' as const, label: 'キャラ状態', count: Object.keys(tracker.character_states).length },
    { id: 'timeline' as const, label: 'タイムライン', count: tracker.timeline.length },
    { id: 'facts' as const, label: '確定事実', count: Object.keys(tracker.facts).length },
  ]

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-yellow-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-400">{planted.length}</div>
          <div className="text-xs text-gray-500 mt-1">未回収の伏線</div>
        </div>
        <div className="bg-gray-900 border border-green-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-400">{resolved.length}</div>
          <div className="text-xs text-gray-500 mt-1">回収済みの伏線</div>
        </div>
        <div className="bg-gray-900 border border-blue-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-400">{tracker.timeline.length}</div>
          <div className="text-xs text-gray-500 mt-1">タイムラインイベント</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-800 pb-2">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-gray-900 text-purple-300 border border-gray-800 border-b-0' : 'text-gray-500 hover:text-gray-300'
            }`}>
            {t.label} <span className="text-xs ml-1 opacity-60">({t.count})</span>
          </button>
        ))}
      </div>

      {/* Foreshadowing tab */}
      {tab === 'foreshadowing' && (
        <div className="space-y-3">
          {tracker.foreshadowing.map((fs, i) => (
            <div key={i} className={`bg-gray-900 border rounded-lg p-4 space-y-3 ${
              fs.importance === 'critical' ? 'border-red-700' :
              fs.importance === 'major' ? 'border-yellow-700' : 'border-gray-700'
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-gray-500">{fs.id}</span>
                <select value={fs.importance} onChange={e => updateForeshadowing(i, { importance: e.target.value })}
                  className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-300">
                  <option value="minor">minor</option>
                  <option value="major">major</option>
                  <option value="critical">critical</option>
                </select>
                <select value={fs.status} onChange={e => updateForeshadowing(i, { status: e.target.value })}
                  className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-300">
                  <option value="planted">planted</option>
                  <option value="resolved">resolved</option>
                </select>
                <button onClick={() => removeForeshadowing(i)} className="ml-auto text-xs text-red-500 hover:text-red-400">削除</button>
              </div>
              <input value={fs.description} onChange={e => updateForeshadowing(i, { description: e.target.value })}
                className={inputClass} placeholder="伏線の説明" />
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">埋め込み話数</label>
                  <input type="number" min={1} value={fs.planted_chapter}
                    onChange={e => updateForeshadowing(i, { planted_chapter: Number(e.target.value) })}
                    className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">回収予定話数</label>
                  <input type="number" min={1} value={fs.resolution_chapter || ''}
                    onChange={e => updateForeshadowing(i, { resolution_chapter: e.target.value ? Number(e.target.value) : null })}
                    className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">ヒントテキスト</label>
                  <input value={fs.hint_text} onChange={e => updateForeshadowing(i, { hint_text: e.target.value })}
                    className={inputClass} placeholder="作中のセリフ等" />
                </div>
              </div>
            </div>
          ))}
          <button onClick={addForeshadowing}
            className="w-full border border-dashed border-gray-700 rounded-lg py-3 text-sm text-gray-500 hover:text-purple-400 hover:border-purple-700 transition-colors">
            + 伏線を追加
          </button>
        </div>
      )}

      {/* Characters tab */}
      {tab === 'characters' && (
        <div className="space-y-3">
          {Object.entries(tracker.character_states)
            .filter(([k]) => !k.startsWith('_'))
            .map(([charId, state]) => {
              const s = state as CharacterState
              return (
                <div key={charId} className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
                  <div className="font-semibold text-purple-300">{charId}</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">現在地</label>
                      <input value={s.location || ''} onChange={e => updateCharState(charId, { location: e.target.value })}
                        className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">身体状態</label>
                      <input value={s.physical_condition || ''} onChange={e => updateCharState(charId, { physical_condition: e.target.value })}
                        className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">感情状態</label>
                      <input value={s.emotional_state || ''} onChange={e => updateCharState(charId, { emotional_state: e.target.value })}
                        className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">現在の目標</label>
                      <input value={s.goals_current || ''} onChange={e => updateCharState(charId, { goals_current: e.target.value })}
                        className={inputClass} />
                    </div>
                  </div>
                </div>
              )
            })}
          <button onClick={addCharacter}
            className="w-full border border-dashed border-gray-700 rounded-lg py-3 text-sm text-gray-500 hover:text-purple-400 hover:border-purple-700 transition-colors">
            + キャラクター状態を追加
          </button>
        </div>
      )}

      {/* Timeline tab */}
      {tab === 'timeline' && (
        <div className="space-y-3">
          {tracker.timeline.map((event, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-gray-500">{event.id}</span>
                <button onClick={() => removeTimeline(i)} className="ml-auto text-xs text-red-500 hover:text-red-400">削除</button>
              </div>
              <input value={event.description} onChange={e => updateTimeline(i, { description: e.target.value })}
                className={inputClass} placeholder="イベントの説明" />
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">話数</label>
                  <input type="number" min={1} value={event.chapter}
                    onChange={e => updateTimeline(i, { chapter: Number(e.target.value) })}
                    className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">作中日付</label>
                  <input value={event.date_in_story || ''} onChange={e => updateTimeline(i, { date_in_story: e.target.value })}
                    className={inputClass} placeholder="例: 1日目の朝" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">場所</label>
                  <input value={event.location || ''} onChange={e => updateTimeline(i, { location: e.target.value })}
                    className={inputClass} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">関連キャラ（カンマ区切り）</label>
                <input value={(event.involved_characters || []).join(', ')}
                  onChange={e => updateTimeline(i, { involved_characters: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  className={inputClass} placeholder="例: 主人公, ヒロイン" />
              </div>
            </div>
          ))}
          <button onClick={addTimeline}
            className="w-full border border-dashed border-gray-700 rounded-lg py-3 text-sm text-gray-500 hover:text-purple-400 hover:border-purple-700 transition-colors">
            + タイムラインイベントを追加
          </button>
        </div>
      )}

      {/* Facts tab */}
      {tab === 'facts' && (
        <div className="space-y-3">
          {Object.entries(tracker.facts)
            .filter(([k]) => !k.startsWith('_'))
            .map(([key, value]) => (
              <div key={key} className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex gap-3 items-start">
                <span className="text-xs font-mono text-green-400 pt-2 flex-shrink-0 min-w-[120px]">{key}</span>
                <input value={String(value)} onChange={e => updateFact(key, e.target.value)}
                  className={inputClass + ' flex-1'} />
              </div>
            ))}
          <button onClick={addFact}
            className="w-full border border-dashed border-gray-700 rounded-lg py-3 text-sm text-gray-500 hover:text-purple-400 hover:border-purple-700 transition-colors">
            + 確定事実を追加
          </button>
        </div>
      )}

      {/* Save button */}
      <div className="sticky bottom-4 pt-4">
        <button onClick={handleSave} disabled={saving}
          className={`w-full py-3 rounded-xl text-sm font-bold transition-colors ${
            saved ? 'bg-green-700 text-green-100' :
            saving ? 'bg-gray-700 text-gray-400 cursor-wait' :
            'bg-purple-700 hover:bg-purple-600 text-white'
          }`}>
          {saved ? '保存しました' : saving ? '保存中...' : 'トラッカーを保存する'}
        </button>
      </div>
    </div>
  )
}
