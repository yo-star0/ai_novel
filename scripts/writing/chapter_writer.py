#!/usr/bin/env python3
"""
章執筆自動化スクリプト
「概要作成 → 整合性チェック → 本文執筆 → 編集者批評 → リライト」の自動ループを管理する。

使用方法:
  python chapter_writer.py --chapter 1 --arc 1 --interactive
  python chapter_writer.py --chapter 1 --arc 1 --outline story/arcs/arc1.md
"""

import json
import argparse
import subprocess
from pathlib import Path
from datetime import datetime

PROJECT_ROOT = Path(__file__).parent.parent.parent


def load_tracker() -> dict:
    with open(PROJECT_ROOT / "story" / "story_tracker.json", encoding="utf-8") as f:
        return json.load(f)


def load_bible() -> str:
    bible_path = PROJECT_ROOT / "bible.md"
    if bible_path.exists():
        return bible_path.read_text(encoding="utf-8")
    return "（World Bibleが未作成です）"


def load_characters_summary() -> str:
    """全キャラクターの概要をまとめて返す"""
    profiles_dir = PROJECT_ROOT / "characters" / "profiles"
    summaries = []
    for p in profiles_dir.glob("*.json"):
        with open(p, encoding="utf-8") as f:
            data = json.load(f)
        name = data.get("basic", {}).get("name", {}).get("full", p.stem)
        role = data.get("basic", {}).get("role", "")
        core_desire = data.get("psychology", {}).get("core_desire", "")
        speech = data.get("speech_patterns", {}).get("sentence_endings", "")
        summaries.append(f"- {name}（{role}）: 欲求={core_desire}, 語尾={speech}")
    return "\n".join(summaries) if summaries else "（キャラクター未定義）"


def build_writing_context(chapter_num: int, arc_num: int, outline: str = "") -> str:
    """執筆コンテキストを構築する"""
    tracker = load_tracker()
    bible = load_bible()
    chars = load_characters_summary()

    # 直前の章サマリーを取得
    chapter_summaries = tracker.get("chapter_summaries", [])
    prev_summary = ""
    for s in chapter_summaries:
        if s.get("chapter") == chapter_num - 1:
            prev_summary = f"""
## 直前話のサマリー
- タイトル: {s.get('title', '')}
- 結末: {s.get('what', '')}
- 次話への引き継ぎ: {s.get('continuity_notes', '')}
- 登場人物の現在状態: {json.dumps(tracker.get('character_states', {}), ensure_ascii=False, indent=2)}
"""
            break

    # 回収すべき伏線
    pending_fs = [
        f"- {fs['description']}（第{fs['planted_chapter']}話に埋め込み）"
        for fs in tracker.get("foreshadowing", [])
        if fs.get("status") == "planted" and
        (fs.get("resolution_chapter") is None or fs.get("resolution_chapter") <= chapter_num)
    ]
    foreshadowing_section = "\n".join(pending_fs) if pending_fs else "（なし）"

    context = f"""# 第{chapter_num}話 執筆コンテキスト

## 執筆絶対ルール
CLAUDE.mdの全ルールを厳守すること。特に:
- 三点リーダー(……)とダッシュ(——)は偶数個
- 感嘆符・疑問符の直後に全角スペース
- 行頭字下げ必須
- 視点キャラクター外の内心描写禁止

## 世界観Bible（要約）
{bible[:3000]}

## 登場キャラクター
{chars}

{prev_summary}

## 今話で回収すべき伏線
{foreshadowing_section}

## 今話の概要（プロットアウトライン）
{outline if outline else '（アウトラインを指定してください）'}

---
## Phase 1: 編集者AIによる概要批評

まず上記の概要を読み、以下の観点から厳しく批評してください:
1. 読者の感情曲線は計算されているか？
2. キャラクターの行動に動機的根拠があるか？
3. 伏線の活用は適切か？
4. ご都合主義な展開はないか？
5. 前話からの感情的な橋渡しは適切か？

## Phase 2: 作家AIによる本文執筆

編集者の指摘を踏まえ、以下のフォーマットで本文を執筆してください:

---
# 第{chapter_num}話「（タイトル）」

（本文）

---
[SCENE_BREAK: シーン番号, キャラクター, 感情, ロケーション]
（各シーンの後にこのタグを付与すること。挿絵生成に使用する）
"""
    return context


def run_consistency_check(chapter_file: str | None, chapter_num: int) -> bool:
    """整合性チェックを実行する"""
    cmd = ["python3", str(PROJECT_ROOT / "scripts" / "writing" / "consistency_check.py")]
    if chapter_file:
        cmd.append(chapter_file)
    cmd.append(str(chapter_num))

    result = subprocess.run(cmd, capture_output=True, text=True)
    print(result.stdout)
    if result.stderr:
        print("STDERR:", result.stderr)
    return result.returncode == 0


def save_chapter(chapter_num: int, arc_num: int, content: str, title: str = "") -> Path:
    """執筆した章をファイルに保存する"""
    chapters_dir = PROJECT_ROOT / "story" / "chapters"
    chapters_dir.mkdir(exist_ok=True)
    filename = f"ch{arc_num}-{chapter_num:02d}_{title or '無題'}.md"
    path = chapters_dir / filename
    path.write_text(content, encoding="utf-8")
    print(f"\n✓ 章を保存しました: {path}")
    return path


def update_tracker_after_chapter(chapter_num: int, arc_num: int, summary: dict) -> None:
    """章執筆後にトラッカーを更新する"""
    tracker_path = PROJECT_ROOT / "story" / "story_tracker.json"
    tracker = load_tracker()

    tracker["meta"]["last_updated"] = datetime.now().isoformat()
    tracker["meta"]["current_chapter"] = chapter_num

    # チャプターサマリーを追加
    existing_ids = {s["chapter"] for s in tracker.get("chapter_summaries", [])}
    if chapter_num not in existing_ids:
        tracker["chapter_summaries"].append({
            "chapter": chapter_num,
            "arc": f"arc{arc_num}",
            "title": summary.get("title", ""),
            "pov_character": summary.get("pov", ""),
            "tension_level": summary.get("tension", 5),
            "location": summary.get("location", ""),
            "time_in_story": summary.get("time", ""),
            "who": summary.get("who", []),
            "what": summary.get("what", ""),
            "where": summary.get("where", ""),
            "when": summary.get("when", ""),
            "why": summary.get("why", ""),
            "how": summary.get("how", ""),
            "emotional_journey": summary.get("emotional_journey", ""),
            "foreshadowing_planted": summary.get("fs_planted", []),
            "foreshadowing_resolved": summary.get("fs_resolved", []),
            "new_facts_established": summary.get("new_facts", []),
            "continuity_notes": summary.get("continuity", ""),
            "word_count": summary.get("word_count", 0)
        })

    with open(tracker_path, "w", encoding="utf-8") as f:
        json.dump(tracker, f, ensure_ascii=False, indent=2)
    print(f"✓ story_tracker.json を更新しました")


def print_session_checklist(chapter_num: int) -> None:
    """執筆開始前チェックリストを表示する"""
    print("\n" + "=" * 60)
    print("執筆セッション開始チェックリスト")
    print("=" * 60)
    print(f"□ story_tracker.json を読み込んだか？")
    print(f"□ 第{chapter_num - 1}話の結末を確認したか？")
    print(f"□ 今話（第{chapter_num}話）の感情曲線目標を設定したか？")
    print(f"□ 今話で回収すべき伏線を確認したか？")
    print(f"□ キャラクターの現在状態を確認したか？")
    print(f"□ 整合性チェックを実行したか？")
    print("=" * 60 + "\n")


def main():
    parser = argparse.ArgumentParser(description="章執筆自動化スクリプト")
    parser.add_argument("--chapter", type=int, required=True, help="話数")
    parser.add_argument("--arc", type=int, required=True, help="Arc番号")
    parser.add_argument("--outline", type=str, help="プロットアウトラインファイルのパス")
    parser.add_argument("--interactive", action="store_true", help="インタラクティブモード")
    args = parser.parse_args()

    print_session_checklist(args.chapter)

    # アウトラインの読み込み
    outline_text = ""
    if args.outline:
        outline_path = Path(args.outline)
        if outline_path.exists():
            outline_text = outline_path.read_text(encoding="utf-8")
        else:
            print(f"警告: アウトラインファイルが見つかりません: {args.outline}")

    # 事前整合性チェック
    print("事前整合性チェックを実行中...")
    check_passed = run_consistency_check(None, args.chapter)
    if not check_passed:
        print("\n警告: 整合性チェックでエラーが検出されました。")
        print("consistency_log.md を確認して修正してください。")
        if args.interactive:
            answer = input("続行しますか？ (y/N): ")
            if answer.lower() != 'y':
                return

    # 執筆コンテキストを出力
    context = build_writing_context(args.chapter, args.arc, outline_text)

    print("\n" + "=" * 60)
    print("執筆コンテキスト（Claude Codeへの指示）")
    print("=" * 60)
    print(context)
    print("=" * 60)

    if args.interactive:
        print("\n上記のコンテキストをClaude Codeに貼り付けて執筆を依頼してください。")
        print("執筆完了後、生成された本文を chapter_output.md に保存して続行してください。")
        input("\n準備ができたらEnterを押してください...")

        # 執筆後の整合性チェック
        output_file = PROJECT_ROOT / "story" / "chapters" / "chapter_output.md"
        if output_file.exists():
            print("\n本文の整合性チェックを実行中...")
            run_consistency_check(str(output_file), args.chapter)
        else:
            print(f"執筆ファイルが見つかりません: {output_file}")


if __name__ == "__main__":
    main()
