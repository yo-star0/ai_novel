import { readFileSync, existsSync, readdirSync } from 'fs'
import { join } from 'path'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'

const PROJECT_ROOT = join(process.cwd(), '..')

function getChapters() {
  const chaptersDir = join(PROJECT_ROOT, 'story', 'chapters')
  if (!existsSync(chaptersDir)) return []
  return readdirSync(chaptersDir)
    .filter(f => f.endsWith('.md'))
    .sort()
    .map(filename => {
      const content = readFileSync(join(chaptersDir, filename), 'utf-8')
      const lines = content.split('\n')
      const title = lines.find(l => l.startsWith('# '))?.replace('# ', '') || filename
      const wordCount = content.replace(/\s/g, '').length
      const preview = lines
        .filter(l => l.trim() && !l.startsWith('#'))
        .slice(0, 3)
        .join(' ')
        .slice(0, 120)
      return { filename, title, wordCount, preview }
    })
}

export default function ChaptersPage() {
  const chapters = getChapters()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-purple-300">章一覧</h1>
        <Link
          href="/chapters/new"
          className="bg-purple-700 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
        >
          + 新しい章を執筆
        </Link>
      </div>

      {chapters.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
          <p className="text-gray-500 mb-4">まだ章がありません</p>
          <Link href="/chapters/new" className="text-purple-400 hover:text-purple-300">
            最初の章を書く →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {chapters.map(({ filename, title, wordCount, preview }) => (
            <Link
              key={filename}
              href={`/chapters/${encodeURIComponent(filename.replace('.md', ''))}`}
              className="block bg-gray-900 border border-gray-800 rounded-lg p-5 hover:border-purple-600 transition-colors group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white group-hover:text-purple-300 transition-colors mb-1">
                    {title}
                  </h3>
                  <p className="text-xs text-gray-500 font-mono mb-2">{filename}</p>
                  <p className="text-sm text-gray-400 line-clamp-2">{preview}…</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-mono text-purple-400">{wordCount.toLocaleString()}</div>
                  <div className="text-xs text-gray-600">字</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
