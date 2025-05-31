#!/usr/bin/env node
// sync.js - チェックボックス記法ベースのタスク同期コマンド
const fs = require('fs');
const yaml = require('js-yaml');
const argv = require('minimist')(process.argv.slice(2));

if (!argv.file) {
  console.error('使用方法: node sync.js --file daily/YYYY-MM-DD.md');
  process.exit(1);
}

const filePath = argv.file;
if (!fs.existsSync(filePath)) {
  console.error(`ファイルが見つかりません: ${filePath}`);
  process.exit(1);
}

// チェックボックス行からタスク情報を抽出
function parseDailyTasks(content) {
  const lines = content.split('\n');
  const tasks = [];
  let currentTask = null;
  lines.forEach(line => {
    // チェックボックス行: - [ ] INSURANCE-001 タイトル ...
    const cbMatch = line.match(/^\s*-\s*\[( |x|~)\]\s+([A-Z]+-\d+)\s+(.+)/);
    if (cbMatch) {
      if (currentTask) tasks.push(currentTask);
      currentTask = {
        id: cbMatch[2],
        title: cbMatch[3].trim(),
        status: cbMatch[1] === 'x' ? 'completed' : cbMatch[1] === '~' ? 'in_progress' : 'open',
        attrs: {}
      };
      return;
    }
    // 属性行:   - 期限: ...  - メモ: ...  - カテゴリ: ...
    if (currentTask && line.match(/^\s*-\s*(期限|due):/)) {
      const due = line.replace(/^\s*-\s*(期限|due):\s*/, '').trim();
      currentTask.attrs.due = due;
      return;
    }
    if (currentTask && line.match(/^\s*-\s*(メモ|memo):/)) {
      const memo = line.replace(/^\s*-\s*(メモ|memo):\s*/, '').trim();
      currentTask.attrs.memo = memo;
      return;
    }
    if (currentTask && line.match(/^\s*-\s*(カテゴリ|category):/)) {
      const category = line.replace(/^\s*-\s*(カテゴリ|category):\s*/, '').trim();
      currentTask.attrs.category = category;
      return;
    }
    if (currentTask && line.match(/^\s*-\s*優先度:|priority:/)) {
      const priority = line.replace(/^\s*-\s*(優先度:|priority:)\s*/, '').trim();
      currentTask.attrs.priority = priority;
      return;
    }
    if (currentTask && line.match(/^\s*-\s*(参照|source):/)) {
      const source = line.replace(/^\s*-\s*(参照|source):\s*/, '').trim();
      currentTask.attrs.source = source;
      return;
    }
    // 空行や他の行は無視
  });
  if (currentTask) tasks.push(currentTask);
  return tasks;
}

try {
  // 日次ファイル・tasks.yml読み込み
  const content = fs.readFileSync(filePath, 'utf8');
  const dailyTasks = parseDailyTasks(content);
  let tasks = yaml.load(fs.readFileSync('tasks.yml', 'utf8'));
  let updatedTasks = [...tasks];
  let hasChanges = false;

  // daily/にあるタスクID一覧
  const dailyIds = dailyTasks.map(t => t.id);
  // tasks.ymlにあるタスクID一覧
  const ymlIds = tasks.map(t => t.id);

  // 1. 新規タスク追加（重複チェック強化）
  dailyTasks.forEach(dt => {
    // 厳密な重複チェック
    const existingTask = updatedTasks.find(t => t.id === dt.id);
    
    if (!existingTask) {
      // 新規追加
      const newTask = {
        id: dt.id,
        title: dt.title,
        status: dt.status,
        category: dt.attrs.category || 'other',
        priority: dt.attrs.priority || 'medium',
        ...(dt.attrs.due && { due: dt.attrs.due }),
        ...(dt.attrs.memo && { memo: dt.attrs.memo }),
        ...(dt.attrs.source && { source: dt.attrs.source })
      };
      updatedTasks.push(newTask);
      hasChanges = true;
      console.log(`➕ 新規タスク追加: ${dt.id} - ${dt.title}`);
    } else {
      // 既存タスクが見つかった場合のログ
      console.log(`🔍 既存タスク検出: ${dt.id} - 新規追加をスキップ`);
    }
  });

  // 2. 進捗・完了・属性の同期
  dailyTasks.forEach(dt => {
    const idx = updatedTasks.findIndex(t => t.id === dt.id);
    if (idx !== -1) {
      let changed = false;
      // ステータス同期
      if (updatedTasks[idx].status !== dt.status) {
        console.log(`📝 ${dt.id}: status ${updatedTasks[idx].status} → ${dt.status}`);
        updatedTasks[idx].status = dt.status;
        changed = true;
      }
      // 属性同期
      ['due','memo','category','priority','source'].forEach(attr => {
        if (dt.attrs[attr] && updatedTasks[idx][attr] !== dt.attrs[attr]) {
          console.log(`📝 ${dt.id}: ${attr} ${updatedTasks[idx][attr]||'未設定'} → ${dt.attrs[attr]}`);
          updatedTasks[idx][attr] = dt.attrs[attr];
          changed = true;
        }
      });
      if (changed) hasChanges = true;
    }
  });

  // 3. tasks.ymlにあるがdaily/に出てこないタスクは放置

  // 4. 保存
  if (hasChanges) {
    const yamlOptions = { lineWidth: 120, quotingType: '"', forceQuotes: false };
    fs.writeFileSync('tasks.yml', yaml.dump(updatedTasks, yamlOptions));
    console.log('✅ tasks.yml を更新しました');
  } else {
    console.log('ℹ️ 変更はありませんでした');
  }

} catch (error) {
  console.error('エラーが発生しました:', error.message);
  process.exit(1);
} 