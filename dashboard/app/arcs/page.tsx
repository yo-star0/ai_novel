import { readFileSync, existsSync, readdirSync } from 'fs'
import { join } from 'path'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { PROJECT_ROOT } from '@/lib/paths'

function getArcs(): { filename: string; content: string }[] {
  const arcsDir = join(PROJECT_ROOT, 'story', 'arcs')
  if (!existsSync(arcsDir)) return []
  return readdirSync(arcsDir)
    .filter(f => f.endsWith('.md'))
    .sort()
    .map(f => ({ filename: f, content: readFileSync(join(arcsDir, f), 'utf-8') }))
}

export default function ArcsPage() {
  const arcs = getArcs()

  return (
    <div>
      <h1 className="text-2xl font-bold text-purple-300 mb-6">Arc概要・プロット</h1>

      {arcs.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-10 text-center">
          <p className="text-gray-500 mb-3">Arc概要がまだありません</p>
          <p className="text-sm text-gray-600">
            <code className="bg-gray-800 px-2 py-0.5 rounded">story/arc_template.md</code> をコピーして
            <code className="bg-gray-800 px-2 py-0.5 rounded ml-1">story/arcs/arc1_タイトル.md</code> を作成してください
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {arcs.map(({ filename, content }) => (
            <section key={filename}>
              <h2 className="text-sm font-mono text-gray-500 mb-4 border-b border-gray-800 pb-2">{filename}</h2>
              <div className="prose prose-invert prose-sm max-w-none
                prose-headings:text-purple-300 prose-table:text-sm
                prose-th:text-gray-400 prose-td:text-gray-300
                prose-code:bg-gray-800 prose-code:text-green-300">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
