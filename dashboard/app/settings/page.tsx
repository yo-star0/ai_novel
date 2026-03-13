import SettingsForm from '@/components/SettingsForm'

export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-purple-300 mb-2">API設定</h1>
      <p className="text-sm text-gray-500 mb-6">
        画像生成APIキーやモードを設定します。ブラウザからいつでも変更可能です。
      </p>
      <SettingsForm />
    </div>
  )
}
