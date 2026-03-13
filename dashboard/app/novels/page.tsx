import NovelSwitcher from '@/components/NovelSwitcher'

export default function NovelsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-purple-300 mb-2">小説管理</h1>
      <p className="text-sm text-gray-500 mb-6">
        複数の小説プロジェクトを管理できます。アクティブな小説に切り替えると、全ページがその小説のデータを参照します。
      </p>
      <div className="max-w-2xl">
        <NovelSwitcher />
      </div>
    </div>
  )
}
