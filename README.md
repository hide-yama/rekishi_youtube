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

# 3. 生成されたファイルでタスクを確認・実行
# daily/YYYY-MM-DD.md を開いてタスクを確認

# 4. 夕方に同期
npm run sync-today

# 5. Obsidianで視覚的確認
npm run obsidian
```

---

## 📋 システム概要

### 特徴
- **YAML一元管理**: `tasks.yml` でタスクの状態を集約
- **チェックボックス記法**: 直感的な `- [ ]` / `- [~]` / `- [x]` でタスク管理
- **自動化**: CLIコマンドで日次タスクの抽出・同期
- **ID管理**: タスクを一意に識別（例：`LEGAL-001`）
- **双方向同期**: 日次ファイルの変更を自動でYAMLに反映
- **重複チェック**: 新規タスク追加時の重複検出機能（ID・タイトル・類似度）
- **柔軟な更新**: 期限・メモ・優先度の日次ファイル経由での変更
- **タイムライン分析**: 期限付きタスクの時系列分析・過密スケジュール自動検出
- **Obsidian対応**: YAMLデータを構造化Markdownに変換して視覚的管理

### ディレクトリ構成
```
/開業準備/
├── package.json              ← Node.js設定
├── tasks.yml                 ← タスク一元管理（メインファイル）
├── extract.js                ← 日次タスク抽出ツール
├── sync.js                   ← 双方向同期ツール
├── obsidian-export.js        ← Obsidian用Markdown生成
├── timeline-export.js        ← タイムライン分析ツール
├── daily/                    ← 日次記録
│   ├── YYYY-MM-DD.md        ← 各日のタスク・振り返り
│   └── template.md          ← テンプレートファイル
├── obsidian-export/          ← Obsidian用ファイル（自動生成）
├── timeline.md               ← タイムライン分析結果（自動生成）
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
| `RESEARCH-xxx` | 研究・論文 | `RESEARCH-001` 研究論文執筆 |

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
3. 作業中は `- [~]` にチェック
4. 新規タスクは以下の形式で追加：
   ```markdown
   - [ ] TASK-ID タスクタイトル
     - 期限: YYYY-MM-DD
     - メモ: 詳細情報
     - カテゴリ: カテゴリ名
     - 優先度: high/medium/low
   ```
5. 既存タスクの属性変更は子項目を編集
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
# → 「調整提案」を参考にタスク期限を変更
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

#### 生成される形式
```markdown
# YYYY-MM-DD のタスク一覧

## カテゴリ名

- [ ] TASK-ID タスクタイトル
  - 期限: YYYY-MM-DD
  - メモ: タスクメモ
  - カテゴリ: カテゴリ名
  - 優先度: high/medium/low
```

### sync.js（双方向同期）

#### 基本的な使用法
```bash
# 今日のファイルを同期
npm run sync-today

# 指定ファイルを同期
node sync.js --file daily/YYYY-MM-DD.md
```

#### 同期される内容
- **新規タスク**: daily/にあってtasks.ymlにないタスクを新規追加
- **ステータス更新**: `[ ]` → open, `[~]` → in_progress, `[x]` → completed
- **属性更新**: 期限・メモ・カテゴリ・優先度の変更を反映
- **重複チェック**: ID重複・タイトル一致・類似タスクの検出

---

## 📝 タスク管理

### チェックボックス記法

#### タスクステータス
- `- [ ]` : 未着手（open）
- `- [~]` : 作業中（in_progress）
- `- [x]` : 完了（completed）

#### 優先度アイコン
- 🔴 : 高優先度（high）
- 🟡 : 中優先度（medium）
- 🟢 : 低優先度（low）

### 新規タスクの追加
日次ファイルに以下の形式で記述：
```markdown
# 新規タスクの例
- [ ] MARKETING-010 ウェブサイトのSEO対策
  - 期限: YYYY-MM-DD
  - 優先度: medium
  - カテゴリ: マーケティング

- [ ] RISK-005 事業保険の検討
  - 期限: YYYY-MM-DD
  - 優先度: high
  - メモ: 各社の見積もり比較が必要
```

**重要な注意点**：
- **カテゴリ名**: 必ず日本語で記述（例：会計・税務、研究・論文、保険・年金）
- **ID形式**: カテゴリプレフィックス-番号3桁（例：MARKETING-010）
- **日付形式**: "YYYY-MM-DD"のクォート付き形式

**重複チェック機能**：
- ID完全重複検出（100%精度）
- タイトル完全一致検出（大文字小文字無視）
- キーワードベース類似検出（中精度70-80%）

### 既存タスクの更新
日次ファイルで既存タスクの子項目を編集：
```markdown
# 既存タスクの属性変更例
- [~] INSURANCE-002 国民年金から厚生年金への切り替え
  - 期限: YYYY-MM-DD  ← 期限変更
  - メモ: デイキャンプのため延期  ← メモ追加
  - 優先度: high  ← 優先度変更

- [ ] ENVIRONMENT-003 作業環境のセットアップ
  - 優先度: high  ← 優先度を low から high に変更
  - メモ: 急務対応  ← メモ追加
```

**更新可能項目**：
- `期限: YYYY-MM-DD` : 期限変更
- `メモ: テキスト内容` : メモ更新/追加
- `優先度: high|medium|low` : 優先度変更
- `カテゴリ: カテゴリ名` : カテゴリ変更

### 日付形式について
- **統一形式**: `"YYYY-MM-DD"` （例：`"2025-06-30"`）
- **タイムゾーン**: ローカル時間で統一
- **可読性**: 手動編集しやすい簡潔な形式

---

## 🔗 Obsidian連携

### 生成されるファイル構成
```bash
npm run obsidian  # 実行後、obsidian-export/に以下が生成される
```

**カテゴリ別ファイル**（タスク存在時のみ）:
- `00_タスクサマリー.md` (全体概要・統計)
- `法的手続き.md`
- `会計・税務.md`
- `業務環境.md`
- `保険・年金.md`
- `収益基盤.md`
- `契約・請求.md`
- `ブランディング.md`
- `マーケティング.md`
- `運用・仕組み化.md`
- `リスク管理.md`
- `研究・論文.md`
- `期限別タスク一覧.md`

### Obsidianでの使用方法
1. Obsidianで `obsidian-export/` フォルダを開く
2. `00_タスクサマリー.md` から開始
3. `[[カテゴリ名]]` でカテゴリ間を移動
4. 双方向リンクでタスク間を自由に移動

### 自動生成される情報
- **タスク統計**: 全体・カテゴリ別・ステータス別・優先度別
- **期限分析**: 緊急タスク・今週・来週のタスク一覧
- **進捗可視化**: 完了率・残タスク数
- **カテゴリ別詳細**: 各カテゴリのタスク詳細とメモ

---

## 📂 Git管理

### 基本的なGit運用
```bash
# 朝のワークフロー
git pull
npm run today
git add daily/$(date +%F).md
git commit -m "feat: create daily tasks $(date +%F)"
git push

# 夕方のワークフロー
npm run sync-today
npm run obsidian
git add tasks.yml daily/ obsidian-export/
git commit -m "chore: sync tasks and obsidian export $(date +%F)"
git push
```

#### 新規タスク追加・更新時
```bash
# 新規タスク追加時
git add tasks.yml daily/$(date +%F).md
git commit -m "feat: add new tasks via checkbox syntax $(date +%F)"
git push

# タスク更新時
git add tasks.yml daily/$(date +%F).md obsidian-export/
git commit -m "chore: update tasks and obsidian export $(date +%F)"
git push
```

### ファイル管理方針
- `tasks.yml`: メインデータ、必ずコミット
- `daily/`: 日次記録、作業日は必ずコミット
- `obsidian-export/`: 自動生成、定期的にコミット
- `timeline.md`: 自動生成、分析時にコミット

---

## 🔧 トラブルシューティング

### よくある問題と解決方法

#### 1. タスクが同期されない
```bash
# 問題: daily/ファイルでタスクを変更したがtasks.ymlに反映されない
# 原因: sync.jsが実行されていない

# 解決方法
npm run sync-today
# または
node sync.js --file daily/YYYY-MM-DD.md
```

#### 2. extract.jsで期限付きタスクが見つからない
```bash
# 問題: 指定した日付のタスクが表示されない
# 原因: 日付形式が一致していない、またはタスクが存在しない

# 確認方法
node extract.js --date YYYY-MM-DD --all  # 全タスクを表示
grep "due.*YYYY-MM-DD" tasks.yml  # 該当日期限のタスクを検索
```

#### 3. タイムライン生成エラー
```bash
# 問題: npm run timelineでエラーが発生
# 原因: 日付形式が不正、またはYAMLファイルの構文エラー

# 解決方法
# 1. YAML構文チェック
npm install -g js-yaml
js-yaml tasks.yml

# 2. 日付形式チェック
grep "due:" tasks.yml | grep -v "\"[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}\""
```

#### 4. 重複タスクの検出
```bash
# 問題: 重複タスクが作成された
# 原因: ID重複、タイトル重複、または類似タスクの存在

# 確認方法
node -e "const yaml = require('js-yaml'); const fs = require('fs'); const tasks = yaml.load(fs.readFileSync('tasks.yml', 'utf8')); const ids = tasks.map(t => t.id); const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i); console.log('重複ID:', duplicates);"
```

#### 5. チェックボックス記法エラー
```bash
# チェックボックス記法での構文エラー
# 正しい記法：
- [ ] TASK-001 タスクタイトル  # ✅ 正しい
  - 期限: YYYY-MM-DD
- [x] TASK-001 タスクタイトル  # ✅ 完了
- [~] TASK-001 タスクタイトル  # ✅ 作業中

# 間違った記法：
- [] TASK-001 タスクタイトル   # ❌ スペースなし
- [x TASK-001 タスクタイトル   # ❌ 閉じ括弧なし
- [ ]TASK-001 タスクタイトル   # ❌ スペースなし
```

#### 6. Obsidianファイル生成エラー
```bash
# 問題: npm run obsidianでファイルが生成されない
# 原因: tasks.ymlの読み込みエラー、または権限不足

# 解決方法
# 1. tasks.ymlの構文チェック
node -e "console.log(require('js-yaml').load(require('fs').readFileSync('tasks.yml', 'utf8')))"

# 2. 権限チェック
ls -la obsidian-export/
mkdir -p obsidian-export  # ディレクトリが存在しない場合
```

### ファイル復旧手順
```bash
# tasks.ymlのバックアップから復旧
git log --oneline tasks.yml  # 履歴確認
git checkout [commit-hash] -- tasks.yml  # 特定時点に復旧

# daily/ファイルの復旧
git log --oneline daily/  # 履歴確認
git checkout [commit-hash] -- daily/YYYY-MM-DD.md
```

---

## 📞 サポート・質問

### 機能拡張の要望
新機能やカスタマイズの要望がある場合は、以下の情報を含めてIssueを作成してください：

1. **機能概要**: どのような機能を求めているか
2. **使用例**: 具体的な使用例や記法例
3. **期待する動作**: システムがどう動作すべきか

### 想定される拡張例
```markdown
# カテゴリ追加の例
- [ ] NEWCAT-001 新しいカテゴリのタスク
  - 期限: YYYY-MM-DD
  - カテゴリ: 新カテゴリ
  - 優先度: high

# 新しい属性追加の例
- [ ] TASK-001 タスクタイトル
  - 期限: YYYY-MM-DD
  - 担当者: 山田太郎  ← 新属性
  - 予想時間: 2時間   ← 新属性
```

---

*最終更新: 2025年5月31日*  
*システムバージョン: v2.0 (チェックボックス記法対応版)* 