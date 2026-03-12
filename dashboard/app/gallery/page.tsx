import { existsSync, readdirSync, readFileSync } from 'fs'
import { join } from 'path'
import { PROJECT_ROOT } from '@/lib/paths'

interface ImageMeta {
  scene_id: string
  chapter_file: string
  characters: string[]
  emotion: string
  location: string
  positive_prompt: string
  generated_at: string
}

function getImages(): { file: string; meta: ImageMeta | null }[] {
  const imagesDir = join(PROJECT_ROOT, 'assets', 'images')
  if (!existsSync(imagesDir)) return []
  return readdirSync(imagesDir)
    .filter(f => f.endsWith('.png') || f.endsWith('.jpg'))
    .map(f => {
      const metaPath = join(imagesDir, f.replace(/\.(png|jpg)$/, '.json'))
      let meta: ImageMeta | null = null
      if (existsSync(metaPath)) {
        try { meta = JSON.parse(readFileSync(metaPath, 'utf-8')) } catch { /* ignore */ }
      }
      return { file: f, meta }
    })
}

export default function GalleryPage() {
  const images = getImages()

  return (
    <div>
      <h1 className="text-2xl font-bold text-purple-300 mb-2">挿絵ギャラリー</h1>
      <p className="text-sm text-gray-500 mb-6">
        Stable Diffusion で生成された挿絵一覧
      </p>

      {images.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-10 text-center space-y-4">
          <p className="text-gray-500">まだ挿絵がありません</p>
          <div className="text-sm text-gray-600 space-y-1">
            <p>挿絵を生成するには:</p>
            <ol className="text-left inline-block space-y-1 mt-2">
              <li>1. 章ファイルを保存して <code className="bg-gray-800 px-1 rounded">process_chapter.py</code> を実行</li>
              <li>2. <code className="bg-gray-800 px-1 rounded">assets/images/</code> フォルダに PNG を置く</li>
              <li>または Stable Diffusion WebUI 起動後: <code className="bg-gray-800 px-1 rounded">make images FILE=...</code></li>
            </ol>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {images.map(({ file, meta }) => (
            <div key={file} className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
              <div className="aspect-[2/3] bg-gray-800 flex items-center justify-center text-gray-600 text-xs">
                {/* 実際の本番環境では next/image を使う */}
                <span className="font-mono">{file}</span>
              </div>
              {meta && (
                <div className="p-3 space-y-1 text-xs">
                  {meta.scene_id && <div className="text-purple-400 font-mono">{meta.scene_id}</div>}
                  {meta.characters?.length > 0 && (
                    <div className="text-gray-400">{meta.characters.join(', ')}</div>
                  )}
                  {meta.emotion && <div className="text-gray-500">{meta.emotion}</div>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
