#!/usr/bin/env python3
"""
本文から挿絵用プロンプトを自動抽出するスクリプト
本文中の [SCENE_BREAK: ...] タグと重要シーンを解析して
Stable Diffusion用プロンプトを生成する。

使用方法:
  python prompt_extractor.py <chapter_file>
  python prompt_extractor.py <chapter_file> --output prompts.json
"""

import json
import re
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent.parent

# 挿絵候補シーンを示すキーワード
ILLUSTRATION_TRIGGERS = [
    r'初めて.*?(現れ|登場|姿を見せ)',
    r'(涙|泣き|泣い)',
    r'(叫び|叫ん|叫んだ)',
    r'(笑顔|微笑|ほほ笑)',
    r'(魔法|術|技|攻撃|防御)',
    r'(爆発|閃光|轟音)',
    r'(夕日|夕焼け|朝日|星空|月明かり)',
    r'(剣|刀|銃|武器).*?(振|放)',
    r'(抱きしめ|抱擁|ハグ)',
    r'(絶望|希望|決意)',
]


def load_character_sd_prompts() -> dict[str, str]:
    """キャラクターのSD基本プロンプトを読み込む"""
    profiles_dir = PROJECT_ROOT / "characters" / "profiles"
    prompts = {}
    for p in profiles_dir.glob("*.json"):
        with open(p, encoding="utf-8") as f:
            data = json.load(f)
        name = data.get("basic", {}).get("name", {}).get("full", "")
        sd_prompt = data.get("sd_prompts", {}).get("base_positive", "")
        if name and sd_prompt:
            prompts[name] = sd_prompt
    return prompts


def parse_scene_break_tags(text: str) -> list[dict]:
    """本文中の [SCENE_BREAK: ...] タグを解析する"""
    scenes = []
    pattern = r'\[SCENE_BREAK:\s*([^\]]+)\]'
    matches = re.finditer(pattern, text)

    for match in matches:
        tag_content = match.group(1)
        parts = [p.strip() for p in tag_content.split(',')]

        scene = {
            "scene_id": parts[0] if len(parts) > 0 else "",
            "characters": parts[1].split('/') if len(parts) > 1 else [],
            "emotion": parts[2] if len(parts) > 2 else "",
            "location": parts[3] if len(parts) > 3 else "",
            "position": match.start(),
            "context": text[max(0, match.start()-200):match.start()].strip()
        }
        scenes.append(scene)

    return scenes


def extract_illustratable_scenes(text: str) -> list[dict]:
    """挿絵化に適したシーンを自動検出する"""
    candidates = []
    paragraphs = text.split('\n')

    for i, para in enumerate(paragraphs):
        for trigger_pattern in ILLUSTRATION_TRIGGERS:
            if re.search(trigger_pattern, para):
                context = '\n'.join(paragraphs[max(0, i-2):min(len(paragraphs), i+3)])
                candidates.append({
                    "line": i + 1,
                    "trigger": trigger_pattern,
                    "context": context.strip()
                })
                break  # 同一行で複数のトリガーにマッチしても1回

    return candidates


def build_sd_prompt(scene: dict, char_prompts: dict, world_style: str = "") -> dict:
    """シーン情報からSD用プロンプトを構築する"""
    # キャラクタープロンプトの組み合わせ
    char_prompt_parts = []
    for char_name in scene.get("characters", []):
        for profile_name, prompt in char_prompts.items():
            if char_name in profile_name or profile_name in char_name:
                char_prompt_parts.append(prompt)

    # 感情→表情プロンプトのマッピング
    emotion_map = {
        "喜び": "happy expression, bright smile",
        "怒り": "angry expression, fierce look",
        "悲しみ": "sad expression, teary eyes",
        "恐怖": "fearful expression, wide eyes",
        "決意": "determined expression, sharp gaze",
        "驚き": "surprised expression, shocked look",
        "緊張": "tense expression, focused gaze",
        "絶望": "despairing expression, hollow eyes",
    }
    emotion_prompt = emotion_map.get(scene.get("emotion", ""), scene.get("emotion", ""))

    # 場所→背景プロンプトのマッピング（基本）
    location = scene.get("location", "")

    # プロンプト組み立て
    positive_parts = [
        "masterpiece, best quality, ultra-detailed, 8k, professional illustration",
        "anime style, detailed",
        *char_prompt_parts,
        emotion_prompt,
        location,
        world_style,
        "cinematic lighting, detailed background",
    ]

    negative = (
        "lowres, bad anatomy, bad hands, text, error, missing fingers, "
        "extra digit, fewer digits, cropped, worst quality, low quality, "
        "normal quality, jpeg artifacts, signature, watermark, username, blurry, "
        "bad proportions, deformed"
    )

    positive = ", ".join(p for p in positive_parts if p)

    return {
        "scene_id": scene.get("scene_id", ""),
        "characters": scene.get("characters", []),
        "emotion": scene.get("emotion", ""),
        "location": scene.get("location", ""),
        "positive_prompt": positive,
        "negative_prompt": negative,
        "context_snippet": scene.get("context", "")[:200],
        "suggested_size": "832x1216",  # 縦長（小説挿絵向け）
        "suggested_steps": 28,
        "suggested_cfg_scale": 7.0,
    }


def main():
    if len(sys.argv) < 2:
        print("使用方法: python prompt_extractor.py <chapter_file> [--output <output.json>]")
        sys.exit(1)

    chapter_path = Path(sys.argv[1])
    output_path = None

    if "--output" in sys.argv:
        idx = sys.argv.index("--output")
        if idx + 1 < len(sys.argv):
            output_path = Path(sys.argv[idx + 1])

    if not chapter_path.exists():
        print(f"エラー: ファイルが見つかりません: {chapter_path}")
        sys.exit(1)

    text = chapter_path.read_text(encoding="utf-8")
    char_prompts = load_character_sd_prompts()

    print("=" * 60)
    print(f"挿絵プロンプト抽出: {chapter_path.name}")
    print("=" * 60)

    # タグベースのシーン解析
    tagged_scenes = parse_scene_break_tags(text)
    print(f"\n[SCENE_BREAK] タグ検出: {len(tagged_scenes)} 件")

    # 自動検出シーン
    auto_scenes = extract_illustratable_scenes(text)
    print(f"自動検出候補シーン: {len(auto_scenes)} 件")

    # プロンプト生成
    all_prompts = []

    for scene in tagged_scenes:
        prompt_data = build_sd_prompt(scene, char_prompts)
        all_prompts.append(prompt_data)
        print(f"\n--- シーン: {scene['scene_id']} ---")
        print(f"キャラ: {', '.join(scene['characters'])}")
        print(f"感情: {scene['emotion']}")
        print(f"場所: {scene['location']}")
        print(f"プロンプト (先頭100字): {prompt_data['positive_prompt'][:100]}...")

    # 自動検出シーンのプロンプト（シンプル版）
    for i, candidate in enumerate(auto_scenes[:5]):  # 最大5件
        print(f"\n--- 自動検出候補 {i+1} (行{candidate['line']}) ---")
        print(f"コンテキスト: {candidate['context'][:100]}...")

    # 出力
    output_data = {
        "chapter_file": str(chapter_path),
        "tagged_scenes": all_prompts,
        "auto_detected_count": len(auto_scenes),
        "generation_settings": {
            "api_url": "http://localhost:7860",
            "sampler": "DPM++ 2M Karras",
            "steps": 28,
            "cfg_scale": 7.0,
            "size": "832x1216"
        }
    }

    if output_path:
        output_path.write_text(json.dumps(output_data, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"\n✓ プロンプトを保存しました: {output_path}")
    else:
        default_output = chapter_path.parent / (chapter_path.stem + "_prompts.json")
        default_output.write_text(json.dumps(output_data, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"\n✓ プロンプトを保存しました: {default_output}")


if __name__ == "__main__":
    main()
