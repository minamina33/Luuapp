import { useGame } from '../game/store';
import { useNav, runRec, type SheetState } from '../nav';
import { doneToday, today, dayKey } from '../game/logic';
import { recommend, RECS } from '../data/content';
import type { CareKind } from '../types';

interface CareCard {
  kind: CareKind;
  title: string;
  sub: string;
  emoji: string;
  open?: SheetState;
  soon?: boolean;
}
const GROUPS: Array<{ title: string; items: CareCard[] }> = [
  {
    title: 'リラックス',
    items: [
      { kind: 'breathing', title: '呼吸法', sub: '1分・3分', emoji: '🌬️', open: { k: 'breathing' } },
      { kind: 'meditation', title: 'ガイド付き瞑想', sub: '3・5・10分', emoji: '🎧', soon: true },
    ],
  },
  {
    title: '気持ちの整理',
    items: [
      { kind: 'mood', title: '気分記録', sub: '5段階＋メモ', emoji: '😊', open: { k: 'mood' } },
      { kind: 'journal', title: '自由日記', sub: '思ったままに', emoji: '📓', open: { k: 'journal' } },
      { kind: 'compassion', title: 'セルフコンパッション', sub: '自分にやさしい言葉を', emoji: '🤍', soon: true },
    ],
  },
  {
    title: '日常を整える',
    items: [
      { kind: 'task', title: 'セルフケアタスク', sub: '小さな習慣', emoji: '✅', open: { k: 'tasks' } },
      { kind: 'walk', title: '散歩・軽い運動', sub: 'やったら記録', emoji: '🚶', open: { k: 'walk' } },
      { kind: 'sleep', title: '睡眠記録', sub: 'おやすみ・おはよう', emoji: '🌙', open: { k: 'sleepInfo' } },
      { kind: 'connection', title: '人とのつながり', sub: '無理のない一歩', emoji: '💌', soon: true },
    ],
  },
];

export default function Kokoro({ embedded = false }: { embedded?: boolean }) {
  const { s, toast } = useGame();
  const nav = useNav();
  const todays = s.moods.filter((m) => dayKey(m.at) === today(s));
  const last = todays[todays.length - 1];
  const recs = recommend(last ? last.value : null, last?.reasons);
  const goalNote = last ? '今日の気分にあわせたおすすめ' : 'まだ今日の気分は記録していないよ（記録しなくても使えます）';
  return (
    <div className="page">
      {!embedded && <h1 className="page-title">こころ</h1>}
      <section>
        <div className="sec-head">
          <h2>今日のおすすめ</h2>
          <small className="muted">{goalNote}</small>
        </div>
        <div className="rec-list">
          {recs.map((r) => (
            <button key={r} className="rec-card" onClick={() => runRec(nav, r, toast)}>
              <span className="rec-ico">{RECS[r].emoji}</span>
              <span className="rec-txt">
                <b>{RECS[r].title}</b>
                <small>{RECS[r].sub}</small>
              </span>
              <span className="chev">›</span>
            </button>
          ))}
        </div>
      </section>
      {GROUPS.map((g) => (
        <section key={g.title}>
          <h2>{g.title}</h2>
          <div className="care-grid">
            {g.items.filter((c) => !(embedded && c.soon)).map((c) => {
              const done = !c.soon && doneToday(s, c.kind);
              return c.soon ? (
                <div key={c.title} className="care-card soon" aria-disabled>
                  <span className="care-ico">{c.emoji}</span>
                  <b>{c.title}</b>
                  <small>準備中</small>
                </div>
              ) : (
                <button key={c.title} className={`care-card ${done ? 'done' : ''}`} onClick={() => c.open && nav.open(c.open)}>
                  <span className="care-ico">{c.emoji}</span>
                  <b>{c.title}</b>
                  <small>{done ? '✓ 今日やったよ' : c.sub}</small>
                </button>
              );
            })}
          </div>
        </section>
      ))}
      <p className="muted tiny center">「準備中」の3つは、初期公開のあとに追加する予定の機能です。</p>
      <button className="help-entry" onClick={() => nav.open({ k: 'help' })}>
        <span>📞</span>
        <span>
          <b>つらいときは</b>
          <small>24時間つながる相談先</small>
        </span>
        <span className="chev">›</span>
      </button>
    </div>
  );
}
