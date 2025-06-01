const fs = require('fs');
const yaml = require('js-yaml');

function generateTimeline() {
    try {
        // tasks.ymlを読み込み
        const tasksData = yaml.load(fs.readFileSync('tasks.yml', 'utf8'));
        
        // 期限があるタスクのみを抽出してソート
        const tasksWithDue = tasksData
            .filter(task => task.due && task.due !== null)
            .map(task => ({
                ...task,
                dueDate: new Date(task.due)
            }))
            .sort((a, b) => a.dueDate - b.dueDate);

        // 今日の日付（時刻をリセット）
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 期限別にグループ化
        const tasksByDate = {};
        tasksWithDue.forEach(task => {
            const dateStr = task.dueDate.toISOString().split('T')[0];
            if (!tasksByDate[dateStr]) {
                tasksByDate[dateStr] = [];
            }
            tasksByDate[dateStr].push(task);
        });

        // タイムライン生成
        let timeline = `# 📅 開業準備タスク タイムライン

> 生成日時: ${new Date().toLocaleString('ja-JP')}

`;

        // 期間別にセクション分け
        const sections = [
            {
                title: '🚨 緊急対応期間',
                startDate: new Date(today),
                endDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), // 1週間後
                emoji: '🔥'
            },
            {
                title: '📋 開業準備期間',
                startDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
                endDate: new Date('2025-06-23'),
                emoji: '📅'
            },
            {
                title: '🎯 開業後整備期間',
                startDate: new Date('2025-06-23'),
                endDate: new Date('2025-07-31'),
                emoji: '🔧'
            }
        ];

        // 各セクションを生成
        sections.forEach(section => {
            const sectionTasks = Object.entries(tasksByDate)
                .filter(([dateStr]) => {
                    const date = new Date(dateStr);
                    return date >= section.startDate && date < section.endDate;
                })
                .sort(([a], [b]) => a.localeCompare(b));

            if (sectionTasks.length > 0) {
                timeline += `## ${section.title}\n\n`;

                sectionTasks.forEach(([dateStr, tasks]) => {
                    const date = new Date(dateStr);
                    // 日付差の計算を修正
                    const daysDiff = Math.round((date - today) / (1000 * 60 * 60 * 24));
                    
                    let dateLabel = formatDateLabel(dateStr, daysDiff);
                    let warningEmoji = '';
                    
                    if (tasks.length >= 5) {
                        warningEmoji = ' 🚨';
                    } else if (tasks.length >= 3) {
                        warningEmoji = ' ⚠️';
                    }

                    timeline += `### ${dateLabel}${warningEmoji}\n`;
                    
                    if (tasks.length >= 3) {
                        timeline += `**${tasks.length}件同時**\n`;
                    }

                    // 優先度順でソート
                    const sortedTasks = tasks.sort((a, b) => {
                        const priorityOrder = { high: 0, medium: 1, low: 2 };
                        return priorityOrder[a.priority] - priorityOrder[b.priority];
                    });

                    sortedTasks.forEach(task => {
                        const priorityEmoji = getPriorityEmoji(task.priority);
                        const statusEmoji = getStatusEmoji(task.status);
                        timeline += `- ${priorityEmoji} ${statusEmoji} **${task.id}**: ${task.title}\n`;
                        
                        if (task.memo) {
                            timeline += `  - 📝 ${task.memo}\n`;
                        }
                    });

                    timeline += '\n';
                });
            }
        });

        // 問題分析セクション
        timeline += generateProblemAnalysis(tasksByDate);

        // 調整提案セクション
        timeline += generateAdjustmentProposal(tasksByDate);

        // ファイルに出力
        fs.writeFileSync('timeline.md', timeline);

        console.log('✅ タイムラインを生成しました: timeline.md');
        console.log(`📊 期限付きタスク: ${tasksWithDue.length}件`);
        
        // 問題のある日をレポート
        const problematicDates = Object.entries(tasksByDate)
            .filter(([, tasks]) => tasks.length >= 3)
            .length;
        
        if (problematicDates > 0) {
            console.log(`⚠️  過密な日: ${problematicDates}日間`);
        }

        return timeline;
        
    } catch (error) {
        console.error('❌ エラー:', error.message);
    }
}

function formatDateLabel(dateStr, daysDiff) {
    const date = new Date(dateStr);
    const monthDay = `${date.getMonth() + 1}月${date.getDate()}日`;
    
    if (daysDiff === 0) {
        return `${monthDay}（今日）`;
    } else if (daysDiff === 1) {
        return `${monthDay}（明日）`;
    } else if (daysDiff > 0) {
        return `${monthDay}（${daysDiff}日後）`;
    } else {
        return `${monthDay}（${Math.abs(daysDiff)}日前）`;
    }
}

function getPriorityEmoji(priority) {
    switch (priority) {
        case 'high': return '🔴';
        case 'medium': return '🟡';
        case 'low': return '🟢';
        default: return '⚪';
    }
}

function getStatusEmoji(status) {
    switch (status) {
        case 'completed': return '✅';
        case 'in_progress': return '🔄';
        case 'open': return '⭕';
        case 'on_hold': return '📋';
        default: return '⭕';
    }
}

function generateProblemAnalysis(tasksByDate) {
    let analysis = `---

## 🚨 問題分析

### 📊 期限別タスク密度
`;

    const sortedDates = Object.entries(tasksByDate)
        .sort(([a], [b]) => a.localeCompare(b));

    sortedDates.forEach(([dateStr, tasks]) => {
        const count = tasks.length;
        // 見積もり時間の合計を計算
        const totalHours = tasks.reduce((sum, task) => {
            return sum + (task.estimated_hours || 0);
        }, 0);
        
        let emoji = '📅';
        let status = '';
        let hourStatus = '';
        
        // タスク数による評価
        if (count >= 5) {
            emoji = '🚨';
            status = ' - **明らかに過密、要調整**';
        } else if (count >= 3) {
            emoji = '⚠️';
            status = ' - やや過密、注意が必要';
        }
        
        // 見積もり時間による評価（1日1時間制約）
        if (totalHours > 4) {
            hourStatus = ` | ⚠️ 時間超過: ${totalHours}時間（推奨4時間以内）`;
        } else if (totalHours > 0) {
            hourStatus = ` | ✅ 時間: ${totalHours}時間`;
        }

        analysis += `- ${emoji} **${dateStr}**: ${count}件${hourStatus}${status}\n`;
    });

    // 時間ベース負荷分析を追加
    analysis += `\n### ⏰ 時間ベース負荷分析\n`;
    
    const heavyWorkloadDates = sortedDates.filter(([dateStr, tasks]) => {
        const totalHours = tasks.reduce((sum, task) => sum + (task.estimated_hours || 0), 0);
        return totalHours > 4;
    });
    
    if (heavyWorkloadDates.length > 0) {
        analysis += `\n**🚨 重負荷日（4時間超過）: ${heavyWorkloadDates.length}日間**\n\n`;
        heavyWorkloadDates.forEach(([dateStr, tasks]) => {
            const totalHours = tasks.reduce((sum, task) => sum + (task.estimated_hours || 0), 0);
            const exceededHours = totalHours - 4;
            analysis += `- **${dateStr}**: ${totalHours}時間（${exceededHours}時間超過）\n`;
            
            // 見積もり時間があるタスクのみ表示
            const tasksWithHours = tasks.filter(task => task.estimated_hours);
            if (tasksWithHours.length > 0) {
                tasksWithHours.forEach(task => {
                    analysis += `  - ${task.id}: ${task.estimated_hours}時間\n`;
                });
            }
        });
    } else {
        analysis += `\n✅ **時間ベースでの問題なし**（全日程4時間以内）\n`;
    }

    // 最も問題のある日を特定
    const mostProblematic = sortedDates
        .filter(([, tasks]) => tasks.length >= 5)
        .sort(([, a], [, b]) => b.length - a.length);

    if (mostProblematic.length > 0) {
        const [worstDate, worstTasks] = mostProblematic[0];
        analysis += `\n### 🚨 最重要問題\n`;
        analysis += `**${worstDate}に${worstTasks.length}件集中** - 緊急調整が必要\n\n`;
        
        analysis += `#### 該当タスク\n`;
        worstTasks.forEach(task => {
            const priorityEmoji = getPriorityEmoji(task.priority);
            analysis += `- ${priorityEmoji} ${task.id}: ${task.title}\n`;
        });
    }

    return analysis + '\n';
}

function generateAdjustmentProposal(tasksByDate) {
    let proposal = `## 🎯 調整提案

### 基本方針
- **1日最大3件**を目標とする
- **高優先度タスク**を優先的に分散
- **依存関係**を考慮した順序調整
- **開業日（6月23日）**前後での適切な配置

### 推奨調整
`;

    // 最も過密な日を特定
    const problematicDates = Object.entries(tasksByDate)
        .filter(([, tasks]) => tasks.length >= 5)
        .sort(([, a], [, b]) => b.length - a.length);

    if (problematicDates.length > 0) {
        const [worstDate, worstTasks] = problematicDates[0];
        
        proposal += `#### ${worstDate}の${worstTasks.length}件を分散\n\n`;
        
        // 高優先度タスクを先に処理
        const highPriorityTasks = worstTasks.filter(t => t.priority === 'high');
        const mediumPriorityTasks = worstTasks.filter(t => t.priority === 'medium');
        const lowPriorityTasks = worstTasks.filter(t => t.priority === 'low');

        // 分散提案
        const redistributionPlan = [
            { date: '6月10日', tasks: highPriorityTasks.slice(0, 1) },
            { date: '6月15日', tasks: highPriorityTasks.slice(1, 2) },
            { date: '6月20日', tasks: highPriorityTasks.slice(2, 4) },
            { date: '6月22日', tasks: highPriorityTasks.slice(4, 7) },
            { date: '7月5日', tasks: [...mediumPriorityTasks.slice(0, 3), ...lowPriorityTasks] }
        ];

        redistributionPlan.forEach(plan => {
            if (plan.tasks.length > 0) {
                proposal += `**${plan.date}**\n`;
                plan.tasks.forEach(task => {
                    const priorityEmoji = getPriorityEmoji(task.priority);
                    proposal += `- ${priorityEmoji} ${task.id}: ${task.title}\n`;
                });
                proposal += '\n';
            }
        });
    }

    return proposal;
}

// スクリプト実行
if (require.main === module) {
    generateTimeline();
}

module.exports = { generateTimeline }; 