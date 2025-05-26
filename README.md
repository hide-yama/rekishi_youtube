# 開業準備タスク管理システム

## 📖 概要
フリーランス開業準備（2025年6月23日開始予定）に向けた、Node.js + YAML + CLI自動化によるタスク管理システムです。

## 🎯 開業スケジュール
- **開業予定日**: 2025年6月23日
- **準備期間**: 〜2025年6月22日まで

## 🗂️ ディレクトリ構成

```
/開業準備_20250524/
├── package.json              ← Node.js設定
├── tasks.yml                 ← タスク一元管理（メインファイル）
├── extract.js                ← 日次タスク抽出コマンド
├── sync.js                   ← 双方向同期コマンド（重複チェック・更新機能付き）
├── daily/                    ← 日次記録
│   ├── 2025-05-24.md
│   └── template.md
├── docs/                     ← 参考資料
│   ├── 法的手続き/
│   ├── 税務資料/
│   ├── ブランディング/
│   └── 営業資料/
└── README.md                 ← 本ファイル
```

## ⚙️ システムの特徴

### 🔄 自動化ワークフロー
1. **タスク抽出**: `extract.js` で期限順・優先度順にタスクを自動生成
2. **双方向同期**: `sync.js` で日次ファイルの完了状況を `tasks.yml` に反映
3. **ID管理**: `LEGAL-001` 形式でタスクを一意識別
4. **重複チェック**: 新規タスク追加時の重複検出機能
5. **柔軟な更新**: 期限・メモ・優先度の日次ファイル経由での変更
6. **Obsidian対応**: YAMLデータを構造化Markdownに変換して視覚的管理

### 📋 タスクカテゴリー
- **法的手続き** (`LEGAL-xxx`): 開業届、青色申告承認申請書等
- **税務会計準備** (`ACCOUNTING-xxx`): 会計ソフト、帳簿セットアップ等
- **事業基盤整備** (`ENVIRONMENT-xxx`): 作業環境、ツール整備等
- **保険年金手続き** (`INSURANCE-xxx`): 国民健康保険、国民年金等
- **金融関係** (`FINANCE-xxx`): 事業用口座、クレジットカード等
- **契約営業準備** (`CONTRACT-xxx`): 契約書雛形、提案書等
- **ブランディング** (`BRANDING-xxx`): 屋号、事業紹介文等
- **マーケティング** (`MARKETING-xxx`): 名刺、ウェブサイト、SNS等
- **収益基盤** (`REVENUE-xxx`): 案件獲得、価格設定等
- **運用管理** (`OPERATION-xxx`): タスク管理、業務フロー等
- **リスク管理** (`RISK-xxx`): 保険、バックアップ等

## 🚀 使用方法

### 基本コマンド

```bash
# 今日のタスクを生成
node extract.js --date 2025-05-25 > daily/2025-05-25.md

# 全タスクを確認（期限関係なく）
node extract.js --date 2025-05-25 --all

# 変更をtasks.ymlに同期（重複チェック・更新機能付き）
node sync.js --file daily/2025-05-25.md

# npm scriptsを使用（推奨）
npm run today      # 今日のタスク生成
npm run sync-today # 今日の同期

# Obsidian用ファイル生成
npm run obsidian   # 全カテゴリのMarkdownファイル生成
npm run obsidian-category # 特定カテゴリのみ生成
npm run obsidian-status   # 特定ステータスのみ生成
```

### 日次ワークフロー

#### 🌅 朝の作業
```bash
# 今日のタスクファイルを生成
npm run today

# または手動で日付指定
node extract.js --date $(date +%F) > daily/$(date +%F).md
```

#### 🌆 夕方の作業（振り返り後）
```bash
# タスク状況をYAMLに同期
npm run sync-today

# または手動でファイル指定
node sync.js --file daily/$(date +%F).md
```

### タスク状態の管理

#### チェックボックス記法
- `- [ ]` : 未着手
- `- [~]` : 作業中（または🔄マーク付き）
- `- [x]` : 完了

#### 優先度アイコン
- 🔴 : 高優先度（high）
- 🟡 : 中優先度（medium）
- 🟢 : 低優先度（low）

### 🆕 新機能：タスクの追加・更新

#### 新規タスクの追加
日次ファイルに以下の形式で記述：
```markdown
- [ ] NEW: TASK-ID タスクタイトル
```

**重複チェック機能**：
- ID完全重複検出（100%精度）
- タイトル完全一致検出（大文字小文字無視）
- キーワードベース類似検出（中精度70-80%）

#### 既存タスクの更新
日次ファイルに以下の形式で記述：
```markdown
- UPDATE: TASK-ID due:2025-05-30 memo:新しいメモ priority:high
```

**更新可能項目**：
- `due:YYYY-MM-DD` : 期限変更
- `memo:テキスト内容` : メモ更新
- `priority:high|medium|low` : 優先度変更

## 📊 タスク管理例

### tasks.yml での定義
```yaml
- id: LEGAL-001
  title: 開業届の提出
  status: open        # open/in_progress/completed/backlog
  due: 2025-06-15
  category: 法的手続き
  priority: high
  source: docs/法的手続き/開業届.md
  memo: 失業保険との兼ね合いで6月23日以降に提出
```

### 日次ファイルでの表示
```markdown
## 法的手続き

- [ ] LEGAL-001 開業届の提出 🔴
  - 期限: 2025-06-15
  - 参照: docs/法的手続き/開業届.md
  - メモ: 失業保険との兼ね合いで6月23日以降に提出
```

### 新規タスク追加例
```markdown
- [ ] NEW: MARKETING-010 ウェブサイトのSEO対策
```

### タスク更新例
```markdown
- UPDATE: INSURANCE-002 due:2025-05-28 memo:デイキャンプのため1日延期 priority:high
```

## 🔍 Obsidian対応機能

### 概要
`tasks.yml`（YAML形式）をObsidianで視覚的に確認するため、構造化されたMarkdownファイルに自動変換する機能です。

### YAMLファイルとは
**YAML**（ヤムル）は「YAML Ain't Markup Language」の略で：
- **人間が読みやすい**データ構造化フォーマット
- **インデント**でデータの階層を表現
- **設定ファイル**やデータ交換によく使用
- **プログラムで処理しやすい**構造

### 使用方法

#### 基本的な生成
```bash
# 全カテゴリのMarkdownファイルを生成
npm run obsidian

# 出力先: obsidian-export/ ディレクトリ
```

#### フィルタリング生成
```bash
# 特定カテゴリのみ生成
node obsidian-export.js --category=法的手続き

# 特定ステータスのみ生成
node obsidian-export.js --status=in_progress

# 出力先を指定
node obsidian-export.js --output=my-obsidian-vault
```

### 生成されるファイル構成

#### 📄 00_タスクサマリー.md
- **全体統計**: 完了率、カテゴリ別進捗
- **期限が近いタスク**: 上位10件の緊急タスク
- **カテゴリ間リンク**: `[[カテゴリ名]]` でナビゲーション

#### 📁 カテゴリ別ファイル
- **法的手続き.md**, **税務会計準備.md** 等
- **進捗状況**: カテゴリ内の統計情報
- **タスク詳細**: ステータス・優先度・期限・メモ
- **ソート機能**: 作業中 → 未着手 → 後回し → 完了

#### 📅 期限別タスク一覧.md
- **期限順ソート**: 緊急度の高い順
- **視覚的アラート**: 🚨今日、⚠️経過日数表示
- **カテゴリ横断**: 期限を軸とした全体ビュー

### Obsidianでの活用方法

#### 1. 基本的な使い方
```bash
# 1. Markdownファイルを生成
npm run obsidian

# 2. Obsidianで obsidian-export/ フォルダを開く
# 3. 00_タスクサマリー.md から開始
```

#### 2. ナビゲーション
- **[[カテゴリ名]]**: カテゴリ間の移動
- **グラフビュー**: タスク間の関連性を視覚化
- **検索機能**: 特定のタスクやキーワードで検索
- **タグ機能**: 優先度やステータスでフィルタリング

#### 3. 更新ワークフロー
```bash
# 1. tasks.ymlを更新（sync.js経由）
npm run sync-today

# 2. Obsidian用ファイルを再生成
npm run obsidian

# 3. Obsidianで最新状況を確認
```

### メリット
- **視覚的管理**: YAMLの構造化データを直感的に確認
- **関連性把握**: カテゴリ間の関連性をグラフで表示
- **検索・フィルタ**: Obsidianの豊富な機能を活用
- **バックアップ**: Markdownファイルとして保存・共有可能

## 🔧 セットアップ

### 初回セットアップ
```bash
# 依存パッケージのインストール
npm install

# 実行権限の付与
chmod +x extract.js sync.js
```

### Git管理（推奨）
```bash
# 朝: タスクファイル生成後
git add daily/$(date +%F).md
git commit -m "feat: generate daily tasks $(date +%F)"
git push

# 夕方: 同期後
git add tasks.yml
git commit -m "chore: sync task status $(date +%F)"
git push
```

## 📝 カスタマイズ

### 新しいタスクの追加
日次ファイルに `NEW:` 記法で追加するか、`tasks.yml` に直接追加します。重複チェック機能により、既存タスクとの重複を自動検出します。

### カテゴリーの追加
新しいプレフィックス（例：`MARKETING-001`）でタスクIDを作成し、categoryフィールドで分類します。

### 期限・メモ・優先度の調整
日次ファイルに `UPDATE:` 記法で更新するか、`tasks.yml` の該当フィールドを直接編集します。

## 🎯 開業準備の重要マイルストーン

- **〜6月10日**: 金融関係、会計準備
- **〜6月15日**: 法的手続き、ポートフォリオ更新
- **〜6月20日**: 事業基盤整備、契約準備
- **〜6月22日**: 最終チェック、環境整備
- **6月23日**: 開業開始 🎉

---

**このシステムで、フリーランス開業準備を効率的に進めましょう！**

