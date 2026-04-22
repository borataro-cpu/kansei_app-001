// index_script.js (Indexページ専用)

// ★1. 目標正答率を読み取って勉強モードへ移動する関数
function goToStudy(genre) {
    // 入力欄から数値を取得
    const targetRate = document.getElementById('target-rate').value;
    // 勉強モードページへパラメータ付きで移動
    window.location.href = `study.html?genre=${genre}&target=${targetRate}`;
}

// ★2. 模擬試験モードへ移動する関数（必要なら）
function startExam(type) {
    // demotest.html へ、typeパラメータを付けて移動する
    // 例: demotest.html?type=A
    window.location.href = `demotest.html?type=${type}`;
}

window.onload = () => {
    console.log("TOPページ読み込み完了✨");
};