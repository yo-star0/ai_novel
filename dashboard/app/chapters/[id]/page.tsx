import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import Link from 'next/link'
import { PROJECT_ROOT } from '@/lib/paths'
import { notFound } from 'next/navigation'
import ChapterEditor from '@/components/ChapterEditor'
import PromptViewer from '@/components/PromptViewer'

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

  return (
    <div>
      <div className="mb-6">
        <Link href="/chapters" className="text-sm text-gray-500 hover:text-purple-400 transition-colors">
          &larr; 章一覧に戻る
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          <p className="text-xs font-mono text-gray-600 mt-1">{chapter.filename}</p>
        </div>
      </div>

      {/* 編集可能なエディタ */}
      <ChapterEditor
        chapterId={params.id}
        initialContent={chapter.content}
        filename={chapter.filename}
      />

      {/* 挿絵プロンプト抽出 */}
      <div className="mt-8 border-t border-gray-800 pt-6">
        <h2 className="text-lg font-bold text-purple-300 mb-4">挿絵プロンプト</h2>
        <PromptViewer chapterFile={chapter.filename} />
      </div>
    </div>
  )
}
