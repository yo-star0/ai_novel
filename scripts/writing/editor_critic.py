#!/usr/bin/env python3
"""
編集者AI批評スクリプト
二段階生成フローのPhase 1: 初稿を文芸的観点から厳しく批評する。

使用方法:
  python editor_critic.py <chapter_file>
"""

import sys
import re
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent.parent

EDITOR_PROMPT_TEMPLATE = """あなたは日本の一流文芸誌の編集長です。
担当作家の初稿を読み、プロとして容赦なく批評してください。
褒めることよりも、問題点の指摘を優先してください。

## 批評観点（全項目必ず評価すること）

### 1. ドラマトゥルギー（物語の論理）
- キャラクターの行動に明確な動機があるか？
- 「ご都合主義」の展開はないか？
- 原因と結果の連鎖は自然か？

### 2. キャラクター描写
- 各キャラクターの個性・口調が一貫しているか？
- 設定資料の口調・一人称と一致しているか？
- 心理描写は深度があるか、表面的ではないか？

### 3. 文体・リズム
- 短文・中文・長文のリズムは計算されているか？
- 同じ語尾・同じ接続詞の連続はないか？
- 「〜た。〜た。〜た。」のような単調リズムはないか？
- 比喩・表現の陳腐化（使い古された表現）はないか？

### 4. Show vs Tell
- 感情を「直接語る」のではなく「行動・表情で見せている」か？
- 説明台詞（"As you know Bob" 問題）はないか？
- 情景描写は感情と連動しているか？

### 5. 感情曲線
- 読者のテンションは計算通りに推移しているか？
- 山と谷のバランスは取れているか？
- この章は前後の章との繋がりが感じられるか？

### 6. 日本語文芸ルール
- 三点リーダー(……)・ダッシュ(——)は偶数個か？
- 感嘆符・疑問符後の全角スペースは適切か？
- 行頭字下げは守られているか？

### 7. 構造・ペース
- 各シーンの長さは適切か？長すぎる・短すぎるシーンはないか？
- 冗長な描写・会話はないか？
- 章全体の起承転結は明確か？

## 出力フォーマット

批評は以下の形式で出力してください:

---
## 総評
（3-5行で総評）

## 評点
- ドラマトゥルギー: X/10
- キャラクター描写: X/10
- 文体・リズム: X/10
- Show vs Tell: X/10
- 感情曲線: X/10
- 日本語文芸ルール: X/10
- 構造・ペース: X/10
**合計: XX/70**

## 修正必須項目（優先度高）
1. （具体的な箇所を引用して指摘）
2.
3.

## 改善推奨項目（優先度中）
1.
2.

## 作家への一言
（執筆者へのメッセージ。厳しくても本質的な言葉を）
---

以下が初稿です:

---
{draft_text}
---
"""


def generate_editor_prompt(draft_text: str) -> str:
    return EDITOR_PROMPT_TEMPLATE.format(draft_text=draft_text)


def analyze_draft_metrics(text: str) -> dict:
    """初稿の基本メトリクスを計算する"""
    # 文字数（空白・記号含む）
    total_chars = len(text)

    # 段落数
    paragraphs = [p for p in text.split('\n') if p.strip()]
    paragraph_count = len(paragraphs)

    # 文の数（概算）
    sentences = re.split(r'[。！？]', text)
    sentence_count = len([s for s in sentences if s.strip()])

    # 会話文の割合
    dialogue_chars = sum(len(m) for m in re.findall(r'「[^」]*」', text))
    dialogue_ratio = dialogue_chars / total_chars if total_chars > 0 else 0

    # 平均文長
    avg_sentence_len = total_chars / sentence_count if sentence_count > 0 else 0

    # 文体リズムチェック（連続した短文の検出）
    short_sentences = [s for s in sentences if 0 < len(s.strip()) < 15]
    rhythm_warning = len(short_sentences) > sentence_count * 0.4

    return {
        "total_chars": total_chars,
        "paragraph_count": paragraph_count,
        "sentence_count": sentence_count,
        "dialogue_ratio": round(dialogue_ratio * 100, 1),
        "avg_sentence_len": round(avg_sentence_len, 1),
        "rhythm_warning": rhythm_warning,
        "estimated_pages": round(total_chars / 400, 1)  # 400字詰め換算
    }


def main():
    if len(sys.argv) < 2:
        print("使用方法: python editor_critic.py <chapter_file>")
        sys.exit(1)

    chapter_path = Path(sys.argv[1])
    if not chapter_path.exists():
        print(f"エラー: ファイルが見つかりません: {chapter_path}")
        sys.exit(1)

    draft_text = chapter_path.read_text(encoding="utf-8")

    print("=" * 60)
    print("編集者AI — 初稿分析レポート")
    print("=" * 60)

    # 基本メトリクス
    metrics = analyze_draft_metrics(draft_text)
    print(f"\n【基本メトリクス】")
    print(f"  総文字数:       {metrics['total_chars']:,} 字")
    print(f"  段落数:         {metrics['paragraph_count']} 段落")
    print(f"  文の数（概算）:   {metrics['sentence_count']} 文")
    print(f"  会話文割合:      {metrics['dialogue_ratio']}%")
    print(f"  平均文長:        {metrics['avg_sentence_len']} 字")
    print(f"  400字詰換算:     約{metrics['estimated_pages']} ページ")
    if metrics["rhythm_warning"]:
        print(f"\n  ⚠ 警告: 短文（15字以下）が多すぎます。リズムが単調になる可能性があります。")

    # 編集者AIへのプロンプトを生成・出力
    print("\n" + "=" * 60)
    print("【編集者AIへの指示プロンプト】")
    print("以下をClaude Codeに貼り付けて批評を依頼してください:")
    print("=" * 60 + "\n")
    print(generate_editor_prompt(draft_text))

    # 批評結果の保存先を案内
    output_path = chapter_path.parent / (chapter_path.stem + "_editor_review.md")
    print(f"\n批評結果を以下に保存してください: {output_path}")


if __name__ == "__main__":
    main()
