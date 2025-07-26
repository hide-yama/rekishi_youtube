#!/usr/bin/env node
// review.js - 振り返りデータ集約・分析ツール
const fs = require('fs');
const path = require('path');
const argv = require('minimist')(process.argv.slice(2));

if (!argv.period && !argv.summary && !argv.export) {
  console.error('使用方法:');
  console.error('  node review.js --period weekly|monthly    期間別振り返り集約');
  console.error('  node review.js --summary                  全体サマリー生成');
  console.error('  node review.js --export                   振り返りデータをCSV出力');
  console.error('');
  console.error('例:');
  console.error('  node review.js --period weekly');
  console.error('  node review.js --summary');
  process.exit(1);
}

try {
  // daily/ フォルダ内のMarkdownファイルを取得
  const dailyDir = './daily';
  const files = fs.readdirSync(dailyDir)
    .filter(file => file.match(/^\d{4}-\d{2}-\d{2}.*\.md$/))
    .sort();

  console.log(`📊 振り返りデータ分析 (${files.length}件のファイルを検出)\n`);

  if (argv.period === 'weekly') {
    generateWeeklyReview(files);
  } else if (argv.period === 'monthly') {
    generateMonthlyReview(files);
  } else if (argv.summary) {
    generateSummary(files);
  } else if (argv.export) {
    exportToCSV(files);
  }

} catch (error) {
  console.error('エラーが発生しました:', error.message);
  process.exit(1);
}

function generateWeeklyReview(files) {
  console.log('## 📅 週次振り返りレポート\n');
  
  // 最新の7日分を取得
  const recentFiles = files.slice(-7);
  
  recentFiles.forEach(file => {
    const content = fs.readFileSync(path.join('./daily', file), 'utf8');
    const date = file.match(/(\d{4}-\d{2}-\d{2})/)[1];
    
    console.log(`### ${date}`);
    
    // 完了したことを抽出
    const completedSection = extractSection(content, '### 完了したこと');
    if (completedSection.length > 0) {
      console.log('**完了:**');
      completedSection.forEach(item => console.log(`  ${item}`));
    }
    
    // 学んだことを抽出
    const learnedSection = extractSection(content, '### 学んだこと・改善点');
    if (learnedSection.length > 0) {
      console.log('**学び:**');
      learnedSection.forEach(item => console.log(`  ${item}`));
    }
    
    console.log();
  });
}

function generateMonthlyReview(files) {
  console.log('## 📊 月次振り返りレポート\n');
  
  // 月別にグループ化
  const monthlyData = {};
  
  files.forEach(file => {
    const content = fs.readFileSync(path.join('./daily', file), 'utf8');
    const date = file.match(/(\d{4}-\d{2})/)[1];
    
    if (!monthlyData[date]) {
      monthlyData[date] = {
        completed: [],
        learned: [],
        insights: []
      };
    }
    
    monthlyData[date].completed.push(...extractSection(content, '### 完了したこと'));
    monthlyData[date].learned.push(...extractSection(content, '### 学んだこと・改善点'));
    monthlyData[date].insights.push(...extractSection(content, '### 進捗・気づき'));
  });
  
  Object.entries(monthlyData).forEach(([month, data]) => {
    console.log(`### ${month}月の振り返り`);
    console.log(`- 完了項目: ${data.completed.length}件`);
    console.log(`- 学習項目: ${data.learned.length}件`);
    console.log(`- 気づき: ${data.insights.length}件\n`);
  });
}

function generateSummary(files) {
  console.log('## 📈 全体サマリー\n');
  
  let totalCompleted = 0;
  let totalLearned = 0;
  let totalInsights = 0;
  const keywordCount = {};
  
  files.forEach(file => {
    const content = fs.readFileSync(path.join('./daily', file), 'utf8');
    
    const completed = extractSection(content, '### 完了したこと');
    const learned = extractSection(content, '### 学んだこと・改善点');
    const insights = extractSection(content, '### 進捗・気づき');
    
    totalCompleted += completed.length;
    totalLearned += learned.length;
    totalInsights += insights.length;
    
    // キーワード分析
    [...completed, ...learned, ...insights].forEach(item => {
      const keywords = item.match(/[A-Z]+-\d+|freee|開業|タスク管理|AI/g) || [];
      keywords.forEach(keyword => {
        keywordCount[keyword] = (keywordCount[keyword] || 0) + 1;
      });
    });
  });
  
  console.log(`### 📊 統計情報`);
  console.log(`- 分析期間: ${files.length}日間`);
  console.log(`- 総完了項目: ${totalCompleted}件`);
  console.log(`- 総学習項目: ${totalLearned}件`);
  console.log(`- 総気づき: ${totalInsights}件\n`);
  
  console.log(`### 🔥 頻出キーワード`);
  const sortedKeywords = Object.entries(keywordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);
    
  sortedKeywords.forEach(([keyword, count]) => {
    console.log(`- ${keyword}: ${count}回`);
  });
}

function exportToCSV(files) {
  console.log('📤 CSV出力機能（実装予定）');
  console.log('振り返りデータをCSV形式で出力する機能を追加予定');
}

function extractSection(content, sectionTitle) {
  const lines = content.split('\n');
  const sectionIndex = lines.findIndex(line => line.includes(sectionTitle));
  
  if (sectionIndex === -1) return [];
  
  const items = [];
  for (let i = sectionIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('###') || line.startsWith('##')) break;
    if (line.startsWith('-') && line.length > 3) {
      items.push(line);
    }
  }
  
  return items;
} 