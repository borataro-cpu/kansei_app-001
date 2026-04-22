window.onload = function() {
    const examData = JSON.parse(localStorage.getItem('lastExamResult'));
    if (!examData) {
        alert("結果データが見つかりません。");
        location.href = 'index.html';
        return;
    }

    const { questions, userAnswers, type } = examData;
    let finalScore = 0;

    // 学科別の集計用
    let stats = {
        general: { correct: 0, selected: 0, limit: 17, label: "土木一般" }, // 20問中17問
        special: { correct: 0, selected: 0, limit: 10, label: "土木専門" }, // 34問中10問
        law: { correct: 0, selected: 0, limit: 8, label: "法規" },       // 12問中8問
        essential: { correct: 0, selected: 0, limit: 35, label: "施工管理(応用)" } // 35問中35問
    };

    const listContainer = document.getElementById('review-list');
    listContainer.innerHTML = '';

    // 1. 各学科の「選択数」と「正解数」をまず集計
    questions.forEach((q) => {
        const uAns = userAnswers[q.id];
        if (uAns !== null) {
            stats[q.category].selected++;
            if (uAns === q.answer) {
                stats[q.category].correct++;
            }
        }
    });

    // 各学科の回答済みカウントを一時的に保持する変数
    let currentAnswerCounts = {
        general: 0,
        special: 0,
        law: 0,
        essential: 0
    };

    questions.forEach((q, i) => {
        const uAns = userAnswers[q.id];
        const isCorrect = (uAns === q.answer);
        const s = stats[q.category]; // 各カテゴリの制限数（limit）が入ってるオブジェクト

        const item = document.createElement('div');

        let statusClass = '';
        let statusText = '';

        if (uAns === null) {
            // 1. 未選択の場合
            statusClass = 'unselected';
            statusText = '― 未選択';
        } else {
            // 回答している場合、その学科の「何問目の回答か」をカウント
            currentAnswerCounts[q.category]++;

            if (currentAnswerCounts[q.category] > s.limit) {
                // 2. 制限数を超えた場合（減点対象）
                statusClass = 'penalty'; // 新しいクラス
                statusText = '⚠️ 選択数超過減点';
            } else if (isCorrect) {
                // 3. 制限内で正解
                statusClass = 'correct';
                statusText = '○ 正解';
            } else {
                // 4. 制限内で不正解
                statusClass = 'incorrect';
                statusText = '× 不正解';
            }
        }

        item.className = `result-row ${statusClass}`;
        item.onclick = () => { window.location.href = `review.html?qIndex=${i}`; };

        item.innerHTML = `
            <span class="q-label">問${i + 1}</span>
            <span class="q-status">${statusText}</span>
            <span class="q-arrow">解説 ＞</span>
        `;
        listContainer.appendChild(item);
    });

    // 3. 最終スコアの計算（1級土木：解きすぎ減点ルール）
    Object.keys(stats).forEach(cat => {
        const s = stats[cat];
        let categoryScore = 0;
        let answeredCount = 0; // 実際に回答した数

        // 問題番号順にチェック
        questions.forEach(q => {
            if (q.category === cat) {
                const uAns = userAnswers[q.id];

                if (uAns !== null) {
                    answeredCount++;

                    // 制限数以内の回答なら、正解時に加点
                    if (answeredCount <= s.limit) {
                        if (uAns === q.answer) {
                            categoryScore++;
                        }
                    }
                }
            }
        });

        // ★ここで減点処理！ 制限数を超えた分をマイナスする
        if (answeredCount > s.limit) {
            const penalty = answeredCount - s.limit;
            categoryScore -= penalty;
        }

        finalScore += categoryScore;
    });

    // 4. 合否画像とトータル点数の表示
    const passThreshold = { 'A': 35, 'B': 24, 'AB': 60 };
    const isPass = finalScore >= (passThreshold[type] || 35);

    const resultArea = document.getElementById('judgment-result-area');
    if (resultArea) {
        const imgName = isPass ? 'goukaku.png' : 'hugoukaku.png';
        resultArea.innerHTML = `<img src="images/${imgName}" class="pass-fail-image" alt="結果">`;
    }

    const scoreText = document.getElementById('total-score-display');
    if (scoreText) {
        scoreText.innerText = `${Math.max(0, finalScore)} / ${passThreshold[type]}点（合格基準）`;
    }

    // 5. 学科別詳細の表示（「正解数 / 選択数」形式に！）
    const scoreDetails = document.getElementById('score-details');
    if (scoreDetails) {
        scoreDetails.innerHTML = '';
        Object.values(stats).forEach(data => {
            if (data.selected > 0 || data.limit === 35) {
                const div = document.createElement('div');
                div.className = 'score-item';
                // 選択数オーバーの警告表示
                const overClass = data.selected > data.limit ? 'text-danger' : '';
                div.innerHTML = `
                    <strong>${data.label}</strong>
                    <p class="${overClass}">${data.correct} / ${data.selected} 問選択</p>
                    <small>（制限: ${data.limit}問）</small>
                `;
                scoreDetails.appendChild(div);
            }
        });
    }
};