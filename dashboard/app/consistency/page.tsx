import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import ReactMarkdown from 'react-markdown'
import { PROJECT_ROOT } from '@/lib/paths'

function getConsistencyLog(): string {
  const p = join(PROJECT_ROOT, 'story', 'consistency_log.md')
  return existsSync(p) ? readFileSync(p, 'utf-8') : '（consistency_log.md が見つかりません）'
}

export default function ConsistencyPage() {
  const log = getConsistencyLog()
  const hasViolations = log.includes('### [')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-purple-300">整合性チェックログ</h1>
        <div className={`text-xs px-3 py-1 rounded-full ${hasViolations ? 'bg-yellow-900 text-yellow-300' : 'bg-green-900 text-green-300'}`}>
          {hasViolations ? '要確認あり' : 'クリーン'}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 text-sm">
        <p className="text-gray-400">整合性チェックを手動実行するには:</p>
        <code className="block mt-2 bg-gray-800 p-3 rounded text-green-300 text-xs">
          python3 scripts/writing/consistency_check.py [章ファイル] [話数]
        </code>
        <p className="text-gray-600 text-xs mt-2">
          または <code className="bg-gray-800 px-1 rounded">make check FILE=story/chapters/ch1-01.md CHAPTER=1</code>
        </p>
      </div>

      <div className="prose prose-invert prose-sm max-w-none
        prose-headings:text-yellow-400 prose-code:bg-gray-800 prose-code:text-green-300">
        <ReactMarkdown>{log}</ReactMarkdown>
      </div>
    </div>
  )
}
