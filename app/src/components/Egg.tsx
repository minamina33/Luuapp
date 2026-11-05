import { COLOR_MAP } from '../data/colors';
import type { ColorId } from '../types';

/** たまご（色の手がかりになる模様つき）。原画が届くまでの仮イラスト */
export function Egg({ color, size = 90, crack = 0, wobble, className = '' }: { color: ColorId; size?: number; crack?: 0 | 1 | 2; wobble?: boolean; className?: string }) {
  const c = COLOR_MAP[color];
  const id = `eg-${color}`;
  const pat = c.pattern;
  return (
    <svg viewBox="0 0 100 120" width={size} height={size * 1.2} className={`egg ${wobble ? 'wobble' : ''} ${className}`} aria-hidden>
      <defs>
        <radialGradient id={`${id}-g`} cx="38%" cy="30%" r="75%">
          <stop offset="0" stopColor="#fffdf8" />
          <stop offset="0.7" stopColor="#fbf2e8" />
          <stop offset="1" stopColor="#ecdccb" />
        </radialGradient>
        <clipPath id={`${id}-c`}>
          <path d="M50 4 C78 4 94 48 94 74 C94 100 74 116 50 116 C26 116 6 100 6 74 C6 48 22 4 50 4 Z" />
        </clipPath>
      </defs>
      <ellipse cx="50" cy="116" rx="34" ry="4" fill="#8a5a3a" opacity=".15" />
      <path d="M50 4 C78 4 94 48 94 74 C94 100 74 116 50 116 C26 116 6 100 6 74 C6 48 22 4 50 4 Z" fill={`url(#${id}-g)`} />
      <g clipPath={`url(#${id}-c)`} fill={c.egg} opacity={c.secret ? 0.9 : 0.75}>
        {pat === 'dots' && [
          [30, 40, 6], [62, 30, 5], [72, 62, 7], [40, 72, 6], [24, 92, 5], [58, 96, 6], [84, 90, 4], [48, 52, 4],
        ].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} />)}
        {pat === 'stripes' && [36, 62, 88].map((y) => <rect key={y} x="0" y={y} width="100" height="9" rx="4" />)}
        {pat === 'waves' && [40, 66, 92].map((y) => <path key={y} d={`M0 ${y} q12 -8 25 0 t25 0 t25 0 t25 0 v8 q-12 8 -25 0 t-25 0 t-25 0 t-25 0 z`} />)}
        {pat === 'hearts' && [
          [32, 44], [64, 36], [70, 72], [36, 82], [54, 102],
        ].map(([x, y], i) => <path key={i} transform={`translate(${x} ${y}) scale(.55)`} d="M0 6 C-10 -4 -18 8 0 20 C18 8 10 -4 0 6 Z" />)}
        {pat === 'stars' && [
          [30, 40], [64, 32], [72, 70], [38, 78], [56, 100], [22, 96],
        ].map(([x, y], i) => <path key={i} transform={`translate(${x} ${y}) scale(.6)`} d="M0 -10 L3 -3 L10 -3 L4 2 L6 10 L0 5 L-6 10 L-4 2 L-10 -3 L-3 -3 Z" />)}
      </g>
      {c.secret && <path d="M50 4 C78 4 94 48 94 74 C94 100 74 116 50 116 C26 116 6 100 6 74 C6 48 22 4 50 4 Z" fill="none" stroke="#c9dcf5" strokeWidth="2.5" />}
      <ellipse cx="34" cy="28" rx="9" ry="14" fill="#fff" opacity=".55" transform="rotate(-20 34 28)" />
      {crack >= 1 && <path d="M34 50 l8 8 l6 -7 l7 9 l6 -6" fill="none" stroke="#9c7a62" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />}
      {crack >= 2 && <path d="M28 66 l10 6 l8 -8 l9 9 l10 -7 l9 6" fill="none" stroke="#9c7a62" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
}
