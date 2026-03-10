#!/usr/bin/env python3
"""
Stable Diffusion WebUI API 呼び出しスクリプト
localhost:7860 のSD WebUI APIを使って挿絵を生成する。

使用方法:
  python sd_generator.py <prompts_json>
  python sd_generator.py <prompts_json> --dry-run
  python sd_generator.py --single --positive "prompt" --negative "negative"
"""

import json
import sys
import base64
import argparse
import time
from pathlib import Path
from datetime import datetime

try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False

PROJECT_ROOT = Path(__file__).parent.parent.parent
SD_API_BASE = "http://localhost:7860"
OUTPUT_DIR = PROJECT_ROOT / "assets" / "images"


def check_sd_connection() -> bool:
    """SD WebUI APIへの接続を確認する"""
    if not REQUESTS_AVAILABLE:
        print("エラー: requests ライブラリが必要です。`pip install requests` を実行してください。")
        return False
    try:
        resp = requests.get(f"{SD_API_BASE}/sdapi/v1/sd-models", timeout=5)
        return resp.status_code == 200
    except Exception as e:
        print(f"SD WebUI への接続に失敗しました: {e}")
        print(f"  → {SD_API_BASE} が起動しているか確認してください。")
        return False


def get_available_models() -> list[str]:
    """利用可能なモデル一覧を取得する"""
    try:
        resp = requests.get(f"{SD_API_BASE}/sdapi/v1/sd-models", timeout=10)
        return [m["model_name"] for m in resp.json()]
    except Exception:
        return []


def generate_image(
    positive_prompt: str,
    negative_prompt: str,
    width: int = 832,
    height: int = 1216,
    steps: int = 28,
    cfg_scale: float = 7.0,
    sampler: str = "DPM++ 2M Karras",
    seed: int = -1,
) -> bytes | None:
    """SD WebUI APIで画像を生成して画像バイトを返す"""
    payload = {
        "prompt": positive_prompt,
        "negative_prompt": negative_prompt,
        "width": width,
        "height": height,
        "steps": steps,
        "cfg_scale": cfg_scale,
        "sampler_name": sampler,
        "seed": seed,
        "batch_size": 1,
        "n_iter": 1,
        "save_images": False,
        "send_images": True,
    }

    try:
        resp = requests.post(
            f"{SD_API_BASE}/sdapi/v1/txt2img",
            json=payload,
            timeout=300  # 5分タイムアウト
        )
        resp.raise_for_status()
        result = resp.json()
        images = result.get("images", [])
        if images:
            return base64.b64decode(images[0])
        return None
    except requests.exceptions.Timeout:
        print("タイムアウト: 生成に時間がかかりすぎています。")
        return None
    except Exception as e:
        print(f"生成エラー: {e}")
        return None


def save_image(image_bytes: bytes, filename: str) -> Path:
    """画像をファイルに保存する"""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    output_path = OUTPUT_DIR / filename
    output_path.write_bytes(image_bytes)
    return output_path


def process_prompts_file(prompts_file: Path, dry_run: bool = False) -> list[Path]:
    """プロンプトJSONファイルを読み込んで画像を一括生成する"""
    with open(prompts_file, encoding="utf-8") as f:
        data = json.load(f)

    chapter_file = data.get("chapter_file", "unknown")
    chapter_stem = Path(chapter_file).stem if chapter_file else "chapter"
    settings = data.get("generation_settings", {})
    scenes = data.get("tagged_scenes", [])

    print(f"\n章ファイル: {chapter_file}")
    print(f"生成シーン数: {len(scenes)}")
    print(f"DRY RUN: {dry_run}")
    print("=" * 60)

    generated_files = []

    for i, scene in enumerate(scenes):
        scene_id = scene.get("scene_id", f"scene_{i+1}")
        print(f"\n[{i+1}/{len(scenes)}] シーン: {scene_id}")
        print(f"  キャラ: {', '.join(scene.get('characters', []))}")
        print(f"  感情: {scene.get('emotion', '')}")
        print(f"  場所: {scene.get('location', '')}")
        print(f"  プロンプト（先頭80字）: {scene['positive_prompt'][:80]}...")

        if dry_run:
            print("  → DRY RUN: 実際の生成はスキップ")
            continue

        # 画像生成
        print("  → 生成中...")
        width, height = (int(x) for x in settings.get("size", "832x1216").split("x"))
        image_bytes = generate_image(
            positive_prompt=scene["positive_prompt"],
            negative_prompt=scene["negative_prompt"],
            width=width,
            height=height,
            steps=settings.get("steps", 28),
            cfg_scale=settings.get("cfg_scale", 7.0),
            sampler=settings.get("sampler", "DPM++ 2M Karras"),
        )

        if image_bytes:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{chapter_stem}_{scene_id}_{timestamp}.png"
            output_path = save_image(image_bytes, filename)
            print(f"  ✓ 保存: {output_path}")
            generated_files.append(output_path)

            # メタデータJSON保存
            meta = {
                "scene_id": scene_id,
                "chapter_file": chapter_file,
                "positive_prompt": scene["positive_prompt"],
                "negative_prompt": scene["negative_prompt"],
                "characters": scene.get("characters", []),
                "emotion": scene.get("emotion", ""),
                "location": scene.get("location", ""),
                "context_snippet": scene.get("context_snippet", ""),
                "generated_at": datetime.now().isoformat(),
                "settings": settings
            }
            meta_path = output_path.with_suffix(".json")
            meta_path.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")

            # APIへの負荷軽減のため少し待機
            time.sleep(2)
        else:
            print(f"  ✗ 生成失敗: {scene_id}")

    return generated_files


def main():
    parser = argparse.ArgumentParser(description="Stable Diffusion 挿絵生成スクリプト")
    parser.add_argument("prompts_file", nargs="?", help="プロンプトJSONファイル")
    parser.add_argument("--dry-run", action="store_true", help="実際の生成を行わずにテスト")
    parser.add_argument("--single", action="store_true", help="単一プロンプトモード")
    parser.add_argument("--positive", type=str, help="ポジティブプロンプト（--singleモード）")
    parser.add_argument("--negative", type=str, help="ネガティブプロンプト（--singleモード）")
    parser.add_argument("--output", type=str, help="出力ファイル名（--singleモード）")
    args = parser.parse_args()

    print("=" * 60)
    print("Stable Diffusion 挿絵生成システム")
    print(f"API エンドポイント: {SD_API_BASE}")
    print("=" * 60)

    # 接続確認
    if not args.dry_run:
        print("\nSD WebUI への接続確認中...")
        if not check_sd_connection():
            print("\n接続に失敗しました。")
            print("以下を確認してください:")
            print("  1. Stable Diffusion WebUI が起動しているか")
            print("  2. `--api` フラグ付きで起動されているか")
            print("  3. localhost:7860 でアクセス可能か")
            if not args.dry_run:
                sys.exit(1)
        else:
            print("✓ 接続成功")
            models = get_available_models()
            if models:
                print(f"✓ 利用可能なモデル: {models[0]} 他 {len(models)-1} モデル")

    if args.single:
        # 単一プロンプトモード
        if not args.positive:
            print("エラー: --positive プロンプトを指定してください")
            sys.exit(1)
        positive = args.positive
        negative = args.negative or (
            "lowres, bad anatomy, bad hands, text, error, missing fingers, "
            "extra digit, fewer digits, cropped, worst quality, low quality, "
            "normal quality, jpeg artifacts, signature, watermark, username, blurry"
        )
        print(f"\n単一プロンプト生成モード")
        print(f"Positive: {positive[:80]}...")
        if args.dry_run:
            print("DRY RUN: 実際の生成はスキップ")
        else:
            image_bytes = generate_image(positive, negative)
            if image_bytes:
                filename = args.output or f"single_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
                output_path = save_image(image_bytes, filename)
                print(f"✓ 保存: {output_path}")
            else:
                print("✗ 生成失敗")
    else:
        # バッチ生成モード
        if not args.prompts_file:
            print("エラー: プロンプトJSONファイルを指定してください")
            parser.print_help()
            sys.exit(1)
        prompts_path = Path(args.prompts_file)
        if not prompts_path.exists():
            print(f"エラー: ファイルが見つかりません: {prompts_path}")
            sys.exit(1)

        generated = process_prompts_file(prompts_path, dry_run=args.dry_run)
        print(f"\n\n生成完了: {len(generated)} 枚")
        print(f"保存先: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
