// 時間見積もりベースタスク管理システム 計算ロジック（シンプル版）
// 作成日: 2025-06-01

const fs = require('fs');
const yaml = require('js-yaml');

/**
 * 設定ファイルを読み込む
 */
function loadConfig() {
  try {
    const configContent = fs.readFileSync('config/schedule.yml', 'utf8');
    return yaml.load(configContent);
  } catch (error) {
    console.error('設定ファイルの読み込みに失敗しました:', error.message);
    // デフォルト設定を返す
    return {
      daily_work_hours: 1,
      buffer_days: 1,
      alert_thresholds: {
        heavy_workload_hours: 4.0
      }
    };
  }
}

/**
 * 着手期限を計算する（1日1時間制約）
 * @param {Object} task - タスクオブジェクト
 * @param {Object} config - 設定オブジェクト
 * @returns {string} - 着手期限（YYYY-MM-DD形式）
 */
function calculateStartDeadline(task, config) {
  if (!task.estimated_hours || !task.due) {
    return null;
  }
  
  // 必要日数 = 見積もり時間の小数点以下繰り上げ
  const daysNeeded = Math.ceil(task.estimated_hours);
  
  // 着手期限 = 期限 - 必要日数 - バッファ日数
  const dueDate = new Date(task.due);
  const startDate = new Date(dueDate);
  startDate.setDate(startDate.getDate() - daysNeeded - config.buffer_days);
  
  return startDate.toISOString().split('T')[0];
}

/**
 * 指定日の作業負荷を計算する（1日1時間配分）
 * @param {string} date - 対象日（YYYY-MM-DD形式）
 * @param {Array} tasks - タスク配列
 * @param {Object} config - 設定オブジェクト
 * @returns {Object} - 作業負荷情報
 */
function calculateDailyWorkload(date, tasks, config) {
  const tasksForDay = [];
  
  tasks.forEach(task => {
    // 見積もり時間がないタスクや完了済みタスクは除外
    if (!task.estimated_hours || task.status === 'completed') return;
    
    // ケース1: 期限当日のタスク（緊急対応）
    if (task.due === date && (task.status === 'open' || task.status === 'in_progress')) {
      tasksForDay.push({
        ...task,
        workType: 'due_today',
        dailyHours: task.estimated_hours // 期限当日は全時間必要
      });
      return;
    }
    
    // ケース2: 計画的作業期間内のタスク（1日1時間配分）
    const startDeadline = calculateStartDeadline(task, config);
    if (!startDeadline) return;
    
    const daysNeeded = Math.ceil(task.estimated_hours);
    const endDate = new Date(startDeadline);
    endDate.setDate(endDate.getDate() + daysNeeded - 1);
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // 指定日が作業期間内かチェック
    if (startDeadline <= date && date <= endDateStr && 
        (task.status === 'open' || task.status === 'in_progress')) {
      tasksForDay.push({
        ...task,
        workType: 'planned',
        dailyHours: 1 // 計画的作業は1日1時間
      });
    }
  });
  
  // 合計時間を計算
  const totalHours = tasksForDay.reduce((sum, task) => sum + task.dailyHours, 0);
  const isHeavyWorkload = totalHours >= config.alert_thresholds.heavy_workload_hours;
  
  return {
    date,
    tasks: tasksForDay,
    totalHours,
    isHeavyWorkload,
    status: getWorkloadStatus(totalHours, config)
  };
}

/**
 * 作業負荷のステータスを取得
 * @param {number} totalHours - 合計時間
 * @param {Object} config - 設定オブジェクト
 * @returns {Object} - ステータス情報
 */
function getWorkloadStatus(totalHours, config) {
  const threshold = config.alert_thresholds.heavy_workload_hours;
  
  if (totalHours === 0) {
    return { level: 'empty', emoji: '⚪', text: '作業なし' };
  } else if (totalHours < threshold) {
    return { level: 'normal', emoji: '✅', text: '正常' };
  } else if (totalHours === threshold) {
    return { level: 'warning', emoji: '⚠️', text: 'ちょうど上限' };
  } else {
    return { level: 'heavy', emoji: '🔴', text: '重負荷' };
  }
}

/**
 * 今後n日間の作業負荷予測を生成
 * @param {Array} tasks - タスク配列
 * @param {number} days - 予測日数（デフォルト7日）
 * @param {string} startDate - 開始日（デフォルト今日）
 * @returns {Array} - 日別作業負荷配列
 */
function generateWorkloadForecast(tasks, days = 7, startDate = null) {
  const config = loadConfig();
  const start = startDate ? new Date(startDate) : new Date();
  const forecast = [];
  
  for (let i = 0; i < days; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    const workload = calculateDailyWorkload(dateStr, tasks, config);
    forecast.push(workload);
  }
  
  return forecast;
}

/**
 * タスクの作業配分詳細を計算
 * @param {Object} task - タスクオブジェクト
 * @param {Object} config - 設定オブジェクト
 * @returns {Object} - 作業配分情報
 */
function calculateTaskAllocation(task, config) {
  if (!task.estimated_hours || !task.due) {
    return null;
  }
  
  const startDeadline = calculateStartDeadline(task, config);
  const daysNeeded = Math.ceil(task.estimated_hours);
  const dailyAllocation = [];
  
  const startDate = new Date(startDeadline);
  for (let i = 0; i < daysNeeded; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    dailyAllocation.push({
      date: date.toISOString().split('T')[0],
      hours: 1,
      dayIndex: i + 1,
      totalDays: daysNeeded
    });
  }
  
  return {
    id: task.id,
    title: task.title,
    totalHours: task.estimated_hours,
    daysNeeded,
    startDeadline,
    due: task.due,
    dailyAllocation
  };
}

/**
 * 重負荷日のアラート情報を生成
 * @param {Array} forecast - 作業負荷予測配列
 * @returns {Array} - アラート情報配列
 */
function generateAlerts(forecast) {
  const alerts = [];
  
  forecast.forEach(workload => {
    if (workload.isHeavyWorkload) {
      const taskDetails = workload.tasks.map(task => {
        const config = loadConfig();
        const allocation = calculateTaskAllocation(task, config);
        const currentDayIndex = allocation ? 
          allocation.dailyAllocation.findIndex(day => day.date === workload.date) + 1 : 1;
        
        return {
          id: task.id,
          title: task.title,
          dayInfo: allocation ? `${currentDayIndex}日目/${allocation.daysNeeded}日計画` : '詳細不明'
        };
      });
      
      alerts.push({
        date: workload.date,
        totalHours: workload.totalHours,
        taskCount: workload.tasks.length,
        tasks: taskDetails,
        suggestion: generateSuggestion(workload)
      });
    }
  });
  
  return alerts;
}

/**
 * 重負荷日の調整提案を生成
 * @param {Object} workload - 作業負荷情報
 * @returns {string} - 調整提案テキスト
 */
function generateSuggestion(workload) {
  const taskCount = workload.tasks.length;
  
  if (taskCount === 4) {
    return '上限ギリギリです。可能であれば1つのタスクの開始を1日遅らせることを検討してください。';
  } else if (taskCount === 5) {
    return '1タスク超過です。1つのタスクの開始を1日遅らせるか、期限交渉を検討してください。';
  } else if (taskCount >= 6) {
    return `${taskCount - 4}タスク超過です。複数のタスクの開始を遅らせるか、期限の見直しが必要です。`;
  }
  
  return '作業負荷が高いため、スケジュール調整を検討してください。';
}

module.exports = {
  loadConfig,
  calculateStartDeadline,
  calculateDailyWorkload,
  generateWorkloadForecast,
  calculateTaskAllocation,
  generateAlerts,
  getWorkloadStatus
}; 