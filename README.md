# 全自動AI小説執筆・設定管理システム

メディアミックス前提の超精密小説制作プラットフォーム。
Claude Code + Stable Diffusion WebUI によるローカル完結型システム。

## クイックスタート

### 1. 世界観の定義
```bash
# bible.md を編集して基本設定を定義
# world/world_template.md をコピーして world/world_bible.md を作成
```

### 2. キャラクター登録
```bash
# テンプレートをコピーして設定を記入
cp characters/templates/character_template.json characters/profiles/char_001.json
```

### 3. 章の執筆
```bash
# 執筆コンテキスト生成（整合性チェック込み）
python3 scripts/writing/chapter_writer.py --chapter 1 --arc 1 --interactive
```

### 4. 整合性チェック（単体実行）
```bash
python3 scripts/writing/consistency_check.py story/chapters/ch1-01_タイトル.md 1
```

### 5. 編集者批評
```bash
python3 scripts/writing/editor_critic.py story/chapters/ch1-01_タイトル.md
```

### 6. 挿絵プロンプト抽出
```bash
python3 scripts/image_gen/prompt_extractor.py story/chapters/ch1-01_タイトル.md
```

### 7. 画像生成（要: SD WebUI 起動中）
```bash
# SD WebUI を --api フラグで起動後:
python3 scripts/image_gen/sd_generator.py story/chapters/ch1-01_タイトル_prompts.json
```

### 8. ダッシュボード起動
```bash
cd dashboard
npm install
npm run dev
# http://localhost:3000 を開く
```

## ディレクトリ構造

```
ai_novel/
├── CLAUDE.md              # 執筆絶対ルール（憲法）
├── bible.md               # 世界観总括Bible
├── characters/            # キャラクター設定
├── world/                 # 世界観設定
├── story/                 # 本文・プロット・トラッカー
├── scripts/               # 自動化スクリプト
│   ├── writing/           # 執筆支援
│   └── image_gen/         # 画像生成
├── dashboard/             # Next.js 制作ダッシュボード
└── assets/images/         # 生成挿絵
```

## 依存関係

- Python 3.10+
- Node.js 18+
- Stable Diffusion WebUI（画像生成・オプション）
  - `--api` フラグで起動すること
  - デフォルト: http://localhost:7860

## 執筆フロー

1. **世界観定義** → bible.md + world/
2. **キャラクター登録** → characters/profiles/
3. **プロット作成** → story/arcs/
4. **整合性チェック** → consistency_check.py
5. **章執筆（Editor→Writer二段階）** → chapter_writer.py
6. **挿絵生成** → prompt_extractor.py + sd_generator.py
7. **トラッカー更新** → story_tracker.json
8. **ダッシュボードで確認** → http://localhost:3000
