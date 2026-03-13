'use client'
import { useState, useRef } from 'react'

interface Props {
  onUploadComplete?: () => void
}

export default function ImageUploader({ onUploadComplete }: Props) {
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // メタデータ
  const [sceneId, setSceneId] = useState('')
  const [chapterFile, setChapterFile] = useState('')
  const [characters, setCharacters] = useState('')
  const [emotion, setEmotion] = useState('')
  const [location, setLocation] = useState('')
  const [positivePrompt, setPositivePrompt] = useState('')

  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  function handleFileSelect(file: File) {
    setSelectedFile(file)
    setError('')
    setUploaded(false)
    const url = URL.createObjectURL(file)
    setPreview(url)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileSelect(file)
  }

  async function handleUpload() {
    if (!selectedFile) return
    setUploading(true)
    setError('')

    const formData = new FormData()
    formData.append('file', selectedFile)

    const meta: Record<string, unknown> = {}
    if (sceneId) meta.scene_id = sceneId
    if (chapterFile) meta.chapter_file = chapterFile
    if (characters) meta.characters = characters.split(',').map(s => s.trim())
    if (emotion) meta.emotion = emotion
    if (location) meta.location = location
    if (positivePrompt) meta.positive_prompt = positivePrompt

    if (Object.keys(meta).length > 0) {
      formData.append('meta', JSON.stringify(meta))
    }

    try {
      const res = await fetch('/api/images/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok) {
        setUploaded(true)
        setSelectedFile(null)
        setPreview(null)
        // フォームリセット
        setSceneId('')
        setChapterFile('')
        setCharacters('')
        setEmotion('')
        setLocation('')
        setPositivePrompt('')
        if (fileRef.current) fileRef.current.value = ''
        onUploadComplete?.()
        setTimeout(() => setUploaded(false), 3000)
      } else {
        setError(data.error || 'アップロードに失敗しました')
      }
    } catch {
      setError('ネットワークエラー')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
      <h3 className="text-white font-semibold">画像アップロード</h3>

      {/* ドラッグ＆ドロップエリア */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-purple-500 bg-purple-900/20' : 'border-gray-700 hover:border-gray-600'
        }`}
      >
        {preview ? (
          <div className="space-y-3">
            <img src={preview} alt="プレビュー" className="max-h-48 mx-auto rounded-lg" />
            <p className="text-sm text-gray-400">{selectedFile?.name}</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-gray-400 text-sm">画像をドラッグ＆ドロップ</p>
            <p className="text-gray-600 text-xs">または クリックしてファイルを選択</p>
            <p className="text-gray-700 text-xs">PNG, JPG, WebP 対応</p>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleInputChange}
          className="hidden"
        />
      </div>

      {/* メタデータ（任意） */}
      {selectedFile && (
        <details className="text-sm">
          <summary className="text-gray-400 cursor-pointer hover:text-gray-300 text-xs">
            メタデータを追加（任意）
          </summary>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">シーンID</label>
              <input value={sceneId} onChange={e => setSceneId(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-gray-300"
                placeholder="scene01" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">章ファイル</label>
              <input value={chapterFile} onChange={e => setChapterFile(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-gray-300"
                placeholder="ch1-01_覚醒.md" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">キャラクター（カンマ区切り）</label>
              <input value={characters} onChange={e => setCharacters(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-gray-300"
                placeholder="主人公, ヒロイン" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">感情</label>
              <input value={emotion} onChange={e => setEmotion(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-gray-300"
                placeholder="決意" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">場所</label>
              <input value={location} onChange={e => setLocation(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-gray-300"
                placeholder="森の中" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">SDプロンプト</label>
              <input value={positivePrompt} onChange={e => setPositivePrompt(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-gray-300"
                placeholder="masterpiece, ..." />
            </div>
          </div>
        </details>
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}
      {uploaded && <p className="text-green-400 text-sm">アップロード完了</p>}

      {selectedFile && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            uploading ? 'bg-gray-700 text-gray-400 cursor-wait' : 'bg-purple-700 hover:bg-purple-600 text-white'
          }`}
        >
          {uploading ? 'アップロード中...' : 'アップロードする'}
        </button>
      )}
    </div>
  )
}
