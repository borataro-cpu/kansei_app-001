// exam_script.js

let examQuestions = []; // 出題される全問題
let currentIndex = 0;
let userAnswers = {};   // { ID: 選択した番号 }

// タイマー用変数
let timeLeft = 0;
let totalTime = 0;
let timerInterval = null;

// 1. 試験の初期化
function initExam() {
    const params = new URLSearchParams(window.location.search);
    const examType = params.get('type') || 'A';

    // 一旦全問リストを空にする
    examQuestions = [];

    if (examType === 'A') {
        // 学科A：それぞれのジャンル内からランダム抽出
        // 一般(20問)、専門(34問)、法規(12問)
        const gen = getRandom(civilGeneralQuestions, 20).map(q => ({...q, category: 'general'}));
        const spec = getRandom(civilSpecialistQuestions, 34).map(q => ({...q, category: 'special'}));
        const law = getRandom(lawQuestions, 12).map(q => ({...q, category: 'law'}));
        examQuestions = [...gen, ...spec, ...law];
        totalTime = 2.5 * 60 * 60; // 2h30m

    } else if (examType === 'B') {
        // 学科B：施工管理法(応用能力) 35問
        // questionsB.js のデータから抽出
        examQuestions = getRandom(questionsB, 35).map(q => ({...q, category: 'essential'}));
        totalTime = 2 * 60 * 60; // 2h

    } else if (examType === 'AB') {
        // 学科AB：全部入りセット
        const gen = getRandom(civilGeneralQuestions, 20).map(q => ({...q, category: 'general'}));
        const spec = getRandom(civilSpecialistQuestions, 34).map(q => ({...q, category: 'special'}));
        const law = getRandom(lawQuestions, 12).map(q => ({...q, category: 'law'}));
        const ess = getRandom(questionsB, 35).map(q => ({...q, category: 'essential'}));
        examQuestions = [...gen, ...spec, ...law, ...ess];
        totalTime = 4.5 * 60 * 60; // 4h30m
    }

    timeLeft = totalTime;
    updateTimerUI();

    // 回答初期化（ここも重要！IDが被って★マークが出ないように空にする）
    userAnswers = {};
    examQuestions.forEach(q => {
        userAnswers[q.id] = null;
    });

    currentIndex = 0; // 必ず1問目から開始
    updateDropdown();
    showQuestion();
    startExamTimer();

    // ★追加：試験終了ボタンの動作設定
    const finishBtn = document.getElementById('finish-exam-btn');
    if (finishBtn) {
        finishBtn.onclick = function() {
            // 未選択の問題があるかチェック（任意でアラートを出すならここ）
            if (confirm("本当に試験を終了して、採点画面へ移動しますか？")) {
                finishExam(); // 既存のfinishExam関数を呼ぶ
            }
        };
    }
}

// 配列からランダムに指定数取り出す（シャッフル）
function getRandom(arr, n) {
    if (!arr || arr.length === 0) return [];
    let result = [...arr].sort(() => Math.random() - 0.5);
    return result.slice(0, Math.min(n, arr.length));
}

// 2. 問題表示（問題文が変わらないバグを修正）
function showQuestion() {
    if (!examQuestions[currentIndex]) return;
    const q = examQuestions[currentIndex];

    // ヘッダー・メタ情報の更新
    document.getElementById('progress-text').innerText = `${currentIndex + 1} / ${examQuestions.length} 問`;
    document.getElementById('question-meta').innerText = `${q.year} No.${q.no}`;

    // ★問題文の更新（ここをinnerTextにしっかり反映）
    const qTextElem = document.getElementById('question-text');
    if (qTextElem) qTextElem.innerText = q.question;

    // --- 画像の表示・非表示を安定化 ---
    const imgArea = document.getElementById('q-image-area');
    const qImg = document.getElementById('question-img');

    // q.image が無い(undefined)、空文字("")、null のいずれかであれば隠す
    if (q.image) {
        qImg.src = q.image;
        imgArea.classList.remove('hidden');
        imgArea.style.display = "block"; // 表示！

       // ★図の読み込みが終わったら看板を更新
       qImg.onload = () => updateWoodSignBackground();
    } else {
        qImg.src = ""; // 中身を空にする
        imgArea.classList.add('hidden');
        imgArea.style.display = "none"; // 完全に消滅させる！
        // ★図がない時も更新
        updateWoodSignBackground();
    }
    // ★念のため、少し遅れて再計算（保険！）
    setTimeout(updateWoodSignBackground, 300);

    // --- 選択肢ボタン生成 ---
    const container = document.getElementById('choices-container');
    container.innerHTML = '';
    [1, 2, 3, 4].forEach(num => {
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        if (userAnswers[q.id] === num) btn.classList.add('selected');

        if (q.isImageChoice) {
            // 画像の場合は img タグを中に入れる
            btn.innerHTML = `<img src="${q['choice' + num]}" style="max-height:80px; width:auto;">`;
        } else {
            // 通常の場合はテキストを入れる
            btn.innerText = q[`choice${num}`];
        }

        btn.onclick = () => selectAnswer(num);
        container.appendChild(btn);
    });

    updateCounters();
    document.getElementById('jump-dropdown').value = currentIndex;
}

// 3. 回答の記録
function selectAnswer(num) {
    const q = examQuestions[currentIndex];
    userAnswers[q.id] = (userAnswers[q.id] === num) ? null : num;
    showQuestion();// 画面（選択肢）を更新
    updateDropdown();   // ★ここを追加！プルダウンの★マークをリアルタイム更新✨
}

// 4. タイマー連動ロジック
function startExamTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;

        // 1. 時間表示の更新
        const h = Math.floor(timeLeft / 3600).toString().padStart(2, '0');
        const m = Math.floor((timeLeft % 3600) / 60).toString().padStart(2, '0');
        const s = (timeLeft % 60).toString().padStart(2, '0');
        document.getElementById('total-time-display').innerText = `${h}:${m}:${s}`;

        // 2. バーと火花の連動ロジック（右から左へ）
        // 残り時間の割合を計算（100 -> 0 へ向かう）
        const percentage = (timeLeft / totalTime) * 100;

        const bar = document.getElementById('question-bar'); // fuse-fillのこと
        const spark = document.getElementById('spark-img');

        if (bar) {
            // バー自体の幅を 100% から 0% に減らす
            // CSSで left: 0 固定にしていれば、右端が左に吸い込まれるように減るよ✨
            bar.style.width = percentage + "%";
        }

        if (spark) {
            // 火花の位置をバーの右端（残り長さ）に合わせる
            // これで右端からスタートして左（ダイナマイト）へ突き進む！
            spark.style.left = percentage + "%";
        }

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            alert("タイムアップ！試験を終了します。"); // ユーザーに通知
            finishExam(); // ★結果表示処理へ
        }
    }, 1000);
}

// --- 以下、ナビゲーション等は既存を維持 ---
function nextQuestion() {
    if (currentIndex < examQuestions.length - 1) {
        currentIndex++;
        showQuestion();
        // ★追加：次へ行く時だけトップへ戻る
        scrollToTop();
    }
}
function prevQuestion() {
    if (currentIndex > 0) {
        currentIndex--;
        showQuestion();
        // ★追加：戻る時だけトップへ戻る
        scrollToTop();
    }
}
function jumpToQuestion() {
    currentIndex = parseInt(document.getElementById('jump-dropdown').value);
    showQuestion();
    // ★追加：ジャンプした時だけトップへ戻る
    scrollToTop();
}
// 6. プルダウンの生成・更新（★マークとジャンル対応）
function updateDropdown() {
    const select = document.getElementById('jump-dropdown');
    if (!select) return;

    select.innerHTML = ''; // 一旦空にする

    examQuestions.forEach((q, i) => {
        const opt = document.createElement('option');
        opt.value = i;

        // 1. 回答済み（選択済み）なら★を付ける
        const mark = (userAnswers[q.id] !== null) ? "★" : "　"; // 全角スペースで幅を揃える

        // 2. ジャンル名の取得
        let genreLabel = "";
        if (q.category === 'general') genreLabel = "[一般]";
        else if (q.category === 'special') genreLabel = "[専門]";
        else if (q.category === 'law') genreLabel = "[法規]";
        else if (q.category === 'essential') genreLabel = "[施工]";

        // 3. テキストの組み立て
        opt.innerText = `${mark}${genreLabel} 問${i + 1}`;

        // 4. 背景色の設定（※PCブラウザで有効）
        // ジャンルごとに薄い色をつけて区切りをわかりやすくするよ
        if (q.category === 'general') opt.style.backgroundColor = "#e3f2fd"; // 薄い青
        else if (q.category === 'special') opt.style.backgroundColor = "#f1f8e9"; // 薄い緑
        else if (q.category === 'law') opt.style.backgroundColor = "#fff3e0"; // 薄いオレンジ
        else if (q.category === 'essential') opt.style.backgroundColor = "#fce4ec"; // 薄いピンク

        select.appendChild(opt);
    });
    // ★【重要！】ここを追加：プルダウンを更新した後、今見ている問題の番号を選択状態にする
    select.value = currentIndex;
}

// 4. カテゴリ別のカウント更新（モード別表示対応版）
function updateCounters() {
    // 1. 各カテゴリの回答数をカウント
    let counts = { general: 0, special: 0, law: 0, essential: 0 };
    examQuestions.forEach(q => {
        if (userAnswers[q.id] !== null) {
            counts[q.category]++;
        }
    });

    const display = document.getElementById('selection-summary');
    if (!display) return;

    // 2. 現在の試験タイプを取得
    const params = new URLSearchParams(window.location.search);
    const examType = params.get('type') || 'A';

    // 3. モードに合わせて表示内容を組み立てる
    let html = "";

    if (examType === 'A') {
        // 学科A：一般・専門・法規を表示
        html = `
            一般: <span class="${counts.general > 17 ? 'text-danger' : ''}">${counts.general}/17</span> |
            専門: <span class="${counts.special > 10 ? 'text-danger' : ''}">${counts.special}/10</span> |
            法規: <span class="${counts.law > 8 ? 'text-danger' : ''}">${counts.law}/8</span>
        `;
    } else if (examType === 'B') {
        // 学科B：施工管理法（応用能力）のみを表示
        html = `施工管理法(応用能力): <span>${counts.essential}/35</span>`;
    } else if (examType === 'AB') {
        // 学科AB：全部盛り！
        html = `
            一般: ${counts.general}/17 | 専門: ${counts.special}/10 |
            法規: ${counts.law}/8 | 施工(応用): ${counts.essential}/35
        `;
    }

    display.innerHTML = html;
}

// --- 追加：時間の表示（HH:MM:SS）を更新する補助関数 ---
function updateTimerUI() {
   const display = document.getElementById('total-time-display');
    const bar = document.getElementById('question-bar');
    const spark = document.getElementById('spark-img');
    if (!display || !bar || !spark) return;

    // 1. 時間のテキスト更新
    const h = Math.floor(timeLeft / 3600).toString().padStart(2, '0');
    const m = Math.floor((timeLeft % 3600) / 60).toString().padStart(2, '0');
    const s = (timeLeft % 60).toString().padStart(2, '0');
    display.innerText = `${h}:${m}:${s}`;

    // 2. バーと火花の同期（ここがポイント！）
    // 読み込み直後（timeLeft = totalTime）なら percentage は 100 になるよ✨
    const percentage = (timeLeft / totalTime) * 100;

    // バーの幅を更新
    bar.style.width = percentage + "%";
    // 火花の位置をバーの右端（残り時間の先端）に強制セット！
    spark.style.left = percentage + "%";
}

function finishExam() {
    if (timerInterval) clearInterval(timerInterval);

    // データを保存
    const resultData = {
        questions: examQuestions,
        userAnswers: userAnswers,
        type: new URLSearchParams(window.location.search).get('type') || 'A'
    };
    localStorage.setItem('lastExamResult', JSON.stringify(resultData));

    // 結果ページへ移動
    location.href = 'result.html';
}

function updateWoodSignBackground() {
    const board = document.querySelector('.wood-sign-board');
    const content = document.querySelector('.board-content');
    if (!board || !content) return;

    const height = content.scrollHeight;
    let bgImage = 'wood_panel_LL.png';

    if (height < 180) bgImage = 'wood_panel_SS.png';
    else if (height < 300) bgImage = 'wood_panel_S.png';
    else if (height < 400) bgImage = 'wood_panel_MS.png';
    else if (height < 650) bgImage = 'wood_panel_M.png';
    else if (height < 750) bgImage = 'wood_panel_L.png';

    board.style.backgroundImage = `url('images/${bgImage}')`;
}

// 共通で使えるスクロール関数を末尾に作っておくと便利！
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
    // もし内部スクロールを使っている場合用
    const content = document.querySelector('.scrollable-content');
    if (content) {
        content.scrollTop = 0;
    }
}

window.onload = initExam;