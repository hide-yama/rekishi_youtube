const fs = require('fs');
const yaml = require('js-yaml');

/**
 * 日付文字列をDateオブジェクトに変換
 */
function parseDate(dateStr) {
    return new Date(dateStr + 'T00:00:00');
}

/**
 * 日付をYYYY-MM-DD形式にフォーマット
 */
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

/**
 * 2つの日付間の日数を計算
 */
function getDaysBetween(startDate, endDate) {
    const timeDiff = endDate.getTime() - startDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

/**
 * 期限別累積制約チェックを実行
 */
function performFeasibilityCheck(tasks) {
    const today = new Date();
    const todayStr = formatDate(today);
    
    // 期限付きタスクのみ抽出（未完了）
    const activeTasks = tasks.filter(task => 
        task.due && 
        task.estimated_hours > 0 && 
        task.status !== 'completed'
    );
    
    if (activeTasks.length === 0) {
        return {
            feasible: true,
            message: "期限付きタスクがありません",
            totalRequiredHours: 0,
            availableHours: 0,
            margin: 0,
            constraints: []
        };
    }
    
    // 期限日でタスクをグループ化
    const tasksByDueDate = {};
    activeTasks.forEach(task => {
        if (!tasksByDueDate[task.due]) {
            tasksByDueDate[task.due] = [];
        }
        tasksByDueDate[task.due].push(task);
    });
    
    // 期限順にソート
    const sortedDueDates = Object.keys(tasksByDueDate).sort();
    
    // 期限別累積制約チェック
    const constraints = [];
    let cumulativeHours = 0;
    let firstFailure = null;
    let overallFeasible = true;
    
    for (const dueDate of sortedDueDates) {
        const tasksForThisDue = tasksByDueDate[dueDate];
        const hoursForThisDue = tasksForThisDue.reduce((sum, task) => 
            sum + task.estimated_hours, 0
        );
        
        cumulativeHours += hoursForThisDue;
        
        // 今日からその期限までの利用可能日数・時間
        const dueDateObj = parseDate(dueDate);
        const daysFromToday = getDaysBetween(today, dueDateObj);
        
        // 期限が過去または今日の場合の処理
        let availableDays, availableHours;
        if (dueDate < todayStr) {
            // 過去の期限：既に破綻
            availableDays = 0;
            availableHours = 0;
        } else if (dueDate === todayStr) {
            // 今日期限：残り時間なし
            availableDays = 0;
            availableHours = 0;
        } else {
            // 未来の期限：正常計算
            availableDays = Math.max(0, daysFromToday);
            availableHours = availableDays * 4; // 1日4時間
        }
        
        // この期限での実行可能性
        const feasible = cumulativeHours <= availableHours;
        const shortage = feasible ? 0 : cumulativeHours - availableHours;
        
        // 最初の破綻を記録
        if (!feasible && !firstFailure) {
            firstFailure = {
                dueDate,
                shortage,
                cumulativeHours,
                availableHours
            };
            overallFeasible = false;
        }
        
        // 期限の分類
        const isToday = dueDate === todayStr;
        const isPast = dueDate < todayStr;
        
        constraints.push({
            due: dueDate,
            tasksThisDue: hoursForThisDue,
            taskCount: tasksForThisDue.length,
            cumulativeTasks: cumulativeHours,
            availableDays,
            availableHours,
            feasible,
            shortage,
            isToday,
            isPast,
            adjustable: !isToday && !isPast,
            tasks: tasksForThisDue.map(t => ({ id: t.id, title: t.title, hours: t.estimated_hours }))
        });
    }
    
    // 全体統計を計算
    const totalRequiredHours = cumulativeHours;
    const finalConstraint = constraints[constraints.length - 1];
    const totalAvailableHours = finalConstraint ? finalConstraint.availableHours : 0;
    
    return {
        feasible: overallFeasible,
        totalRequiredHours,
        availableHours: totalAvailableHours,
        margin: overallFeasible ? totalAvailableHours - totalRequiredHours : -(firstFailure?.shortage || 0),
        activeTasks: activeTasks.length,
        constraints,
        firstFailure,
        latestDue: sortedDueDates[sortedDueDates.length - 1] || null
    };
}

function generateTimeline() {
    try {
        console.log('📊 **期限別実行可能性判定を実行中...**\n');
        
        // tasks.ymlを読み込み
        const yamlData = fs.readFileSync('tasks.yml', 'utf8');
        const tasksData = yaml.load(yamlData);
        
        if (!tasksData || !Array.isArray(tasksData)) {
            console.log('❌ タスクデータが見つかりません');
            return;
        }
        
        // 実行可能性判定を実行
        const result = performFeasibilityCheck(tasksData);
        
        // 結果のヘッダー表示
        console.log('='.repeat(60));
        console.log('📅 **期限別実行可能性判定結果**');
        console.log('='.repeat(60));
        
        // 総合判定表示
        if (result.feasible) {
            console.log(`✅ **総合判定: 実行可能**`);
            console.log(`📊 必要時間: ${result.totalRequiredHours}時間 / 利用可能: ${result.availableHours}時間`);
            console.log(`📈 余裕: ${result.margin}時間\n`);
        } else {
            console.log(`❌ **総合判定: 実行不可能**`);
            if (result.firstFailure) {
                console.log(`🚨 **最初の破綻**: ${result.firstFailure.dueDate}期限で${result.firstFailure.shortage}時間不足`);
                console.log(`📊 累積必要: ${result.firstFailure.cumulativeHours}時間 / 利用可能: ${result.firstFailure.availableHours}時間\n`);
            }
        }
        
        // 期限別詳細表示
        console.log('📋 **期限別詳細分析**');
        console.log('-'.repeat(60));
        
        if (result.constraints.length === 0) {
            console.log('📝 ' + result.message);
            return;
        }
        
        result.constraints.forEach((constraint, index) => {
            const statusIcon = constraint.feasible ? '✅' : '❌';
            const typeIcon = constraint.isPast ? '⏰' : constraint.isToday ? '🔥' : '📅';
            
            let header = `${statusIcon} ${typeIcon} **${constraint.due}期限**`;
            if (constraint.isPast) header += ' (過去期限)';
            if (constraint.isToday) header += ' (今日期限)';
            
            console.log(header);
            console.log(`   🎯 この期限: ${constraint.tasksThisDue}時間 (${constraint.taskCount}件)`);
            console.log(`   📊 累積必要: ${constraint.cumulativeTasks}時間`);
            console.log(`   ⏳ 利用可能: ${constraint.availableHours}時間 (${constraint.availableDays}日間)`);
            
            if (!constraint.feasible) {
                console.log(`   🚨 **不足**: ${constraint.shortage}時間`);
                if (constraint.adjustable) {
                    console.log(`   💡 **調整可能**: 期限変更で解決可能`);
                } else {
                    console.log(`   ⚠️  **緊急**: 即座の対応が必要`);
                }
            }
            
            // タスク詳細（不足している場合のみ）
            if (!constraint.feasible) {
                console.log(`   📝 含まれるタスク:`);
                constraint.tasks.forEach(task => {
                    console.log(`      - ${task.id}: ${task.title} (${task.hours}時間)`);
                });
            }
            
            console.log('');
        });
        
        // 調整提案
        if (!result.feasible) {
            console.log('💡 **調整提案**');
            console.log('-'.repeat(60));
            
            const adjustableConstraints = result.constraints.filter(c => !c.feasible && c.adjustable);
            if (adjustableConstraints.length > 0) {
                console.log('🔧 **期限変更による解決案:**');
                adjustableConstraints.forEach(constraint => {
                    const suggestedDays = Math.ceil(constraint.shortage / 4);
                    const currentDate = new Date(constraint.due + 'T00:00:00');
                    const newDate = new Date(currentDate.getTime() + suggestedDays * 24 * 60 * 60 * 1000);
                    const newDateStr = formatDate(newDate);
                    
                    console.log(`   • ${constraint.due} → ${newDateStr} (+${suggestedDays}日延期)`);
                    console.log(`     理由: ${constraint.shortage}時間不足 → ${suggestedDays}日追加で解決`);
                });
            }
            
            const urgentConstraints = result.constraints.filter(c => !c.feasible && !c.adjustable);
            if (urgentConstraints.length > 0) {
                console.log('\n🚨 **緊急対応が必要:**');
                urgentConstraints.forEach(constraint => {
                    if (constraint.isPast) {
                        console.log(`   • ${constraint.due}: 既に期限超過 (${constraint.shortage}時間分)`);
                        console.log(`     → 期限の再交渉が必要`);
                    } else if (constraint.isToday) {
                        console.log(`   • 今日期限: ${constraint.shortage}時間の作業が未完了`);
                        console.log(`     → 他業務の調整または期限延期交渉が必要`);
                    }
                });
            }
        }
        
        // 出力ファイル生成
        const outputContent = generateTimelineExportFile(result);
        fs.writeFileSync('timeline-export.md', outputContent);
        console.log('📄 timeline-export.md が生成されました');
        
    } catch (error) {
        console.error('❌ エラーが発生しました:', error.message);
    }
}

function generateTimelineExportFile(result) {
    const now = new Date();
    let content = `# 期限別実行可能性判定結果\n\n`;
    content += `生成日時: ${now.toISOString().replace('T', ' ').slice(0, 19)}\n\n`;
    
    // 総合判定
    content += `## 総合判定\n\n`;
    if (result.feasible) {
        content += `✅ **実行可能** - すべての期限で制約を満たしています\n\n`;
        content += `- 必要時間: ${result.totalRequiredHours}時間\n`;
        content += `- 利用可能: ${result.availableHours}時間\n`;
        content += `- 余裕: ${result.margin}時間\n\n`;
    } else {
        content += `❌ **実行不可能** - 期限制約を満たせません\n\n`;
        if (result.firstFailure) {
            content += `🚨 最初の破綻: ${result.firstFailure.dueDate}期限で${result.firstFailure.shortage}時間不足\n\n`;
        }
    }
    
    // 期限別詳細
    content += `## 期限別詳細\n\n`;
    result.constraints.forEach(constraint => {
        const status = constraint.feasible ? '✅' : '❌';
        const type = constraint.isPast ? '⏰ 過去期限' : constraint.isToday ? '🔥 今日期限' : '📅 未来期限';
        
        content += `### ${status} ${constraint.due} ${type}\n\n`;
        content += `- この期限のタスク: ${constraint.tasksThisDue}時間 (${constraint.taskCount}件)\n`;
        content += `- 累積必要時間: ${constraint.cumulativeTasks}時間\n`;
        content += `- 利用可能時間: ${constraint.availableHours}時間 (${constraint.availableDays}日間)\n`;
        
        if (!constraint.feasible) {
            content += `- **不足**: ${constraint.shortage}時間\n`;
        }
        
        content += `\n`;
    });
    
    return content;
}

// 実行
if (require.main === module) {
    generateTimeline();
}

module.exports = { generateTimeline, performFeasibilityCheck }; 