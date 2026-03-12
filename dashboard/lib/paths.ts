/**
 * プロジェクトルートへの信頼性の高いパス解決
 *
 * __dirname は Next.js が .next/server/ にコンパイルした後のパスを指すため使えない。
 * 代わりに story_tracker.json の存在を手掛かりに実際のルートを探す。
 *
 * Next.js の process.cwd() は next.config.js があるディレクトリ（= dashboard/）を返すことが保証されている。
 */
import { existsSync, join } from 'path'

function findProjectRoot(): string {
  const candidates = [
    join(process.cwd(), '..'),          // npm run dev を dashboard/ から実行した場合
    process.cwd(),                       // プロジェクトルートから実行した場合
    join(process.cwd(), '..', '..'),     // .next/server/ などから実行された場合
  ]
  for (const candidate of candidates) {
    if (existsSync(join(candidate, 'story', 'story_tracker.json'))) {
      return candidate
    }
  }
  // story_tracker.json がまだ存在しない場合の最終フォールバック
  return join(process.cwd(), '..')
}

export const PROJECT_ROOT = findProjectRoot()
