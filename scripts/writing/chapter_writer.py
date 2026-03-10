#!/usr/bin/env python3
"""
chapter_writer.py — Claude Code 向け「最強執筆プロンプト」生成ツール

APIキー不要。Claude Code の対話（Chat）に貼り付けるための
最高密度のコンテキストプロンプトを生成する。

使用方法:
  python3 scripts/writing/chapter_writer.py --chapter 1 --arc 1
  python3 scripts/writing/chapter_writer.py --chapter 2 --arc 1 --tension 7 --emotion "絶望と覚悟"
  python3 scripts/writing/chapter_writer.py --chapter 1 --arc 1 --no-interactive
"""

import argparse
import sys
import textwrap
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from prompt_builder import (
    load_tracker, load_bible, load_all_characters,
    load_arc_outline, load_previous_chapter,
    build_rules_section, build_bible_section, build_characters_section,
    build_tracker_section, build_foreshadowing_section,
    build_emotional_arc_section, build_scene_structure_section,
)

PROJECT_ROOT = Path(__file__).parent.parent.parent
PROMPTS_DIR = PROJECT_ROOT / "prompts"

# ─────────────────────────────────────────────
# プロンプトテンプレート
# ─────────────────────────────────────────────

PHASE1_EDITOR = """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PHASE 1 — 編集者AIとして概要を批評せよ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

あなたは日本の一流文芸誌の編集長です。
今話の概要・構成を読み、以下の観点から容赦なく批評してください。
批評は箇条書きで簡潔に（各3行以内）。

1. 読者感情曲線は計算されているか？ テンション推移が自然か？
2. キャラクターの行動に動機的根拠があるか？ ご都合主義はないか？
3. 「見せる（Show）」か「語る（Tell）」か？
4. 伏線の活用・前話との繋がりは適切か？
5. 今話が終わった後、読者は何を感じ・何を知りたいと思うか？

批評後、「以上の指摘を全て踏まえた上で」Phase 2 の執筆に進んでください。
""".strip()

PHASE2_WRITER_TEMPLATE = """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PHASE 2 — 作家AIとして本文を執筆せよ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phase 1 の批評を全て受け入れた上で、本文を執筆してください。

### 出力フォーマット（厳守）

```
# 第{chapter_num}話「（タイトルを決めて記入）」

（本文）

[SCENE_BREAK: scene01, キャラ名/キャラ名, 感情キーワード, ロケーション]

（次シーン本文）

[SCENE_BREAK: scene02, ...]
```

### 品質要件
- **目標文字数**: {target_words}字以上（少なくともこの分量は必ず書く）
- **段落数**: 最低 {min_paragraphs} 段落
- **セリフ:地の文**: {dialogue_ratio}
- 冒頭1段落は「掴み」に全力を注ぐ（感覚描写 or 謎提示から始める）
- 最終段落は次話を読みたくなる「問い」か「変化した状態」で終わる

### 執筆後 自己検閲チェックリスト（問題があれば即修正してから出力）
```
□ 三点リーダー(……)はすべて2個セットか？
□ ダッシュ(——)はすべて2個セットか？
□ ！？の直後（閉じカッコ・行末以外）に全角スペースがあるか？
□ 全段落の行頭に全角スペース（　）があるか？
□ POVキャラ以外の内心描写はないか？
□ 各キャラの一人称・語尾は設定通りか？
□ 説明台詞（読者への情報提供台詞）はないか？
□ [SCENE_BREAK] タグは各シーン末尾に付与してあるか？
```
""".strip()


def build_full_prompt(chapter_num, arc_num, outline, target_tension,
                       emotional_goal, arc_position, scenes,
                       target_words, dialogue_ratio, chapter_filename, prompt_path):
    tracker = load_tracker()
    bible = load_bible()
    chars = load_all_characters()
    prev_chapter = load_previous_chapter(chapter_num)
    min_paragraphs = max(20, target_words // 200)

    header = (
        f"# Claude Code 執筆依頼 — 第{chapter_num}話（Arc {arc_num}）\n"
        f"# 生成: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n"
        f"# 保存先: story/chapters/{chapter_filename}\n"
        f"# 処理: python3 scripts/process_chapter.py story/chapters/{chapter_filename} {chapter_num}\n"
    )

    intro = (
        f"あなたは「プロの文芸編集者」と「直木賞級の小説家」の二役を担うAIです。\n"
        f"下記の設定・ルールを完全に把握した上で、第{chapter_num}話を二段階（批評→執筆）で完成させてください。"
    )

    sections = [
        header,
        intro,
        build_rules_section(),
        build_bible_section(bible),
        build_characters_section(chars),
        build_tracker_section(tracker, chapter_num),
        build_foreshadowing_section(tracker, chapter_num),
        build_emotional_arc_section(chapter_num, target_tension, emotional_goal, arc_position),
    ]

    if prev_chapter:
        sections.append(f"## 直前話の末尾（文体・テンション参照）\n\n{prev_chapter}")

    if outline:
        sections.append(f"## 今話のプロットアウトライン\n\n{outline}")
    else:
        sections.append(
            f"## 今話のプロットアウトライン\n\n"
            f"（未指定。世界観・キャラ・伏線情報を元に、テンション{target_tension}の章を自律的に構成すること）"
        )

    sections.append(build_scene_structure_section(scenes))
    sections.append(PHASE1_EDITOR)
    sections.append(
        PHASE2_WRITER_TEMPLATE.format(
            chapter_num=chapter_num,
            target_words=target_words,
            min_paragraphs=min_paragraphs,
            dialogue_ratio=dialogue_ratio,
        )
    )

    return "\n\n---\n\n".join(s.strip() for s in sections if s.strip())


# ─────────────────────────────────────────────
# インタラクティブ入力
# ─────────────────────────────────────────────

def ask(prompt, default=""):
    suffix = f" [{default}]" if default else ""
    val = input(f"{prompt}{suffix}: ").strip()
    return val if val else default

def ask_int(prompt, default):
    try:
        return int(ask(prompt, str(default)))
    except ValueError:
        return default

def interactive_setup(chapter_num, arc_num):
    print("\n" + "=" * 60)
    print("  執筆プロンプト設定ウィザード")
    print("=" * 60 + "\n")

    tension = ask_int("テンション値（0-10）", 5)
    emotion = ask("読者に体験させたい感情", "緊張と期待が入り混じる感覚")

    positions = [
        "序盤（世界観・キャラ紹介）", "中盤（葛藤・対立）",
        "山場（クライマックス直前）", "頂点（クライマックス）", "解決（余韻・次Arc布石）"
    ]
    print("\nArc内での位置づけ:")
    for i, p in enumerate(positions, 1):
        print(f"  {i}. {p}")
    arc_position = positions[max(0, min(ask_int("番号", 2) - 1, len(positions) - 1))]

    target_words = ask_int("目標文字数", 4000)

    ratios = ["3:7（地の文重視）", "4:6（標準）", "5:5（バランス）", "6:4（会話重視）"]
    print("\nセリフ:地の文 の比率:")
    for i, r in enumerate(ratios, 1):
        print(f"  {i}. {r}")
    dialogue_ratio = ratios[max(0, min(ask_int("番号", 2) - 1, len(ratios) - 1))]

    print("\nシーン構成: 1=自動  2=手動指定")
    scenes = []
    if ask_int("番号", 1) == 2:
        count = ask_int("シーン数", 3)
        for i in range(1, count + 1):
            print(f"\n  --- シーン {i} ---")
            scenes.append({
                "name": ask(f"  シーン{i}名", f"シーン{i}"),
                "location": ask("  場所", ""),
                "characters": [c.strip() for c in ask("  登場人物（カンマ区切り）", "").split(",") if c.strip()],
                "emotion_goal": ask("  感情目標", ""),
                "summary": ask("  概要", ""),
            })

    return dict(tension=tension, emotion=emotion, arc_position=arc_position,
                 target_words=target_words, dialogue_ratio=dialogue_ratio, scenes=scenes)


# ─────────────────────────────────────────────
# メイン
# ─────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Claude Code 向け最強執筆プロンプト生成ツール",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--chapter", "-c", type=int, required=True)
    parser.add_argument("--arc", "-a", type=int, required=True)
    parser.add_argument("--outline", type=str)
    parser.add_argument("--tension", type=int)
    parser.add_argument("--emotion", type=str)
    parser.add_argument("--words", type=int, default=4000)
    parser.add_argument("--no-interactive", action="store_true")
    args = parser.parse_args()

    PROMPTS_DIR.mkdir(exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M")
    prompt_filename = f"ch{args.arc}-{args.chapter:02d}_writing_prompt_{ts}.md"
    prompt_path = PROMPTS_DIR / prompt_filename
    chapter_filename = f"ch{args.arc}-{args.chapter:02d}_タイトル.md"

    # アウトライン読み込み
    outline_text = ""
    if args.outline:
        p = Path(args.outline)
        outline_text = p.read_text(encoding="utf-8") if p.exists() else ""
    if not outline_text:
        arc_outline = load_arc_outline(args.arc)
        outline_text = arc_outline

    # 設定収集
    if args.no_interactive:
        config = dict(tension=args.tension or 5, emotion=args.emotion or "緊張と期待",
                      arc_position="中盤", target_words=args.words,
                      dialogue_ratio="4:6（標準）", scenes=[])
    else:
        config = interactive_setup(args.chapter, args.arc)
        if args.tension is not None:
            config["tension"] = args.tension
        if args.emotion:
            config["emotion"] = args.emotion
        if args.words != 4000:
            config["target_words"] = args.words

    print("\nプロンプトを生成中...")
    prompt = build_full_prompt(
        chapter_num=args.chapter, arc_num=args.arc, outline=outline_text,
        target_tension=config["tension"], emotional_goal=config["emotion"],
        arc_position=config["arc_position"], scenes=config["scenes"],
        target_words=config["target_words"], dialogue_ratio=config["dialogue_ratio"],
        chapter_filename=chapter_filename, prompt_path=str(prompt_path),
    )

    prompt_path.write_text(prompt, encoding="utf-8")
    char_count = len(prompt)

    print(f"""
{"=" * 60}
✓ プロンプト生成完了！
  ファイル : {prompt_path}
  文字数   : {char_count:,} 字
{"=" * 60}

【次のステップ】

  STEP 1: このプロンプトを Claude Code Chat に貼り付ける
            cat "{prompt_path}"
            ↑ の出力をコピーして Chat に貼り付けてください

  STEP 2: 生成された本文を保存する
            story/chapters/{chapter_filename}

  STEP 3: 自動処理パイプラインを実行する
            python3 scripts/process_chapter.py \\
              story/chapters/{chapter_filename} {args.chapter}
""")

    try:
        show = input("プロンプトをターミナルにも表示しますか？ (y/N): ").strip().lower()
        if show == "y":
            print("\n" + "=" * 60)
            print(prompt)
            print("=" * 60)
    except (EOFError, KeyboardInterrupt):
        pass


if __name__ == "__main__":
    main()
