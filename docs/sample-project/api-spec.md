# [サンプル] API仕様書

> このファイルはタスク管理システムの参照機能のサンプルです。

## 関連タスク
- DOC-001: API仕様書作成

## API エンドポイント

### ユーザー管理
```
POST /api/users/login
GET  /api/users/profile
PUT  /api/users/profile
```

### プロジェクト管理
```
GET    /api/projects
POST   /api/projects
PUT    /api/projects/:id
DELETE /api/projects/:id
```

### タスク管理
```
GET    /api/tasks
POST   /api/tasks
PUT    /api/tasks/:id
DELETE /api/tasks/:id
```

## レスポンス例

### プロジェクト一覧取得
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "サンプルプロジェクト",
      "status": "active",
      "created_at": "2025-06-01T00:00:00Z"
    }
  ]
}
```

---
*このドキュメントは[サンプル]です - 実運用時は削除してください*