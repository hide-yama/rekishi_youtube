# 議事録管理

このフォルダは、日本史年号楽曲制作プロジェクトの議事録を管理するためのフォルダです。

## 🤖 Claude による自動議事録作成フロー

### 使用方法（推奨）

1. **Claude への依頼開始**
   ```
   「@docs/meeting-minutes/README.md @docs/meeting-minutes/meeting-assistant.md を読み込んでください。ミーティングをしましたので、議事録を取ってください。」
   ```

2. **Claude からの質問対応**
   - Claude が以下を質問します：
     - 日付は何月何日ですか？
     - 時間は何時から何時までですか？
     - 参加者は誰ですか？
     - 何についての話し合いですか？（議事録のテーマ）

3. **ファイル生成**
   - Claude が下記の命名規則に従って議事録ファイルを作成
   - 例：`2025-01-27_image-generation-meeting.md`

4. **文字起こしデータ提供**
   - Claude が「文字起こしデータをください」と依頼
   - 録音の文字起こしデータを貼り付けて送信

5. **議事録完成**
   - Claude がテンプレート形式で議事録を自動生成
   - アクションアイテム、決定事項、討議内容を整理

### Claude 向け自動化指示

**このREADMEを読み込まれた場合の動作:**

`meeting-assistant.md` の「議事録作成指示」セクションに従って議事録作成を進行してください。

**重要**: ファイル名は必ず下記の「ファイル命名規則」に従って決定してください。

## ファイル命名規則

### 定期ミーティング
- **キックオフ**: `YYYY-MM-DD_kickoff.md`
- **週次ミーティング**: `YYYY-MM-DD_weekly.md`
- **月次レビュー**: `YYYY-MM-DD_monthly-review.md`

### プロジェクト関連
- **制作会議**: `YYYY-MM-DD_production-meeting.md`
- **技術検討会**: `YYYY-MM-DD_technical-review.md`
- **マーケティング会議**: `YYYY-MM-DD_marketing-meeting.md`
- **画像生成会議**: `YYYY-MM-DD_image-generation-meeting.md`
- **進捗確認会議**: `YYYY-MM-DD_progress-review-meeting.md`

### その他
- **緊急会議**: `YYYY-MM-DD_emergency_[議題].md`
- **個別相談**: `YYYY-MM-DD_consultation_[相談者名].md`

## 管理方針

- **自動化優先**: Claude による対話型議事録作成を推奨
- **アクションアイテム**: 必ず担当者と期限を明記
- **フォローアップ**: 次回ミーティングで進捗確認
- **アーカイブ**: 完了したプロジェクトの議事録は適切に整理保存

## 関連ドキュメント

- `meeting-assistant.md` - Claude向け議事録作成アシスタント
- `docs/progress.md` - プロジェクト全体進捗
- `docs/strategy/` - 戦略・要件関連ドキュメント
- `tasks.yml` - タスク管理（議事録からのアクションアイテム反映） 