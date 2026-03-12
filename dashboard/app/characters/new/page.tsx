export default function NewCharacterPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-purple-300 mb-6">キャラクターを追加する</h1>

      <div className="space-y-6 max-w-2xl">
        <div className="bg-gray-900 border border-blue-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-blue-300 mb-4">登録手順</h2>
          <ol className="space-y-5">
            {[
              {
                step: 1,
                title: 'テンプレートをコピーする',
                code: 'cp characters/templates/character_template.json characters/profiles/char_001.json',
                note: 'ファイル名は char_001, char_002 ... と連番にする（または名前で管理）',
              },
              {
                step: 2,
                title: 'JSONファイルを編集する',
                code: '# VS Code / Codespaces でファイルを開いて各フィールドを埋める\ncharacters/profiles/char_001.json',
                note: '特に重要: basic.name, psychology, speech_patterns, sd_prompts',
              },
              {
                step: 3,
                title: 'ダッシュボードで確認する',
                code: '# このページを更新すると自動で反映されます',
                note: 'ページをリロードするだけでOK',
              },
            ].map(({ step, title, code, note }) => (
              <li key={step} className="flex gap-4">
                <span className="w-8 h-8 rounded-full bg-blue-900 text-blue-300 text-sm font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {step}
                </span>
                <div className="flex-1">
                  <div className="font-semibold text-white mb-2">{title}</div>
                  <code className="block bg-gray-800 text-green-300 text-xs px-3 py-2 rounded font-mono whitespace-pre">
                    {code}
                  </code>
                  <p className="text-xs text-gray-600 mt-1">{note}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">テンプレートの主要フィールド</h3>
          <div className="space-y-2 text-xs font-mono">
            {[
              { field: 'basic.name.full', desc: '名前（漢字）' },
              { field: 'basic.role', desc: 'protagonist / antagonist / support ...' },
              { field: 'psychology.core_desire', desc: '核心欲求（行動原理）' },
              { field: 'psychology.core_fear', desc: '核心恐怖（弱点）' },
              { field: 'speech_patterns.first_person', desc: '一人称（俺/私/僕...）' },
              { field: 'speech_patterns.sentence_endings', desc: '語尾の特徴' },
              { field: 'speech_patterns.speech_samples', desc: '状況別セリフ例（重要！）' },
              { field: 'sd_prompts.base_positive', desc: 'Stable Diffusion 外見プロンプト' },
            ].map(({ field, desc }) => (
              <div key={field} className="flex gap-3">
                <span className="text-green-400 flex-shrink-0">{field}</span>
                <span className="text-gray-500">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
