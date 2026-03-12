import { readFileSync, existsSync, readdirSync } from 'fs'
import { join } from 'path'
import Link from 'next/link'
import { PROJECT_ROOT } from '@/lib/paths'

function getCharacters() {
  const profilesDir = join(PROJECT_ROOT, 'characters', 'profiles')
  if (!existsSync(profilesDir)) return []
  return readdirSync(profilesDir)
    .filter(f => f.endsWith('.json'))
    .map(filename => {
      try {
        const data = JSON.parse(readFileSync(join(profilesDir, filename), 'utf-8'))
        return {
          id: data.id || filename,
          filename,
          name: data.basic?.name?.full || filename,
          reading: data.basic?.name?.reading || '',
          role: data.basic?.role || '',
          age: data.basic?.age?.value || '',
          coreDesire: data.psychology?.core_desire || '',
          coreFear: data.psychology?.core_fear || '',
          firstPerson: data.speech_patterns?.first_person || '',
          speechEnding: data.speech_patterns?.sentence_endings || '',
        }
      } catch {
        return null
      }
    })
    .filter(Boolean)
}

const ROLE_COLORS: Record<string, string> = {
  protagonist: 'border-purple-600 bg-purple-950',
  deuteragonist: 'border-blue-600 bg-blue-950',
  antagonist: 'border-red-700 bg-red-950',
  support: 'border-gray-600 bg-gray-900',
  mob: 'border-gray-800 bg-gray-950',
}

const ROLE_LABELS: Record<string, string> = {
  protagonist: '主人公',
  deuteragonist: '重要人物',
  antagonist: '敵対者',
  support: 'サポート',
  mob: 'モブ',
}

export default function CharactersPage() {
  const characters = getCharacters() as Array<{
    id: string;
    filename: string;
    name: string;
    reading: string;
    role: string;
    age: string | number;
    coreDesire: string;
    coreFear: string;
    firstPerson: string;
    speechEnding: string;
  }>

  const grouped: Record<string, typeof characters> = {}
  for (const char of characters) {
    const role = char.role || 'other'
    if (!grouped[role]) grouped[role] = []
    grouped[role].push(char)
  }

  const roleOrder = ['protagonist', 'deuteragonist', 'antagonist', 'support', 'mob', 'other']

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-purple-300">キャラクター設定</h1>
        <Link
          href="/characters/new"
          className="bg-purple-700 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
        >
          + キャラクターを追加
        </Link>
      </div>

      {characters.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
          <p className="text-gray-500 mb-4">キャラクターが未登録です</p>
          <p className="text-sm text-gray-600">
            <code className="bg-gray-800 px-2 py-1 rounded">characters/profiles/</code> に
            character_template.json をコピーして定義してください
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {roleOrder.map(role => {
            const chars = grouped[role]
            if (!chars?.length) return null
            return (
              <section key={role}>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  {ROLE_LABELS[role] || role}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {chars.map(char => (
                    <div
                      key={char.id}
                      className={`border rounded-xl p-5 ${ROLE_COLORS[char.role] || 'border-gray-800 bg-gray-900'}`}
                    >
                      <div className="mb-3">
                        <div className="text-xl font-bold text-white">{char.name}</div>
                        {char.reading && (
                          <div className="text-xs text-gray-500">{char.reading}</div>
                        )}
                        {char.age && (
                          <div className="text-xs text-gray-400 mt-1">{char.age}歳</div>
                        )}
                      </div>

                      <div className="space-y-2 text-xs">
                        {char.coreDesire && (
                          <div>
                            <span className="text-gray-600">欲求: </span>
                            <span className="text-gray-300">{char.coreDesire}</span>
                          </div>
                        )}
                        {char.coreFear && (
                          <div>
                            <span className="text-gray-600">恐怖: </span>
                            <span className="text-gray-300">{char.coreFear}</span>
                          </div>
                        )}
                        {char.firstPerson && (
                          <div>
                            <span className="text-gray-600">一人称: </span>
                            <span className="text-purple-300 font-mono">{char.firstPerson}</span>
                          </div>
                        )}
                        {char.speechEnding && (
                          <div>
                            <span className="text-gray-600">語尾: </span>
                            <span className="text-purple-300 font-mono">{char.speechEnding}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
