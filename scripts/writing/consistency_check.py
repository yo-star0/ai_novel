#!/usr/bin/env python3
"""
整合性チェックエンジン
新しい章を執筆する前に、既出の事実・キャラクター状態と矛盾がないかスキャンする。
"""

import json
import re
import sys
from pathlib import Path
from datetime import datetime
from typing import Any

PROJECT_ROOT = Path(__file__).parent.parent.parent


def load_tracker() -> dict[str, Any]:
    tracker_path = PROJECT_ROOT / "story" / "story_tracker.json"
    with open(tracker_path, encoding="utf-8") as f:
        return json.load(f)


def load_character_profiles() -> dict[str, Any]:
    profiles_dir = PROJECT_ROOT / "characters" / "profiles"
    profiles = {}
    for p in profiles_dir.glob("*.json"):
        with open(p, encoding="utf-8") as f:
            data = json.load(f)
            profiles[data.get("id", p.stem)] = data
    return profiles


def load_chapter_text(chapter_path: Path) -> str:
    with open(chapter_path, encoding="utf-8") as f:
        return f.read()


def check_typography(text: str) -> list[dict]:
    """日本語文芸ルールの違反をチェックする"""
    violations = []

    # 三点リーダーチェック（単体の…は禁止）
    single_ellipsis = re.findall(r'(?<!…)…(?!…)', text)
    if single_ellipsis:
        violations.append({
            "type": "typography",
            "severity": "error",
            "rule": "三点リーダー単体使用禁止",
            "description": f"単体の「…」が {len(single_ellipsis)} 箇所見つかりました。「……」（2個セット）に修正してください。",
            "count": len(single_ellipsis)
        })

    # ダッシュチェック（単体の—は禁止）
    single_dash = re.findall(r'(?<!—)—(?!—)', text)
    if single_dash:
        violations.append({
            "type": "typography",
            "severity": "error",
            "rule": "ダッシュ単体使用禁止",
            "description": f"単体の「—」が {len(single_dash)} 箇所見つかりました。「——」（2個セット）に修正してください。",
            "count": len(single_dash)
        })

    # 感嘆符・疑問符の後のスペースチェック
    missing_space = re.findall(r'[！？](?![　」\n])', text)
    if missing_space:
        violations.append({
            "type": "typography",
            "severity": "warning",
            "rule": "感嘆符・疑問符の後に全角スペースが必要",
            "description": f"スペースなしの「！」「？」が {len(missing_space)} 箇所あります（閉じカッコ・行末は除く）。",
            "count": len(missing_space)
        })

    # 半角記号の混入チェック
    half_width = re.findall(r'[!?\.]{1,}', text)
    if half_width:
        violations.append({
            "type": "typography",
            "severity": "warning",
            "rule": "半角記号の使用",
            "description": f"半角記号 {half_width[:5]} が検出されました。全角に統一してください。",
            "count": len(half_width)
        })

    # 行頭字下げチェック（段落開始）
    paragraphs = text.split('\n')
    no_indent = []
    for i, para in enumerate(paragraphs, 1):
        stripped = para.strip()
        if stripped and not stripped.startswith('　') and not stripped.startswith('#') \
                and not stripped.startswith('「') and not stripped.startswith('『') \
                and len(stripped) > 10:
            no_indent.append(i)
    if no_indent:
        violations.append({
            "type": "typography",
            "severity": "warning",
            "rule": "行頭字下げ",
            "description": f"行頭字下げがない段落が {len(no_indent)} 箇所あります（行番号: {no_indent[:10]}）",
            "count": len(no_indent)
        })

    return violations


def check_character_consistency(text: str, tracker: dict, profiles: dict) -> list[dict]:
    """キャラクターの状態・知識との矛盾をチェックする"""
    violations = []
    char_states = tracker.get("character_states", {})

    for char_id, state in char_states.items():
        if state.get("physical_condition") == "死亡":
            char_profile = profiles.get(char_id, {})
            char_name = char_profile.get("basic", {}).get("name", {}).get("full", char_id)
            if char_name and char_name in text:
                # 死亡キャラが登場している（回想・言及は除く複雑な判定が必要）
                violations.append({
                    "type": "character_consistency",
                    "severity": "warning",
                    "rule": "死亡キャラクターの登場",
                    "description": f"死亡済みの「{char_name}」が本文中に登場しています。回想・言及の場合は無視してください。",
                    "character": char_id
                })

    return violations


def check_facts_consistency(text: str, tracker: dict) -> list[dict]:
    """確定した事実との矛盾をチェックする"""
    violations = []
    facts = tracker.get("facts", {})
    ability_rules = facts.get("ability_rules", {})

    # 能力ルール違反チェック（基本的なキーワードベースの簡易チェック）
    for rule_name, rule_desc in ability_rules.items():
        if isinstance(rule_desc, dict):
            forbidden = rule_desc.get("forbidden_in_text", [])
            for keyword in forbidden:
                if keyword in text:
                    violations.append({
                        "type": "fact_consistency",
                        "severity": "error",
                        "rule": f"能力ルール違反: {rule_name}",
                        "description": f"「{keyword}」が検出されました。ルール定義: {rule_desc.get('description', '')}",
                        "keyword": keyword
                    })

    return violations


def check_foreshadowing(chapter_num: int, tracker: dict) -> list[dict]:
    """回収すべき伏線を確認する"""
    reminders = []
    foreshadowing = tracker.get("foreshadowing", [])

    for fs in foreshadowing:
        if fs.get("status") == "planted":
            resolution_ch = fs.get("resolution_chapter")
            if resolution_ch and resolution_ch <= chapter_num:
                reminders.append({
                    "type": "foreshadowing_reminder",
                    "severity": "info",
                    "rule": "伏線回収の確認",
                    "description": f"伏線「{fs['description']}」（第{fs['planted_chapter']}話に埋め込み）の回収予定章です。",
                    "foreshadow_id": fs["id"]
                })

    return reminders


def run_full_check(chapter_path: str | None = None, chapter_num: int = 0) -> dict:
    """全チェックを実行してレポートを返す"""
    print("=" * 60)
    print("整合性チェックエンジン 起動")
    print(f"チェック対象: {chapter_path or '（本文なし・事前チェックモード）'}")
    print(f"章番号: 第{chapter_num}話")
    print("=" * 60)

    tracker = load_tracker()
    profiles = load_character_profiles()

    all_violations = []

    # 伏線リマインダー
    fs_reminders = check_foreshadowing(chapter_num, tracker)
    all_violations.extend(fs_reminders)

    # 本文チェック（ファイルが指定されている場合）
    if chapter_path:
        text = load_chapter_text(Path(chapter_path))

        typo_violations = check_typography(text)
        all_violations.extend(typo_violations)

        char_violations = check_character_consistency(text, tracker, profiles)
        all_violations.extend(char_violations)

        fact_violations = check_facts_consistency(text, tracker)
        all_violations.extend(fact_violations)

    # レポート生成
    errors = [v for v in all_violations if v["severity"] == "error"]
    warnings = [v for v in all_violations if v["severity"] == "warning"]
    infos = [v for v in all_violations if v["severity"] == "info"]

    print(f"\n【チェック結果】")
    print(f"  エラー: {len(errors)} 件")
    print(f"  警告:   {len(warnings)} 件")
    print(f"  情報:   {len(infos)} 件")
    print()

    for v in errors:
        print(f"[ERROR] {v['rule']}")
        print(f"  → {v['description']}")
        print()

    for v in warnings:
        print(f"[WARN]  {v['rule']}")
        print(f"  → {v['description']}")
        print()

    for v in infos:
        print(f"[INFO]  {v['rule']}")
        print(f"  → {v['description']}")
        print()

    # 違反をログファイルに追記
    if errors:
        _append_to_consistency_log(errors, chapter_num)

    return {
        "chapter": chapter_num,
        "timestamp": datetime.now().isoformat(),
        "errors": errors,
        "warnings": warnings,
        "infos": infos,
        "passed": len(errors) == 0
    }


def _append_to_consistency_log(violations: list[dict], chapter_num: int) -> None:
    log_path = PROJECT_ROOT / "story" / "consistency_log.md"
    with open(log_path, "a", encoding="utf-8") as f:
        for i, v in enumerate(violations):
            f.write(f"\n### [AUTO-{datetime.now().strftime('%Y%m%d-%H%M%S')}-{i}] {datetime.now().strftime('%Y-%m-%d')}\n")
            f.write(f"**発見章**: 第{chapter_num}話\n")
            f.write(f"**矛盾内容**: {v['description']}\n")
            f.write(f"**ルール**: {v['rule']}\n")
            f.write(f"**修正案**:\n  - （手動で記入）\n")
            f.write(f"**採用案**: （未決定）\n")
            f.write(f"**修正実施**: □ 未実施\n")
            f.write("---\n")


if __name__ == "__main__":
    chapter_file = sys.argv[1] if len(sys.argv) > 1 else None
    chapter_number = int(sys.argv[2]) if len(sys.argv) > 2 else 0
    result = run_full_check(chapter_file, chapter_number)
    sys.exit(0 if result["passed"] else 1)
