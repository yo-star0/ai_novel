'use client'
import { useState } from 'react'
import ImageUploader from './ImageUploader'

interface ImageMeta {
  scene_id: string
  chapter_file: string
  characters: string[]
  emotion: string
  location: string
  positive_prompt: string
  generated_at: string
}

interface Props {
  initialImages: { file: string; meta: ImageMeta | null }[]
}

export default function GalleryClient({ initialImages }: Props) {
  const [showUploader, setShowUploader] = useState(false)
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null)

  async function copyPrompt(text: string, id: string) {
    await navigator.clipboard.writeText(text)
    setCopiedPrompt(id)
    setTimeout(() => setCopiedPrompt(null), 2000)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-purple-300">挿絵ギャラリー</h1>
          <p className="text-sm text-gray-500 mt-1">
            生成した挿絵の管理・プロンプトのコピー
          </p>
        </div>
        <button
          onClick={() => setShowUploader(!showUploader)}
          className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          {showUploader ? '閉じる' : '画像をアップロード'}
        </button>
      </div>

      {/* アップロードUI */}
      {showUploader && (
        <div className="mb-8">
          <ImageUploader onUploadComplete={() => {
            // ページをリロードして新しい画像を表示
            window.location.reload()
          }} />
        </div>
      )}

      {initialImages.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-10 text-center space-y-4">
          <p className="text-gray-500">まだ挿絵がありません</p>
          <div className="text-sm text-gray-600 space-y-1">
            <p>挿絵を追加するには:</p>
            <ol className="text-left inline-block space-y-1 mt-2">
              <li>1. 上の「画像をアップロード」ボタンから画像を追加</li>
              <li>2. 章ページでプロンプトを抽出 → nanobanana で生成 → アップロード</li>
            </ol>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {initialImages.map(({ file, meta }) => (
            <div key={file} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              {/* 画像表示 */}
              <div className="aspect-[3/4] bg-gray-800 relative">
                <img
                  src={`/api/images/serve/${encodeURIComponent(file)}`}
                  alt={meta?.scene_id || file}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* メタデータ */}
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-gray-500">{file}</span>
                  {meta?.scene_id && (
                    <span className="text-xs text-purple-400 bg-purple-900/30 px-2 py-0.5 rounded">
                      {meta.scene_id}
                    </span>
                  )}
                </div>

                {meta && (
                  <>
                    {meta.characters?.length > 0 && (
                      <div className="text-xs text-gray-400">{meta.characters.join(', ')}</div>
                    )}
                    <div className="flex gap-2 text-xs">
                      {meta.emotion && <span className="text-gray-500">{meta.emotion}</span>}
                      {meta.location && <span className="text-gray-600">@ {meta.location}</span>}
                    </div>

                    {/* プロンプトコピーボタン */}
                    {meta.positive_prompt && (
                      <div className="pt-2 space-y-2">
                        <button
                          onClick={() => copyPrompt(meta.positive_prompt, `prompt-${file}`)}
                          className={`w-full py-1.5 rounded text-xs font-semibold transition-colors border ${
                            copiedPrompt === `prompt-${file}`
                              ? 'border-green-700 text-green-400 bg-green-900/20'
                              : 'border-gray-700 text-gray-400 hover:text-white hover:border-gray-600'
                          }`}
                        >
                          {copiedPrompt === `prompt-${file}` ? 'コピーしました!' : 'SDプロンプトをコピー'}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
