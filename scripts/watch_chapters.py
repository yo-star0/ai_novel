#!/usr/bin/env python3
"""
watch_chapters.py — 章フォルダのファイル監視デーモン

story/chapters/ に新しい .md ファイルが保存されたら
自動的に process_chapter.py を実行する。

watchdog ライブラリ不要のポーリング方式（どこでも動く）。

使用方法:
  # フォアグラウンドで監視（Ctrl+C で停止）
  python3 scripts/watch_chapters.py

  # 特定のArcを指定
  python3 scripts/watch_chapters.py --arc 1

  # 監視間隔を指定（秒）
  python3 scripts/watch_chapters.py --interval 3
"""

import argparse
import json
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
CHAPTERS_DIR = PROJECT_ROOT / "story" / "chapters"
STATE_FILE = PROJECT_ROOT / ".watch_state.json"


def load_state() -> dict[str, float]:
    """前回の監視状態を読み込む（ファイル名 → 最終更新時刻）"""
    if STATE_FILE.exists():
        try:
            with open(STATE_FILE, encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}


def save_state(state: dict[str, float]) -> None:
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(state, f, ensure_ascii=False, indent=2)


def get_current_files() -> dict[str, float]:
    """現在の chapters/ にある .md ファイルと更新時刻を返す"""
    CHAPTERS_DIR.mkdir(exist_ok=True)
    return {
        str(p): p.stat().st_mtime
        for p in CHAPTERS_DIR.glob("*.md")
    }


def guess_chapter_num(filepath: Path) -> int:
    """ファイル名から話数を推定する（ch1-03_... → 3）"""
    import re
    m = re.search(r'ch\d+-(\d+)', filepath.stem)
    return int(m.group(1)) if m else 0


def guess_arc_num(filepath: Path) -> int:
    """ファイル名からArc番号を推定する（ch2-03_... → 2）"""
    import re
    m = re.search(r'ch(\d+)-', filepath.stem)
    return int(m.group(1)) if m else 1


def process_file(filepath: Path, arc_override: int | None) -> None:
    """変更を検知したファイルに対して処理パイプラインを実行する"""
    chapter_num = guess_chapter_num(filepath)
    arc_num = arc_override if arc_override else guess_arc_num(filepath)

    print(f"\n{'=' * 60}")
    print(f"  新規/更新検知: {filepath.name}")
    print(f"  推定: 第{chapter_num}話 / Arc{arc_num}")
    print(f"  時刻: {datetime.now().strftime('%H:%M:%S')}")
    print(f"{'=' * 60}")

    if chapter_num == 0:
        print("  ⚠ 話数を推定できませんでした。ファイル名が ch{arc}-{話数}_ 形式か確認してください。")
        return

    # ファイルの書き込みが完了するまで少し待つ
    time.sleep(1.5)

    cmd = [
        sys.executable,
        str(PROJECT_ROOT / "scripts" / "process_chapter.py"),
        str(filepath.relative_to(PROJECT_ROOT)),
        str(chapter_num),
        "--arc", str(arc_num),
    ]

    try:
        subprocess.run(cmd, cwd=PROJECT_ROOT)
    except KeyboardInterrupt:
        print("\n処理を中断しました")
    except Exception as e:
        print(f"  ✗ 処理エラー: {e}")


def watch(interval: int, arc_override: int | None) -> None:
    CHAPTERS_DIR.mkdir(parents=True, exist_ok=True)
    prev_state = load_state()
    # 初回は既存ファイルを「既知」として登録（処理しない）
    if not prev_state:
        prev_state = get_current_files()
        save_state(prev_state)

    print(f"""
{"=" * 60}
  章ファイル監視デーモン 起動
  監視ディレクトリ: {CHAPTERS_DIR}
  監視間隔: {interval}秒
  Ctrl+C で停止
{"=" * 60}
""")

    try:
        while True:
            current = get_current_files()
            new_or_modified = []

            for filepath_str, mtime in current.items():
                p = Path(filepath_str)
                prev_mtime = prev_state.get(filepath_str, 0)
                if mtime > prev_mtime:
                    new_or_modified.append(p)

            for p in new_or_modified:
                process_file(p, arc_override)
                prev_state[str(p)] = p.stat().st_mtime
                save_state(prev_state)

            time.sleep(interval)

    except KeyboardInterrupt:
        print("\n\n監視を終了しました。")
        save_state(get_current_files())


def main():
    parser = argparse.ArgumentParser(description="章フォルダのファイル監視デーモン")
    parser.add_argument("--interval", type=int, default=5, help="監視間隔（秒）デフォルト: 5")
    parser.add_argument("--arc", type=int, help="Arc番号を強制指定（省略時はファイル名から推定）")
    args = parser.parse_args()
    watch(args.interval, args.arc)


if __name__ == "__main__":
    main()
