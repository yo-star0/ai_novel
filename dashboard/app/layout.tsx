import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Novel Dashboard — 制作管理システム',
  description: '全自動AI小説執筆・設定管理システム',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className="bg-gray-950 text-gray-100 min-h-screen">
        <nav className="border-b border-gray-800 px-6 py-3 flex items-center gap-6">
          <span className="text-xl font-bold text-purple-400">AI Novel</span>
          <a href="/" className="text-sm text-gray-400 hover:text-white transition-colors">ダッシュボード</a>
          <a href="/chapters" className="text-sm text-gray-400 hover:text-white transition-colors">章一覧</a>
          <a href="/characters" className="text-sm text-gray-400 hover:text-white transition-colors">キャラクター</a>
          <a href="/world" className="text-sm text-gray-400 hover:text-white transition-colors">世界観</a>
          <a href="/tracker" className="text-sm text-gray-400 hover:text-white transition-colors">伏線トラッカー</a>
          <a href="/gallery" className="text-sm text-gray-400 hover:text-white transition-colors">挿絵ギャラリー</a>
          <a href="/settings" className="text-sm text-gray-400 hover:text-white transition-colors">設定</a>
        </nav>
        <main className="container mx-auto px-6 py-8 max-w-7xl">
          {children}
        </main>
      </body>
    </html>
  )
}
