import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { PROJECT_ROOT } from '@/lib/paths'
import { notFound } from 'next/navigation'

interface Props {
  params: { id: string }
}

function getChapter(id: string): { filename: string; content: string } | null {
  const filename = decodeURIComponent(id) + '.md'
  const filePath = join(PROJECT_ROOT, 'story', 'chapters', filename)
  if (!existsSync(filePath)) return null
  return { filename, content: readFileSync(filePath, 'utf-8') }
}

export default function ChapterPage({ params }: Props) {
  const chapter = getChapter(params.id)
  if (!chapter) notFound()

  const lines = chapter.content.split('\n')
  const title = lines.find(l => l.startsWith('# '))?.replace('# ', '') || chapter.filename
  const wordCount = chapter.content.replace(/\s/g, '').length

  // [SCENE_BREAK: ...] タグをカウント
  const sceneCount = (chapter.content.match(/\[SCENE_BREAK:/g) || []).length

  return (
    <div>
      <div className="mb-6">
        <Link href="/chapters" className="text-sm text-gray-500 hover:text-purple-400 transition-colors">
          ← 章一覧に戻る
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          <p className="text-xs font-mono text-gray-600 mt-1">{chapter.filename}</p>
        </div>
        <div className="text-right flex-shrink-0 space-y-1">
          <div className="text-purple-400 font-mono text-lg font-bold">{wordCount.toLocaleString()}<span className="text-sm font-normal ml-1">字</span></div>
          {sceneCount > 0 && (
            <div className="text-xs text-gray-500">{sceneCount} シーン</div>
          )}
        </div>
      </div>

      {/* 本文 */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
        <div className="novel-text prose prose-invert max-w-none
          prose-headings:text-purple-300 prose-blockquote:border-purple-700
          prose-code:bg-gray-800 prose-code:text-xs prose-code:text-gray-400
          prose-strong:text-white">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // [SCENE_BREAK: ...] タグを区切り線として表示
              p: ({ children }) => {
                const text = String(children)
                if (text.startsWith('[SCENE_BREAK:')) {
                  const match = text.match(/\[SCENE_BREAK:\s*([^\]]+)\]/)
                  const parts = match ? match[1].split(',').map(s => s.trim()) : []
                  return (
                    <div className="my-8 flex items-center gap-4 text-xs text-gray-600">
                      <div className="flex-1 h-px bg-gray-800" />
                      <span className="flex-shrink-0">
                        {parts[0] && <span className="font-mono mr-2 text-gray-500">{parts[0]}</span>}
                        {parts[2] && <span className="text-purple-800">{parts[2]}</span>}
                      </span>
                      <div className="flex-1 h-px bg-gray-800" />
                    </div>
                  )
                }
                return <p>{children}</p>
              },
            }}
          >
            {chapter.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
