import { useEffect, useState } from 'react';
import { LuuImg } from './LuuImg';
import { Hotlines } from './Hotlines';
import { afterFail, checkPin, FREE_TRIES, hashPin, pinNeedsUpgrade, readGuard, writeGuard, type LockGuard } from '../secure';

/** 4けたの番号入力（ロック画面・設定の両方で使う） */
export function PinPad({ onDone, title, sub, error, disabled }: { onDone: (pin: string) => void; title: string; sub?: string; error?: string; disabled?: boolean }) {
  const [pin, setPin] = useState('');
  const push = (d: string) => {
    if (disabled) return;
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
      <div className="pin-dots" role="status" aria-label={`${pin.length}けた入力ずみ`}>
        {[0, 1, 2, 3].map((i) => (
          <i key={i} className={i < pin.length ? 'on' : ''} />
        ))}
      </div>
      {error && (
        <small className="danger-text" role="alert">
          {error}
        </small>
      )}
      <div className="pin-keys">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k, i) =>
          k === '' ? (
            <span key={i} />
          ) : (
            <button key={i} disabled={disabled} onClick={() => (k === '⌫' ? setPin(pin.slice(0, -1)) : push(k))} aria-label={k === '⌫' ? '1文字けす' : k}>
              {k}
            </button>
          )
        )}
      </div>
    </div>
  );
}

const storage = () => {
  try {
    return localStorage;
  } catch {
    return null;
  }
};

/**
 * アプリを開いたときのロック画面
 * - 番号を続けてまちがえると、少し待ってもらう（回数はアプリを開き直しても残る）
 * - 何回まちがえても、記録は消さない
 * - 前の形式で保存された番号は、ロックを外したときに今の形式に置きかえる（onUnlock に新しいハッシュをわたす）
 */
export function LockScreen({ hash, onUnlock }: { hash: string; onUnlock: (newHash?: string) => void }) {
  const [err, setErr] = useState('');
  const [help, setHelp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [guard, setGuard] = useState<LockGuard>(() => {
    const st = storage();
    return st ? readGuard(st, Date.now()) : { fails: 0, until: 0 };
  });
  const [now, setNow] = useState(Date.now());
  const waitSec = Math.max(0, Math.ceil((guard.until - now) / 1000));
  // 待っているあいだは、のこり時間を数える
  useEffect(() => {
    if (guard.until <= Date.now()) return;
    const t = window.setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [guard.until]);
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
  const waitText = waitSec >= 60 ? `${Math.ceil(waitSec / 60)}分` : `${waitSec}秒`;
  return (
    <div className="lock-screen">
      <LuuImg sprite="g_sleep" alt="" />
      <PinPad
        title="ロックをはずしてね"
        sub={waitSec > 0 ? `まちがいが続いたので、${waitText}たってからもう一度ためしてね` : undefined}
        error={waitSec > 0 ? undefined : err}
        disabled={busy || waitSec > 0}
        onDone={async (p) => {
          if (busy || guard.until > Date.now()) return;
          setBusy(true);
          const ok = await checkPin(p, hash);
          const st = storage();
          if (ok) {
            if (st) writeGuard(st, null);
            const upgraded = pinNeedsUpgrade(hash) ? await hashPin(p) : undefined;
            setBusy(false);
            onUnlock(upgraded);
            return;
          }
          const g = afterFail(guard, Date.now());
          if (st) writeGuard(st, g);
          setGuard(g);
          setNow(Date.now());
          setBusy(false);
          const left = FREE_TRIES - g.fails;
          setErr(left > 0 && left <= 2 ? `番号がちがうみたい（あと${left}回まちがえると、少し待つことになるよ）` : '番号がちがうみたい');
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
          番号はこの端末にしか保存されていないので、わたしたちにも調べることはできません。引き継ぎコードがあれば、ブラウザの「サイトのデータを消去」をしてからアプリを開き、はじめの画面を進めたあと「せってい」→「データの引き継ぎ」でコードを貼りつけると元にもどせます。
        </p>
      )}
    </div>
  );
}

export { hashPin };
