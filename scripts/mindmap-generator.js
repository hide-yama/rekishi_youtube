#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

/**
 * マインドマップ生成スクリプト
 * tasks.ymlからマインドマップ用のファイルを自動生成
 */

// ステータスと絵文字のマッピング
const STATUS_EMOJI = {
    'open': '🔴',           // 未着手
    'in_progress': '🟠',    // 作業中
    'completed': '🟢',      // 完了
    'done': '🟢'           // 完了（代替表記）
};

// 優先度の日本語マッピング（統計用）
const PRIORITY_JP = {
    'high': '高',
    'medium': '中',
    'low': '低'
};

/**
 * tasks.ymlを読み込む
 */
function loadTasks() {
    try {
        const tasksFile = path.join(__dirname, '..', 'tasks.yml');
        const fileContent = fs.readFileSync(tasksFile, 'utf8');
        return yaml.load(fileContent);
    } catch (error) {
        console.error('❌ tasks.ymlの読み込みに失敗しました:', error.message);
        process.exit(1);
    }
}

/**
 * カテゴリ別にタスクを分類
 */
function categorizeTask(tasks) {
    const categories = {};

    tasks.forEach(task => {
        const category = task.category || 'その他';
        if (!categories[category]) {
            categories[category] = [];
        }
        categories[category].push(task);
    });

    return categories;
}

/**
 * 統計情報を計算
 */
function calculateStats(tasks) {
    const stats = {
        total: tasks.length,
        completed: 0,
        in_progress: 0,
        open: 0,
        by_priority: { high: 0, medium: 0, low: 0 }
    };

    tasks.forEach(task => {
        const status = task.status || 'open';

        // ステータス別カウント
        if (status === 'completed' || status === 'done') {
            stats.completed++;
        } else if (status === 'in_progress') {
            stats.in_progress++;
        } else {
            stats.open++;
        }

        // 優先度別カウント
        const priority = task.priority || 'medium';
        if (stats.by_priority[priority] !== undefined) {
            stats.by_priority[priority]++;
        }
    });

    return stats;
}

/**
 * マインドマップ用コンテンツを生成
 */
function generateMindmapContent(tasks) {
    const categories = categorizeTask(tasks);
    const stats = calculateStats(tasks);
    let content = '';

    // カテゴリ別タスクの出力
    Object.keys(categories).sort().forEach(categoryName => {
        content += `${categoryName}\n`;

        // カテゴリ内のタスクをID順でソート
        const sortedTasks = categories[categoryName].sort((a, b) => {
            return a.id.localeCompare(b.id);
        });

        sortedTasks.forEach(task => {
            const emoji = STATUS_EMOJI[task.status] || '🔴';
            content += `\t${emoji} ${task.id} ${task.title}\n`;
        });
    });

    // 参考情報セクション
    content += '参考情報\n';
    content += '\tステータス凡例\n';
    content += '\t\t🔴 未着手 : status = open\n';
    content += '\t\t🟠 作業中 : status = in_progress\n';
    content += '\t\t🟢 完了 : status = completed / done\n';

    content += '\t統計\n';
    content += `\t\t総タスク数: ${stats.total}件\n`;
    content += `\t\t完了済み: ${stats.completed}件\n`;
    content += `\t\t作業中: ${stats.in_progress}件\n`;
    content += `\t\t未着手: ${stats.open}件\n`;

    // 優先度別統計（0件でないもののみ表示）
    const priorityStats = Object.entries(stats.by_priority)
        .filter(([_, count]) => count > 0)
        .map(([priority, count]) => `${PRIORITY_JP[priority]}優先度: ${count}件`)
        .join('、');

    if (priorityStats) {
        content += `\t\t優先度別: ${priorityStats}`;
    }

    return content;
}

/**
 * ファイルに書き込み
 */
function writeToFile(content, outputPath) {
    try {
        fs.writeFileSync(outputPath, content, 'utf8');
        console.error(`✅ マインドマップファイルを生成しました: ${outputPath}`);
    } catch (error) {
        console.error('❌ ファイル書き込みに失敗しました:', error.message);
        process.exit(1);
    }
}

/**
 * カテゴリ別タスク数を表示（デバッグ用）
 */
function showCategoryStats(tasks) {
    const categories = categorizeTask(tasks);
    console.log('\n📊 カテゴリ別タスク数:');

    Object.entries(categories)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([category, tasks]) => {
            const completed = tasks.filter(t => t.status === 'completed' || t.status === 'done').length;
            const inProgress = tasks.filter(t => t.status === 'in_progress').length;
            const open = tasks.filter(t => t.status === 'open').length;

            console.log(`  ${category}: ${tasks.length}件 (完了:${completed}, 進行:${inProgress}, 未着手:${open})`);
        });
}

/**
 * カテゴリ別タスク数を標準エラー出力に表示（リダイレクト対応）
 */
function showCategoryStatsToStderr(tasks) {
    const categories = categorizeTask(tasks);
    console.error('\n📊 カテゴリ別タスク数:');

    Object.entries(categories)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([category, tasks]) => {
            const completed = tasks.filter(t => t.status === 'completed' || t.status === 'done').length;
            const inProgress = tasks.filter(t => t.status === 'in_progress').length;
            const open = tasks.filter(t => t.status === 'open').length;

            console.error(`  ${category}: ${tasks.length}件 (完了:${completed}, 進行:${inProgress}, 未着手:${open})`);
        });
}

/**
 * メイン処理
 */
function main() {
    // リダイレクト使用時は標準出力ではなく標準エラー出力を使用
    console.error('🗺️  マインドマップファイル生成開始...');

    // tasks.yml読み込み
    const tasks = loadTasks();
    console.error(`📋 ${tasks.length}件のタスクを読み込みました`);

    // カテゴリ統計表示（標準エラー出力に変更）
    showCategoryStatsToStderr(tasks);

    // マインドマップコンテンツ生成
    const content = generateMindmapContent(tasks);

    // 標準出力にコンテンツのみを出力（リダイレクト対応、改行なし）
    process.stdout.write(content);

    console.error('\n🎉 マインドマップファイルの生成が完了しました！');
    console.error('💡 使用方法: マインドマップツールにファイル内容をコピー&ペーストしてください');
}

// スクリプト実行
if (require.main === module) {
    main();
}

module.exports = {
    loadTasks,
    categorizeTask,
    calculateStats,
    generateMindmapContent
}; 