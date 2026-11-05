import type { Constellation } from '../data/sky';

/** 星座1つ（灯った星は光り、灯った星どうしを線でつなぐ） */
export function ConstellationSvg({ c, faint, size = 100, showNext = true }: { c: Constellation; faint?: boolean; size?: number; showNext?: boolean }) {
  const { pts, lines } = c.pattern;
  const P = (i: number) => ({ x: 8 + pts[i][0] * 84, y: 8 + pts[i][1] * 84 });
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={`constel ${faint ? 'faint' : ''} ${c.done ? 'done' : ''}`} aria-hidden>
      {lines.map(([a, b], i) => {
        const on = a < c.lit && b < c.lit;
        if (!on && !showNext) return null;
        const pa = P(a);
        const pb = P(b);
        return <line key={i} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} className={on ? 'ln on' : 'ln'} />;
      })}
      {pts.map((_, i) => {
        const p = P(i);
        const on = i < c.lit;
        if (!on && !showNext) return null;
        return (
          <g key={i}>
            {on && <circle cx={p.x} cy={p.y} r={7} className="glow" />}
            <circle cx={p.x} cy={p.y} r={on ? 2.8 : 1.6} className={on ? 'st on' : 'st'} style={on ? { animationDelay: `${(i % 4) * 0.4}s` } : undefined} />
          </g>
        );
      })}
    </svg>
  );
}
