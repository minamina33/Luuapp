import { useEffect, useState } from 'react';
import { useGame } from '../game/store';
import { useNav, runRec, type SheetState } from '../nav';
import { LuuImg } from '../components/LuuImg';
import { sound } from '../sound';
import { careCountToday, doneToday, nowMs, tasksForToday, today, dayKey } from '../game/logic';
import { recommend, RECS, WHEN_NAMES } from '../data/content';
import { sortByTime, TASK_CHEERS, toggleTask } from '../sheets/Care';
import type { CareKind, CareTask } from '../types';

interface CareCard {
  kind: CareKind;
  title: string;
  sub: string;
  emoji: string;
  open?: SheetState;
  soon?: boolean;
}
// 習慣（タスク）は上の「今日の習慣」にあるので、ここには入れない
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
      { kind: 'walk', title: '散歩・軽い運動', sub: 'やったら記録', emoji: '🚶', open: { k: 'walk' } },
      { kind: 'sleep', title: '睡眠記録', sub: 'おやすみ・おはよう', emoji: '🌙', open: { k: 'sleepInfo' } },
      { kind: 'connection', title: '人とのつながり', sub: '無理のない一歩', emoji: '💌', soon: true },
    ],
  },
];

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

export default function Kokoro({ embedded = false }: { embedded?: boolean }) {
  const { s, update, toast } = useGame();
  const nav = useNav();
  const ms = nowMs(s);
  const todays = s.moods.filter((m) => dayKey(m.at) === today(s));
  const last = todays[todays.length - 1];
  // おすすめは1つだけ（習慣は上にあるので「セルフケアタスク」はのぞく）
  const rec = recommend(last ? last.value : null, last?.reasons).find((r) => r !== 'tasks') ?? 'breath1';
  const low = !!last && last.value <= 2;

  // 今日の習慣（今の時間帯に合うものを上に）
  const habits = sortByTime(tasksForToday(s.tasks, ms), ms);
  const habitsDone = habits.filter((t) => doneToday(s, 'task', t.id)).length;
  const allDone = habits.length > 0 && habitsDone >= habits.length;
  const [popId, setPopId] = useState<string | null>(null);

  // るうのリアクション（習慣をチェックしたとき・ケアのシートを閉じたとき）
  const [cheer, setCheer] = useState<{ line: string; n: number } | null>(null);
  function check(t: CareTask) {
    if (!toggleTask(s, update, t)) return;
    setCheer({ line: `「${t.title}」${pick(TASK_CHEERS)}`, n: Date.now() });
    setPopId(t.id);
    window.setTimeout(() => setPopId(null), 900);
  }
  const lc = s.lastCare;
  useEffect(() => {
    if (embedded || !lc || lc.seen || lc.cheered || nav.sheetKind) return;
    if (nowMs(s) - new Date(lc.at).getTime() > 30 * 60_000) return;
    if (lc.kind === 'mood' || lc.kind === 'sleep') return;
    const lines: Partial<Record<string, string>> = {
      task: `「${lc.detail ?? 'タスク'}」できたね！${s.pet.name}もうれしい`,
      breathing: 'いっしょに深呼吸できたね。ふぅ〜',
      journal: '書いてくれてありがとう。おつかれさま',
      walk: `${lc.detail ?? '運動'}、おつかれさま！えらいね`,
    };
    const t = window.setTimeout(() => {
      sound.se('chime');
      setCheer({ line: lines[lc.kind] ?? 'できたね！', n: Date.now() });
      // ここで喜んだので、おへやに戻ったときはひとことだけにする
      update((d) => void (d.lastCare && (d.lastCare.cheered = true)));
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lc?.id, lc?.seen, lc?.cheered, nav.sheetKind, embedded]);
  // しばらくしたら、ふだんのひとことに戻す
  useEffect(() => {
    if (!cheer) return;
    const t = window.setTimeout(() => setCheer(null), 4000);
    return () => clearTimeout(t);
  }, [cheer]);
  const careN = careCountToday(s);
  const idleLine = allDone
    ? '今日の習慣、ぜんぶできたね。あとはゆっくりしてね'
    : careN === 0
      ? 'できそうなものから、ひとつだけでも大丈夫だよ'
      : `今日は${careN}つ、自分のことを大事にできたね`;

  return (
    <div className="page">
      {!embedded && <h1 className="page-title">今日のケア</h1>}
      {!embedded && (
        <div className="task-luu care-luu">
          <LuuImg key={cheer?.n ?? 0} sprite={cheer ? 'ureshii' : 'smile'} className={cheer ? 'cheer-hop' : ''} />
          <div className="bubble static">{cheer ? cheer.line : idleLine}</div>
        </div>
      )}

      <section>
        <div className="sec-head">
          <h2>今日の習慣</h2>
          {habits.length > 0 && (
            <span className="task-progress habit-progress">
              {habits.map((t) => (
                <i key={t.id} className={doneToday(s, 'task', t.id) ? 'on' : ''}>✦</i>
              ))}
              <span>
                {habitsDone}/{habits.length}
              </span>
            </span>
          )}
        </div>
        {habits.length ? (
          <div className="today-habits">
            {habits.map((t) => {
              const done = doneToday(s, 'task', t.id);
              return (
                <div key={t.id} className={`task ${done ? 'done' : ''}`}>
                  <button className={`check ${done ? 'on' : ''} ${popId === t.id ? 'pop' : ''}`} onClick={() => check(t)} aria-label={done ? 'チェックをはずす' : 'できた'}>
                    {done ? '✓' : ''}
                    {popId === t.id && (
                      <span className="check-burst">
                        {Array.from({ length: 8 }, (_, i) => (
                          <b key={i} style={{ ['--a' as string]: `${i * 45}deg` }}>✦</b>
                        ))}
                      </span>
                    )}
                  </button>
                  <button className="grow task-title" onClick={() => check(t)}>
                    {t.title}
                    {t.when && t.when !== 'any' && <small>{WHEN_NAMES[t.when]}</small>}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty">まだ習慣がないよ。小さなことから、ひとつえらんでみよう</div>
        )}
        <button className="habit-edit" onClick={() => nav.open({ k: 'tasks' })}>
          {habits.length ? '習慣をへんしゅう・追加' : '習慣をえらぶ'} ›
        </button>
      </section>

      <button className={`rec-line ${low ? 'gentle' : ''}`} onClick={() => runRec(nav, rec, toast)}>
        <span className="rec-ico">{RECS[rec].emoji}</span>
        <span className="rec-txt">
          <small>{last ? '今日の気分にあわせて' : 'ひと息つくなら'}</small>
          <b>{RECS[rec].title}</b>
        </span>
        <span className="chev">›</span>
      </button>

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
      {!embedded && <p className="muted tiny center">「準備中」の3つは、初期公開のあとに追加する予定の機能です。</p>}
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
