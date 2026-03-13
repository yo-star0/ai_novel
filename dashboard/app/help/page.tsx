export default function HelpPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-purple-300 mb-2">使い方ガイド</h1>
      <p className="text-sm text-gray-500 mb-8">AI Novel ダッシュボードの全機能を解説します</p>

      <div className="space-y-8">

        {/* 全体フロー */}
        <Section title="基本的な使い方（全体フロー）">
          <Steps items={[
            { num: 1, label: '世界観を設定する', desc: '「世界観」ページを開き、作品の設定・世界・ルールを書く。これがAIへの執筆指示の土台になります。' },
            { num: 2, label: 'キャラクターを登録する', desc: '「キャラクター」ページで登場人物を追加。名前・口調・心理などを入力すると、AIが一貫したキャラクターで書いてくれます。' },
            { num: 3, label: '章を執筆する', desc: '「章一覧 → 新しい章を書く」から執筆ワークフローを起動。プロンプトを生成してAIに送り、書かれた本文をダッシュボードに保存します。' },
            { num: 4, label: '伏線・タイムラインを更新する', desc: '「伏線トラッカー」で、各話で埋め込んだ伏線・確定した事実を記録。整合性を保ちながら執筆できます。' },
            { num: 5, label: '挿絵を作成する', desc: '章ページの下部でプロンプトを抽出 → nanobananaなどで画像生成 → ギャラリーにアップロード。' },
          ]} />
        </Section>

        {/* 章の書き方 */}
        <Section title="章の書き方（4ステップ）">
          <div className="space-y-3">
            <Step num={1} title="執筆設定">
              <p>話数・Arc番号・テンション値・感情・目標文字数・あらすじを入力します。テンション値（0〜10）は章の盛り上がりを示します。あらすじは省略しても構いません。</p>
            </Step>
            <Step num={2} title="プロンプト生成">
              <p>「執筆プロンプトを生成する」を押すと、世界観・キャラクター・伏線が全て組み込まれた長大なプロンプトが作成されます。</p>
              <p className="mt-1 text-yellow-400/80">「クリップボードにコピー」→ Claude Code のチャット欄に貼り付けて送信してください。</p>
            </Step>
            <Step num={3} title="本文を保存">
              <p>Claudeが書いた本文をコピーして、ダッシュボードの入力欄に貼り付けて保存します。ファイルが <code className="bg-gray-800 px-1 rounded text-xs">story/chapters/</code> に自動保存されます。</p>
            </Step>
            <Step num={4} title="完了">
              <p>保存後は「章一覧」で確認できます。章ページでは本文の閲覧・直接編集が可能です（プレビュー/編集タブ切替）。</p>
            </Step>
          </div>
        </Section>

        {/* 挿絵機能 */}
        <Section title="挿絵機能の使い方">
          <div className="bg-blue-900/20 border border-blue-800 rounded-xl p-4 mb-4">
            <p className="text-blue-300 text-sm font-semibold mb-1">全体の流れ</p>
            <p className="text-sm text-gray-300">
              章のプロンプトを抽出 → nanobanana などで画像生成 → ギャラリーにアップロード
            </p>
          </div>
          <Steps items={[
            {
              num: 1,
              label: '章ページを開く',
              desc: '「章一覧」から章タイトルをクリックして章ページへ。ページ下部に「挿絵プロンプト」セクションがあります。',
            },
            {
              num: 2,
              label: '「挿絵プロンプトを抽出する」を押す',
              desc: '本文中の [SCENE_BREAK] タグを解析して、各シーンのSDプロンプトを自動生成します。キャラクター設定のSDプロンプトも自動で反映されます。',
            },
            {
              num: 3,
              label: 'nanobanana にプロンプトを貼り付ける',
              desc: '「nanobanana用に一括コピー」ボタンを押すと、Positive/Negative Prompt が両方クリップボードにコピーされます。そのまま nanobanana（またはお好みの画像生成ツール）に貼り付けてください。',
            },
            {
              num: 4,
              label: '生成した画像をアップロード',
              desc: '「挿絵ギャラリー」ページの「画像をアップロード」から、生成した画像をアップロードします。ドラッグ＆ドロップ対応。シーンIDなどのメタデータも登録できます。',
            },
          ]} />
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 mt-4">
            <p className="text-sm font-semibold text-gray-300 mb-2">SCENE_BREAK タグとは？</p>
            <p className="text-sm text-gray-500 mb-2">本文中に以下の形式で挿入するタグです。Claudeが書いた本文には自動で含まれます：</p>
            <pre className="bg-gray-950 rounded p-3 text-xs text-green-400 font-mono">
              {`[SCENE_BREAK: scene01, キャラ名, 感情, 場所]`}
            </pre>
            <p className="text-xs text-gray-600 mt-2">このタグがあると、プロンプト抽出・シーン区切り表示が有効になります。</p>
          </div>
        </Section>

        {/* 伏線トラッカー */}
        <Section title="伏線トラッカーの使い方">
          <div className="space-y-3 text-sm text-gray-300">
            <p>「伏線トラッカー」では4種類のデータを管理します：</p>
            <div className="grid grid-cols-2 gap-3">
              <Card title="伏線" color="yellow">
                各話で埋め込んだ伏線を登録。planted（未回収）/ resolved（回収済）のステータスで管理。
              </Card>
              <Card title="キャラ状態" color="purple">
                各キャラクターの現在地・体調・感情状態・目標を記録。整合性チェックに使用。
              </Card>
              <Card title="タイムライン" color="blue">
                物語内の時系列イベントを記録。矛盾しないよう管理できます。
              </Card>
              <Card title="確定事実" color="green">
                世界設定・確定した事実をキーバリューで記録。執筆プロンプトに自動反映。
              </Card>
            </div>
          </div>
        </Section>

        {/* 複数小説 */}
        <Section title="複数の小説を管理する">
          <div className="space-y-3 text-sm text-gray-300">
            <p>「小説管理」ページから、複数の小説プロジェクトを作成・切り替えできます。</p>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>「+ 新しい小説を追加」で新規プロジェクトを作成（bible.md・tracker等が自動生成）</li>
              <li>「切替える」を押すとアクティブな小説が変わり、全ページが切り替わります</li>
              <li>各小説のデータは <code className="bg-gray-800 px-1 rounded text-xs">novels/</code> ディレクトリ以下に独立して保存</li>
            </ul>
          </div>
        </Section>

        {/* API設定 */}
        <Section title="API設定（画像生成モード）">
          <div className="space-y-3 text-sm text-gray-300">
            <p>「設定」ページで画像生成APIを切り替えられます：</p>
            <div className="grid gap-2">
              <ModeCard mode="手動（nanobanana等）" desc="プロンプトをコピーして外部ツールで生成。nanobanana・Nijijourney・Midjourneyなどで利用できます。" recommended />
              <ModeCard mode="Google Gemini API" desc="Imagen APIで自動生成（APIキーが必要）。無料枠あり。" />
              <ModeCard mode="Stable Diffusion WebUI" desc="ローカルで動作するSD WebUIに自動送信。localhost:7860での起動が必要。" />
            </div>
          </div>
        </Section>

        {/* ショートカット */}
        <Section title="便利なショートカット">
          <div className="grid grid-cols-2 gap-3">
            <ShortcutItem keys="Ctrl + S" desc="章エディタ（編集モード）で保存" />
            <ShortcutItem keys="クリップボードコピー" desc="プロンプト・SDプロンプトをワンクリックでコピー" />
            <ShortcutItem keys="ドラッグ&ドロップ" desc="画像をギャラリーにアップロード" />
            <ShortcutItem keys="プレビュー/編集タブ" desc="章ページでビューア⇔エディタを切替" />
          </div>
        </Section>

      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-bold text-purple-300 mb-4 pb-2 border-b border-gray-800">{title}</h2>
      {children}
    </section>
  )
}

function Steps({ items }: { items: { num: number; label: string; desc: string }[] }) {
  return (
    <div className="space-y-3">
      {items.map(item => (
        <div key={item.num} className="flex gap-4 items-start">
          <div className="w-7 h-7 rounded-full bg-purple-800 text-purple-200 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
            {item.num}
          </div>
          <div>
            <div className="text-sm font-semibold text-white">{item.label}</div>
            <div className="text-sm text-gray-400 mt-0.5">{item.desc}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function Step({ num, title, children }: { num: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="w-7 h-7 rounded-full bg-purple-800 text-purple-200 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
        {num}
      </div>
      <div className="flex-1 bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="text-sm font-semibold text-white mb-1">{title}</div>
        <div className="text-sm text-gray-400">{children}</div>
      </div>
    </div>
  )
}

function Card({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  const colors: Record<string, string> = {
    yellow: 'border-yellow-800 text-yellow-400',
    purple: 'border-purple-800 text-purple-400',
    blue: 'border-blue-800 text-blue-400',
    green: 'border-green-800 text-green-400',
  }
  return (
    <div className={`bg-gray-900 border rounded-xl p-4 ${colors[color] || 'border-gray-700'}`}>
      <div className="font-semibold text-sm mb-1">{title}</div>
      <div className="text-xs text-gray-500">{children}</div>
    </div>
  )
}

function ModeCard({ mode, desc, recommended }: { mode: string; desc: string; recommended?: boolean }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 flex gap-3 items-start">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">{mode}</span>
          {recommended && <span className="text-xs bg-green-800 text-green-200 px-2 py-0.5 rounded-full">おすすめ</span>}
        </div>
        <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
      </div>
    </div>
  )
}

function ShortcutItem({ keys, desc }: { keys: string; desc: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
      <code className="text-xs text-purple-300 font-mono">{keys}</code>
      <div className="text-xs text-gray-500 mt-1">{desc}</div>
    </div>
  )
}
