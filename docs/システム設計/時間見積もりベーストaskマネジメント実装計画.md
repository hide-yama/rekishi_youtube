# 時間見積もりベースタスクマネジメント実装計画（シンプル版）

作成日: 2025年5月31日  
修正日: 2025年6月1日（シンプル化）
企画者: ユーザー  
実装予定: 2025年6月1日〜  

## 🎯 **実装の目的・価値**

### 現在の課題
- 期限だけ見て「今日やらなきゃ」では手遅れ
- タスクの所要時間を考慮していない  
- 1日の作業負荷が見えない
- 期限当日に慌てる「締切駆動」の非効率性

### 期待される効果
- **逆算による計画的タスク管理**: 期限から逆算した着手期限の自動計算
- **作業負荷の可視化**: 1日の必要作業時間の明確化
- **負荷アラート**: 5時間以上の作業が必要な日の事前警告
- **ストレス軽減**: 計画的な着手による精神的負担軽減

## 🔧 **技術仕様（シンプル版）**

### 1. データ構造拡張

#### tasks.ymlへの新フィールド追加
```yaml
- id: TASK-001
  title: タスク名
  category: カテゴリ
  priority: high
  due: "2025-06-30"
  status: open
  memo: メモ
  # 新規追加フィールド（1つのみ）
  estimated_hours: 4.0      # 見積もり時間（時間単位、0.5刻み）
```

#### 設定ファイル（config/schedule.yml）
```yaml
# 作業時間設定
daily_work_hours: 6         # 1日の標準作業時間
buffer_days: 1              # 着手期限のバッファ日数
work_days: [1,2,3,4,5]      # 作業可能曜日（月-金）

# アラート設定
alert_thresholds:
  heavy_workload_hours: 5.0 # 5時間以上でアラート

# デフォルト見積もり時間（カテゴリ別）
default_estimates:
  法的手続き: 2.0           # 書類作成・手続き系
  会計・税務: 3.0           # 学習・設定が必要
  業務環境: 1.5             # 機材・ツール準備
  収益基盤: 4.0             # 営業・案件獲得
  保険・年金: 1.5           # 手続き系
  ブランディング: 3.0       # 創作・企画系
  運用・仕組み化: 4.0       # システム開発
  契約・請求: 2.0           # 事務処理
  マーケティング: 3.5       # 企画・制作
  リスク管理: 2.5           # 分析・計画
  オペレーション改善: 5.0   # 高度なシステム開発
  研究・論文: 6.0           # 研究・執筆
```

### 2. 計算ロジック（シンプル版・1日1時間制約）

#### 着手期限計算
```javascript
// 1日1時間制約での着手期限計算
function calculateStartDeadline(task, config) {
  // 必要日数 = 見積もり時間の小数点以下繰り上げ
  const daysNeeded = Math.ceil(task.estimated_hours);
  const startDate = new Date(task.due);
  startDate.setDate(startDate.getDate() - daysNeeded - config.buffer_days);
  return startDate.toISOString().split('T')[0];
}
```

#### 日次時間合算チェック（1日1時間配分）
```javascript
// その日に作業すべきタスクの合計時間を計算（1日1時間配分）
function calculateDailyWorkload(date, tasks, config) {
  const tasksForDay = tasks.filter(task => {
    if (!task.estimated_hours) return false;
    const startDeadline = calculateStartDeadline(task, config);
    const daysNeeded = Math.ceil(task.estimated_hours);
    const endDate = new Date(startDeadline);
    endDate.setDate(endDate.getDate() + daysNeeded - 1);
    const endDateStr = endDate.toISOString().split('T')[0];
    
    return startDeadline <= date && date <= endDateStr && 
           (task.status === 'open' || task.status === 'in_progress');
  });
  
  // 各タスク1日1時間なので、タスク数 = 必要時間
  const totalHours = tasksForDay.length;
  return {
    tasks: tasksForDay,
    totalHours,
    isHeavyWorkload: totalHours >= config.alert_thresholds.heavy_workload_hours
  };
}
```

#### 作業配分例
```javascript
// 3.2時間のタスク（期限: 2025-06-30）の配分例
// 必要日数: Math.ceil(3.2) = 4日
// 開始日: 2025-06-30 - 4日 - 1日 = 2025-06-25
// 配分: 
//   2025-06-25: 1時間
//   2025-06-26: 1時間  
//   2025-06-27: 1時間
//   2025-06-28: 1時間（計4時間で完了）
//   2025-06-29: 0時間（余裕日）
//   2025-06-30: 0時間（期限日）
```

### 3. 表示機能（シンプル版）

#### extract.jsの新オプション
```bash
# 新しいコマンドオプション
node extract.js --schedule          # 時間ベーススケジュール表示
node extract.js --workload YYYY-MM-DD  # 指定日の作業負荷分析
```

#### 新しい表示形式
```markdown
# 2025-06-01 時間ベーススケジュール（1日1時間制約）

## 🚨 今日作業すべきタスク（1日1時間配分）
- [ ] ACCOUNTING-005 freee導入・初期設定 ［3.0h］
  - 期限: 2025-06-30 → 着手期限: 2025-06-26  
  - 今日の作業: 1時間（3日目/4日計画）
  
- [ ] INSURANCE-002 国民年金・国民健康保険手続き ［1.5h］
  - 期限: 2025-06-15 → 着手期限: 2025-06-13
  - 今日の作業: 1時間（1日目/2日計画）

## ⏰ 今日の作業負荷状況
- **作業予定タスク**: 2個（2時間）
- **状況**: ✅ 正常（4時間未満）

## 📊 今後7日間の負荷予測
| 日付 | タスク数 | 必要時間 | 状況 |
|------|----------|----------|------|
| 06-01 | 2個 | 2.0h | ✅ 正常 |
| 06-02 | 4個 | 4.0h | ⚠️ ちょうど上限 |
| 06-03 | 5個 | 5.0h | 🔴 重負荷 |
| 06-04 | 3個 | 3.0h | ✅ 正常 |

## 🚨 重負荷日のアラート
### 📅 06-03（5タスク同時実行）
- ACCOUNTING-005（3日目）
- INSURANCE-002（2日目）  
- BUSINESS-001（1日目）
- TAX-003（2日目）
- OPERATION-007（1日目）

**提案**: 一部タスクの開始を1日遅らせるか、期限交渉を検討
```

## 🛠️ **実装手順（シンプル版）**

### Phase 1: データ準備（Day 1）
1. **設定ファイル作成**
   - `config/schedule.yml`の作成（シンプル版）
   - 基本パラメーターの設定

2. **既存タスクへの見積もり時間追加**
   - 主要タスク（10-15件）に`estimated_hours`を追加
   - sync.jsでの新フィールド対応

### Phase 2: 計算ロジック実装（Day 2）
1. **schedule-calculator.js作成**
   - 着手期限計算関数
   - 日次負荷計算関数  

2. **extract.js拡張**
   - `--schedule`オプション追加
   - 時間ベース表示機能

### Phase 3: 統合・テスト（Day 3）
1. **既存システムとの統合確認**
   - sync.jsでの新フィールド同期確認
   - 実際の運用での効果測定

## 📋 **実装タスク詳細**

### OPERATION-007: 時間見積もりベースタスク管理システム実装（シンプル版）
- **期限**: 2025-06-05
- **見積もり時間**: 9時間（3時間/日 × 3日）
- **優先度**: high

#### サブタスク
1. **OPERATION-007-1**: データ構造設計・設定ファイル作成［3h］
2. **OPERATION-007-2**: 計算ロジック実装・extract.js拡張［4h］  
3. **OPERATION-007-3**: 統合テスト・文書化［2h］

## 🎯 **期待される成果**

### 短期成果（1週間）
- 着手すべきタスクの明確化
- 作業負荷の可視化による計画性向上
- 5時間以上の重負荷日の事前警告

### 中期成果（1か月）
- 見積もり精度の向上による予測性向上  
- 時間管理に対する意識改革
- 締切直前の慌ただしさ軽減

---

**実装開始日**: 2025年6月1日  
**完成目標日**: 2025年6月3日（シンプル化により短縮）  
**レビュー日**: 2025年6月4日  

*シンプル版で効果を確認後、必要に応じて機能拡張を検討する。* 