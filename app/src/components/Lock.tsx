import { useState } from 'react';
import { LuuImg } from './LuuImg';
import { Hotlines } from './Hotlines';
import { checkPin, hashPin } from '../secure';

/** 4けたの番号入力（ロック画面・設定の両方で使う） */
export function PinPad({ onDone, title, sub, error }: { onDone: (pin: string) => void; title: string; sub?: string; error?: string }) {
  const [pin, setPin] = useState('');
  const push = (d: string) => {
    const p = (pin + d).slice(0, 4);
    setPin(p);
    if (p.length === 4) {
      setTimeout(() => {
        onDone(p);
        setPin('');
      }, 120);
    }
  };
  return (
    <div className="pinpad">
      <b>{title}</b>
      {sub && <small className="muted">{sub}</small>}
      <div className="pin-dots">
        {[0, 1, 2, 3].map((i) => (
          <i key={i} className={i < pin.length ? 'on' : ''} />
        ))}
      </div>
      {error && <small className="danger-text">{error}</small>}
      <div className="pin-keys">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k, i) =>
          k === '' ? (
            <span key={i} />
          ) : (
            <button key={i} onClick={() => (k === '⌫' ? setPin(pin.slice(0, -1)) : push(k))} aria-label={k === '⌫' ? '1文字けす' : k}>
              {k}
            </button>
          )
        )}
      </div>
    </div>
  );
}

/** アプリを開いたときのロック画面 */
export function LockScreen({ hash, onUnlock }: { hash: string; onUnlock: () => void }) {
  const [err, setErr] = useState('');
  const [help, setHelp] = useState(false);
  // 番号が思い出せなくても、相談先だけはいつでも開けるようにする
  const [care, setCare] = useState(false);
  if (care) {
    return (
      <div className="lock-screen lock-care">
        <b>つらいときは</b>
        <Hotlines />
        <button className="btn primary block" onClick={() => setCare(false)}>
          もどる
        </button>
      </div>
    );
  }
  return (
    <div className="lock-screen">
      <LuuImg sprite="g_sleep" alt="" />
      <PinPad
        title="ロックをはずしてね"
        error={err}
        onDone={async (p) => {
          if (await checkPin(p, hash)) onUnlock();
          else setErr('番号がちがうみたい');
        }}
      />
      <button className="btn soft small-btn" onClick={() => setCare(true)}>
        つらいときは（相談先）
      </button>
      <button className="btn ghost small-btn" onClick={() => setHelp(!help)}>
        番号をわすれたとき
      </button>
      {help && (
        <p className="muted small lock-help">
          番号はこの端末にしか保存されていないので、わたしたちにも調べることはできません。引き継ぎコードがあれば、ブラウザの「サイトのデータを消去」をしてから、はじめの画面でコードを貼りつけると元にもどせます。
        </p>
      )}
    </div>
  );
}

export { hashPin };
