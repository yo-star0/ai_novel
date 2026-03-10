#!/usr/bin/env python3
"""
プロンプトビルダー — コンテキスト収集モジュール

chapter_writer.py から呼ばれる、プロンプト構築のためのデータ収集層。
各種設定ファイルを読み込み、Claude Code 向けの指示文に変換する。
"""

import json
from pathlib import Path
from typing import Any

PROJECT_ROOT = Path(__file__).parent.parent.parent


# ─────────────────────────────────────────────
# データ読み込み
# ─────────────────────────────────────────────

def load_tracker() -> dict[str, Any]:
    p = PROJECT_ROOT / "story" / "story_tracker.json"
    if not p.exists():
        return {"timeline": [], "foreshadowing": [], "facts": {}, "character_states": {}, "chapter_summaries": []}
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def load_bible() -> str:
    p = PROJECT_ROOT / "bible.md"
    return p.read_text(encoding="utf-8") if p.exists() else "（bible.md 未作成）"


def load_character_full(char_id: str) -> dict[str, Any] | None:
    p = PROJECT_ROOT / "characters" / "profiles" / f"{char_id}.json"
    if not p.exists():
        return None
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def load_all_characters() -> list[dict[str, Any]]:
    profiles_dir = PROJECT_ROOT / "characters" / "profiles"
    if not profiles_dir.exists():
        return []
    chars = []
    for p in sorted(profiles_dir.glob("*.json")):
        with open(p, encoding="utf-8") as f:
            try:
                chars.append(json.load(f))
            except json.JSONDecodeError:
                pass
    return chars


def load_arc_outline(arc_num: int) -> str:
    """story/arcs/ から該当Arcのアウトラインを探す"""
    arcs_dir = PROJECT_ROOT / "story" / "arcs"
    if not arcs_dir.exists():
        return ""
    for p in arcs_dir.glob(f"arc{arc_num}_*.md"):
        return p.read_text(encoding="utf-8")
    # fallback: arc_template
    template = PROJECT_ROOT / "story" / "arc_template.md"
    return template.read_text(encoding="utf-8") if template.exists() else ""


def load_previous_chapter(chapter_num: int) -> str:
    """直前の章本文を返す（末尾1500字）"""
    chapters_dir = PROJECT_ROOT / "story" / "chapters"
    if not chapters_dir.exists() or chapter_num <= 1:
        return ""
    # ch*-XX_*.md 形式でソートして直前を探す
    files = sorted(chapters_dir.glob("*.md"))
    if not files:
        return ""
    # 最後に書かれたファイルを取得
    last = files[-1]
    text = last.read_text(encoding="utf-8")
    return f"【直前話ファイル: {last.name}】\n\n…（前略）…\n\n{text[-1500:]}"


# ─────────────────────────────────────────────
# セクション構築
# ─────────────────────────────────────────────

def build_rules_section() -> str:
    """CLAUDE.md の核心ルールを要約した指示ブロック"""
    return """
## ██ 絶対ルール（違反禁止・全項目厳守）██

### 記号ルール
| 記号 | 正 | 誤 |
|------|----|----|
| 三点リーダー | `……`（2個セット） | `…`（単体）`...` |
| ダッシュ | `——`（2個セット） | `—`（単体）`-` |
| 感嘆符・疑問符 | `！　` `？　`（後に全角スペース） | `! ` `? `（半角）|
| 行頭字下げ | 　（全角スペース1文字） | なし |
| カギ括弧閉じ | 「セリフ」（句点なし） | 「セリフ。」 |

### 文体ルール
- **視点**: 三人称限定視点（POVキャラ以外の内心描写は絶対禁止）
- **時制**: 過去形統一（現在形は心理描写の傍点部分のみ可）
- **リズム**: 短文→中文→長文の順で組む（連続短文3文以上は冗長）
- **感覚描写優先度**: 視覚 → 触覚 → 聴覚 → 嗅覚 → 味覚
- **禁止語**: 「なんか」「とか」「みたいな」（会話文以外での使用禁止）
- **Show, don't Tell**: 感情を直接書かず、行動・表情・身体反応で表現する
- **説明台詞禁止**: キャラが読者のために情報を説明するセリフを書かない

### 会話ルール
- セリフの間には必ず「行動 or 表情 or 心理」を挟む
- 同一人物の連続発言は最大2回まで
- 各キャラの口調は下記キャラクター設定に厳密に従う

### シーンタグ（必須）
各シーンの末尾に以下タグを付与すること（挿絵生成パイプラインが使用）:
```
[SCENE_BREAK: シーンID, キャラ名/キャラ名, 感情キーワード, ロケーション]
```
""".strip()


def build_bible_section(bible: str) -> str:
    # bible.md は長い可能性があるので核心部分だけ抜く
    lines = bible.split("\n")
    # 「世界観ワンライン」「核となるテーマ」「世界の『ルール』」を優先抽出
    important = []
    capture = False
    for line in lines:
        if any(kw in line for kw in ["ワンライン", "核となるテーマ", "世界の「ルール」", "世界の'ルール'"]):
            capture = True
        if capture:
            important.append(line)
        if capture and line.startswith("---"):
            capture = False
    core = "\n".join(important[:60]) if important else bible[:2000]
    return f"## 世界観Bible（核心）\n\n{core}"


def build_characters_section(chars: list[dict]) -> str:
    if not chars:
        return "## キャラクター\n（characters/profiles/ にプロファイルを作成してください）"

    sections = ["## キャラクター設定（執筆中は常に参照）"]
    for c in chars:
        name = c.get("basic", {}).get("name", {}).get("full", "?")
        reading = c.get("basic", {}).get("name", {}).get("reading", "")
        role = c.get("basic", {}).get("role", "")
        age = c.get("basic", {}).get("age", {}).get("value", "?")

        # 心理
        psych = c.get("psychology", {})
        core_desire = psych.get("core_desire", "")
        core_fear = psych.get("core_fear", "")
        wound = psych.get("wound", "")
        misbelief = psych.get("misbelief", "")

        # 口調
        speech = c.get("speech_patterns", {})
        fp = speech.get("first_person", "")
        endings = speech.get("sentence_endings", "")
        vocab = speech.get("vocabulary_level", "")
        forbidden = speech.get("forbidden_words", "")

        # セリフサンプル
        samples = speech.get("speech_samples", [])
        sample_text = "\n".join(
            f'    └ {s["context"]}: 「{s["line"]}」'
            for s in samples if s.get("line")
        )

        # 外見の特徴
        appear = c.get("appearance", {})
        silhouette = appear.get("silhouette_key", "")
        voice = appear.get("voice", {}).get("tone", "")

        # 現在状態
        char_state = ""  # tracker から引く必要がある場合は呼び出し元で追加

        block = f"""
### {name}（{reading}）— {role} / {age}歳
- **シルエット特徴**: {silhouette}
- **声の特徴**: {voice}
- **一人称**: {fp}　**語尾・口調**: {endings}　**語彙レベル**: {vocab}
- **禁止語**: {forbidden}
- **核心欲求**: {core_desire}
- **核心恐怖**: {core_fear}
- **トラウマ**: {wound}
- **誤った信念（物語で克服すべき）**: {misbelief}
{f'- **セリフサンプル**:{chr(10)}{sample_text}' if sample_text else ''}
""".strip()
        sections.append(block)

    return "\n\n".join(sections)


def build_tracker_section(tracker: dict, chapter_num: int) -> str:
    lines = ["## story_tracker 状態（現在まで確定した事実）"]

    # 確定事実
    facts = tracker.get("facts", {})
    world_facts = facts.get("world_facts", {})
    char_facts = facts.get("character_facts", {})
    if world_facts or char_facts:
        lines.append("\n### 確定した事実（矛盾禁止）")
        for k, v in {**world_facts, **char_facts}.items():
            lines.append(f"- **{k}**: {v}")

    # キャラクター現在状態
    char_states = tracker.get("character_states", {})
    # _note / _template など内部キーを除外
    char_states = {k: v for k, v in char_states.items()
                   if isinstance(v, dict) and not k.startswith("_")}
    if char_states:
        lines.append("\n### キャラクター現在状態")
        for char_id, state in char_states.items():
            loc = state.get("location", "?")
            cond = state.get("physical_condition", "?")
            emo = state.get("emotional_state", "?")
            knowledge = state.get("knowledge", "")
            goal = state.get("goals_current", "")
            lines.append(
                f"- **{char_id}**: 現在地={loc} / 状態={cond} / 感情={emo}"
                + (f"\n  知っていること: {knowledge}" if knowledge else "")
                + (f"\n  現在の目標: {goal}" if goal else "")
            )

    # 直近章サマリー
    summaries = tracker.get("chapter_summaries", [])
    recent = [s for s in summaries if s.get("chapter", 0) >= chapter_num - 2]
    if recent:
        lines.append("\n### 直近の展開")
        for s in recent:
            lines.append(
                f"- 第{s['chapter']}話「{s.get('title','')}」: "
                f"{s.get('what','')}（テンション{s.get('tension_level','?')}）"
                + (f"\n  引き継ぎ: {s['continuity_notes']}" if s.get("continuity_notes") else "")
            )

    return "\n".join(lines)


def build_foreshadowing_section(tracker: dict, chapter_num: int) -> str:
    lines = ["## 伏線管理"]
    fs_list = tracker.get("foreshadowing", [])

    # 今話で回収すべき伏線
    to_resolve = [
        f for f in fs_list
        if f.get("status") == "planted"
        and f.get("resolution_chapter") is not None
        and f.get("resolution_chapter") <= chapter_num
    ]
    if to_resolve:
        lines.append("\n### ⚠ 今話で回収すべき伏線（必ず回収すること）")
        for f in to_resolve:
            lines.append(
                f"- [{f['id']}] {f['description']}"
                + (f"\n  ヒント文: 「{f['hint_text']}」" if f.get("hint_text") else "")
            )

    # 今話以降に回収予定の伏線（忘れないよう認識）
    future = [
        f for f in fs_list
        if f.get("status") == "planted"
        and (f.get("resolution_chapter") is None or f.get("resolution_chapter") > chapter_num)
    ]
    if future:
        lines.append("\n### 現在生きている伏線（矛盾させないこと）")
        for f in future[:8]:  # 多すぎる場合は8件まで
            res_ch = f.get("resolution_chapter")
            res_info = f"→ 第{res_ch}話回収予定" if res_ch else "→ 回収章未定"
            lines.append(f"- [{f['id']}] {f['description']} {res_info}")

    if len(lines) == 1:
        lines.append("（まだ伏線が登録されていません）")

    return "\n".join(lines)


def build_emotional_arc_section(chapter_num: int, target_tension: int,
                                 emotional_goal: str, arc_position: str) -> str:
    return f"""
## 感情曲線設計（今話の目標）

| 項目 | 内容 |
|------|------|
| 今話のテンション値 | **{target_tension} / 10** |
| 読者に体験させる感情 | **{emotional_goal}** |
| Arc内での位置づけ | {arc_position} |

### テンション値の定義
| 値 | 状態 |
|----|------|
| 0-2 | 静寂・日常・伏線埋め込み |
| 3-4 | 緊張の萌芽・違和感 |
| 5-6 | 葛藤・対立・選択 |
| 7-8 | 危機・クライマックス手前 |
| 9 | クライマックス |
| 10 | 究極の転換点 |

### 感情曲線の設計原則（今話の構成に反映すること）
- **冒頭**: 前話からの感情的な「橋渡し」を2〜3段落で確立する
- **展開**: テンション値 {max(1, target_tension - 3)} からスタートし、{target_tension} まで段階的に引き上げる
- **頂点**: テンション {target_tension} の場面では、五感の描写と心理描写を最大密度で書く
- **引き**: 次話への「問い」か「変化した状態」を余韻として残す
""".strip()


def build_scene_structure_section(scenes: list[dict]) -> str:
    if not scenes:
        return """
## シーン構成（自動生成してください）

今話のシーン構成を以下のテンプレートで考えてから執筆すること:

1. **シーン1**: 冒頭（前話の余韻 → 今話の日常確立）
2. **シーン2**: 転換点（事態が動き出す）
3. **シーン3**: 葛藤・クライマックス
4. **シーン4**: 結末・余韻（次話への橋渡し）

各シーンの末尾には `[SCENE_BREAK: ...]` タグを忘れずに付与すること。
""".strip()

    lines = ["## シーン構成（指定）"]
    for i, s in enumerate(scenes, 1):
        lines.append(
            f"\n### シーン{i}: {s.get('name', '')}"
            + f"\n- 場所: {s.get('location', '')}"
            + f"\n- 登場人物: {', '.join(s.get('characters', []))}"
            + f"\n- 感情目標: {s.get('emotion_goal', '')}"
            + f"\n- 概要: {s.get('summary', '')}"
            + f"\n- タグ: `[SCENE_BREAK: scene{i:02d}, {'/'.join(s.get('characters', []))}, {s.get('emotion_goal', '')}, {s.get('location', '')}]`"
        )
    return "\n".join(lines)
