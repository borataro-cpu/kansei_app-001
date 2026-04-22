let studyQueue = [];
let currentQuestion = null;
let selectedChoiceNum = null;
let totalAnswered = 0;
let correctCount = 0;

// ★URLから任意のパラメータを取得する汎用関数
function getParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}

// 1. URLからジャンルを取得
function getGenre() {
    return getParam('genre') || 'general';
}

// ジャンル名の日本語変換
function getGenreName(genre) {
    const names = {
        'general': '学科A（土木一般）',
        'special': '学科A（土木専門）',
        'law': '学科A（法規）',
        'essential': '学科B（必須問題）'
    };
    return names[genre] || '不明な分野';
}

// 2. ジャンルに合わせて問題をセット
function refillQueue() {
    const genre = getGenre();
    let sourceData = [];

    try {
        if (genre === 'general') sourceData = civilGeneralQuestions;
        else if (genre === 'law') sourceData = lawQuestions;
        else if (genre === 'special') sourceData = civilSpecialistQuestions;
        else if (genre === 'essential') sourceData = typeof questionsB !== 'undefined' ? questionsB : [];

        if (!sourceData || sourceData.length === 0) {
            throw new Error(`ジャンル「${genre}」のデータが見つかりません。`);
        }

        studyQueue = [...sourceData].sort(() => Math.random() - 0.5);
        console.log("読み込み成功！問数:", studyQueue.length);
    } catch (e) {
        console.error("データ読み込みエラー:", e.message);
        document.getElementById('question-text').innerText = "データの読み込みに失敗しました";
    }
}

// 3. 次の問題を表示
function showNextQuestion() {
    if (studyQueue.length === 0) refillQueue();
    currentQuestion = studyQueue.pop();
    selectedChoiceNum = null;

    document.getElementById('explanation-area').classList.add('hidden');
    document.getElementById('submit-area').classList.remove('hidden');

    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;

    const container = document.getElementById('choices-container');
    container.innerHTML = '';
    container.style.pointerEvents = 'auto';

    // 表示の詳細化
    const genre = getGenre();
    const genreName = getGenreName(genre);
    document.getElementById('question-meta').innerText =
        `${currentQuestion.year} ${genreName} No.${currentQuestion.no}`;

    // ★ 修正：問題文を看板用のクラスの要素にセット（HTMLの構造に合わせてね！）
    document.getElementById('question-text').innerText = currentQuestion.question;

    // ★重要：getParam('target') を使う！
    const target = getParam('target') || 0;
    updateAccuracy(target);

    // 図の処理
    const imgArea = document.getElementById('q-image-area');
    const qImg = document.getElementById('question-img');

    if (currentQuestion.image && currentQuestion.image.trim() !== "") {
        qImg.src = currentQuestion.image;
        imgArea.classList.remove('hidden');
        imgArea.style.display = "block"; // 表示

        // ★ 重要：図が読み込み終わったら看板の背景を更新！
        qImg.onload = () => updateWoodSignBackground();
    } else {
        qImg.src = ""; // 前の問題の画像を消去＆alt文字防止
        imgArea.classList.add('hidden');
        imgArea.style.display = "none";  // 非表示
        // 図がない場合も背景を更新
        updateWoodSignBackground();
    }

    // 3. 【超重要】念には念を入れて、時間差で3回くらい計算させる！
    // ブラウザのレンダリング待機用だよ✨
    [50, 200, 500].forEach(delay => {
        setTimeout(updateWoodSignBackground, delay);
    });

    // 選択肢ボタン生成
    [1, 2, 3, 4].forEach(num => {
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.id = `btn-${num}`;
        if (currentQuestion.isImageChoice) {
            btn.innerHTML = `<img src="${currentQuestion['choice' + num]}" style="max-height:50px;">`;
        } else {
            btn.innerText = currentQuestion[`choice${num}`];
        }
        btn.onclick = () => selectChoice(num);
        container.appendChild(btn);
    });
    // ★ 保険：少し遅れて看板背景を更新
    setTimeout(updateWoodSignBackground, 300);
    window.scrollTo(0, 0);
}

// 4. 選択肢を選んだ時
function selectChoice(num) {
    selectedChoiceNum = num;
    document.querySelectorAll('.choice-btn').forEach(btn => btn.classList.remove('selected'));
    document.getElementById(`btn-${num}`).classList.add('selected');
    document.getElementById('submit-btn').disabled = false;
}

// 正答率表示を更新する関数
function updateAccuracy(target) {
    let rate = totalAnswered === 0 ? 0 : Math.round((correctCount / totalAnswered) * 100);
    const targetVal = target || 0;
    document.getElementById('accuracy-display').innerText = `正答率 ${rate}% / 目標 ${targetVal}%`;
}

// 5. 【重要】回答ボタンを押した時
function submitAnswer() {
    if (selectedChoiceNum === null) return;

    document.getElementById('choices-container').style.pointerEvents = 'none';
    document.getElementById('submit-area').classList.add('hidden');

    const isCorrect = (selectedChoiceNum === currentQuestion.answer);
    const msg = document.getElementById('result-msg');
    const userBtn = document.getElementById(`btn-${selectedChoiceNum}`);

    if (isCorrect) {
        correctCount++;
        msg.innerHTML = '○ 正解...！';
        msg.className = "correct-msg";
        userBtn.classList.add('btn-correct');
    } else {
        msg.innerHTML = '× 不正解...';
        msg.className = "incorrect-msg";
        userBtn.classList.add('btn-incorrect');
        const correctBtn = document.getElementById(`btn-${currentQuestion.answer}`);
        if(correctBtn) correctBtn.classList.add('btn-correct');
    }

    document.getElementById('explanation-text').innerText = currentQuestion.explanation;
    document.getElementById('explanation-area').classList.remove('hidden');

    totalAnswered++;
    document.getElementById('total-count').innerText = `累計 ${totalAnswered} 問`;

    // ★ここも getParam('target') に修正！
    updateAccuracy(getParam('target') || 0);

    window.scrollBy(0, 200);
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

// 6. ページ読み込み完了時の初期設定
window.onload = () => {
    refillQueue();
    showNextQuestion();
    document.getElementById('submit-btn').addEventListener('click', submitAnswer);
    document.getElementById('next-btn').addEventListener('click', showNextQuestion);
};