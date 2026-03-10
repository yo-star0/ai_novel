import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const PROJECT_ROOT = join(process.cwd(), '..')

function getTracker() {
  const trackerPath = join(PROJECT_ROOT, 'story', 'story_tracker.json')
  if (!existsSync(trackerPath)) return null
  try {
    return JSON.parse(readFileSync(trackerPath, 'utf-8'))
  } catch {
    return null
  }
}

export default function TrackerPage() {
  const tracker = getTracker()

  if (!tracker) {
    return (
      <div className="text-center py-12 text-gray-500">
        story_tracker.json が見つかりません
      </div>
    )
  }

  const foreshadowing = tracker.foreshadowing || []
  const planted = foreshadowing.filter((f: { status: string }) => f.status === 'planted')
  const resolved = foreshadowing.filter((f: { status: string }) => f.status === 'resolved')
  const timeline = tracker.timeline || []
  const charStates = tracker.character_states || {}

  return (
    <div>
      <h1 className="text-2xl font-bold text-purple-300 mb-6">伏線トラッカー & 世界状態</h1>

      {/* 伏線サマリー */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-900 border border-yellow-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-400">{planted.length}</div>
          <div className="text-xs text-gray-500 mt-1">未回収の伏線</div>
        </div>
        <div className="bg-gray-900 border border-green-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-400">{resolved.length}</div>
          <div className="text-xs text-gray-500 mt-1">回収済みの伏線</div>
        </div>
        <div className="bg-gray-900 border border-blue-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-400">{timeline.length}</div>
          <div className="text-xs text-gray-500 mt-1">タイムラインイベント</div>
        </div>
      </div>

      {/* 未回収伏線 */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-yellow-400 mb-3">未回収の伏線</h2>
        {planted.length === 0 ? (
          <p className="text-gray-600 text-sm">未回収の伏線はありません</p>
        ) : (
          <div className="space-y-2">
            {planted.map((fs: {
              id: string;
              importance: string;
              description: string;
              planted_chapter: number;
              resolution_chapter: number | null;
              hint_text: string;
            }) => (
              <div
                key={fs.id}
                className={`bg-gray-900 border rounded-lg p-4 ${
                  fs.importance === 'critical' ? 'border-red-700' :
                  fs.importance === 'major' ? 'border-yellow-700' : 'border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        fs.importance === 'critical' ? 'bg-red-900 text-red-300' :
                        fs.importance === 'major' ? 'bg-yellow-900 text-yellow-300' :
                        'bg-gray-800 text-gray-400'
                      }`}>
                        {fs.importance}
                      </span>
                      <span className="text-xs text-gray-500 font-mono">{fs.id}</span>
                    </div>
                    <p className="text-sm text-gray-200">{fs.description}</p>
                    {fs.hint_text && (
                      <p className="text-xs text-gray-500 mt-1 italic">「{fs.hint_text}」</p>
                    )}
                  </div>
                  <div className="text-right text-xs flex-shrink-0">
                    <div className="text-gray-500">第{fs.planted_chapter}話に埋め込み</div>
                    {fs.resolution_chapter && (
                      <div className="text-yellow-500 mt-1">第{fs.resolution_chapter}話で回収予定</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* キャラクター現在状態 */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-blue-400 mb-3">キャラクター現在状態</h2>
        {Object.keys(charStates).length === 0 ? (
          <p className="text-gray-600 text-sm">キャラクター状態が未定義です</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(charStates).map(([charId, state]: [string, unknown]) => {
              const s = state as {
                location?: string;
                physical_condition?: string;
                emotional_state?: string;
                goals_current?: string;
              }
              return (
                <div key={charId} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                  <div className="font-semibold text-purple-300 mb-2">{charId}</div>
                  <div className="space-y-1 text-xs text-gray-400">
                    <div><span className="text-gray-600">現在地:</span> {s.location || '—'}</div>
                    <div><span className="text-gray-600">状態:</span> {s.physical_condition || '—'}</div>
                    <div><span className="text-gray-600">感情:</span> {s.emotional_state || '—'}</div>
                    <div><span className="text-gray-600">目標:</span> {s.goals_current || '—'}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* タイムライン */}
      <section>
        <h2 className="text-lg font-semibold text-green-400 mb-3">タイムライン</h2>
        {timeline.length === 0 ? (
          <p className="text-gray-600 text-sm">タイムラインが空です</p>
        ) : (
          <div className="space-y-2">
            {timeline.map((event: {
              id: string;
              chapter: number;
              date_in_story: string;
              description: string;
              involved_characters: string[];
              location: string;
            }) => (
              <div key={event.id} className="flex gap-4 bg-gray-900 border border-gray-800 rounded-lg p-3">
                <div className="text-xs text-gray-500 font-mono flex-shrink-0 w-16">
                  第{event.chapter}話
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-300">{event.description}</p>
                  {event.involved_characters?.length > 0 && (
                    <p className="text-xs text-gray-600 mt-1">
                      登場: {event.involved_characters.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
