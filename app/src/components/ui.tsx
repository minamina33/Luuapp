import React, { useEffect } from 'react';
import type { MoodValue } from '../types';
import { useGame } from '../game/store';

/** 気分アイコン（SVG） */
const MOOD_COLORS: Record<MoodValue, string> = { 5: '#F6C76E', 4: '#F4B2A0', 3: '#E6D5BF', 2: '#BFCBE6', 1: '#A9B4D8' };
export function MoodFace({ value, size = 40 }: { value: MoodValue; size?: number }) {
  const c = MOOD_COLORS[value];
  const ink = '#6b4f3f';
  const mouth: Record<MoodValue, string> = {
    5: 'M13 23 Q20 31 27 23',
    4: 'M14 24 Q20 28.5 26 24',
    3: 'M15 25 L25 25',
    2: 'M15 27 Q20 24 25 27',
    1: 'M14.5 28 Q20 23.5 25.5 28',
  };
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <circle cx="20" cy="20" r="18" fill={c} />
      <circle cx="11" cy="23" r="3" fill="#fff" opacity=".35" />
      <circle cx="29" cy="23" r="3" fill="#fff" opacity=".35" />
      {value === 5 ? (
        <>
          <path d="M11.5 17 Q14 14 16.5 17" stroke={ink} strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M23.5 17 Q26 14 28.5 17" stroke={ink} strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      ) : value === 1 ? (
        <>
          <path d="M11.5 17 Q14 19 16.5 17" stroke={ink} strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M23.5 17 Q26 19 28.5 17" stroke={ink} strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="14" cy="17" r="2.1" fill={ink} />
          <circle cx="26" cy="17" r="2.1" fill={ink} />
        </>
      )}
      <path d={mouth[value]} stroke={ink} strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/** 画面下からせり上がるシート。full=true で全画面 */
export function Sheet({
  title,
  onClose,
  children,
  full,
  footer,
}: {
  title?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  full?: boolean;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className={`sheet ${full ? 'full' : ''}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal>
        <div className="sheet-head">
          <div className="sheet-title">{title}</div>
          <button className="icon-btn" onClick={onClose} aria-label="閉じる">
            ✕
          </button>
        </div>
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-foot">{footer}</div>}
      </div>
    </div>
  );
}

/** 画面内の確認ダイアログ（ブラウザの confirm は使わない） */
export function Confirm({ text, ok, cancel, okLabel = 'OK', danger }: { text: React.ReactNode; ok: () => void; cancel: () => void; okLabel?: string; danger?: boolean }) {
  return (
    <div className="sheet-backdrop center" onClick={cancel}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-text">{text}</div>
        <div className="row gap">
          <button className="btn ghost" onClick={cancel}>
            やめる
          </button>
          <button className={`btn ${danger ? 'danger' : 'primary'}`} onClick={ok}>
            {okLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Toasts() {
  const { toasts } = useGame();
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="toast">
          {t.text}
        </div>
      ))}
    </div>
  );
}

export function Star({ n }: { n?: number }) {
  return (
    <span className="star-pill">
      <span className="star-ico">★</span>
      {n !== undefined && <b>{n}</b>}
    </span>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="empty">{children}</div>;
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: Array<[T, string]>; onChange: (v: T) => void }) {
  return (
    <div className="seg">
      {options.map(([v, l]) => (
        <button key={v} className={v === value ? 'on' : ''} onClick={() => onChange(v)}>
          {l}
        </button>
      ))}
    </div>
  );
}

export const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};
export const fmtDateTime = (iso: string) => {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};
export const fmtTime = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};
/** ISO → datetime-local 入力用 */
export const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
