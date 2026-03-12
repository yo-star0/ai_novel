import { readFileSync, existsSync, readdirSync } from 'fs'
import Link from 'next/link'
import { PROJECT_ROOT } from '@/lib/paths'

function getProjectStats() {
  const stats = {
    chapterCount: 0,
    characterCount: 0,
    totalWords: 0,
    pendingForeshadowing: 0,
    lastUpdated: '',
  }

  // 章数カウント
  const chaptersDir = join(PROJECT_ROOT, 'story', 'chapters')
  if (existsSync(chaptersDir)) {
    stats.chapterCount = readdirSync(chaptersDir).filter(f => f.endsWith('.md')).length
  }

  // キャラクター数カウント
  const profilesDir = join(PROJECT_ROOT, 'characters', 'profiles')
  if (existsSync(profilesDir)) {
    stats.characterCount = readdirSync(profilesDir).filter(f => f.endsWith('.json')).length
  }

  // トラッカー読み込み
  const trackerPath = join(PROJECT_ROOT, 'story', 'story_tracker.json')
  if (existsSync(trackerPath)) {
    try {
      const tracker = JSON.parse(readFileSync(trackerPath, 'utf-8'))
      stats.lastUpdated = tracker._meta?.last_updated || ''
      stats.pendingForeshadowing = (tracker.foreshadowing || [])
        .filter((f: { status: string }) => f.status === 'planted').length
    } catch {
      // ignore parse errors
    }
  }

  return stats
}

function getRecentChapters() {
  const chaptersDir = join(PROJECT_ROOT, 'story', 'chapters')
  if (!existsSync(chaptersDir)) return []
  return readdirSync(chaptersDir)
    .filter(f => f.endsWith('.md'))
    .slice(-5)
    .reverse()
}

export default function DashboardPage() {
  const stats = getProjectStats()
  const recentChapters = getRecentChapters()

  return (
    <div>
      <h1 className="text-3xl font-bold text-purple-300 mb-2">制作ダッシュボード</h1>
      <p className="text-gray-500 text-sm mb-8">全自動AI小説執筆・設定管理システム</p>

      {/* 統計カード */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard label="完成章数" value={stats.chapterCount} unit="話" color="purple" />
        <StatCard label="登録キャラ" value={stats.characterCount} unit="人" color="blue" />
        <StatCard label="未回収伏線" value={stats.pendingForeshadowing} unit="件" color="yellow" />
        <StatCard label="総文字数" value={stats.totalWords} unit="字" color="green" />
      </div>

      {/* クイックアクション */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-300 mb-4">クイックアクション</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <ActionButton href="/chapters/new" label="新しい章を執筆" icon="✍" />
          <ActionButton href="/characters/new" label="キャラクターを追加" icon="👤" />
          <ActionButton href="/tracker" label="伏線トラッカーを確認" icon="🔍" />
          <ActionButton href="/world" label="世界観Bibleを編集" icon="🌍" />
          <ActionButton href="/gallery" label="挿絵ギャラリー" icon="🎨" />
          <ActionButton href="/consistency" label="整合性チェックを実行" icon="✓" />
        </div>
      </section>

      {/* 最近の章 */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-300 mb-4">最近の章</h2>
        {recentChapters.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-center text-gray-500">
            まだ章がありません。「新しい章を執筆」から始めましょう。
          </div>
        ) : (
          <div className="space-y-2">
            {recentChapters.map(filename => (
              <Link
                key={filename}
                href={`/chapters/${encodeURIComponent(filename.replace('.md', ''))}`}
                className="block bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 hover:border-purple-600 transition-colors"
              >
                <span className="text-purple-300 font-mono text-sm">{filename.replace('.md', '')}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ワークフロー案内 */}
      <section>
        <h2 className="text-lg font-semibold text-gray-300 mb-4">執筆ワークフロー</h2>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <ol className="space-y-3">
            {[
              { step: 1, label: '世界観Bibleを定義する', href: '/world' },
              { step: 2, label: 'キャラクタープロファイルを作成する', href: '/characters' },
              { step: 3, label: 'Arcのプロット概要を作成する', href: '/arcs' },
              { step: 4, label: '整合性チェックを実行する', href: '/consistency' },
              { step: 5, label: '章を執筆する（Editor→Writer二段階）', href: '/chapters/new' },
              { step: 6, label: '挿絵プロンプトを抽出・生成する', href: '/gallery' },
              { step: 7, label: 'story_tracker.jsonを更新する', href: '/tracker' },
            ].map(({ step, label, href }) => (
              <li key={step} className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-purple-900 text-purple-300 text-xs flex items-center justify-center font-bold flex-shrink-0">
                  {step}
                </span>
                <Link href={href} className="text-gray-300 hover:text-purple-300 transition-colors text-sm">
                  {label}
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  )
}

function StatCard({ label, value, unit, color }: {
  label: string; value: number; unit: string; color: string
}) {
  const colorMap: Record<string, string> = {
    purple: 'text-purple-400',
    blue: 'text-blue-400',
    yellow: 'text-yellow-400',
    green: 'text-green-400',
  }
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <div className={`text-2xl font-bold ${colorMap[color] || 'text-white'}`}>
        {value.toLocaleString()}
        <span className="text-sm font-normal ml-1">{unit}</span>
      </div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  )
}

function ActionButton({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 hover:border-purple-600 hover:bg-gray-800 transition-colors text-sm"
    >
      <span>{icon}</span>
      <span className="text-gray-300">{label}</span>
    </Link>
  )
}
