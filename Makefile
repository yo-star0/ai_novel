# ═══════════════════════════════════════════════════════
#  AI Novel System — コマンドショートカット集
#  使い方: make <コマンド>
# ═══════════════════════════════════════════════════════

PYTHON := python3
CHAPTER ?= 1
ARC     ?= 1
TENSION ?= 5
WORDS   ?= 4000
FILE    ?=

.PHONY: help write process watch check dashboard install clean prompts

# ──────────────────────────────────────────────────────
# デフォルト: ヘルプ表示
# ──────────────────────────────────────────────────────
help:
	@echo ""
	@echo "╔══════════════════════════════════════════════════╗"
	@echo "║   AI Novel System — コマンド一覧                  ║"
	@echo "╚══════════════════════════════════════════════════╝"
	@echo ""
	@echo "  【執筆フロー】"
	@echo "  make write    CHAPTER=1 ARC=1           章の執筆プロンプトを生成（インタラクティブ）"
	@echo "  make write-q  CHAPTER=1 ARC=1 TENSION=7 クイック生成（インタラクティブなし）"
	@echo "  make process  FILE=story/chapters/ch1-01_タイトル.md CHAPTER=1"
	@echo "                                           章保存後の自動処理パイプライン"
	@echo "  make watch                               chapters/ を監視して自動処理（Ctrl+Cで停止）"
	@echo ""
	@echo "  【チェック・ツール】"
	@echo "  make check    FILE=story/chapters/ch1-01.md CHAPTER=1  整合性チェック単体実行"
	@echo "  make prompts  FILE=story/chapters/ch1-01.md            挿絵プロンプト抽出"
	@echo ""
	@echo "  【ダッシュボード】"
	@echo "  make dashboard   Next.js ダッシュボードを起動（http://localhost:3000）"
	@echo "  make install     ダッシュボードの依存関係をインストール"
	@echo ""
	@echo "  【その他】"
	@echo "  make clean       一時ファイルを削除"
	@echo "  make tree        プロジェクト構造を表示"
	@echo ""

# ──────────────────────────────────────────────────────
# 執筆プロンプト生成（インタラクティブ）
# ──────────────────────────────────────────────────────
write:
	@echo "第$(CHAPTER)話（Arc$(ARC)）の執筆プロンプトを生成します..."
	$(PYTHON) scripts/writing/chapter_writer.py --chapter $(CHAPTER) --arc $(ARC)

# 非インタラクティブ版（CI や素早く生成したい場合）
write-q:
	$(PYTHON) scripts/writing/chapter_writer.py \
		--chapter $(CHAPTER) --arc $(ARC) \
		--tension $(TENSION) --words $(WORDS) \
		--no-interactive

# ──────────────────────────────────────────────────────
# 章保存後の自動処理
# ──────────────────────────────────────────────────────
process:
ifndef FILE
	$(error FILE が未指定です。例: make process FILE=story/chapters/ch1-01_タイトル.md CHAPTER=1)
endif
	$(PYTHON) scripts/process_chapter.py $(FILE) $(CHAPTER) --arc $(ARC)

# ──────────────────────────────────────────────────────
# ファイル監視デーモン
# ──────────────────────────────────────────────────────
watch:
	@echo "chapters/ ディレクトリの監視を開始します（Ctrl+C で停止）..."
	$(PYTHON) scripts/watch_chapters.py --arc $(ARC)

# ──────────────────────────────────────────────────────
# 整合性チェック単体実行
# ──────────────────────────────────────────────────────
check:
ifdef FILE
	$(PYTHON) scripts/writing/consistency_check.py $(FILE) $(CHAPTER)
else
	$(PYTHON) scripts/writing/consistency_check.py $(CHAPTER)
endif

# ──────────────────────────────────────────────────────
# 挿絵プロンプト抽出
# ──────────────────────────────────────────────────────
prompts:
ifndef FILE
	$(error FILE が未指定です。例: make prompts FILE=story/chapters/ch1-01.md)
endif
	$(PYTHON) scripts/image_gen/prompt_extractor.py $(FILE)

# 画像生成（SD WebUI 起動中の場合）
images:
ifndef FILE
	$(error FILE が未指定です。例: make images FILE=story/chapters/ch1-01_prompts.json)
endif
	$(PYTHON) scripts/image_gen/sd_generator.py $(FILE)

# ──────────────────────────────────────────────────────
# ダッシュボード
# ──────────────────────────────────────────────────────
dashboard:
	@echo "ダッシュボードを起動します: http://localhost:3000"
	cd dashboard && npm run dev

install:
	cd dashboard && npm install

# ──────────────────────────────────────────────────────
# ユーティリティ
# ──────────────────────────────────────────────────────
clean:
	find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
	find . -name "*.pyc" -delete 2>/dev/null || true
	rm -f .watch_state.json
	@echo "✓ 一時ファイルを削除しました"

tree:
	@find . \( -name "node_modules" -o -name ".next" -o -name "__pycache__" -o -name ".git" \) \
		-prune -o -print | head -60
