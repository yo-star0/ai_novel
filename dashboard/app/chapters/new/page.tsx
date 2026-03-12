export default function NewChapterPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-purple-300 mb-6">新しい章を執筆する</h1>

      <div className="space-y-6 max-w-2xl">
        <div className="bg-gray-900 border border-purple-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-purple-300 mb-4">執筆の手順</h2>
          <ol className="space-y-5">
            {[
              {
                step: 1,
                title: '執筆プロンプトを生成する',
                description: 'ターミナルで以下のコマンドを実行してください',
                code: 'python3 scripts/writing/chapter_writer.py --chapter [話数] --arc [Arc番号]',
                note: '例: --chapter 1 --arc 1',
              },
              {
                step: 2,
                title: '生成されたプロンプトを Claude Code に貼り付ける',
                description: 'prompts/ フォルダに生成されたファイルの内容をこの Chat に貼り付けてください',
                code: 'cat prompts/ch1-01_writing_prompt_*.md',
                note: '↑ の出力をコピーして Claude Code Chat に送信',
              },
              {
                step: 3,
                title: '生成された本文をファイルに保存する',
                description: 'Claude Code が書いた本文を以下のパスに保存してください',
                code: 'story/chapters/ch[Arc番号]-[話数]_タイトル.md',
                note: '例: story/chapters/ch1-01_覚醒の朝.md',
              },
              {
                step: 4,
                title: '自動処理パイプラインを実行する',
                description: '整合性チェック・挿絵プロンプト抽出・トラッカー更新を一括実行',
                code: 'python3 scripts/process_chapter.py story/chapters/ch1-01_タイトル.md 1',
                note: 'または: make process FILE=story/chapters/ch1-01_タイトル.md CHAPTER=1',
              },
            ].map(({ step, title, description, code, note }) => (
              <li key={step} className="flex gap-4">
                <span className="w-8 h-8 rounded-full bg-purple-900 text-purple-300 text-sm font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {step}
                </span>
                <div className="flex-1">
                  <div className="font-semibold text-white mb-1">{title}</div>
                  <p className="text-sm text-gray-400 mb-2">{description}</p>
                  <code className="block bg-gray-800 text-green-300 text-xs px-3 py-2 rounded font-mono">
                    {code}
                  </code>
                  <p className="text-xs text-gray-600 mt-1">{note}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">自動監視モード（便利）</h3>
          <p className="text-sm text-gray-500 mb-3">
            ファイルを保存するだけで自動処理が走るようにするには:
          </p>
          <code className="block bg-gray-800 text-green-300 text-xs px-3 py-2 rounded font-mono">
            python3 scripts/watch_chapters.py
          </code>
          <p className="text-xs text-gray-600 mt-2">
            Ctrl+C で停止。story/chapters/ への保存を5秒ごとに監視します。
          </p>
        </div>
      </div>
    </div>
  )
}
