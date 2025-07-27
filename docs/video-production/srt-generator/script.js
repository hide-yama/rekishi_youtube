// グローバル変数
let audioPlayer;
let lyricsLines = [];
let currentLineIndex = 0;
let timingData = [];
let isWaitingForEnd = false;

// DOM要素の取得
document.addEventListener('DOMContentLoaded', () => {
    audioPlayer = document.getElementById('audio-player');
    
    // イベントリスナーの設定
    document.getElementById('mp3-input').addEventListener('change', handleMP3Upload);
    document.getElementById('lyrics-input').addEventListener('input', handleLyricsInput);
    document.getElementById('lyrics-file-input').addEventListener('change', handleLyricsFileUpload);
    document.getElementById('main-btn').addEventListener('click', handleMainButton);
    document.getElementById('end-btn').addEventListener('click', handleEndButton);
    document.getElementById('export-btn').addEventListener('click', exportSRT);
    document.getElementById('preview-btn').addEventListener('click', showPreview);
    
    // モーダル関連
    const modal = document.getElementById('preview-modal');
    const closeBtn = document.getElementsByClassName('close')[0];
    closeBtn.onclick = () => modal.style.display = 'none';
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
    
    // オーディオプレイヤーの時間更新
    audioPlayer.addEventListener('timeupdate', updateTimeDisplay);
});

// MP3ファイルのアップロード処理
function handleMP3Upload(event) {
    const file = event.target.files[0];
    if (file) {
        const url = URL.createObjectURL(file);
        audioPlayer.src = url;
        updateStatus('MP3ファイルを読み込みました');
        checkReady();
    }
}

// 歌詞の入力処理
function handleLyricsInput() {
    const lyricsText = document.getElementById('lyrics-input').value;
    processLyrics(lyricsText);
}

// 歌詞ファイルのアップロード処理
function handleLyricsFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('lyrics-input').value = e.target.result;
            processLyrics(e.target.result);
        };
        reader.readAsText(file);
    }
}

// 歌詞の処理
function processLyrics(text) {
    lyricsLines = text.split('\n').filter(line => line.trim() !== '');
    displayLyrics();
    updateStatus('歌詞を読み込みました');
    checkReady();
}

// 歌詞の表示
function displayLyrics() {
    const container = document.getElementById('lyrics-lines');
    container.innerHTML = '';
    
    lyricsLines.forEach((line, index) => {
        const div = document.createElement('div');
        div.className = 'lyrics-line';
        div.textContent = `${index + 1}. ${line}`;
        div.id = `line-${index}`;
        div.addEventListener('click', () => jumpToLine(index));
        container.appendChild(div);
    });
}

// 特定の行にジャンプ
function jumpToLine(index) {
    currentLineIndex = index;
    updateCurrentLine();
    updateStatus(`${index + 1}行目に移動しました`);
}

// 現在の行の表示を更新
function updateCurrentLine() {
    document.querySelectorAll('.lyrics-line').forEach((el, index) => {
        el.classList.remove('current');
        if (index < currentLineIndex) {
            el.classList.add('completed');
        } else {
            el.classList.remove('completed');
        }
    });
    
    if (currentLineIndex < lyricsLines.length) {
        const currentElement = document.getElementById(`line-${currentLineIndex}`);
        currentElement.classList.add('current');
        document.getElementById('current-line-num').textContent = currentLineIndex + 1;
        
        // 自動スクロール処理
        scrollToCurrentLine();
    }
}

// 現在の行を見やすい位置にスクロール
function scrollToCurrentLine() {
    const container = document.querySelector('.lyrics-display');
    const currentElement = document.getElementById(`line-${currentLineIndex}`);
    
    if (!currentElement) return;
    
    // 現在の行を表示エリアの上から3行目の位置に配置
    const containerRect = container.getBoundingClientRect();
    const elementRect = currentElement.getBoundingClientRect();
    const lineHeight = currentElement.offsetHeight;
    
    // 現在の要素の位置を計算（コンテナ内での相対位置）
    const currentPosition = elementRect.top - containerRect.top + container.scrollTop;
    
    // 目標位置：上から3行目（約100px下）
    const targetPosition = currentPosition - 100;
    
    // スムーズスクロール
    container.scrollTo({
        top: Math.max(0, targetPosition),
        behavior: 'smooth'
    });
}

// 準備状態のチェック
function checkReady() {
    const hasMP3 = audioPlayer.src !== '';
    const hasLyrics = lyricsLines.length > 0;
    
    const isReady = hasMP3 && hasLyrics;
    document.getElementById('main-btn').disabled = !isReady;
    document.getElementById('end-btn').disabled = !isReady;
    
    if (isReady) {
        updateStatus('準備完了');
        updateCurrentLine();
    }
}

// メインボタンの処理
function handleMainButton() {
    const currentTime = audioPlayer.currentTime;
    
    if (!isWaitingForEnd) {
        // 開始時刻を記録
        if (!timingData[currentLineIndex]) {
            timingData[currentLineIndex] = {};
        }
        timingData[currentLineIndex].start = currentTime;
        timingData[currentLineIndex].text = lyricsLines[currentLineIndex];
        isWaitingForEnd = true;
        updateStatus(`${currentLineIndex + 1}行目の開始時刻を記録しました`);
    } else {
        // 終了時刻を記録し、次の行の開始時刻も記録
        timingData[currentLineIndex].end = currentTime;
        updateTimeline();
        
        // 次の行へ
        currentLineIndex++;
        if (currentLineIndex < lyricsLines.length) {
            timingData[currentLineIndex] = {
                start: currentTime,
                text: lyricsLines[currentLineIndex]
            };
            updateCurrentLine();
            updateStatus(`${currentLineIndex}行目を完了し、${currentLineIndex + 1}行目を開始しました`);
        } else {
            // 全ての行が完了
            isWaitingForEnd = false;
            updateStatus('全ての行の設定が完了しました');
            document.getElementById('export-btn').disabled = false;
            document.getElementById('preview-btn').disabled = false;
        }
    }
}

// 終了ボタンの処理
function handleEndButton() {
    if (isWaitingForEnd && timingData[currentLineIndex]) {
        const currentTime = audioPlayer.currentTime;
        timingData[currentLineIndex].end = currentTime;
        updateTimeline();
        isWaitingForEnd = false;
        updateStatus(`${currentLineIndex + 1}行目の終了時刻を記録しました`);
        
        // 次の行へ移動（開始時刻は設定しない）
        currentLineIndex++;
        if (currentLineIndex < lyricsLines.length) {
            updateCurrentLine();
        } else {
            updateStatus('全ての行の設定が完了しました');
            document.getElementById('export-btn').disabled = false;
            document.getElementById('preview-btn').disabled = false;
        }
    }
}

// タイムラインの更新
function updateTimeline() {
    const container = document.getElementById('timeline-display');
    container.innerHTML = '';
    
    timingData.forEach((data, index) => {
        if (data && data.start !== undefined) {
            const div = document.createElement('div');
            div.className = 'timeline-item';
            const startTime = formatTime(data.start);
            const endTime = data.end ? formatTime(data.end) : '未設定';
            div.textContent = `${index + 1}. ${startTime} --> ${endTime} : ${data.text.substring(0, 30)}...`;
            container.appendChild(div);
        }
    });
}

// 時間の表示更新
function updateTimeDisplay() {
    const currentTime = audioPlayer.currentTime;
    document.getElementById('current-time').textContent = formatTime(currentTime);
}

// 時間のフォーマット
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const millis = Math.floor((seconds % 1) * 1000);
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
}

// SRT形式の時間フォーマット
function formatSRTTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const millis = Math.floor((seconds % 1) * 1000);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(millis).padStart(3, '0')}`;
}

// ステータスの更新
function updateStatus(message) {
    document.getElementById('status-text').textContent = message;
}

// SRTファイルのエクスポート
function exportSRT() {
    const srtContent = generateSRT();
    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // ファイル名の取得
    const filenameInput = document.getElementById('filename-input').value.trim();
    const filename = filenameInput || 'subtitles';
    a.download = `${filename}.srt`;
    
    a.click();
    URL.revokeObjectURL(url);
}

// SRT形式の生成
function generateSRT() {
    let srtContent = '';
    let subtitleNumber = 1;
    
    timingData.forEach((data, index) => {
        if (data && data.start !== undefined && data.end !== undefined) {
            srtContent += `${subtitleNumber}\n`;
            srtContent += `${formatSRTTime(data.start)} --> ${formatSRTTime(data.end)}\n`;
            srtContent += `${data.text}\n\n`;
            subtitleNumber++;
        }
    });
    
    return srtContent.trim();
}

// プレビューの表示
function showPreview() {
    const srtContent = generateSRT();
    document.getElementById('preview-content').textContent = srtContent;
    document.getElementById('preview-modal').style.display = 'block';
}