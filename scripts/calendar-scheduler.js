const fs = require('fs');
const yaml = require('js-yaml');
const scheduleCalculator = require('./schedule-calculator');

/**
 * カレンダー式タスクスケジューラー
 * 期限から逆算して1日1時間ずつタスクを配置
 * fixed: trueのタスクは必ずdue日に全時間を割り当て
 */

// tasks.ymlからタスクを抽出
function loadTasksFromYaml(path = 'tasks.yml') {
    const file = fs.readFileSync(path, 'utf8');
    const allTasks = yaml.load(file);
    // 未完了タスクのみ抽出（status: open, in_progress）
    return allTasks.filter(task =>
        (task.status === 'open' || task.status === 'in_progress') &&
        task.due && task.estimated_hours > 0
    ).map(task => ({
        id: task.id,
        title: task.title,
        due: typeof task.due === 'string' ? task.due.replace(/"/g, '') : task.due,
        estimated_hours: task.estimated_hours,
        fixed: !!task.fixed,
        status: task.status
    }));
}


/**
 * 日付関連のユーティリティ
 */
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function subtractDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() - days);
    return result;
}

/**
 * カレンダースケジュール生成
 */
function generateCalendarSchedule(tasks, startDate = new Date(), monthsToShow = 2) {
    const config = scheduleCalculator.loadConfig();
    const schedule = new Map(); // 日付 -> タスク配列
    const today = formatDate(new Date());
    
    // 期限順でソート
    const sortedTasks = [...tasks].sort((a, b) => new Date(a.due) - new Date(b.due));
    
    console.log('📊 タスク処理開始...');
    
    // 各タスクを逆算配置
    sortedTasks.forEach(task => {
        console.log(`\n🔄 処理中: ${task.id} (期限: ${task.due}, ${task.estimated_hours}時間)`);
        
        const dueDate = new Date(task.due);
        const bufferDate = subtractDays(dueDate, 1); // 1日バッファ
        
        let hoursToPlace = task.estimated_hours;
        let currentDate = bufferDate;
        
        // 1時間ずつ逆算して配置
        while (hoursToPlace > 0) {
            const dateStr = formatDate(currentDate);
            
            // その日のタスク数を確認
            if (!schedule.has(dateStr)) {
                schedule.set(dateStr, []);
            }
            
            const dayTasks = schedule.get(dateStr);
            
            // 1日上限取得
            const dayHourLimit = config.alert_thresholds?.heavy_workload_hours || 4;
            // 1タスク1日上限取得
            const taskHourLimit = config.daily_work_hours || 1;
            // その日の合計（fixed含む）
            let total = dayTasks.reduce((sum, t) => sum + (t.hours || taskHourLimit), 0);

            // デバッグ: 割当前のその日のタスク状況
            console.log(`  [DEBUG] ${dateStr} 割当前: タスク数=${dayTasks.length}, 合計時間=${total}, タスクID=[${dayTasks.map(t => t.id).join(', ')}]`);

            if (total < dayHourLimit) {
                const assign = Math.min(taskHourLimit, dayHourLimit - total, hoursToPlace);
                if (assign > 0) {
                    // 重複割当防止: 既に同じタスクIDがその日に存在しない場合のみ追加
                    if (!dayTasks.some(t => t.id === task.id)) {
                        dayTasks.push({ ...task, hours: assign });
                        hoursToPlace -= assign;
                        // デバッグ: 割当直後のその日のタスク状況
                        let afterTotal = dayTasks.reduce((sum, t) => sum + (t.hours || taskHourLimit), 0);
                        console.log(`    [DEBUG] ${dateStr} ← ${task.id} を${assign}時間割当（残り${hoursToPlace}時間） 割当後: タスク数=${dayTasks.length}, 合計時間=${afterTotal}, タスクID=[${dayTasks.map(t => t.id).join(', ')}]`);
                    } else {
                        // デバッグ: 重複割当をスキップ
                        console.log(`    [DEBUG] ${dateStr} ← ${task.id} は既に割当済みのためスキップ`);
                        // 進めるだけ
                        hoursToPlace -= assign;
                    }
                }
            } else {
                console.log(`  ⚠️ ${dateStr} は満杯 (${total}/${dayHourLimit}), 前日へ`);
            }
            
            // 前日へ移動
            currentDate = subtractDays(currentDate, 1);
        }
    });
    
    return { schedule, today };
}

/**
 * カレンダー表示用のMarkdown生成
 */
function generateCalendarMarkdown(schedule, today, allTasksRaw) {
    let output = "# カレンダー式タスクスケジュール\n\n";
    output += `生成日時: ${new Date().toLocaleString('ja-JP')}\n`;
    output += `📍 **今日**: ${today}\n\n`;
    let sortedDates;
    if (typeof schedule.keys === 'function') {
        sortedDates = Array.from(schedule.keys()).sort();
    } else {
        sortedDates = Object.keys(schedule).sort();
    }
    // status情報付きの全タスクリスト
    const allTasks = allTasksRaw || [];
    // 冒頭に現時点（今日）での繰越タスクをまとめて表示
    const carryOverTasks = allTasks.filter(t => {
        // 割り当て日（最初に割り当てられた日） < today かつ statusがopen/in_progress
        let firstAssigned = null;
        for (const d of sortedDates) {
            if (d >= today) break;
            const dayTasks = typeof schedule.get === 'function' ? schedule.get(d) : schedule[d];
            if (dayTasks.some(dt => dt.id === t.id)) {
                firstAssigned = d;
                break;
            }
        }
        return firstAssigned && firstAssigned < today && (t.status === 'open' || t.status === 'in_progress');
    });
    output += `### 繰越タスク\n`;
    if (carryOverTasks.length === 0) {
        output += `（繰越なし）\n`;
    } else {
        carryOverTasks.forEach(task => {
            output += `- ${task.id} ${task.title} (期限: ${task.due})\n`;
        });
    }
    output += `\n`;
    // 今日以降の日付のみ出力
    sortedDates.filter(date => date >= today).forEach(date => {
        const tasks = typeof schedule.get === 'function' ? schedule.get(date) : schedule[date];
        const isToday = date === today;
        const isPast = new Date(date) < new Date(today);
        output += `## ${date}`;
        if (isToday) {
            output += " 📍 **今日**";
        }
        output += `\n`;
        // タスクリスト
        const totalHours = tasks.reduce((sum, t) => sum + (t.hours || 1), 0);
        output += `**負荷**: ${totalHours}/4時間\n\n`;
        if (tasks.length === 0) {
            output += `（割り当てなし）\n`;
        } else {
            tasks.forEach(task => {
                output += `- ${task.id} ${task.title} (期限: ${task.due})`;
                if (task.hours && task.hours > 1) output += ` [${task.hours}時間]`;
                output += `\n`;
            });
        }
        output += "\n";
    });
    return output;
}

function scheduleTasks(tasks, startDate, endDate) {
    const config = scheduleCalculator.loadConfig();
    const calendar = {};
    // まずfixed: trueのタスクをdue日に全時間割り当て
    tasks.forEach(task => {
        if (task.fixed) {
            if (!calendar[task.due]) calendar[task.due] = [];
            calendar[task.due].push({ ...task, hours: task.estimated_hours });
        }
    });
    // fixed以外のタスクを逆算で割り当て
    const normalTasks = tasks.filter(t => !t.fixed);
    normalTasks.forEach(task => {
        let hoursLeft = task.estimated_hours;
        let day = new Date(task.due);
        const dayHourLimit = config.alert_thresholds?.heavy_workload_hours || 4;
        const taskHourLimit = config.daily_work_hours || 1;
        while (hoursLeft > 0) {
            const dateStr = day.toISOString().split('T')[0];
            let total = (calendar[dateStr] || []).reduce((sum, t) => sum + (t.hours || taskHourLimit), 0);
            if (total < dayHourLimit) {
                const assign = Math.min(taskHourLimit, dayHourLimit - total, hoursLeft);
                if (assign > 0) {
                    if (!calendar[dateStr]) calendar[dateStr] = [];
                    calendar[dateStr].push({ ...task, hours: assign });
                    hoursLeft -= assign;
                }
            }
            day.setDate(day.getDate() - 1);
        }
    });
    return calendar;
}

// 今日やるべきタスクを抽出する関数
function getTodayTasks(tasks, calendar, today) {
    // 今日に割り当てられているタスクID
    const assigned = (calendar[today] || []).map(t => t.id);
    // 期限が今日の未完了タスクID
    const dueToday = tasks.filter(t => t.due === today && (t.status === 'open' || t.status === 'in_progress')).map(t => t.id);
    // 和集合
    const ids = Array.from(new Set([...assigned, ...dueToday]));
    return ids.map(id => tasks.find(t => t.id === id));
}

/**
 * メイン実行
 */
function main() {
    console.log('🚀 カレンダー式タスクスケジューラー開始\n');
    let tasks;
    if (fs.existsSync('tasks.yml')) {
        tasks = loadTasksFromYaml('tasks.yml');
        console.log(`🗂️ tasks.ymlから${tasks.length}件の未完了タスクを抽出`);
    } else {
        console.log('⚠️ tasks.ymlが見つかりません。テストデータで実行します。');
        tasks = [];
    }
    if (tasks.length === 0) {
        console.log('⚠️ 有効なタスクがありません。終了します。');
        return;
    }
    const today = formatDate(new Date());
    const end = new Date();
    end.setMonth(end.getMonth() + 2);
    const calendar = scheduleTasks(tasks, new Date(), end);
    const markdown = generateCalendarMarkdown(calendar, today, tasks);
    fs.writeFileSync('calendar-output.md', markdown);
    console.log('\n✅ calendar-output.md に出力完了');
    console.log('\n📅 生成されたスケジュール:');
    console.log('================================');
    console.log(markdown);
}

// 実行
if (require.main === module) {
    main();
}

module.exports = { generateCalendarSchedule, generateCalendarMarkdown, loadTasksFromYaml, scheduleTasks, getTodayTasks }; 