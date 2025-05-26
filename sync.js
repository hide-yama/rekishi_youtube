#!/usr/bin/env node
// sync.js - 双方向同期コマンド
const fs = require('fs');
const yaml = require('js-yaml');
const argv = require('minimist')(process.argv.slice(2));

if (!argv.file) {
  console.error('使用方法: node sync.js --file daily/YYYY-MM-DD.md');
  console.error('例: node sync.js --file daily/2025-05-25.md');
  process.exit(1);
}

const filePath = argv.file;

if (!fs.existsSync(filePath)) {
  console.error(`ファイルが見つかりません: ${filePath}`);
  process.exit(1);
}

// 重複チェック機能
function checkDuplicates(tasks, newTaskInfo) {
  const warnings = [];
  
  // 1. IDの完全重複チェック
  if (newTaskInfo.id && tasks.find(task => task.id === newTaskInfo.id)) {
    warnings.push(`🚨 ID重複: ${newTaskInfo.id} は既に存在します`);
  }
  
  // 2. タイトルの完全一致チェック
  if (newTaskInfo.title) {
    const exactMatch = tasks.find(task => 
      task.title.toLowerCase() === newTaskInfo.title.toLowerCase()
    );
    if (exactMatch) {
      warnings.push(`⚠️ タイトル重複: "${newTaskInfo.title}" は既存タスク ${exactMatch.id} と同じです`);
    }
  }
  
  // 3. キーワードベースの類似チェック
  if (newTaskInfo.title) {
    const keywords = newTaskInfo.title.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    const similarTasks = tasks.filter(task => {
      const taskWords = task.title.toLowerCase().split(/\s+/);
      const commonWords = keywords.filter(keyword => 
        taskWords.some(word => word.includes(keyword) || keyword.includes(word))
      );
      // 類似度の閾値を調整: 共通キーワードが2個以上、または全キーワードの50%以上
      const similarityThreshold = Math.max(2, Math.ceil(keywords.length * 0.5));
      return commonWords.length >= similarityThreshold;
    });
    
    if (similarTasks.length > 0) {
      warnings.push(`💡 類似タスク発見:`);
      similarTasks.forEach(task => {
        warnings.push(`   - ${task.id}: ${task.title}`);
      });
    }
  }
  
  return warnings;
}

// 新規タスク検出機能
function detectNewTasks(content, existingTasks) {
  const lines = content.split('\n');
  const newTasks = [];
  
  lines.forEach((line, index) => {
    // 新規タスクのパターンを検出
    const newTaskMatch = line.match(/^\s*-\s*\[\s*\]\s*NEW:\s*(.+)/i);
    if (newTaskMatch) {
      const taskText = newTaskMatch[1];
      const idMatch = taskText.match(/([A-Z]+-\d+)/);
      const titleMatch = taskText.replace(/([A-Z]+-\d+)/, '').trim();
      
      if (idMatch) {
        newTasks.push({
          id: idMatch[1],
          title: titleMatch,
          lineNumber: index + 1,
          originalLine: line
        });
      }
    }
  });
  
  return newTasks;
}

// タスク更新検出機能
function detectTaskUpdates(content, existingTasks) {
  const lines = content.split('\n');
  const updates = [];
  
  lines.forEach((line, index) => {
    // 更新指示のパターンを検出: UPDATE: TASK-001 due:2025-05-30 memo:新しいメモ
    const updateMatch = line.match(/^\s*-\s*UPDATE:\s*([A-Z]+-\d+)\s*(.+)/i);
    if (updateMatch) {
      const taskId = updateMatch[1];
      const updateText = updateMatch[2];
      
      const update = {
        id: taskId,
        lineNumber: index + 1,
        originalLine: line
      };
      
      // 期限変更: due:YYYY-MM-DD
      const dueMatch = updateText.match(/due:\s*([0-9-]+)/i);
      if (dueMatch) {
        update.due = dueMatch[1];
      }
      
      // メモ更新: memo:テキスト
      const memoMatch = updateText.match(/memo:\s*(.+?)(?:\s+due:|$)/i);
      if (memoMatch) {
        update.memo = memoMatch[1].trim();
      }
      
      // 優先度変更: priority:high|medium|low
      const priorityMatch = updateText.match(/priority:\s*(high|medium|low)/i);
      if (priorityMatch) {
        update.priority = priorityMatch[1].toLowerCase();
      }
      
      updates.push(update);
    }
  });
  
  return updates;
}

try {
  // 日次ファイルを読み込み
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  // tasks.yml を読み込み
  const tasks = yaml.load(fs.readFileSync('tasks.yml', 'utf8'));
  
  // 新規タスクの検出と重複チェック
  const newTasks = detectNewTasks(content, tasks);
  if (newTasks.length > 0) {
    console.log('\n🔍 新規タスクの重複チェック:');
    newTasks.forEach(newTask => {
      console.log(`\n📝 検出: ${newTask.id} - ${newTask.title}`);
      const warnings = checkDuplicates(tasks, newTask);
      if (warnings.length > 0) {
        warnings.forEach(warning => console.log(`  ${warning}`));
        console.log(`  ❓ 続行しますか？ (手動確認が必要)`);
      } else {
        console.log(`  ✅ 重複なし - 追加可能`);
      }
    });
    console.log('\n⚠️ 新規タスクが検出されました。手動で確認してください。');
  }
  
  // タスク更新の検出と適用
  const taskUpdates = detectTaskUpdates(content, tasks);
  let updatedTasks = [...tasks];
  let hasUpdates = false;
  
  if (taskUpdates.length > 0) {
    console.log('\n🔧 タスク更新の検出:');
    taskUpdates.forEach(update => {
      const taskIndex = updatedTasks.findIndex(task => task.id === update.id);
      if (taskIndex !== -1) {
        console.log(`\n📝 更新: ${update.id}`);
        
        // 期限変更
        if (update.due) {
          const oldDue = updatedTasks[taskIndex].due || 'なし';
          updatedTasks[taskIndex].due = update.due;
          console.log(`  📅 期限: ${oldDue} → ${update.due}`);
          hasUpdates = true;
        }
        
        // メモ更新
        if (update.memo) {
          const oldMemo = updatedTasks[taskIndex].memo || 'なし';
          updatedTasks[taskIndex].memo = update.memo;
          console.log(`  📝 メモ: ${oldMemo} → ${update.memo}`);
          hasUpdates = true;
        }
        
        // 優先度変更
        if (update.priority) {
          const oldPriority = updatedTasks[taskIndex].priority || 'なし';
          updatedTasks[taskIndex].priority = update.priority;
          console.log(`  🎯 優先度: ${oldPriority} → ${update.priority}`);
          hasUpdates = true;
        }
      } else {
        console.log(`⚠️ タスクが見つかりません: ${update.id}`);
      }
    });
  }
  
  // チェックボックスの状態を解析
  const doneIds = [];
  const workingIds = [];
  const openIds = [];
  
  lines.forEach(line => {
    // チェック済み: - [x] TASK-xxx
    const doneMatch = line.match(/^\s*-\s\[x\]\s+(LEGAL-\d+|ACCOUNTING-\d+|ENVIRONMENT-\d+|REVENUE-\d+|INSURANCE-\d+|BRANDING-\d+|OPERATION-\d+|CONTRACT-\d+|MARKETING-\d+|RISK-\d+)/);
    if (doneMatch) {
      doneIds.push(doneMatch[1]);
      return;
    }
    
    // 作業中（カスタムマーク）: - [~] TASK-xxx または 🔄マーク付き
    const workingMatch = line.match(/^\s*-\s\[~\]\s+(LEGAL-\d+|ACCOUNTING-\d+|ENVIRONMENT-\d+|REVENUE-\d+|INSURANCE-\d+|BRANDING-\d+|OPERATION-\d+|CONTRACT-\d+|MARKETING-\d+|RISK-\d+)/) ||
                        line.match(/^\s*-\s\[\s\]\s+(LEGAL-\d+|ACCOUNTING-\d+|ENVIRONMENT-\d+|REVENUE-\d+|INSURANCE-\d+|BRANDING-\d+|OPERATION-\d+|CONTRACT-\d+|MARKETING-\d+|RISK-\d+).*🔄/);
    if (workingMatch) {
      workingIds.push(workingMatch[1]);
      return;
    }
    
    // 未完了: - [ ] TASK-xxx
    const openMatch = line.match(/^\s*-\s\[\s\]\s+(LEGAL-\d+|ACCOUNTING-\d+|ENVIRONMENT-\d+|REVENUE-\d+|INSURANCE-\d+|BRANDING-\d+|OPERATION-\d+|CONTRACT-\d+|MARKETING-\d+|RISK-\d+)/);
    if (openMatch && !line.includes('🔄')) {
      openIds.push(openMatch[1]);
    }
  });
  
  // tasks.yml を読み込んで更新
  let updatedCount = 0;
  
  function syncTaskStatus(tasks, dailyContent) {
    const lines = dailyContent.split('\n');
    let hasChanges = false;

    lines.forEach(line => {
      // チェックボックスがあるタスク行を検出
      const checkboxMatch = line.match(/^- \[([ x])\] (.+)/);
      if (checkboxMatch) {
        const isChecked = checkboxMatch[1] === 'x';
        const taskText = checkboxMatch[2];
        
        // タスクIDを抽出（新しいパターンに対応）
        const idMatch = taskText.match(/\(([A-Z]+-\d+)\)/);
        if (idMatch) {
          const taskId = idMatch[1];
          const taskIndex = updatedTasks.findIndex(task => task.id === taskId);
          
          if (taskIndex !== -1) {
            const currentStatus = updatedTasks[taskIndex].status;
            const newStatus = isChecked ? 'done' : 
                             (currentStatus === 'done' || currentStatus === 'completed') ? 'in_progress' : currentStatus;
            
            if (currentStatus !== newStatus) {
              console.log(`📝 ${taskId}: ${currentStatus} → ${newStatus}`);
              updatedTasks[taskIndex].status = newStatus;
              hasChanges = true;
            }
          }
        }
      }
    });

    return { hasChanges };
  }
  
  const { hasChanges } = syncTaskStatus(updatedTasks, content);
  
  // tasks.yml を上書き保存
  const yamlOptions = {
    lineWidth: 120,
    quotingType: '"',
    forceQuotes: false
  };
  
  fs.writeFileSync('tasks.yml', yaml.dump(updatedTasks, yamlOptions));
  
  // 結果レポート
  console.log(`\n📊 同期結果:`);
  console.log(`- 完了: ${doneIds.length}件`);
  console.log(`- 作業中: ${workingIds.length}件`);
  console.log(`- 未着手: ${openIds.length}件`);
  
  if (hasChanges || hasUpdates) {
    console.log(`✅ tasks.yml を更新しました`);
  } else {
    console.log(`ℹ️ 変更はありませんでした`);
  }

} catch (error) {
  console.error('エラーが発生しました:', error.message);
  process.exit(1);
} 