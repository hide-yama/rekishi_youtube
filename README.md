# 開業準備タスク管理システム

## 📖 目次
1. クイックスタート
2. システム概要
3. 日次ワークフロー
4. コマンドリファレンス
5. タスク管理ルール
6. Obsidian連携
7. Git管理
8. トラブルシューティング

---

## 🚀 クイックスタート

### 開業スケジュール
- 開業予定日：2025年6月23日
- 準備期間：〜2025年6月22日まで

### 5分で始める
```bash
npm install
npm run today
# daily/YYYY-MM-DD.md を開いてタスクを確認
npm run sync-all
```

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
/開業準備/
├── package.json              ← Node.js設定
├── tasks.yml                 ← タスク一元管理（メインファイル）
├── extract.js                ← 日次タスク抽出・スケジュール分析ツール
├── sync.js                   ← 双方向同期ツール
├── obsidian-export.js        ← Obsidian用Markdown生成
├── calendar-scheduler.js     ← カレンダー割当・出力スクリプト
├── calendar-output.md        ← カレンダー出力ファイル
├── daily/                    ← 日次記録
│   ├── YYYY-MM-DD.md        ← 各日のタスク・振り返り
│   └── template.md          ← テンプレートファイル
├── obsidian-export/          ← Obsidian用ファイル（自動生成）
├── docs/                     ← 参考資料・契約書類
│   └── 研究論文/            ← 運用知見・対話ログ分析
└── README.md                ← 本ファイル
```

### カテゴリ・ID・日付形式（全体ルール）
- カテゴリ名：必ず日本語で記述（例：会計・税務、研究・論文、保険・年金）
- ID形式：カテゴリプレフィックス＋番号3桁（例：MARKETING-010）
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
  - [ ] MARKETING-010 ウェブサイトのSEO対策
    - 期限: "2025-06-30"
    - 優先度: medium
    - カテゴリ: マーケティング
  - [~] INSURANCE-002 国民年金から厚生年金への切り替え
    - 期限: "2025-06-15"
    - メモ: デイキャンプのため延期
    - 優先度: high
  ```

### タスク更新の安全性ルール
- タスクの新規追加・更新は原則としてデイリーファイル経由で行う
- tasks.yml直接編集は緊急時のみ、必ず変更内容をデイリーファイルにも反映
- 大量更新・複数タスク変更時はとくにデイリーファイル経由を推奨
- デイリーファイル→sync.js→tasks.ymlの流れが設計思想
- タスク削除・属性変更時のトレーサビリティ確保のため、変更履歴をデイリーファイルに明確に記録

### 日付形式について
- 統一形式："YYYY-MM-DD"（例："2025-06-30"）
- タイムゾーン：ローカル時間で統一
- 可読性：手動編集しやすい簡潔な形式

---

## 🔗 Obsidian連携

### 生成されるファイル構成
- `obsidian-export/`ディレクトリにカテゴリ別・サマリー・期限別などのMarkdownファイルを自動生成
- 例：
  - 00_タスクサマリー.md（全体概要・統計）
  - 法的手続き.md
  - 会計・税務.md
  - 業務環境.md
  - 保険・年金.md
  - 収益基盤.md
  - 契約・請求.md
  - ブランディング.md
  - マーケティング.md
  - 運用・仕組み化.md
  - リスク管理.md
  - 研究・論文.md
  - 期限別タスク一覧.md

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
node sync.js --file daily/YYYY-MM-DD.md
```

### 2. extract.jsで期限付きタスクが見つからない
```bash
node extract.js --date YYYY-MM-DD --all  # 全タスクを表示
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

*最終更新：2025年6月2日*
*システムバージョン：v3.1（カレンダー割当方式・sync-all統合版）* 