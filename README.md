# 開業準備タスク管理システム

## 📖 目次
1. [クイックスタート](#クイックスタート)
2. [システム概要](#システム概要)
3. [日次ワークフロー](#日次ワークフロー)
4. [コマンドリファレンス](#コマンドリファレンス)
5. [タスク管理](#タスク管理)
6. [Obsidian連携](#obsidian連携)
7. [Git管理](#git管理)
8. [トラブルシューティング](#トラブルシューティング)

---

## 🚀 クイックスタート

### 開業スケジュール
- **開業予定日**: 2025年6月23日
- **準備期間**: 〜2025年6月22日まで

### 5分で始める
```bash
# 1. 依存パッケージのインストール
npm install

# 2. 今日のタスクを生成
npm run today

# 3. 生成されたファイルでタスクを実行
# daily/YYYY-MM-DD.md を開いてタスクを確認・実行

# 4. 夕方に同期
npm run sync-today

# 5. Obsidianで視覚的確認
npm run obsidian
```

---

## 📋 システム概要

### 特徴
- **YAML一元管理**: `tasks.yml` でタスクの状態を集約
- **自動化**: CLIコマンドで日次タスクの抽出・同期
- **ID管理**: タスクを一意に識別（例：`LEGAL-001`）
- **双方向同期**: 日次ファイルの変更を自動でYAMLに反映
- **重複チェック**: 新規タスク追加時の重複検出機能
- **柔軟な更新**: 期限・メモ・優先度の日次ファイル経由での変更
- **Obsidian対応**: YAMLデータを構造化Markdownに変換して視覚的管理

### ディレクトリ構成
```
/開業準備_20250524/
├── package.json              ← Node.js設定
├── tasks.yml                 ← タスク一元管理（メインファイル）
├── extract.js                ← 日次タスク抽出ツール
├── sync.js                   ← 双方向同期ツール
├── obsidian-export.js        ← Obsidian用Markdown生成
├── daily/                    ← 日次記録
│   ├── YYYY-MM-DD.md        ← 各日のタスク・振り返り
│   └── template.md          ← テンプレートファイル
├── obsidian-export/          ← Obsidian用ファイル（自動生成）
├── docs/                     ← 参考資料・契約書類
│   ├── 法的手続き/
│   ├── 契約・請求/
│   ├── ブランディング/
│   └── 研究論文/
└── README.md                 ← 本ファイル
```

### タスクカテゴリー

| プレフィックス | カテゴリ | 例 |
|-------------|---------|---|
| `LEGAL-xxx` | 法的手続き | `LEGAL-001` 開業届の提出 |
| `ACCOUNTING-xxx` | 会計・税務 | `ACCOUNTING-001` 会計ソフト導入 |
| `ENVIRONMENT-xxx` | 業務環境 | `ENVIRONMENT-001` 作業環境構築 |
| `INSURANCE-xxx` | 保険・年金 | `INSURANCE-001` 国保切替 |
| `REVENUE-xxx` | 収益基盤 | `REVENUE-001` 案件獲得 |
| `CONTRACT-xxx` | 契約・請求 | `CONTRACT-001` 請求フロー |
| `BRANDING-xxx` | ブランディング | `BRANDING-001` 事業紹介文 |
| `MARKETING-xxx` | マーケティング | `MARKETING-001` 名刺作成 |
| `OPERATION-xxx` | 運用・仕組み化 | `OPERATION-001` AI連携システム |
| `RISK-xxx` | リスク管理 | `RISK-001` 事業保険 |
| `RESEARCH-xxx` | research | `RESEARCH-001` 研究論文執筆 |

**現在のタスク状況**: `npm run obsidian` で最新の統計情報を確認できます

---

## 🔄 日次ワークフロー

### 朝の作業（推奨時間：9:00）
```bash
# 1. 最新状態に更新
git pull

# 2. 今日のタスクファイルを生成
npm run today

# 3. 生成されたファイルを確認
open daily/$(date +%F).md  # macOS
```

### 日中の作業
1. 生成された日次ファイルでタスクを確認
2. 作業完了したら `- [x]` にチェック
3. 作業中は `- [~]` または🔄マークを追加
4. 新規タスクは `ADD:` 記法で追加
5. 既存タスクの更新は `UPDATE:` 記法で変更
6. 振り返りセクションに進捗や気づきを記録

### 夕方の作業（推奨時間：18:00）
```bash
# 1. タスクの状態をYAMLに同期
npm run sync-today

# 2. Obsidian用ファイルを更新
npm run obsidian

# 3. 変更をGitで記録
git add .
git commit -m "chore: sync tasks $(date +%F)"
git push
```

---

## 💻 コマンドリファレンス

### npm scripts（推奨）

| コマンド | 説明 | 頻度 |
|---------|------|------|
| `npm run today` | 今日のタスクファイル生成 | 毎朝 |
| `npm run sync-today` | 今日の同期実行 | 毎夕 |
| `npm run obsidian` | Obsidian用ファイル生成 | 毎夕 |
| `npm run timeline` | タイムライン分析ファイル生成 | 週次・調整時 |

### timeline-export.js（タイムライン分析）

#### 基本的な使用法
```bash
# タイムラインファイルを生成
npm run timeline

# 出力先: timeline.md
# 期限付きタスクを時系列で分析・可視化
```

#### 生成される内容
- **期間別セクション分け**
  - 🚨 緊急対応期間（1週間以内）
  - 📋 開業準備期間（開業日まで）
  - 🎯 開業後整備期間（開業日以降）
- **問題分析**
  - 過密スケジュールの自動検出（3件以上で⚠️、5件以上で🚨）
  - 期限別タスク密度の一覧表示
  - 最重要問題の特定と該当タスクリスト
- **調整提案**
  - 1日最大3件を目標とした分散案
  - 優先度を考慮した再配置提案
  - 開業日前後での適切な配置案

#### 実用的な活用例
```bash
# 週次スケジュール確認
npm run timeline
open timeline.md  # 生成されたファイルを確認

# 問題のある日程を特定
# → timeline.mdの「問題分析」セクションで過密日をチェック

# 調整が必要な場合
# → 「調整提案」を参考にUPDATE記法でタスク期限を変更
```

### extract.js（タスク抽出）

#### 基本的な使用法
```bash
# 指定日期限のタスクを生成
node extract.js --date YYYY-MM-DD > daily/YYYY-MM-DD.md

# 全タスクを確認（期限無関係）
node extract.js --date YYYY-MM-DD --all

# 過去期限のタスクを抽出
node extract.js --overdue
```

#### 条件指定での抽出
```bash
# カテゴリで絞り込み
node extract.js --category "法的手続き"
node extract.js --category "マーケティング"

# 優先度で絞り込み
node extract.js --priority high      # 高優先度のみ
node extract.js --priority medium    # 中優先度のみ

# ステータスで絞り込み
node extract.js --status open        # 未着手のみ
node extract.js --status in_progress # 作業中のみ
node extract.js --status completed   # 完了のみ
```

#### 実用的な抽出例
```bash
# 週次レビュー用：過去期限の確認
node extract.js --overdue > weekly_overdue_check.md

# 緊急度チェック：高優先度タスクのみ
node extract.js --priority high --all > high_priority_tasks.md

# 法的手続きの進捗確認
node extract.js --category "法的手続き" --all > legal_progress.md
```

### sync.js（双方向同期）
```bash
# 基本使用法
node sync.js --file daily/YYYY-MM-DD.md

# 同期結果例
# 📊 同期結果:
# - 完了: X件
# - 作業中: X件
# - 未着手: X件
# 🆕 新規タスク: X件追加
# 🔄 タスク更新: X件更新
```

---

## 📝 タスク管理

### タスク状態の管理

#### チェックボックス記法
- `- [ ]` : 未着手
- `- [~]` : 作業中（または🔄マーク付き）
- `- [x]` : 完了

#### 優先度アイコン
- 🔴 : 高優先度（high）
- 🟡 : 中優先度（medium）
- 🟢 : 低優先度（low）

### 新規タスクの追加
日次ファイルに以下の形式で記述：
```markdown
- ADD: MARKETING-010 ウェブサイトのSEO対策 priority:medium due:2025-06-30
- ADD: RISK-005 事業保険の検討 priority:high due:2025-06-15
```

**重複チェック機能**：
- ID完全重複検出（100%精度）
- タイトル完全一致検出（大文字小文字無視）
- キーワードベース類似検出（中精度70-80%）

### 既存タスクの更新
日次ファイルに以下の形式で記述：
```markdown
- UPDATE: INSURANCE-002 due:2025-05-28 memo:デイキャンプのため延期 priority:high
- UPDATE: ENVIRONMENT-003 priority:high memo:急務対応
```

**更新可能項目**：
- `due:YYYY-MM-DD` : 期限変更
- `memo:テキスト内容` : メモ更新
- `priority:high|medium|low` : 優先度変更

### tasks.yml での定義例
```yaml
- id: LEGAL-001
  title: 開業届の提出
  status: in_progress
  due: 2025-06-30T00:00:00.000Z
  category: 法的手続き
  priority: high
  source: docs/法的手続き/開業届.md
  memo: 屋号は「CHIENOWASHA（ちえのわ舎）」で提出予定
```

---

## 🔍 Obsidian連携

### 概要
`tasks.yml`（YAML形式）をObsidianで視覚的に確認するため、構造化されたMarkdownファイルに自動変換する機能です。

### 使用方法
```bash
# 全カテゴリのMarkdownファイルを生成
npm run obsidian

# 出力先: obsidian-export/ ディレクトリ
# 生成ファイル数: カテゴリ数 + サマリーファイル + 期限別ファイル
```

### 生成されるファイル（実際の構成）

#### 📄 00_タスクサマリー.md
- **全体統計**: 完了率、カテゴリ別進捗
- **期限が近いタスク**: 上位10件の緊急タスク
- **カテゴリ間リンク**: `[[カテゴリ名]]` でナビゲーション

#### 📁 カテゴリ別ファイル
各カテゴリごとに個別のMarkdownファイルが生成されます：
- **法的手続き.md**
- **マーケティング.md**
- **会計・税務.md**
- **契約・請求.md**
- **保険・年金.md**
- **リスク管理.md**
- **業務環境.md**
- **収益基盤.md**
- **運用・仕組み化.md**
- **ブランディング.md**
- **research.md**
- **期限別タスク一覧.md**

各ファイルには以下の情報が含まれます：
- カテゴリ内の進捗統計
- タスク詳細（ステータス・優先度・期限・メモ）
- 作業中 → 未着手 → 後回し → 完了の順でソート
- 視覚的アイコン（🔄作業中、⭕未着手、✅完了、🔴高優先度）

### Obsidianでの活用方法

#### 基本的な使い方
1. Obsidianで `obsidian-export/` フォルダーを開く
2. `00_タスクサマリー.md` から開始
3. `[[カテゴリ名]]` でカテゴリ間移動
4. グラフビューでタスク間の関連性を視覚化

#### 更新ワークフロー
```bash
# 1. 日次タスクを実行・記録
npm run today
# （日次ファイルでタスクを完了・更新）

# 2. tasks.ymlに同期
npm run sync-today

# 3. Obsidian用ファイルを再生成
npm run obsidian

# 4. Obsidianで最新状況を確認
```

---

## 🎯 Git管理

### 推奨Git運用

#### 朝のワークフロー
```bash
# 最新の状態に更新
git pull

# 今日のタスクを生成
npm run today

# 生成ファイルをコミット
git add daily/$(date +%F).md
git commit -m "feat: generate daily tasks $(date +%F)"
git push
```

#### 夕方のワークフロー
```bash
# タスク状態を同期
npm run sync-today

# Obsidian用ファイルを更新
npm run obsidian

# 変更をコミット
git add .
git commit -m "chore: sync task status $(date +%F)"
git push
```

#### 新規タスク追加・更新時
```bash
# 新規タスク追加時
git add tasks.yml daily/$(date +%F).md
git commit -m "feat: add new tasks via NEW syntax $(date +%F)"
git push

# タスク更新時
git add tasks.yml daily/$(date +%F).md obsidian-export/
git commit -m "chore: update tasks and obsidian export $(date +%F)"
git push
```

---

## ❓ トラブルシューティング

### よくあるエラー

#### 1. `ファイルが見つかりません`
```bash
# エラー例
node sync.js --file daily/YYYY-MM-DD.md
# エラー: ファイルが見つかりません

# 解決方法
ls daily/  # ファイル存在確認
npm run today  # ファイル生成
```

#### 2. `npm command not found`
```bash
# 解決方法
npm install  # 依存関係の再インストール
```

#### 3. `YAML syntax error`
```bash
# tasks.yml の構文エラー
# 解決方法：インデントとコロンの確認
# - id: LEGAL-001
#   title: タスク名  # ← コロンの後にスペース必須
```

#### 4. 重複チェックエラー
```bash
# 重複チェック機能でエラーが発生した場合
# 解決方法：タスクIDやタイトルの重複を確認
# 既存タスクと異なるIDまたはタイトルを使用
```

#### 5. UPDATE記法エラー
```bash
# UPDATE記法の構文エラー
# 正しい記法：
- UPDATE: TASK-ID due:2025-05-30  # ✅ 正しい
- UPDATE TASK-ID due:2025-05-30   # ❌ コロンなし
- UPDATE: TASK-ID due=2025-05-30  # ❌ イコール使用
```

### データの修復

#### tasks.yml のバックアップから復元
```bash
# Git履歴から復元
git checkout HEAD~1 tasks.yml

# 特定日のファイルを再生成
npm run today
```

---

## 📊 実用的な活用例

### 緊急度チェック（毎朝推奨）
```bash
# 過去期限のタスクを確認
node extract.js --overdue

# 高優先度タスクの全体確認
node extract.js --priority high --all

# 今週やるべき重要タスク
node extract.js --from $(date +%F) --to $(date -d "+7 days" +%F) --priority high
```

### 週次レビュー用
```bash
# 今週の進捗確認
echo "# 週次レビュー $(date +%Y年%W週)" > weekly_review.md

# 過去期限タスクの確認
echo "## ⚠️ 過去期限タスク" >> weekly_review.md
node extract.js --overdue >> weekly_review.md

# 完了タスクの確認
echo "## ✅ 完了タスク" >> weekly_review.md
node extract.js --status completed --all >> weekly_review.md
```

### カテゴリ別進捗確認
```bash
# 法的手続きの進捗
node extract.js --category "法的手続き" --all > reports/legal_progress.md

# マーケティングの進捗
node extract.js --category "マーケティング" --all > reports/marketing_progress.md
```

---

## 🎯 開業準備の重要マイルストーン

- **〜6月10日**: 金融関係、会計準備
- **〜6月15日**: 法的手続き、ポートフォリオ更新
- **〜6月20日**: 事業基盤整備、契約準備
- **〜6月22日**: 最終チェック、環境整備
- **6月23日**: 開業開始 🎉

---

## 📈 システムの特徴と価値

### 開発アプローチ
- **継続的対話による創発的開発**: AI-Human協働によるシステム構築
- **文脈保持型システム**: 長期間にわたる文脈継続と累積的学習
- **完全自動化**: チェックボックス操作→YAML更新→Git同期の自動化
- **多形式データ統合**: YAML（構造化）+ Markdown（可読性）+ Obsidian（視覚化）+ CLI（自動化）

### 品質管理機能
- **重複検出**: 新規タスク追加時の自動重複チェック
- **データ整合性**: 双方向同期による一貫性保持
- **バージョン管理**: Git連携による変更履歴の完全管理
- **エラー防止**: 構文チェックと自動修正機能

---

**このシステムで、フリーランス開業準備を効率的に進めましょう！**

## サポート・質問

システムに関する質問や改善案があれば：
1. tasks.ymlや日次ファイルの内容を確認
2. エラーメッセージをコピー
3. 実行したコマンドを記録
4. NEW記法やUPDATE記法の使用例を確認
5. AIまたは開発者に相談 