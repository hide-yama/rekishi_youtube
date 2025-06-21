# 日本史年号楽曲制作プロジェクト管理ツール

## 📖 目次
1. クイックスタート
2. プロジェクト概要
3. システム概要
4. 日次ワークフロー
5. コマンドリファレンス
6. タスク管理ルール
7. Obsidian連携
8. Git管理
9. トラブルシューティング

---

## 🚀 クイックスタート

### プロジェクト概要
- **目的**: 日本史年号を楽曲で覚えやすくするYouTubeコンテンツ制作
- **特徴**: YAML + Markdown ベースのタスク管理システム
- **技術**: Suno AI（楽曲生成）+ 画像生成AI + 動画編集自動化

### 5分で始める
```bash
npm install
npm run today
# daily/YYYY-MM-DD.md を開いてタスクを確認
npm run sync-all
```

> ※本プロジェクトは現状、管理者1名による単独運用です。そのため朝の初動ワークフローにおける「git pull」は省略可能です。
> 複数端末・複数人で運用する場合のみ、pullを推奨します。

---

## 🎯 プロジェクト概要

### 日本史年号楽曲制作プロジェクト
- **目標**: 受験生向けの年号暗記楽曲シリーズ制作
- **楽曲数**: 18曲（202個の重要年号を体系的に分割）
- **制作期間**: 夏の終わりまでに完成予定
- **投稿頻度**: 2日に1本（YouTube）

### 技術スタック
- **楽曲生成**: Suno AI（プロプラン契約済み）
- **画像生成**: シティポップ風の女子高生キャラクター
- **動画編集**: 歌詞テロップ自動化
- **データ管理**: 202個の年号データベース（`data/japanese-history-dates.yml`）

### 楽曲構成
各曲8-12個の年号を含み、歴史的に意味のある区切りで構成：
1. **古代編**（4曲）: 57年〜1051年
2. **中世編**（6曲）: 1053年〜1603年  
3. **近世編**（4曲）: 1615年〜1889年
4. **近現代編**（4曲）: 1894年〜2020年

---

## 🎨 画像生成フロー

### 概要
楽曲完成後、歌詞を基にMidjourney用の画像プロンプトを自動生成し、YouTube動画用のイラストを制作します。

### フロー
```
1. 歌詞完成 (lyrics/era-songs/[楽曲].md)
     ↓
2. プロンプト生成指示書を使用 (docs/prompts/image-generation-prompts.md)
     ↓
3. AIに歌詞 + 指示書を渡してプロンプト生成
     ↓
4. 生成されたプロンプトを格納 (midjourney-prompts/[楽曲].md)
     ↓
5. Midjourneyで画像生成（20枚/楽曲）
     ↓
6. YouTube動画制作
```

### ディレクトリ構成
```
/rekishi_youtube/
├── docs/prompts/
│   └── image-generation-prompts.md    ← プロンプト生成指示書
├── lyrics/era-songs/
│   └── 01-kodai-okoku-no-tanjo.md     ← 完成歌詞
├── midjourney-prompts/
│   └── 01-kodai-okoku-no-tanjo.md     ← 生成されたプロンプト（20個）
└── README.md
```

### 画像構成（楽曲あたり20枚）
- **メインキャラクター**（8-10枚）: 歴史上人物をアニメ風キャラ化
- **重要アイテム・建造物**（4-6枚）: 歌詞に登場する物品・建物
- **時代背景・雰囲気**（4-6枚）: 時代らしい風景・象徴的表現

### 使用方法
1. 歌詞完成後、`docs/prompts/image-generation-prompts.md` の指示書を確認
2. AIに「歌詞 + 指示書」を渡してプロンプト生成依頼
3. 生成されたプロンプトを `midjourney-prompts/[楽曲番号]-[時代名]-[タイトル].md` に保存
4. 各プロンプトをMidjourneyで実行して画像生成
5. 生成画像をYouTube動画制作で使用

---

## 📋 システム概要

- YAML一元管理：`tasks.yml` で全タスクを集約
- チェックボックス記法：`- [ ]` / `- [~]` / `- [x]` で直感的に管理
- カレンダー割当方式：1日1時間・1日4時間上限の現実的なスロット割当を自動化
- 自動化：CLIコマンドで日次タスクの抽出・同期・カレンダー/Obsidian出力
- ID管理：タスクを一意に識別（例：`LEGAL-001`）
- 双方向同期：日次ファイルの変更を自動でYAMLに反映
- 重複チェック：ID・タイトル・類似度で新規タスクの重複検出
- 柔軟な更新：期限・メモ・優先度の日次ファイル経由での変更
- カレンダー自動生成：タスクを日付ごとに自動割当、負荷・実行可能性を可視化
- 段階的アラートシステム：予防（週次）・日常（デイリー）・詳細（専用）の3段階品質管理
- 時間見積もりベース管理：期限駆動から時間管理駆動への革新的アプローチ
- 動的進捗管理：進捗に応じた残り時間更新・正確な負荷予測
- Obsidian対応：YAMLデータを構造化Markdownに変換して視覚的管理

### ディレクトリ構成
```
/rekishi_youtube/
├── package.json              ← Node.js設定
├── tasks.yml                 ← タスク一元管理（メインファイル）
├── tasks-mindmap.md          ← マインドマップ形式のタスク一覧
├── scripts/                  ← スクリプト群
│   ├── extract.js            ← 日次タスク抽出・スケジュール分析ツール
│   ├── sync.js               ← 双方向同期ツール
│   ├── obsidian-export.js    ← Obsidian用Markdown生成
│   ├── calendar-scheduler.js ← カレンダー割当・出力スクリプト
│   ├── mindmap-generator.js  ← マインドマップ生成ツール
│   ├── review.js             ← 週次・月次レビュー・サマリー
│   └── schedule-calculator.js← スケジュール計算補助
├── data/                     ← プロジェクトデータ
│   └── japanese-history-dates.yml ← 202個の年号データベース
├── docs/                     ← ドキュメント・プロンプト集
│   └── prompts/              ← AI用プロンプト集
│       ├── japanese-history-song-generator.md ← 歌詞生成プロンプト
│       └── image-generation-prompts.md ← 画像プロンプト生成指示書
├── lyrics/                   ← 楽曲制作関連
│   ├── production-plan.md    ← 18曲制作計画
│   ├── templates/            ← 歌詞テンプレート
│   ├── era-songs/            ← 時代別楽曲歌詞
│   └── complete-songs/       ← 完成楽曲
├── midjourney-prompts/       ← Midjourney用画像プロンプト格納
│   └── [楽曲番号]-[時代名]-[タイトル].md ← 楽曲別プロンプト（20個/楽曲）
├── calendar-output.md        ← カレンダー出力ファイル
├── daily/                    ← 日次記録
│   ├── YYYY-MM-DD.md        ← 各日のタスク・振り返り
│   └── template.md          ← テンプレートファイル
├── obsidian-export/          ← Obsidian用ファイル（自動生成）
├── inbox/                    ← アイデア・メモ一時保管
└── README.md                ← 本ファイル
```

### カテゴリ・ID・日付形式（全体ルール）
- カテゴリ名：必ず日本語で記述（例：プロジェクト管理、開発、テスト、デザイン）
- ID形式：カテゴリプレフィックス＋番号3桁（例：PROJECT-001）
- 日付形式："YYYY-MM-DD"（クォート付き、例："2025-06-30"）

---

## 🔄 日次ワークフロー

### 朝の作業
```bash
git pull
npm run today
open daily/$(date +%F).md  # macOS
```

### 日中の作業
- 生成された日次ファイルでタスクを確認
- 作業完了したら `- [x]` にチェック
- 作業中は `- [~]` にチェック
- 新規タスクは以下の形式で追加：
  ```markdown
  - [ ] TASK-ID タスクタイトル
    - 期限: YYYY-MM-DD
    - メモ: 詳細情報
    - カテゴリ: カテゴリ名
    - 優先度: high/medium/low
  ```
- 既存タスクの属性変更は子項目を編集
- 振り返りセクションに進捗や気づきを記録

**重要**：タスクの追加・更新は必ずデイリーファイル経由で行う（`tasks.yml`直接編集は避ける）

### 夕方の作業
```bash
npm run sync-all
# 変更をGitで記録
git add .
git commit -m "chore: sync tasks, obsidian, calendar $(date +%F)"
git push
```

---

## 💻 コマンドリファレンス

| コマンド              | 説明                                         | 頻度   |
|----------------------|----------------------------------------------|--------|
| npm run today        | 今日のタスクファイル生成（作業負荷アラート） | 毎朝   |
| npm run sync-all     | 同期＋Obsidian＋カレンダー一括実行           | 毎夕   |
| npm run obsidian     | Obsidian用ファイル生成（個別実行用）         | 必要時 |
| npm run calendar     | カレンダー出力ファイル生成（個別実行用）     | 必要時 |
| node scripts/mindmap-generator.js | マインドマップ形式のタスク一覧生成    | 必要時 |
| node scripts/sync.js --file daily/YYYY-MM-DD.md | 特定日付のファイルを同期 | 必要時 |

### プロジェクト固有コマンド
| コマンド              | 説明                                         |
|----------------------|----------------------------------------------|
| node scripts/sync.js --file daily/2025-06-19.md | 6/19のタスクをtasks.ymlに同期 |
| node scripts/mindmap-generator.js > tasks-mindmap.md | マインドマップを最新状態で更新 |

---

## 📝 タスク管理ルール

### チェックボックス記法
- `- [ ]` ：未着手（open）
- `- [~]` ：作業中（in_progress）
- `- [x]` ：完了（completed）

### 優先度アイコン
- 🔴 ：高優先度（high）
- 🟡 ：中優先度（medium）
- 🟢 ：低優先度（low）

### 新規タスクの追加・更新
- 日次ファイルにカテゴリ・ID・日付形式ルールに従って記述
- 既存タスクの属性変更は子項目を編集
- 例：
  ```markdown
  - [ ] PROJECT-001 プロジェクト要件定義書の作成
    - 期限: "2025-06-30"
    - 優先度: medium
    - カテゴリ: プロジェクト管理
  - [~] DEV-001 システム設計書の作成
    - 期限: "2025-06-15"
    - メモ: アーキテクチャ図とデータベース設計を含む
    - 優先度: high
  ```

### タスク更新の安全性ルール
- タスクの新規追加・更新は原則としてデイリーファイル経由で行う
- tasks.yml直接編集は緊急時のみ、必ず変更内容をデイリーファイルにも反映
- 大量更新・複数タスク変更時はとくにデイリーファイル経由を推奨
- デイリーファイル→scripts/sync.js→tasks.ymlの流れが設計思想
- タスク削除・属性変更時のトレーサビリティ確保のため、変更履歴をデイリーファイルに明確に記録

### 日付形式について
- 統一形式："YYYY-MM-DD"（例："2025-06-30"）
- タイムゾーン：ローカル時間で統一
- 可読性：手動編集しやすい簡潔な形式

---

## 🔗 Obsidian連携

### 生成されるファイル構成
- `obsidian-export/`ディレクトリにカテゴリ別・サマリー・期限別などのMarkdownファイルを自動生成
- 日本史年号楽曲制作プロジェクト用：
  - 00_タスクサマリー.md（全体概要・統計）
  - デザイン.md（キャラクター画像生成、ビジュアルスタイル）
  - プロジェクト管理.md（楽曲構成、スケジュール管理）
  - マーケティング.md（YouTube運営、SNS戦略）
  - 開発.md（楽曲制作、自動化ツール、データベース）
  - 期限別タスク一覧.md

### マインドマップ連携
- `tasks-mindmap.md`：カテゴリ別の階層構造でタスクを可視化
- ステータス別の絵文字表示（🔴未着手 🟠作業中 🟢完了）
- タスク統計情報を自動計算・表示

### Obsidianでの使用方法
1. Obsidianで `obsidian-export/` ディレクトリを開く
2. 00_タスクサマリー.md から開始
3. [[カテゴリ名]] でカテゴリ間を移動
4. 双方向リンクでタスク間を自由に移動

### 自動生成される情報
- タスク統計（全体・カテゴリ別・ステータス別・優先度別）
- 期限分析（緊急タスク・今週・来週のタスク一覧）
- 進捗可視化（完了率・残タスク数）
- カテゴリ別詳細（各カテゴリのタスク詳細とメモ）

---

## 📂 Git管理

### 基本的なGit運用
```bash
git pull
npm run today
git add daily/$(date +%F).md
git commit -m "feat: create daily tasks $(date +%F)"
git push

npm run sync-all
git add tasks.yml daily/ obsidian-export/ calendar-output.md
git commit -m "chore: sync tasks, obsidian, calendar $(date +%F)"
git push
```

### ファイル管理方針
- tasks.yml：メインデータ、必ずコミット
- daily/：日次記録、作業日は必ずコミット
- obsidian-export/：自動生成、定期的にコミット
- calendar-output.md：自動生成、分析時にコミット

---

## 🔧 トラブルシューティング

### 1. タスクが同期されない
```bash
npm run sync-all
# または
node scripts/sync.js --file daily/YYYY-MM-DD.md
```

### 2. extract.jsで期限付きタスクが見つからない
```bash
node scripts/extract.js --date YYYY-MM-DD --all  # 全タスクを表示
grep "due.*YYYY-MM-DD" tasks.yml  # 該当日期限のタスクを検索
```

### 3. カレンダー出力エラー
```bash
npm run calendar
# tasks.ymlの構文エラーや日付形式不正がないか確認
```

### 4. 重複タスクの検出
```bash
node -e "const yaml = require('js-yaml'); const fs = require('fs'); const tasks = yaml.load(fs.readFileSync('tasks.yml', 'utf8')); const ids = tasks.map(t => t.id); const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i); console.log('重複ID:', duplicates);"
```

### 5. チェックボックス記法エラー
- 正しい記法：
  - [ ] TASK-001 タスクタイトル
  - [x] TASK-001 タスクタイトル
  - [~] TASK-001 タスクタイトル
- 間違った記法：
  - [] TASK-001 タスクタイトル
  - [x TASK-001 タスクタイトル
  - [ ]TASK-001 タスクタイトル

### 6. Obsidianファイル生成エラー
```bash
node -e "console.log(require('js-yaml').load(require('fs').readFileSync('tasks.yml', 'utf8')))"
ls -la obsidian-export/
mkdir -p obsidian-export  # ディレクトリが存在しない場合
```

### 7. tasks.yml直接編集によるファイル破損・誤削除
- 原則としてデイリーファイル経由での更新
- 緊急時の直接編集後は必ずデイリーファイルにも反映
- 復旧はGit履歴・daily/ファイルから

---

## カレンダー式タスクスケジューラーの仕様

- 1日あたりの合計作業時間は「4時間上限」で自動分散されます。
- 1タスクあたり1日最大1時間ずつ割り当てられます。
- 同一タスクが同じ日に複数回割り当てられることはありません（重複割当防止ロジック実装済み）。
- 1日4件上限も必要に応じて拡張可能です（現状は時間上限のみ厳密運用）。
- fixed属性タスクは例外的に期限日に全時間割当されます。

---

---

## 📊 プロジェクト進捗

### 完了済みマイルストーン
- ✅ Suno AI環境構築（プロプラン契約）
- ✅ 202個年号データベース完成
- ✅ 18曲制作計画策定
- ✅ タスク管理システム構築

### 現在の制作段階
- 🔄 第1弾楽曲制作準備中
- 🔄 キャラクター画像生成実験
- 🔄 歌詞作成テンプレート開発

### 次回マイルストーン
- 🎯 Phase 1: 第1弾楽曲完成（6月末目標）
- 🎯 Phase 2: 制作テンプレート確立
- 🎯 Phase 3: 量産体制構築

---

*最終更新：2025年6月19日*
*システムバージョン：v4.0（楽曲制作プロジェクト対応版）* 