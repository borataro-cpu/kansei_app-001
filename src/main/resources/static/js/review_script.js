window.onload = function() {
    const params = new URLSearchParams(window.location.search);
    const qIndex = parseInt(params.get('qIndex'));
    const examData = JSON.parse(localStorage.getItem('lastExamResult'));

    // 1. データチェック
    if (!examData || isNaN(qIndex) || !examData.questions[qIndex]) {
        alert("データが見つかりません。");
        location.href = 'result.html';
        return;
    }

    const q = examData.questions[qIndex];
    const uAns = examData.userAnswers[q.id];

    // 2. メタ情報と問題文の表示
    document.getElementById('question-meta').innerText = `${q.year} No.${q.no}`;
    document.getElementById('question-text').innerText = q.question;

    // 3. 画像の表示処理
    const imgArea = document.getElementById('q-image-area');
    const qImg = document.getElementById('question-img');
    if (q.image && q.image.trim() !== "") {
        qImg.src = q.image;
        imgArea.classList.remove('hidden');
        imgArea.style.display = "block";
        // ★重要：図の読み込みが「完了した時」に背景を再計算する！
        qImg.onload = function() {
            updateWoodSignBackground();
        };
    } else {
        imgArea.style.display = "none";
        // 図がない場合はすぐに計算してOK
        updateWoodSignBackground();
    }
    // 念のため、少し遅れてもう一度実行（保険だよ！）
    setTimeout(updateWoodSignBackground, 300);

    // 4. 選択肢カードの生成
    const container = document.getElementById('choices-container');
    container.innerHTML = '';
    [1, 2, 3, 4].forEach(num => {
        const div = document.createElement('div');
        div.className = 'res-choice-card';

        if (num === q.answer) div.classList.add('is-correct');
        if (num === uAns) {
            div.classList.add('is-user');
            if (num !== q.answer) div.classList.add('is-wrong');
        }

        const content = q.isImageChoice
            ? `<img src="${q['choice' + num]}" class="res-choice-img">`
            : q['choice' + num];

        div.innerHTML = `
            <div class="res-choice-inner">
                <span class="res-choice-num">${num}</span>
                <div class="res-choice-text">${content}</div>
            </div>
        `;
        container.appendChild(div);
    });

    // 5. 解説の表示
    const expArea = document.getElementById('explanation-area');
    if (expArea) {
        expArea.classList.remove('hidden');
        document.getElementById('explanation-text').innerText = q.explanation;
    }

    const resultMsg = document.getElementById('result-msg');
    if (resultMsg) {
        if (uAns === q.answer) {
            resultMsg.innerText = "○ 正解！";
            resultMsg.className = "correct-msg";
        } else {
            resultMsg.innerText = uAns === null ? "― 未選択" : "× 不正解...";
            resultMsg.className = "incorrect-msg";
        }
    }

    // 6. 看板のサイズを判定して背景をセット
    updateWoodSignBackground();
};

// 看板の背景画像自動切り替えロジック
function updateWoodSignBackground() {
    const board = document.querySelector('.wood-sign-board');
    const content = document.querySelector('.board-content');
    if (!board || !content) return;

    // コンテンツの高さを取得
    const height = content.offsetHeight;
    let bgImage = 'wood_panel_L.png'; // デフォルト

    // 高さに合わせて画像を使い分け（拡張子を.pngに変更！）
    if (height < 150) {
        bgImage = 'wood_panel_SS.png';
    } else if (height < 250) {
        bgImage = 'wood_panel_S.png';
    } else if (height < 400) {
        bgImage = 'wood_panel_MS.png';
    } else if (height < 600) {
        bgImage = 'wood_panel_M.png';
    } else {
        bgImage = 'wood_panel_L.png';
    }

    board.style.backgroundImage = `url('images/${bgImage}')`;
}

// リサイズ時も看板のサイズを再計算
window.onresize = updateWoodSignBackground;