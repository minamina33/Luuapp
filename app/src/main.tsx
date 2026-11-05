import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';
import { sound } from './sound';

// ブラウザの制約で、音は最初のタップのあとに使えるようになる
window.addEventListener('pointerdown', () => sound.unlock(), { capture: true });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// ホーム画面アプリ用。使えない環境（プレビューなど）では何もしない
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    try {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    } catch {
      /* ignore */
    }
  });
}

// 起動画面：かわいく見せるため最低1.6秒は表示してから、ふわっと消す
{
  const el = document.getElementById('splash');
  if (el) {
    const t0 = performance.now();
    const hide = () => {
      el.classList.add('hide');
      setTimeout(() => el.remove(), 700);
    };
    window.addEventListener('load', () => setTimeout(hide, Math.max(0, 1600 - (performance.now() - t0))));
    setTimeout(hide, 4000); // 読みこみが遅くても長く待たせない
  }
}
