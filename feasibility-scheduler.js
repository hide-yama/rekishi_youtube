// 実行可能性判定・スロット型スケジューリングシステム
// 作成日: 2025-06-01

const fs = require('fs');
const yaml = require('js-yaml');

/**
 * tasks.ymlを読み込む
 */
function loadTasks() {
    try {
        const content = fs.readFileSync('tasks.yml', 'utf8');
        return yaml.load(content);
    } catch (error) {
        console.error('❌ tasks.ymlの読み込みに失敗:', error.message);
        return [];
    }
}

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
 * カレンダースロットを初期化
 */
function initializeCalendar(startDate, endDate) {
    const calendar = {};
    const current = new Date(startDate);
    
    while (current <= endDate) {
        const dateStr = formatDate(current);
        calendar[dateStr] = {
            slots: [null, null, null, null], // 4時間分のスロット
            available: 4,
            tasks: []
        };
        current.setDate(current.getDate() + 1);
    }
    
    return calendar;
}

/**
 * 総量判定を実行（期限別累積制約チェック）
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
            adjustable: !isToday && !isPast, // 今日期限と過去期限は調整困難
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

/**
 * タスクをスロットに配置
 */
function scheduleTaskInSlots(task, calendar, startDate, endDate) {
    const allocation = [];
    let remainingHours = task.estimated_hours;
    
    // 期限から逆算して配置開始日を決定
    const dueDate = parseDate(task.due);
    const daysNeeded = Math.ceil(task.estimated_hours); // 必要日数の概算
    
    let currentDate = new Date(dueDate);
    currentDate.setDate(currentDate.getDate() - daysNeeded);
    
    // 開始日より前にならないよう調整
    if (currentDate < startDate) {
        currentDate = new Date(startDate);
    }
    
    // スロットに配置
    while (remainingHours > 0 && currentDate <= endDate) {
        const dateStr = formatDate(currentDate);
        
        if (calendar[dateStr] && calendar[dateStr].available > 0) {
            // この日に配置可能な時間を計算
            const hoursToAllocate = Math.min(
                remainingHours,
                calendar[dateStr].available,
                1 // 1日最大1時間（細かく分散）
            );
            
            // スロットに配置
            allocation.push({
                date: dateStr,
                hours: hoursToAllocate
            });
            
            // カレンダー更新
            calendar[dateStr].available -= hoursToAllocate;
            calendar[dateStr].tasks.push({
                id: task.id,
                title: task.title,
                hours: hoursToAllocate
            });
            
            remainingHours -= hoursToAllocate;
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return {
        taskId: task.id,
        allocated: task.estimated_hours - remainingHours,
        remaining: remainingHours,
        allocation
    };
}

/**
 * 全タスクのスケジューリングを実行
 */
function performScheduling(tasks) {
    const today = new Date();
    
    // 期限付き未完了タスクを期限順にソート
    const activeTasks = tasks
        .filter(task => 
            task.due && 
            task.estimated_hours > 0 && 
            task.status !== 'completed'
        )
        .sort((a, b) => parseDate(a.due) - parseDate(b.due));
    
    if (activeTasks.length === 0) {
        return {
            success: true,
            message: "スケジュール対象タスクがありません",
            calendar: {},
            results: []
        };
    }
    
    // 最終期限を取得
    const latestDue = parseDate(activeTasks[activeTasks.length - 1].due);
    
    // カレンダー初期化
    const calendar = initializeCalendar(today, latestDue);
    
    // タスクを順番に配置
    const results = [];
    let unscheduledTasks = [];
    
    for (const task of activeTasks) {
        const result = scheduleTaskInSlots(task, calendar, today, latestDue);
        results.push(result);
        
        if (result.remaining > 0) {
            unscheduledTasks.push({
                ...task,
                remainingHours: result.remaining
            });
        }
    }
    
    return {
        success: unscheduledTasks.length === 0,
        calendar,
        results,
        unscheduledTasks
    };
}

/**
 * 結果を表示
 */
function displayResults(feasibilityCheck, scheduling) {
    console.log('🎯 実行可能性判定・スケジューリング結果\n');
    
    // 総量判定結果
    console.log('📊 期限別累積制約チェック結果');
    console.log(`- 対象タスク: ${feasibilityCheck.activeTasks}件`);
    console.log(`- 必要時間合計: ${feasibilityCheck.totalRequiredHours}時間`);
    
    if (feasibilityCheck.feasible) {
        console.log(`✅ 判定: 全期限で実行可能`);
        console.log(`- 最終的な余裕: ${feasibilityCheck.margin}時間`);
    } else {
        console.log(`🚨 判定: 実行不可能`);
        if (feasibilityCheck.firstFailure) {
            const failure = feasibilityCheck.firstFailure;
            console.log(`- 破綻期限: ${failure.dueDate}`);
            console.log(`- 不足時間: ${failure.shortage}時間`);
            console.log(`- 破綻時点: 累積${failure.cumulativeHours}時間 vs 可能${failure.availableHours}時間`);
        }
    }
    
    if (feasibilityCheck.latestDue) {
        console.log(`- 最終期限: ${feasibilityCheck.latestDue}\n`);
    }
    
    // 期限別詳細表示
    console.log('📅 期限別制約チェック詳細');
    console.log('期限日      | 新規 | 累積 | 可能 | 判定');
    console.log('------------|------|------|------|------');
    
    feasibilityCheck.constraints.forEach(constraint => {
        const status = constraint.feasible ? '✅' : '❌';
        const todayMark = constraint.isToday ? ' (今日)' : '';
        const pastMark = constraint.isPast ? ' (過去)' : '';
        const adjustableMark = !constraint.adjustable ? ' ※調整困難' : '';
        
        console.log(
            `${constraint.due}${todayMark}${pastMark} | ` +
            `${constraint.tasksThisDue.toString().padStart(4)}h | ` +
            `${constraint.cumulativeTasks.toString().padStart(4)}h | ` +
            `${constraint.availableHours.toString().padStart(4)}h | ` +
            `${status}${adjustableMark}`
        );
        
        if (!constraint.feasible) {
            console.log(`            └─ 不足: ${constraint.shortage}時間`);
        }
    });
    
    console.log('');
    
    // 調整提案
    if (!feasibilityCheck.feasible) {
        console.log('🔧 調整提案');
        
        const firstProblem = feasibilityCheck.constraints.find(c => !c.feasible);
        if (firstProblem) {
            console.log(`**優先調整対象: ${firstProblem.due}期限**`);
            console.log(`- 問題: ${firstProblem.shortage}時間不足`);
            console.log(`- 該当タスク ${firstProblem.taskCount}件:`);
            
            firstProblem.tasks.forEach(task => {
                console.log(`  - ${task.id}: ${task.title} (${task.hours}時間)`);
            });
            
            console.log('\n調整案:');
            if (firstProblem.adjustable) {
                console.log('1. 一部タスクの期限延期交渉');
                console.log('2. タスクの分割・前倒し実行');
                console.log('3. 1日の作業時間を増やす');
            } else {
                console.log('1. 今日期限のため即座対応が必要');
                console.log('2. 他の用事をキャンセルして集中');
                console.log('3. 可能な範囲での部分完成を目指す');
            }
        }
        console.log('');
    }
    
    // スケジューリング結果
    if (scheduling.success) {
        console.log('✅ スケジューリング: 全タスク配置完了\n');
    } else {
        console.log(`🚨 スケジューリング: ${scheduling.unscheduledTasks.length}件のタスクが配置不可\n`);
        
        console.log('⚠️ 配置不可タスク:');
        scheduling.unscheduledTasks.forEach(task => {
            console.log(`- ${task.id}: ${task.title} (残り${task.remainingHours}時間)`);
        });
        console.log('');
    }
    
    // 今後1週間のスケジュール表示
    console.log('📅 今後1週間のスケジュール');
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        const dateStr = formatDate(date);
        
        if (scheduling.calendar[dateStr]) {
            const dayData = scheduling.calendar[dateStr];
            const usedHours = 4 - dayData.available;
            
            if (usedHours > 0) {
                console.log(`${dateStr} [${usedHours}/4時間]`);
                dayData.tasks.forEach(task => {
                    console.log(`  - ${task.id}: ${task.hours}時間`);
                });
            } else {
                console.log(`${dateStr} [空き]`);
            }
        }
    }
}

/**
 * メイン実行関数
 */
function main() {
    console.log('🚀 実行可能性判定・スケジューリングシステム\n');
    
    // タスク読み込み
    const tasks = loadTasks();
    if (!tasks || tasks.length === 0) {
        console.log('❌ タスクが見つかりません');
        return;
    }
    
    // 総量判定
    const feasibilityCheck = performFeasibilityCheck(tasks);
    
    // スケジューリング
    const scheduling = performScheduling(tasks);
    
    // 結果表示
    displayResults(feasibilityCheck, scheduling);
}

// スクリプト実行
if (require.main === module) {
    main();
}

module.exports = {
    performFeasibilityCheck,
    performScheduling,
    loadTasks
}; 