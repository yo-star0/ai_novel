/**
 * プロジェクトルートへの信頼性の高いパス解決
 *
 * process.cwd() は Next.js の実行環境（dev/build/production）で変わるため、
 * このファイル自体の場所を基準に固定する。
 *
 * このファイルは  dashboard/lib/paths.ts
 *   __dirname  →  dashboard/lib/
 *   ../        →  dashboard/
 *   ../../     →  ai_novel/      ← プロジェクトルート
 */
import { join, resolve } from 'path'

const fromDirname = join(__dirname, '..', '..')
// __dirname が使えない環境（Edge Runtime等）へのフォールバック
const fromCwd = resolve(process.cwd(), process.cwd().endsWith('dashboard') ? '..' : '.')

export const PROJECT_ROOT = fromDirname
