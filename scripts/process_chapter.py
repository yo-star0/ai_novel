#!/usr/bin/env python3
"""
process_chapter.py — 章保存後の全自動処理パイプライン

Claude Code が章を書き終えてファイルを保存したら、このスクリプトを実行する。
以下を順番に自動実行する:

  1. タイポグラフィ & 整合性チェック（consistency_check.py）
  2. 挿絵プロンプト抽出（prompt_extractor.py）
  3. 編集者批評プロンプト生成（editor_critic.py）
  4. story_tracker.json の更新（chapter_summaries に追記）
  5. 次話用プロンプトの雛形生成を案内

使用方法:
  python3 scripts/process_chapter.py story/chapters/ch1-01_タイトル.md 1
  python3 scripts/process_chapter.py story/chapters/ch1-02_タイトル.md 2 --arc 1 --skip-images
"""

import argparse
import json
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
SCRIPTS_DIR = PROJECT_ROOT / "scripts"
sys.path.insert(0, str(SCRIPTS_DIR / "writing"))
sys.path.insert(0, str(SCRIPTS_DIR / "image_gen"))


# ─────────────────────────────────────────────
# ステップ実行ユーティリティ
# ─────────────────────────────────────────────

class Pipeline:
    def __init__(self, chapter_path: Path, chapter_num: int, arc_num: int):
        self.chapter_path = chapter_path
        self.chapter_num = chapter_num
        self.arc_num = arc_num
        self.results: list[dict] = []
        self.text = chapter_path.read_text(encoding="utf-8")

    def step(self, name: str):
        """ステップ開始のプリント"""
        print(f"\n{'─' * 50}")
        print(f"  STEP: {name}")
        print(f"{'─' * 50}")

    def ok(self, msg: str = ""):
        print(f"  ✓ {msg}" if msg else "  ✓ 完了")

    def warn(self, msg: str):
        print(f"  ⚠ {msg}")

    def err(self, msg: str):
        print(f"  ✗ {msg}")


# ─────────────────────────────────────────────
# STEP 1: タイポグラフィ & 整合性チェック
# ─────────────────────────────────────────────

def run_consistency_check(pl: Pipeline) -> bool:
    pl.step("タイポグラフィ & 整合性チェック")
    check_script = SCRIPTS_DIR / "writing" / "consistency_check.py"
    result = subprocess.run(
        [sys.executable, str(check_script), str(pl.chapter_path), str(pl.chapter_num)],
        capture_output=True, text=True
    )
    print(result.stdout)
    if result.returncode == 0:
        pl.ok("チェック通過")
        return True
    else:
        pl.warn("チェックでエラー検出 → story/consistency_log.md を確認してください")
        return False


# ─────────────────────────────────────────────
# STEP 2: 挿絵プロンプト抽出
# ─────────────────────────────────────────────

def run_prompt_extraction(pl: Pipeline) -> Path | None:
    pl.step("挿絵プロンプト抽出")
    extractor = SCRIPTS_DIR / "image_gen" / "prompt_extractor.py"
    output_path = pl.chapter_path.parent / (pl.chapter_path.stem + "_prompts.json")
    result = subprocess.run(
        [sys.executable, str(extractor), str(pl.chapter_path), "--output", str(output_path)],
        capture_output=True, text=True
    )
    print(result.stdout)
    if output_path.exists():
        with open(output_path, encoding="utf-8") as f:
            data = json.load(f)
        scene_count = len(data.get("tagged_scenes", []))
        pl.ok(f"{scene_count} シーンのプロンプトを抽出 → {output_path.name}")
        return output_path
    else:
        pl.warn("プロンプトファイルが生成されませんでした")
        return None


# ─────────────────────────────────────────────
# STEP 3: 編集者批評プロンプト生成
# ─────────────────────────────────────────────

def generate_editor_prompt(pl: Pipeline) -> Path:
    pl.step("編集者批評プロンプト生成")
    from editor_critic import generate_editor_prompt as _gen, analyze_draft_metrics

    metrics = analyze_draft_metrics(pl.text)
    print(f"  文字数: {metrics['total_chars']:,}字 / {metrics['estimated_pages']}ページ")
    print(f"  会話文割合: {metrics['dialogue_ratio']}%")
    if metrics.get("rhythm_warning"):
        pl.warn("短文が多すぎます（リズム単調の可能性）")

    prompt_text = _gen(pl.text)
    out = pl.chapter_path.parent / (pl.chapter_path.stem + "_editor_review_prompt.md")
    out.write_text(
        f"# 編集者批評依頼プロンプト — {pl.chapter_path.name}\n"
        f"# 生成: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n"
        f"# このファイルの内容を Claude Code Chat に貼り付けてください\n\n"
        + prompt_text,
        encoding="utf-8"
    )
    pl.ok(f"批評プロンプト生成 → {out.name}")
    return out


# ─────────────────────────────────────────────
# STEP 4: story_tracker.json 更新
# ─────────────────────────────────────────────

def extract_chapter_metadata(text: str, chapter_num: int, arc_num: int) -> dict:
    """本文からメタデータを自動抽出する"""
    # タイトル抽出
    title_match = re.search(r'^# .+?「(.+?)」', text, re.MULTILINE)
    title = title_match.group(1) if title_match else f"第{chapter_num}話"

    # 文字数
    word_count = len(text.replace("\n", "").replace(" ", "").replace("　", ""))

    # シーンブレークからロケーションを抽出
    scene_tags = re.findall(r'\[SCENE_BREAK:\s*([^\]]+)\]', text)
    locations = []
    characters = set()
    for tag in scene_tags:
        parts = [p.strip() for p in tag.split(",")]
        if len(parts) >= 2:
            for c in parts[1].split("/"):
                characters.add(c.strip())
        if len(parts) >= 4:
            locations.append(parts[3].strip())

    # SCENE_BREAK タグがない場合の警告
    if not scene_tags:
        print("  ⚠ [SCENE_BREAK] タグが見つかりません。挿絵生成が機能しません。")

    return {
        "chapter": chapter_num,
        "arc": f"arc{arc_num}",
        "title": title,
        "pov_character": "",
        "tension_level": 5,
        "location": locations[0] if locations else "",
        "time_in_story": "",
        "who": sorted(characters),
        "what": "",
        "where": ", ".join(dict.fromkeys(locations)),
        "when": "",
        "why": "",
        "how": "",
        "emotional_journey": "（自動入力）",
        "foreshadowing_planted": [],
        "foreshadowing_resolved": [],
        "new_facts_established": [],
        "continuity_notes": "（要手動入力）",
        "word_count": word_count,
    }


def update_tracker(pl: Pipeline) -> None:
    pl.step("story_tracker.json 更新")
    tracker_path = PROJECT_ROOT / "story" / "story_tracker.json"

    with open(tracker_path, encoding="utf-8") as f:
        tracker = json.load(f)

    meta = extract_chapter_metadata(pl.text, pl.chapter_num, pl.arc_num)

    # 重複チェック
    existing = {s["chapter"] for s in tracker.get("chapter_summaries", [])}
    if pl.chapter_num in existing:
        pl.warn(f"第{pl.chapter_num}話のサマリーは既に存在します。上書きします。")
        tracker["chapter_summaries"] = [
            s for s in tracker["chapter_summaries"] if s["chapter"] != pl.chapter_num
        ]

    tracker.setdefault("chapter_summaries", []).append(meta)
    tracker.setdefault("_meta", {})["last_updated"] = datetime.now().isoformat()
    tracker["_meta"]["current_chapter"] = max(
        pl.chapter_num,
        tracker["_meta"].get("current_chapter", 0)
    )

    with open(tracker_path, "w", encoding="utf-8") as f:
        json.dump(tracker, f, ensure_ascii=False, indent=2)

    pl.ok(
        f"story_tracker.json 更新完了\n"
        f"    タイトル: 「{meta['title']}」\n"
        f"    文字数: {meta['word_count']:,}字\n"
        f"    登場人物: {', '.join(meta['who']) or '（未検出）'}\n"
        f"    ⚠ continuity_notes は手動で入力してください"
    )


# ─────────────────────────────────────────────
# STEP 5: 次話案内
# ─────────────────────────────────────────────

def print_next_step_guide(pl: Pipeline, editor_prompt_path: Path | None,
                           prompts_json_path: Path | None) -> None:
    pl.step("完了 & 次のアクション")
    next_chapter = pl.chapter_num + 1

    print(f"""
✓ 全自動処理完了！

【やること（優先順）】

  1. 編集者批評を受ける（推奨）
     → 以下のファイルを Claude Code Chat に貼り付ける:
        {editor_prompt_path or '（生成されませんでした）'}

  2. 批評を受けてリライトする場合:
     → 本文ファイルを直接編集:
        {pl.chapter_path}

  3. story_tracker.json の手動補完:
     → continuity_notes（次話への引き継ぎ）を記入:
        story/story_tracker.json

  4. 挿絵を生成する（SD WebUI 起動中の場合）:
     → python3 scripts/image_gen/sd_generator.py \\
          {prompts_json_path or '（プロンプト未生成）'}

  5. 次話の執筆プロンプトを生成する:
     → python3 scripts/writing/chapter_writer.py \\
          --chapter {next_chapter} --arc {pl.arc_num}
""")


# ─────────────────────────────────────────────
# メイン
# ─────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="章保存後の全自動処理パイプライン")
    parser.add_argument("chapter_file", help="章ファイルのパス（例: story/chapters/ch1-01_タイトル.md）")
    parser.add_argument("chapter_num", type=int, help="話数（例: 1）")
    parser.add_argument("--arc", type=int, default=1, help="Arc番号（デフォルト: 1）")
    parser.add_argument("--skip-images", action="store_true", help="挿絵プロンプト抽出をスキップ")
    parser.add_argument("--skip-editor", action="store_true", help="編集者批評プロンプト生成をスキップ")
    args = parser.parse_args()

    chapter_path = PROJECT_ROOT / args.chapter_file if not Path(args.chapter_file).is_absolute() \
        else Path(args.chapter_file)

    if not chapter_path.exists():
        print(f"エラー: ファイルが見つかりません: {chapter_path}")
        sys.exit(1)

    pl = Pipeline(chapter_path, args.chapter_num, args.arc)

    print("=" * 60)
    print(f"  自動処理パイプライン 開始")
    print(f"  対象: {chapter_path.name}")
    print(f"  第{args.chapter_num}話 / Arc{args.arc}")
    print("=" * 60)

    # STEP 1: 整合性チェック
    run_consistency_check(pl)

    # STEP 2: 挿絵プロンプト抽出
    prompts_json = None
    if not args.skip_images:
        prompts_json = run_prompt_extraction(pl)

    # STEP 3: 編集者批評プロンプト
    editor_prompt_path = None
    if not args.skip_editor:
        try:
            editor_prompt_path = generate_editor_prompt(pl)
        except Exception as e:
            pl.warn(f"編集者批評プロンプト生成でエラー: {e}")

    # STEP 4: トラッカー更新
    update_tracker(pl)

    # STEP 5: 次話案内
    print_next_step_guide(pl, editor_prompt_path, prompts_json)

    print("=" * 60)


if __name__ == "__main__":
    main()
