const fs = require('fs');
const yaml = require('js-yaml');

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
        fixed: !!task.fixed
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
            
            // 1日4時間制限チェック
            if (dayTasks.length < 4) {
                dayTasks.push({
                    id: task.id,
                    title: task.title,
                    due: task.due
                });
                hoursToPlace--;
                console.log(`  ✓ ${dateStr} に配置 (残り${hoursToPlace}時間)`);
            } else {
                console.log(`  ⚠️ ${dateStr} は満杯 (4/4), 前日へ`);
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
function generateCalendarMarkdown(schedule, today) {
    let output = "# カレンダー式タスクスケジュール\n\n";
    output += `生成日時: ${new Date().toLocaleString('ja-JP')}\n`;
    output += `📍 **今日**: ${today}\n\n`;
    // scheduleがMap型かオブジェクト型かで分岐
    let sortedDates;
    if (typeof schedule.keys === 'function') {
        sortedDates = Array.from(schedule.keys()).sort();
    } else {
        sortedDates = Object.keys(schedule).sort();
    }
    sortedDates.forEach(date => {
        // Map型ならget、オブジェクト型ならプロパティ参照
        const tasks = typeof schedule.get === 'function' ? schedule.get(date) : schedule[date];
        const isToday = date === today;
        const isPast = new Date(date) < new Date(today);
        output += `## ${date}`;
        if (isToday) {
            output += " 📍 **今日**";
        } else if (isPast) {
            output += " (過去)";
        }
        output += `\n`;
        // 負荷表示
        const totalHours = tasks.reduce((sum, t) => sum + (t.hours || 1), 0);
        output += `**負荷**: ${totalHours}/4時間\n\n`;
        tasks.forEach(task => {
            output += `- ${task.id} ${task.title} (期限: ${task.due})`;
            if (task.hours && task.hours > 1) output += ` [${task.hours}時間]`;
            output += `\n`;
        });
        output += "\n";
    });
    return output;
}

function scheduleTasks(tasks, startDate, endDate) {
    // 日付ごとにタスクを割り当てる
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
        // 1日バッファ
        day.setDate(day.getDate() - 1);
        while (hoursLeft > 0) {
            const dateStr = day.toISOString().split('T')[0];
            // その日の合計（fixed含む）
            let total = (calendar[dateStr] || []).reduce((sum, t) => sum + t.hours, 0);
            if (total < 4) {
                const assign = Math.min(1, 4 - total, hoursLeft);
                if (assign > 0) {
                    if (!calendar[dateStr]) calendar[dateStr] = [];
                    calendar[dateStr].push({ ...task, hours: assign });
                    hoursLeft -= assign;
                }
            }
            day.setDate(day.getDate() - 1);
            // バッファを超えて過去に割り当てる場合も許容
        }
    });
    return calendar;
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
    const today = new Date();
    const end = new Date(today);
    end.setMonth(end.getMonth() + 2);
    const calendar = scheduleTasks(tasks, today, end);
    const markdown = generateCalendarMarkdown(calendar, today);
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

module.exports = { generateCalendarSchedule, generateCalendarMarkdown, loadTasksFromYaml }; 