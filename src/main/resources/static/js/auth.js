// js/auth.js

(function() {
    const PASSWORD = "dobo2026";
    const EXPIRE_DAYS = 7;
    const STORAGE_KEY = "dobotore_auth_time";

    function checkAuth() {
        const lastAuth = localStorage.getItem(STORAGE_KEY);
        const now = new Date().getTime();

        if (lastAuth) {
            const diffDays = (now - parseInt(lastAuth)) / (1000 * 60 * 60 * 24);
            if (diffDays < EXPIRE_DAYS) {
                return; // 認証済み
            }
        }

        // パスワード入力オーバーレイを表示
        showAuthOverlay();
    }

    function showAuthOverlay() {
        // ページ本体を隠す
        document.body.style.display = 'none';

        // オーバーレイ作成
        const overlay = document.createElement('div');
        overlay.style.cssText = [
            'position:fixed', 'top:0', 'left:0', 'width:100%', 'height:100%',
            'background:#222', 'display:flex', 'flex-direction:column',
            'align-items:center', 'justify-content:center', 'z-index:99999'
        ].join(';');

        overlay.innerHTML = `
            <p style="color:#fff;font-size:18px;margin-bottom:16px;">パスワードを入力してください</p>
            <input id="auth-input" type="password"
                style="font-size:16px;padding:10px;width:220px;border-radius:6px;border:none;text-align:center;"
                placeholder="パスワード" />
            <button id="auth-btn"
                style="margin-top:14px;padding:10px 30px;font-size:16px;background:#e07b00;color:#fff;border:none;border-radius:6px;cursor:pointer;">
                ログイン
            </button>
            <p id="auth-error" style="color:#f66;margin-top:10px;display:none;">パスワードが違います</p>
        `;

        document.body.parentNode.insertBefore(overlay, document.body);

        // ログインボタン処理
        document.getElementById('auth-btn').addEventListener('click', tryLogin);
        document.getElementById('auth-input').addEventListener('keydown', function(e) {
            if (e.key === 'Enter') tryLogin();
        });

        function tryLogin() {
            const input = document.getElementById('auth-input').value;
            if (input === PASSWORD) {
                localStorage.setItem(STORAGE_KEY, new Date().getTime().toString());
                overlay.remove();
                document.body.style.display = '';
            } else {
                document.getElementById('auth-error').style.display = 'block';
                document.getElementById('auth-input').value = '';
            }
        }
    }

    // DOM読み込み後に実行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkAuth);
    } else {
        checkAuth();
    }
})();