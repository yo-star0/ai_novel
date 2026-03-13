'use client'
import { useState, useEffect } from 'react'

export default function SettingsForm() {
  const [geminiKey, setGeminiKey] = useState('')
  const [sdBase, setSdBase] = useState('http://localhost:7860')
  const [mode, setMode] = useState('manual')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        const s = data.settings || {}
        setGeminiKey(s.GEMINI_API_KEY || '')
        setSdBase(s.SD_API_BASE || 'http://localhost:7860')
        setMode(s.IMAGE_GEN_MODE || 'manual')
        setLoading(false)
      })
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        settings: {
          GEMINI_API_KEY: geminiKey,
          SD_API_BASE: sdBase,
          IMAGE_GEN_MODE: mode,
        },
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) {
    return <div className="text-gray-500 text-sm">読み込み中...</div>
  }

  return (
    <form onSubmit={handleSave} className="max-w-xl space-y-6">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <h3 className="text-white font-semibold">画像生成モード</h3>
        <select
          value={mode}
          onChange={e => setMode(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
        >
          <option value="manual">手動（nanobanana等でプロンプトをコピーして生成）</option>
          <option value="gemini">Google Gemini API（無料枠）</option>
          <option value="sd_webui">Stable Diffusion WebUI（ローカル）</option>
        </select>
        <p className="text-xs text-gray-600">
          「手動」モードでは、プロンプトを表示してコピーできます。nanobananaなどのツールに貼り付けてご利用ください。
        </p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <h3 className="text-white font-semibold">Google Gemini API</h3>
        <div>
          <label className="block text-xs text-gray-500 mb-1">APIキー</label>
          <input
            type="text"
            value={geminiKey}
            onChange={e => setGeminiKey(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 font-mono"
            placeholder="AIza..."
          />
          <p className="text-xs text-gray-600 mt-1">
            Google AI Studio から取得できます。無料枠あり。
          </p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <h3 className="text-white font-semibold">Stable Diffusion WebUI</h3>
        <div>
          <label className="block text-xs text-gray-500 mb-1">API URL</label>
          <input
            type="text"
            value={sdBase}
            onChange={e => setSdBase(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 font-mono"
            placeholder="http://localhost:7860"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className={`w-full py-3 rounded-xl text-sm font-bold transition-colors ${
          saved
            ? 'bg-green-700 text-green-100'
            : saving
            ? 'bg-gray-700 text-gray-400 cursor-wait'
            : 'bg-purple-700 hover:bg-purple-600 text-white'
        }`}
      >
        {saving ? '保存中...' : saved ? '保存しました' : '設定を保存する'}
      </button>
    </form>
  )
}
