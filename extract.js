#!/usr/bin/env node
// extract.js - 日次タスク抽出コマンド
const fs = require('fs');
const yaml = require('js-yaml');
const argv = require('minimist')(process.argv.slice(2));

// schedule-calculator.jsをインポート
const scheduleCalculator = require('./schedule-calculator');

if (!argv.date && !argv.overdue && !argv.all && !argv.category && !argv.priority && !argv.status && !argv.from && !argv.to && !argv.schedule && !argv.workload) {
  console.error('使用方法:');
  console.error('  node extract.js --date YYYY-MM-DD [オプション]');
  console.error('  node extract.js --overdue [オプション]');
  console.error('  node extract.js --schedule [YYYY-MM-DD]');
  console.error('  node extract.js --workload YYYY-MM-DD');
  console.error('');
  console.error('オプション:');
  console.error('  --date YYYY-MM-DD    指定日期限のタスクを抽出');
  console.error('  --all                全タスクを表示（期限無関係）');
  console.error('  --overdue            過去期限のタスクを抽出');
  console.error('  --schedule [日付]    時間ベーススケジュール表示（省略時は今日）');
  console.error('  --workload YYYY-MM-DD 指定日の作業負荷分析');
  console.error('  --category カテゴリ   特定カテゴリのみ抽出');
  console.error('  --priority 優先度     特定優先度のみ抽出 (high/medium/low)');
  console.error('  --status ステータス   特定ステータスのみ抽出 (open/in_progress/done/completed)');
  console.error('  --from YYYY-MM-DD    期限開始日');
  console.error('  --to YYYY-MM-DD      期限終了日');
  console.error('');
  console.error('例:');
  console.error('  node extract.js --date 2025-05-25');
  console.error('  node extract.js --overdue');
  console.error('  node extract.js --schedule');
  console.error('  node extract.js --workload 2025-06-01');
  console.error('  node extract.js --category 法的手続き');
  console.error('  node extract.js --priority high');
  console.error('  node extract.js --from 2025-06-01 --to 2025-06-15');
  process.exit(1);
}

const today = argv.date || argv.schedule || argv.workload || (() => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
})();

// 時間ベーススケジュール表示
if (argv.schedule || argv.workload) {
  try {
    const tasks = yaml.load(fs.readFileSync('tasks.yml', 'utf8'));
    const config = scheduleCalculator.loadConfig();
    
    if (argv.schedule) {
      displaySchedule(tasks, today, config);
    } else if (argv.workload) {
      displayWorkload(tasks, today, config);
    }
  } catch (error) {
    console.error('エラー:', error.message);
    process.exit(1);
  }
  process.exit(0);
}

const showAll = argv.all || false;
const showOverdue = argv.overdue || false;
const filterCategory = argv.category;
const filterPriority = argv.priority;
const filterStatus = argv.status;
const fromDate = argv.from;
const toDate = argv.to;

try {
  // tasks.yml を読み込み
  const tasks = yaml.load(fs.readFileSync('tasks.yml', 'utf8'));
  
  // 条件でフィルター
  let filteredTasks = tasks.filter(task => {
    // ステータスフィルター
    if (filterStatus && task.status !== filterStatus) {
      return false;
    }
    
    // カテゴリフィルター
    if (filterCategory && task.category !== filterCategory) {
      return false;
    }
    
    // 優先度フィルター
    if (filterPriority && task.priority !== filterPriority) {
      return false;
    }
    
    // 期間フィルター
    if (fromDate && new Date(task.due) < new Date(fromDate)) {
      return false;
    }
    if (toDate && new Date(task.due) > new Date(toDate)) {
      return false;
    }
    
    // 期限による基本フィルター
    if (showAll) {
      // --statusオプションが指定されている場合はそれに従う
      if (filterStatus) {
        return true; // ステータスフィルターで既に絞り込み済み
      }
      return task.status === 'open' || task.status === 'in_progress';
    } else if (showOverdue) {
      return (task.status === 'open' || task.status === 'in_progress') &&
             new Date(task.due) < new Date(today);
    } else if (argv.date) {
      return (task.status === 'open' || task.status === 'in_progress') &&
             new Date(task.due) <= new Date(today);
    }
    
    // その他の条件指定時も完了済みタスクは除外
    return task.status === 'open' || task.status === 'in_progress';
  });
  
  // 優先度順でソート（high > medium > low）
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  filteredTasks.sort((a, b) => {
    const aPriority = priorityOrder[a.priority] || 1;
    const bPriority = priorityOrder[b.priority] || 1;
    if (aPriority !== bPriority) {
      return bPriority - aPriority; // 高優先度を上に
    }
    return new Date(a.due) - new Date(b.due); // 期限順
  });
  
  // カテゴリー別にグループ化
  const groupedTasks = {};
  filteredTasks.forEach(task => {
    const category = task.category || 'その他';
    if (!groupedTasks[category]) {
      groupedTasks[category] = [];
    }
    groupedTasks[category].push(task);
  });
  
  // タイトル生成
  let title = '';
  if (showOverdue) {
    title = `過去期限タスク一覧 (基準日: ${today})`;
  } else if (showAll) {
    title = `全タスク一覧 (${today})`;
  } else if (fromDate && toDate) {
    title = `${fromDate} 〜 ${toDate} 期限のタスク一覧`;
  } else {
    title = `${today} のタスク一覧`;
  }
  
  // 条件を表示
  const conditions = [];
  if (filterCategory) conditions.push(`カテゴリ: ${filterCategory}`);
  if (filterPriority) conditions.push(`優先度: ${filterPriority}`);
  if (filterStatus) conditions.push(`ステータス: ${filterStatus}`);
  
  // Markdown形式で出力
  console.log(`# ${title}\n`);
  console.log(`生成日時: ${new Date().toLocaleString('ja-JP')}\n`);
  
  if (conditions.length > 0) {
    console.log(`🔍 **抽出条件**: ${conditions.join(', ')}\n`);
  }
  
  if (filteredTasks.length === 0) {
    let message = '🎉 該当するタスクはありません！';
    if (showOverdue) {
      message = '✨ 過去期限のタスクはありません！';
    }
    console.log(`${message}\n`);
  } else {
    let taskTypeLabel = showOverdue ? '過去期限の' : 
                       showAll ? '全' : 
                       '今日期限の';
    console.log(`📋 **${taskTypeLabel}タスク**: ${filteredTasks.length}件\n`);
    
    // カテゴリー別に出力
    Object.entries(groupedTasks).forEach(([category, tasks]) => {
      console.log(`## ${category}\n`);
      tasks.forEach(task => {
        // チェックボックス状態を決定
        const checkbox = task.status === 'completed' ? '[x]' : 
                        task.status === 'in_progress' ? '[~]' : '[ ]';
        
        // タスク行を出力（sync.js対応形式）
        console.log(`- ${checkbox} ${task.id} ${task.title}`);
        
        // 属性を子項目として出力
        if (task.due) {
          console.log(`  - 期限: ${task.due}`);
        }
        if (task.estimated_hours) {
          console.log(`  - 見積もり時間: ${task.estimated_hours}時間`);
        }
        if (task.memo) {
          console.log(`  - メモ: ${task.memo}`);
        }
        if (task.category) {
          console.log(`  - カテゴリ: ${task.category}`);
        }
        if (task.priority) {
          console.log(`  - 優先度: ${task.priority}`);
        }
        if (task.source) {
          console.log(`  - 参照: ${task.source}`);
        }
        
        // 過去期限の場合は経過日数を表示
        if (showOverdue || new Date(task.due) < new Date(today)) {
          const daysPast = Math.floor((new Date(today) - new Date(task.due)) / (1000 * 60 * 60 * 24));
          console.log(`  - ⚠️ 経過日数: ${daysPast}日`);
        }
        console.log();
      });
    });
  }
  
  // 統計情報を追加
  if (filteredTasks.length > 0) {
    console.log(`---\n`);
    console.log(`## 📊 統計情報\n`);
    
    // 優先度別集計
    const priorityStats = { high: 0, medium: 0, low: 0 };
    filteredTasks.forEach(task => {
      priorityStats[task.priority] = (priorityStats[task.priority] || 0) + 1;
    });
    
    console.log(`- **🔴高優先度**: ${priorityStats.high}件`);
    console.log(`- **🟡中優先度**: ${priorityStats.medium}件`);
    console.log(`- **🟢低優先度**: ${priorityStats.low}件`);
    
    // カテゴリ別集計
    console.log(`### カテゴリ別内訳\n`);
    Object.entries(groupedTasks).forEach(([category, tasks]) => {
      console.log(`- **${category}**: ${tasks.length}件`);
    });
    
    // 時間ベース作業負荷チェック（日次ファイル限定）
    if (argv.date && !showAll && !showOverdue && !filterCategory && !filterPriority && !filterStatus) {
      const config = scheduleCalculator.loadConfig();
      const workload = scheduleCalculator.calculateDailyWorkload(today, tasks, config);
      
      console.log(`\n### 📈 今日の作業負荷\n`);
      
      // 期限当日と計画的作業を分けて表示
      const dueTodayTasks = workload.tasks.filter(t => t.workType === 'due_today');
      const plannedTasks = workload.tasks.filter(t => t.workType === 'planned');
      
      if (dueTodayTasks.length > 0) {
        const dueTodayHours = dueTodayTasks.reduce((sum, t) => sum + t.dailyHours, 0);
        console.log(`- **🚨 期限当日タスク**: ${dueTodayTasks.length}件（${dueTodayHours}時間）`);
      }
      
      if (plannedTasks.length > 0) {
        console.log(`- **📅 計画的作業**: ${plannedTasks.length}件（${plannedTasks.length}時間）`);
      }
      
      console.log(`- **合計予定時間**: ${workload.totalHours}時間`);
      console.log(`- **負荷状況**: ${workload.status.emoji} ${workload.status.text}`);
      
      if (workload.isHeavyWorkload) {
        console.log(`\n⚠️ **重負荷アラート**: 今日は${workload.totalHours}時間の作業が予定されており、推奨上限（4時間）を超えています。`);
        
        if (dueTodayTasks.length > 0) {
          console.log(`**緊急**: 期限当日タスク${dueTodayTasks.length}件があります。これらは延期困難です。`);
          dueTodayTasks.forEach(task => {
            console.log(`  - ${task.id}: ${task.estimated_hours}時間`);
          });
        }
        
        if (plannedTasks.length > 0) {
          console.log(`**提案**: 計画的作業${plannedTasks.length}件のうち、一部を明日以降に延期することを検討してください。`);
        }
        
        console.log(`\n詳細分析: \`node extract.js --workload ${today}\``);
      }
    }
    console.log();
  }
  
  // 振り返りセクションを追加（日次の場合のみ）
  if (argv.date && !showAll && !showOverdue && !filterCategory && !filterPriority && !filterStatus) {
    console.log(`---\n`);
    console.log(`## 今日の振り返り\n`);
    console.log(`### 完了したこと\n`);
    console.log(`<!-- 完了したタスクについて記録 -->\n`);
    console.log(`### 進捗・気づき\n`);
    console.log(`<!-- 進捗状況や気づいたことを記録 -->\n`);
    console.log(`### 明日以降の予定\n`);
    console.log(`<!-- 次に取り組むことを記録 -->\n`);
  }

  // 全体統計情報を表示（--allオプション時）
  if (showAll) {
    const allTasks = tasks;
    const inProgressTasks = allTasks.filter(task => task.status === 'in_progress');
    const openTasks = allTasks.filter(task => task.status === 'open');
    const completedTasks = allTasks.filter(task => ['done', 'completed'].includes(task.status));

    console.log(`\n📊 タスク統計:`);
    console.log(`   進行中: ${inProgressTasks.length}件`);
    console.log(`   未着手: ${openTasks.length}件`);
    console.log(`   完了済: ${completedTasks.length}件`);
    console.log(`   全体: ${allTasks.length}件`);
  }

} catch (error) {
  console.error('エラーが発生しました:', error.message);
  process.exit(1);
}

/**
 * 時間ベーススケジュール表示
 */
function displaySchedule(tasks, date, config) {
  console.log(`# ${date} 時間ベーススケジュール（1日1時間制約）\n`);
  console.log(`生成日時: ${new Date().toLocaleString('ja-JP')}\n`);
  
  // 今日作業すべきタスク
  const todayWorkload = scheduleCalculator.calculateDailyWorkload(date, tasks, config);
  
  if (todayWorkload.tasks.length === 0) {
    console.log(`## 🎉 今日作業すべきタスクはありません\n`);
  } else {
    console.log(`## 🚨 今日作業すべきタスク（1日1時間配分）\n`);
    
    todayWorkload.tasks.forEach(task => {
      const allocation = scheduleCalculator.calculateTaskAllocation(task, config);
      if (allocation) {
        const currentDayIndex = allocation.dailyAllocation.findIndex(day => day.date === date) + 1;
        console.log(`- [ ] ${task.id} ${task.title} ［${task.estimated_hours}h］`);
        console.log(`  - 期限: ${task.due} → 着手期限: ${allocation.startDeadline}`);
        console.log(`  - 今日の作業: 1時間（${currentDayIndex}日目/${allocation.daysNeeded}日計画）\n`);
      }
    });
  }
  
  // 今日の作業負荷状況
  console.log(`## ⏰ 今日の作業負荷状況\n`);
  console.log(`- **作業予定タスク**: ${todayWorkload.totalHours}個（${todayWorkload.totalHours}時間）`);
  console.log(`- **状況**: ${todayWorkload.status.emoji} ${todayWorkload.status.text}\n`);
  
  // 今後7日間の負荷予測
  const forecast = scheduleCalculator.generateWorkloadForecast(tasks, 7, date);
  console.log(`## 📊 今後7日間の負荷予測\n`);
  console.log(`| 日付 | タスク数 | 必要時間 | 状況 |`);
  console.log(`|------|----------|----------|------|`);
  
  forecast.forEach(workload => {
    const dateStr = workload.date.substring(5); // MM-DD形式
    console.log(`| ${dateStr} | ${workload.totalHours}個 | ${workload.totalHours}.0h | ${workload.status.emoji} ${workload.status.text} |`);
  });
  console.log();
  
  // 重負荷日のアラート
  const alerts = scheduleCalculator.generateAlerts(forecast);
  if (alerts.length > 0) {
    console.log(`## 🚨 重負荷日のアラート\n`);
    
    alerts.forEach(alert => {
      const dateStr = alert.date.substring(5); // MM-DD形式
      console.log(`### 📅 ${dateStr}（${alert.taskCount}タスク同時実行）`);
      alert.tasks.forEach(task => {
        console.log(`- ${task.id}（${task.dayInfo}）`);
      });
      console.log(`\n**提案**: ${alert.suggestion}\n`);
    });
  }
}

/**
 * 作業負荷分析表示
 */
function displayWorkload(tasks, date, config) {
  console.log(`# ${date} 作業負荷分析\n`);
  console.log(`生成日時: ${new Date().toLocaleString('ja-JP')}\n`);
  
  const workload = scheduleCalculator.calculateDailyWorkload(date, tasks, config);
  
  console.log(`## 📊 基本情報\n`);
  console.log(`- **対象日**: ${date}`);
  console.log(`- **作業予定タスク数**: ${workload.totalHours}個`);
  console.log(`- **必要時間**: ${workload.totalHours}時間（1タスク1時間）`);
  console.log(`- **負荷レベル**: ${workload.status.emoji} ${workload.status.text}`);
  console.log(`- **アラート**: ${workload.isHeavyWorkload ? '⚠️ 重負荷' : '✅ 正常'}\n`);
  
  if (workload.tasks.length === 0) {
    console.log(`## 🎉 この日は作業予定がありません\n`);
  } else {
    console.log(`## 📋 作業予定タスク詳細\n`);
    
    workload.tasks.forEach((task, index) => {
      const allocation = scheduleCalculator.calculateTaskAllocation(task, config);
      if (allocation) {
        const currentDayIndex = allocation.dailyAllocation.findIndex(day => day.date === date) + 1;
        console.log(`### ${index + 1}. ${task.id} ${task.title}\n`);
        console.log(`- **見積もり時間**: ${task.estimated_hours}時間`);
        console.log(`- **期限**: ${task.due}`);
        console.log(`- **着手期限**: ${allocation.startDeadline}`);
        console.log(`- **作業進捗**: ${currentDayIndex}日目/${allocation.daysNeeded}日計画`);
        console.log(`- **優先度**: ${task.priority}`);
        console.log(`- **カテゴリ**: ${task.category}`);
        if (task.memo) {
          console.log(`- **メモ**: ${task.memo}`);
        }
        console.log();
      }
    });
  }
  
  // 推奨スケジュール調整
  if (workload.isHeavyWorkload) {
    console.log(`## 🔧 推奨スケジュール調整\n`);
    console.log(`現在の負荷が推奨レベル（4時間）を超えています。以下の調整を検討してください：\n`);
    
    if (workload.totalHours === 4) {
      console.log(`- 上限ギリギリです。可能であれば1つのタスクの開始を1日遅らせることを検討してください。`);
    } else if (workload.totalHours === 5) {
      console.log(`- 1タスク超過です。以下のいずれかを検討してください：`);
      console.log(`  - 1つのタスクの開始を1日遅らせる`);
      console.log(`  - 1つのタスクの期限交渉を行う`);
    } else {
      console.log(`- ${workload.totalHours - 4}タスク超過です。以下の対策が必要です：`);
      console.log(`  - 複数のタスクの開始を遅らせる`);
      console.log(`  - 期限の見直しを行う`);
      console.log(`  - タスクの優先度を再検討する`);
    }
    console.log();
  }
} 