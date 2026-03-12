'use client'

interface Props {
  saving: boolean
  saved: boolean
  label?: string
}

export default function SaveButton({ saving, saved, label = '保存する' }: Props) {
  return (
    <button
      type="submit"
      disabled={saving}
      className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
        saved
          ? 'bg-green-700 text-green-100'
          : saving
          ? 'bg-gray-700 text-gray-400 cursor-wait'
          : 'bg-purple-700 hover:bg-purple-600 text-white'
      }`}
    >
      {saving ? '保存中...' : saved ? '保存しました' : label}
    </button>
  )
}
