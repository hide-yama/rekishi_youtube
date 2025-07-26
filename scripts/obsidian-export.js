#!/usr/bin/env node

const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

// コマンドライン引数の処理
const args = process.argv.slice(2);
const outputDir = args.find(arg => arg.startsWith('--output='))?.split('=')[1] || 'obsidian-export';
const categoryFilter = args.find(arg => arg.startsWith('--category='))?.split('=')[1];
const statusFilter = args.find(arg => arg.startsWith('--status='))?.split('=')[1];

// 日付差分（日単位、時刻無視）を計算する関数を追加
function dateDiffInDays(date1, date2) {
  const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
  return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
}

try {
    // tasks.ymlを読み込み
    const tasksData = yaml.load(fs.readFileSync('tasks.yml', 'utf8'));
    
    // 出力ディレクトリを完全にクリアして再作成
    if (fs.existsSync(outputDir)) {
        fs.rmSync(outputDir, { recursive: true, force: true });
    }
    fs.mkdirSync(outputDir, { recursive: true });

    // カテゴリ別にタスクを分類
    const tasksByCategory = {};
    const statusIcons = {
        'open': '⭕',
        'in_progress': '🔄',
        'completed': '✅',
        'backlog': '📋'
    };
    
    const priorityIcons = {
        'high': '🔴',
        'medium': '🟡',
        'low': '🟢'
    };

    // フィルタリング
    let filteredTasks = tasksData;
    if (categoryFilter) {
        filteredTasks = filteredTasks.filter(task => task.category === categoryFilter);
    }
    if (statusFilter) {
        filteredTasks = filteredTasks.filter(task => task.status === statusFilter);
    }

    // カテゴリ別に分類
    filteredTasks.forEach(task => {
        const category = task.category || 'その他';
        if (!tasksByCategory[category]) {
            tasksByCategory[category] = [];
        }
        tasksByCategory[category].push(task);
    });

    // 全体サマリーファイルを作成
    let summaryContent = `# 開業準備タスク一覧\n\n`;
    summaryContent += `> 生成日時: ${new Date().toLocaleString('ja-JP')}\n\n`;
    
    // 統計情報
    const totalTasks = filteredTasks.length;
    const completedTasks = filteredTasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = filteredTasks.filter(t => t.status === 'in_progress').length;
    const openTasks = filteredTasks.filter(t => t.status === 'open').length;
    const backlogTasks = filteredTasks.filter(t => t.status === 'backlog').length;
    
    summaryContent += `## 📊 統計情報\n\n`;
    summaryContent += `- **全タスク数**: ${totalTasks}件\n`;
    summaryContent += `- **完了**: ${completedTasks}件 ✅\n`;
    summaryContent += `- **作業中**: ${inProgressTasks}件 🔄\n`;
    summaryContent += `- **未着手**: ${openTasks}件 ⭕\n`;
    summaryContent += `- **後回し**: ${backlogTasks}件 📋\n`;
    summaryContent += `- **進捗率**: ${Math.round((completedTasks / totalTasks) * 100)}%\n\n`;

    // カテゴリ別サマリー
    summaryContent += `## 📋 カテゴリ別サマリー\n\n`;
    Object.keys(tasksByCategory).sort().forEach(category => {
        const tasks = tasksByCategory[category];
        const completed = tasks.filter(t => t.status === 'completed').length;
        const total = tasks.length;
        const progress = Math.round((completed / total) * 100);
        
        summaryContent += `- **${category}**: ${completed}/${total}件 (${progress}%) [[${category}]]\n`;
    });

    summaryContent += `\n## 🔗 カテゴリ別詳細\n\n`;
    Object.keys(tasksByCategory).sort().forEach(category => {
        summaryContent += `- [[${category}]] - ${tasksByCategory[category].length}件\n`;
    });

    // 期限が近いタスク
    const today = new Date();
    const upcomingTasks = filteredTasks
        .filter(task => task.due && task.status !== 'completed')
        .map(task => ({
            ...task,
            dueDate: new Date(task.due),
            daysUntilDue: dateDiffInDays(today, new Date(task.due))
        }))
        .sort((a, b) => a.dueDate - b.dueDate)
        .slice(0, 10);

    if (upcomingTasks.length > 0) {
        summaryContent += `\n## ⏰ 期限が近いタスク（上位10件）\n\n`;
        upcomingTasks.forEach(task => {
            const daysText = task.daysUntilDue < 0 ? `${Math.abs(task.daysUntilDue)}日経過` : 
                           task.daysUntilDue === 0 ? '今日' : `${task.daysUntilDue}日後`;
            const urgencyIcon = task.daysUntilDue < 0 ? '⚠️' : task.daysUntilDue <= 3 ? '🚨' : '📅';
            
            summaryContent += `- ${urgencyIcon} **${task.id}**: ${task.title}\n`;
            summaryContent += `  - 期限: ${task.due} (${daysText})\n`;
            summaryContent += `  - 優先度: ${priorityIcons[task.priority] || '⚪'} ${task.priority}\n`;
            summaryContent += `  - カテゴリ: [[${task.category}]]\n\n`;
        });
    }

    // サマリーファイルを保存
    fs.writeFileSync(path.join(outputDir, '00_タスクサマリー.md'), summaryContent);

    // カテゴリ別ファイルを作成
    Object.keys(tasksByCategory).sort().forEach(category => {
        const tasks = tasksByCategory[category];
        let content = `# ${category}\n\n`;
        content += `> 生成日時: ${new Date().toLocaleString('ja-JP')}\n\n`;
        
        // カテゴリ統計
        const categoryCompleted = tasks.filter(t => t.status === 'completed').length;
        const categoryTotal = tasks.length;
        const categoryProgress = Math.round((categoryCompleted / categoryTotal) * 100);
        
        content += `## 📊 進捗状況\n\n`;
        content += `- **進捗**: ${categoryCompleted}/${categoryTotal}件 (${categoryProgress}%)\n`;
        content += `- **完了**: ${tasks.filter(t => t.status === 'completed').length}件\n`;
        content += `- **作業中**: ${tasks.filter(t => t.status === 'in_progress').length}件\n`;
        content += `- **未着手**: ${tasks.filter(t => t.status === 'open').length}件\n`;
        content += `- **後回し**: ${tasks.filter(t => t.status === 'backlog').length}件\n\n`;

        // タスク一覧
        content += `## 📋 タスク一覧\n\n`;
        
        // ステータス別に並び替え（作業中 → 未着手 → 後回し → 完了）
        const statusOrder = ['in_progress', 'open', 'backlog', 'completed'];
        const sortedTasks = tasks.sort((a, b) => {
            const statusA = statusOrder.indexOf(a.status);
            const statusB = statusOrder.indexOf(b.status);
            if (statusA !== statusB) return statusA - statusB;
            
            // 同じステータス内では優先度順
            const priorityOrder = ['high', 'medium', 'low'];
            const priorityA = priorityOrder.indexOf(a.priority);
            const priorityB = priorityOrder.indexOf(b.priority);
            return priorityA - priorityB;
        });

        sortedTasks.forEach(task => {
            const statusIcon = statusIcons[task.status] || '⚪';
            const priorityIcon = priorityIcons[task.priority] || '⚪';
            
            content += `### ${statusIcon} ${task.id}: ${task.title}\n\n`;
            content += `- **ステータス**: ${statusIcon} ${task.status}\n`;
            content += `- **優先度**: ${priorityIcon} ${task.priority}\n`;
            
            if (task.due) {
                const dueDate = new Date(task.due);
                const today = new Date();
                const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                let dueDateText = task.due;
                
                if (task.status !== 'completed') {
                    if (daysUntilDue < 0) {
                        dueDateText += ` ⚠️ ${Math.abs(daysUntilDue)}日経過`;
                    } else if (daysUntilDue === 0) {
                        dueDateText += ` 🚨 今日`;
                    } else if (daysUntilDue <= 3) {
                        dueDateText += ` 🚨 ${daysUntilDue}日後`;
                    } else if (daysUntilDue <= 7) {
                        dueDateText += ` 📅 ${daysUntilDue}日後`;
                    }
                }
                
                content += `- **期限**: ${dueDateText}\n`;
            }
            
            if (task.source) {
                content += `- **参照**: [[${task.source}]]\n`;
            }
            
            if (task.memo) {
                content += `- **メモ**: ${task.memo}\n`;
            }
            
            content += `\n---\n\n`;
        });

        // ファイル名を安全にする
        const safeFileName = category.replace(/[\/\\:*?"<>|]/g, '_');
        fs.writeFileSync(path.join(outputDir, `${safeFileName}.md`), content);
    });

    // 期限別ビューを作成
    const tasksByDue = {};
    filteredTasks
        .filter(task => task.due && task.status !== 'completed')
        .forEach(task => {
            // 日付の処理を安全にする
            let dueDate;
            if (typeof task.due === 'string') {
                dueDate = task.due.split('T')[0]; // 日付部分のみ
            } else if (task.due instanceof Date) {
                dueDate = task.due.toISOString().split('T')[0];
            } else {
                dueDate = String(task.due).split('T')[0];
            }
            
            if (!tasksByDue[dueDate]) {
                tasksByDue[dueDate] = [];
            }
            tasksByDue[dueDate].push(task);
        });

    if (Object.keys(tasksByDue).length > 0) {
        let dueDateContent = `# 期限別タスク一覧\n\n`;
        dueDateContent += `> 生成日時: ${new Date().toLocaleString('ja-JP')}\n\n`;

        Object.keys(tasksByDue).sort().forEach(dueDate => {
            const tasks = tasksByDue[dueDate];
            const today = new Date();
            const taskDate = new Date(dueDate);
            const daysUntilDue = Math.ceil((taskDate - today) / (1000 * 60 * 60 * 24));
            
            let dateHeader = `## ${dueDate}`;
            if (daysUntilDue < 0) {
                dateHeader += ` ⚠️ ${Math.abs(daysUntilDue)}日経過`;
            } else if (daysUntilDue === 0) {
                dateHeader += ` 🚨 今日`;
            } else if (daysUntilDue <= 3) {
                dateHeader += ` 🚨 ${daysUntilDue}日後`;
            } else if (daysUntilDue <= 7) {
                dateHeader += ` 📅 ${daysUntilDue}日後`;
            }
            
            dueDateContent += `${dateHeader}\n\n`;
            
            tasks.forEach(task => {
                const statusIcon = statusIcons[task.status] || '⚪';
                const priorityIcon = priorityIcons[task.priority] || '⚪';
                
                dueDateContent += `- ${statusIcon} ${priorityIcon} **${task.id}**: ${task.title}\n`;
                dueDateContent += `  - カテゴリ: [[${task.category}]]\n`;
                if (task.memo) {
                    dueDateContent += `  - メモ: ${task.memo}\n`;
                }
                dueDateContent += `\n`;
            });
            
            dueDateContent += `\n`;
        });

        fs.writeFileSync(path.join(outputDir, '期限別タスク一覧.md'), dueDateContent);
    }

    console.log(`✅ Obsidian用ファイルを生成しました:`);
    console.log(`📁 出力ディレクトリ: ${outputDir}/`);
    console.log(`📄 生成ファイル数: ${Object.keys(tasksByCategory).length + 2}件`);
    console.log(`\n📋 生成されたファイル:`);
    console.log(`- 00_タスクサマリー.md (全体概要)`);
    Object.keys(tasksByCategory).sort().forEach(category => {
        const safeFileName = category.replace(/[\/\\:*?"<>|]/g, '_');
        console.log(`- ${safeFileName}.md (${tasksByCategory[category].length}件)`);
    });
    if (Object.keys(tasksByDue).length > 0) {
        console.log(`- 期限別タスク一覧.md (期限順)`);
    }
    
    console.log(`\n🔗 Obsidianでの使用方法:`);
    console.log(`1. Obsidianで ${outputDir}/ フォルダを開く`);
    console.log(`2. 00_タスクサマリー.md から開始`);
    console.log(`3. [[カテゴリ名]] でカテゴリ間を移動`);

} catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    process.exit(1);
} 