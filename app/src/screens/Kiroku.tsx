import { useState } from 'react';
import { LuuImg } from '../components/LuuImg';
import { useGame } from '../game/store';
import { useNav } from '../nav';
import { Empty, fmtDate, fmtDateTime, fmtTime, MoodFace, Segmented } from '../components/ui';
import { spriteUrl } from '../assets';
import { AREA_INFO, PERSONALITY_NAMES, STAGE_DAYS } from '../config';
import { bondProgress, dayKey, fmtDur, nowMs, personalityLabel, sleepHours, stageName, stageOf, timeLabel, today } from '../game/logic';
import { item } from '../data/items';
import { MOODS } from '../data/content';
import type { MoodValue, Personality } from '../types';
import { RarityBadge } from '../sheets/Game';
import { hasRecords } from '../sheets/Letter';
import { COLOR_MAP } from '../data/colors';

function lastNDays(ms: number, n: number) {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(dayKey(ms - i * 86400_000));
  return out;
}
const WD = ['日', '月', '火', '水', '木', '金', '土'];

export default function Kiroku() {
  const [tab, setTab] = useState<'me' | 'luu'>('me');
  return (
    <div className="page">
      <h1 className="page-title">きろく</h1>
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          ['me', 'わたしの記録'],
          ['luu', 'るうの記録'],
        ]}
      />
      {tab === 'me' ? <Mine /> : <LuuRecord />}
    </div>
  );
}

function Mine() {
  const { s } = useGame();
  const nav = useNav();
  const ms = nowMs(s);
  const days = lastNDays(ms, 7);
  const moodsByDay = (d: string) => s.moods.filter((m) => dayKey(m.at) === d);
  // 気分か日記がある日（新しい順）
  const dayKeys = Array.from(new Set([...s.moods.map((m) => dayKey(m.at)), ...s.journals.map((j) => dayKey(j.createdAt)), ...s.completions.filter((c) => c.kind === 'walk' || c.kind === 'breathing').map((c) => c.day), today(s)]))
    .sort()
    .reverse();
  const sleeps = [...s.sleeps].reverse();
  const done = s.sleeps.filter((x) => x.endedAt && !x.unknown).slice(-7);
  const avg = done.length ? done.reduce((a, x) => a + (sleepHours(x) ?? 0), 0) / done.length : null;
  const weekComp = s.completions.filter((c) => days.includes(c.day));
  const cnt = (k: string) => weekComp.filter((c) => c.kind === k).length;

  // ふりかえり：今月と、記録のある過去の月
  const months: string[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(ms);
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (i === 0 || hasRecords(s, k)) months.push(k);
  }
  return (
    <>
      <section>
        <div className="sec-head">
          <h2>ふりかえり</h2>
          <small className="muted">るうたちからの手紙</small>
        </div>
        <div className="month-chips">
          {months.map((k, i) => (
            <button key={k} className={`month-chip ${i > 0 && !s.lettersSeen.includes(k) ? 'new' : ''}`} onClick={() => nav.open({ k: 'letter', month: k })}>
              💌 {Number(k.slice(5))}月{i === 0 ? '（ここまで）' : ''}
            </button>
          ))}
        </div>
      </section>
      <section>
        <h2>気分</h2>
        <div className="week">
          {days.map((d) => {
            const ms2 = moodsByDay(d);
            const last = ms2[ms2.length - 1];
            const dt = new Date(d + 'T12:00:00');
            return (
              <div key={d} className={`week-day ${d === today(s) ? 'today' : ''}`}>
                <small>{WD[dt.getDay()]}</small>
                {last ? <MoodFace value={last.value} size={30} /> : <span className="dot" />}
                <small className="muted">{dt.getDate()}</small>
              </div>
            );
          })}
        </div>
        <div className="sec-head day-head">
          <h2>日ごとの記録</h2>
          <button className="btn tiny soft" onClick={() => nav.open({ k: 'journal' })}>
            ＋ 日記を書く
          </button>
        </div>
        {dayKeys.length === 0 ? (
          <Empty>まだ記録はありません</Empty>
        ) : (
          <div className="day-list">
            {dayKeys.slice(0, 30).map((d) => {
              const dt = new Date(d + 'T12:00:00');
              const ms3 = moodsByDay(d);
              const js = s.journals.filter((j) => dayKey(j.createdAt) === d).sort((x, y) => x.createdAt.localeCompare(y.createdAt));
              return (
                <div key={d} className="day-card">
                  <div className="day-date">
                    {dt.getMonth() + 1}/{dt.getDate()}
                    <small>（{WD[dt.getDay()]}）</small>
                    {d === today(s) && <span className="today-tag">今日</span>}
                  </div>
                  {ms3.length > 0 && (
                    <div className="day-moods">
                      {ms3.map((m) => (
                        <button key={m.id} className="day-mood" onClick={() => nav.open({ k: 'moodEdit', id: m.id })} title={MOODS.find((x) => x.value === m.value)?.label}>
                          <MoodFace value={m.value as MoodValue} size={30} />
                          <small>{fmtTime(m.at)}</small>
                        </button>
                      ))}
                      <span className="day-reasons muted small">
                        {Array.from(new Set(ms3.flatMap((m) => m.reasons))).join('・')}
                        {ms3.filter((m) => m.note).map((m) => (
                          <span key={m.id} className="note">
                            {m.note}
                          </span>
                        ))}
                      </span>
                    </div>
                  )}
                  {(() => {
                    const body = s.completions.filter((c) => c.day === d && (c.kind === 'walk' || c.kind === 'breathing'));
                    if (!body.length) return null;
                    return (
                      <div className="day-body">
                        {body.map((c) => (
                          <span key={c.id} className="day-act">
                            {c.kind === 'breathing' ? '🌬️ 呼吸法' : `${c.detail === 'ストレッチ' ? '🧘' : c.detail === '軽い運動' || c.detail === '運動' ? '🤸' : '🚶'} ${c.detail ?? '散歩'}`}
                            {timeLabel(c.kind === 'breathing' && c.minutes == null && c.detail ? { minutes: parseInt(c.detail) } : c) && <b>{timeLabel(c.kind === 'breathing' && c.minutes == null && c.detail ? { minutes: parseInt(c.detail) } : c)}</b>}
                          </span>
                        ))}
                      </div>
                    );
                  })()}
                  {js.map((j) => (
                    <button key={j.id} className="day-journal" onClick={() => nav.open({ k: 'journal', id: j.id })}>
                      <span className="dj-ico">📓</span>
                      <span className="dj-text">{j.content}</span>
                    </button>
                  ))}
                  {js.length === 0 && d === today(s) && (
                    <button className="day-journal empty" onClick={() => nav.open({ k: 'journal' })}>
                      <span className="dj-ico">✏️</span>
                      <span className="dj-text muted">今日の日記を書く（ひとことでもOK）</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2>睡眠</h2>
        <div className="stat-row">
          <div className="stat">
            <small>最近{done.length}回の平均</small>
            <b>{fmtDur(avg)}</b>
          </div>
          <div className="stat">
            <small>記録した夜</small>
            <b>{done.length >= 7 ? '7+' : done.length}回</b>
          </div>
        </div>
        <p className="muted tiny">「おやすみ」〜「おはよう」のボタン間の経過時間（睡眠の目安）です。</p>
        {sleeps.length === 0 ? (
          <Empty>まだ記録はありません</Empty>
        ) : (
          <div className="list">
            {sleeps.slice(0, 14).map((x) => (
              <button key={x.id} className="list-row" onClick={() => nav.open({ k: 'sleepEdit', id: x.id })}>
                <span className="date-badge">{fmtDate(x.startedAt)}</span>
                <span className="grow">
                  {x.unknown ? '時刻はわからない' : `${x.approx ? '約 ' : ''}${fmtTime(x.startedAt)} → ${x.endedAt ? fmtTime(x.endedAt) : '記録中'}`}
                  {x.edited && <small className="muted">（修正済み）</small>}
                  {x.solo && <small className="muted">（るうが先に寝た夜）</small>}
                </span>
                <b>{x.unknown ? '—' : x.endedAt ? fmtDur(sleepHours(x)) : '💤'}</b>
                <span className="chev">›</span>
              </button>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="sec-head">
          <h2>この1週間のケア</h2>
          <button className="btn tiny soft" onClick={() => nav.open({ k: 'tasks' })}>
            タスク
          </button>
        </div>
        <div className="stat-row wrap">
          {[
            ['task', 'タスク', '✅'],
            ['walk', '散歩・運動', '🚶'],
            ['breathing', '呼吸法', '🌬️'],
            ['journal', '日記', '📓'],
          ].map(([k, l, e]) => (
            <div key={k} className="stat">
              <small>
                {e} {l}
              </small>
              <b>{cnt(k)}回</b>
            </div>
          ))}
        </div>
        <p className="muted tiny">できた日を数えるだけ。できなかった日を気にしなくて大丈夫。</p>
      </section>
    </>
  );
}

function LuuRecord() {
  const { s } = useGame();
  const nav = useNav();
  const st = stageOf(s);
  const bp = bondProgress(s.pet.totalBondPoints);
  const nextDays = STAGE_DAYS[st] !== undefined ? STAGE_DAYS[st] - s.pet.activeDays.length : null;
  const ps = s.pet.personalityScores;
  const maxP = Math.max(10, ...Object.values(ps));
  return (
    <>
      <section>
        <div className="sec-head">
          <h2>なかまたち</h2>
          <button className="btn tiny soft" onClick={() => nav.open({ k: 'pets' })}>
            切りかえ
          </button>
        </div>
        <div className="pet-strip">
          {[s.pet, ...s.otherPets].map((p) => (
            <div key={p.id} className={p.id === s.pet.id ? 'here' : ''}>
              <LuuImg sprite="avatar" color={p.color} />
              <small>{p.name}</small>
            </div>
          ))}
          {s.egg && (
            <div>
              <span className="egg-mini">🥚</span>
              <small>あと{s.egg.nightsLeft}晩</small>
            </div>
          )}
        </div>
        <div className="muted tiny">いまおへやにいるのは {s.pet.name}（{COLOR_MAP[s.pet.color].name}）</div>
      </section>
      <section className="luu-profile">
        <LuuImg sprite={s.pet.outfit ? item(s.pet.outfit).sprite! : 'sit'} alt="" />
        <div>
          <h2>{s.pet.name}</h2>
          <div>
            Stage {st}「{stageName(st)}」
          </div>
          <div className="muted small">一緒に過ごした日：{s.pet.activeDays.length}日</div>
          <div className="muted tiny">{nextDays !== null ? `つぎの成長まで あと${nextDays}日` : 'もうりっぱなおとな！'}</div>
        </div>
      </section>
      <section>
        <h2>親密度</h2>
        <div className="row between">
          <b>
            Lv{bp.lv}「{bp.name}」
          </b>
          <small className="muted">{bp.toNext !== null ? `つぎまで ${bp.toNext}pt` : 'MAX'}</small>
        </div>
        <div className="progress pink">
          <div style={{ width: bp.need ? `${(bp.cur / bp.need) * 100}%` : '100%' }} />
        </div>
      </section>
      <section>
        <h2>性格</h2>
        <div className="muted small">いまの傾向：{personalityLabel(s)}</div>
        {(Object.keys(PERSONALITY_NAMES) as Personality[]).map((p) => (
          <div key={p} className="pbar">
            <span>{PERSONALITY_NAMES[p]}</span>
            <div className="progress">
              <div style={{ width: `${(ps[p] / maxP) * 100}%` }} />
            </div>
          </div>
        ))}
        <p className="muted tiny">遊び方やふれあい方で、少しずつ育っていきます。</p>
      </section>
      <section>
        <h2>成長アルバム</h2>
        {s.album.length === 0 ? (
          <Empty>まだ思い出はありません</Empty>
        ) : (
          <div className="timeline">
            {[...s.album].reverse().map((a) => (
              <div key={a.id} className={`tl tl-${a.kind}`}>
                <span className="tl-date">{fmtDate(a.at)}</span>
                <span className="tl-body">
                  <b>{a.title}</b>
                  {a.detail && a.kind !== 'discovery' && <small className="muted"> {a.detail}</small>}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
      <section>
        <div className="sec-head">
          <h2>冒険の記録</h2>
          <button
            className="btn tiny soft"
            onClick={() => {
              nav.setBoukenView('history');
              nav.setTab('bouken');
            }}
          >
            すべて
          </button>
        </div>
        {s.adventures.length === 0 ? (
          <Empty>まだ冒険していません</Empty>
        ) : (
          <div className="list">
            {[...s.adventures]
              .reverse()
              .slice(0, 5)
              .map((a) => (
                <div key={a.id} className="list-row">
                  <span className="date-badge">{fmtDate(a.createdAt)}</span>
                  <span className="grow">
                    {AREA_INFO[a.area].emoji} {item(a.itemId).icon} {item(a.itemId).title}
                  </span>
                  <RarityBadge r={a.rarity} />
                </div>
              ))}
          </div>
        )}
      </section>
    </>
  );
}
