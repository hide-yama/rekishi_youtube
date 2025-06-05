<!--
このファイルはscriptsディレクトリ移行作業の運用記録・履歴としてdocs/配下に移動しました。
今後も運用記録・例外事項の履歴として参照・追記してください。
-->
# scripts/ディレクトリ移行 ToDoリスト

- [x] 1. scripts/ディレクトリを新規作成する
- [x] 2. プロジェクト直下のjsファイルをすべてscripts/に移動する
    - sync.js
    - extract.js
    - obsidian-export.js
    - review.js
    - calendar-scheduler.js
    - schedule-calculator.js
    - timeline-export.js（※見つからず、移動対象外）
- [x] 3. package.jsonのnpm scriptsやREADME.md内のjsファイルパスを修正する
- [x] 4. 他のjsファイルからのrequire/importパスを修正する
- [x] 5. 動作確認（npm runコマンドや直接実行）
- [~] 6. 完了後、このToDoリストに進捗を記録

---

- scriptsディレクトリ移行作業はすべて完了しました。
- npm scripts・README・コマンド例・動作確認まで一貫して修正・検証済みです。
- 今後はjsファイルはscripts/配下に集約し、ルート直下は管理ファイル・ドキュメントのみとします。
- 追加の要望や例外運用が発生した場合は、このファイルに追記してください。

（このToDoリストはクローズして運用記録として残します） 