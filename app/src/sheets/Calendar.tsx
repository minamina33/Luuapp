import { useState } from 'react';
import { useGame } from '../game/store';
import { useNav } from '../nav';
import { fmtTime, MoodFace, Sheet } from '../components/ui';
import { PREMIUM_NAME, PREMIUM_PRICE_LABEL } from '../config';
import { dayKey, fmtDur, nowMs, sleepHours, today } from '../game/logic';
import { item } from '../data/items';
import { MOODS } from '../data/content';
import { ItemIcon } from './Game';
import type { GameState, MoodValue } from '../types';

const WD = ['日', '月', '火', '水', '木', '金', '土'];
const ym = (y: number, m: number) => `${y}-${String(m + 1).padStart(2, '0')}`;

/** その日の記録をまとめる。睡眠とおみやげは「起きた日（朝）」に入れる */
function dayInfo(s: GameState, d: string) {
  const moods = s.moods.filter((m) => dayKey(m.at) === d).sort((a, b) => a.at.localeCompare(b.at));
  const sleeps = s.sleeps.filter((x) => x.endedAt && dayKey(x.endedAt) === d);
  const sleep = sleeps.find((x) => !x.unknown) ?? sleeps[0];
  const adv = s.adventures.find((a) => dayKey(a.createdAt) === d);
  const journals = s.journals.filter((j) => dayKey(j.createdAt) === d);
  return { moods, last: moods[moods.length - 1], sleep, adv, journals };
}

// ------------------------------------------------------------ カレンダー（るうプラス）
export function CalendarSheet() {
  const { s } = useGame();
  const nav = useNav();
  const ms = nowMs(s);
  const now = new Date(ms);
  const [cur, setCur] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [sel, setSel] = useState<string>(today(s));
  const plus = !!s.player?.premiumDemo;

  const first = new Date(cur.y, cur.m, 1);
  const daysIn = new Date(cur.y, cur.m + 1, 0).getDate();
  const cells: Array<string | null> = [...Array(first.getDay()).fill(null), ...Array.from({ length: daysIn }, (_, i) => `${ym(cur.y, cur.m)}-${String(i + 1).padStart(2, '0')}`)];
  const isThisMonth = cur.y === now.getFullYear() && cur.m === now.getMonth();
  const move = (n: number) => setCur(({ y, m }) => ({ y: m + n < 0 ? y - 1 : m + n > 11 ? y + 1 : y, m: (m + n + 12) % 12 }));

  // この月のまとめ
  const infos = cells.filter((d): d is string => !!d).map((d) => ({ d, ...dayInfo(s, d) }));
  const moodDays = infos.filter((x) => x.last).length;
  const slept = infos.map((x) => x.sleep).filter((x) => x && !x.unknown);
  const sleepAvg = slept.length ? slept.reduce((a, x) => a + (sleepHours(x!) ?? 0), 0) / slept.length : null;
  const gifts = infos.filter((x) => x.adv).length;

  const detail = dayInfo(s, sel);
  const selDt = new Date(sel + 'T12:00:00');

  return (
    <Sheet title="カレンダー" onClose={nav.close} full>
      <div className={`cal-wrap ${plus ? '' : 'locked'}`} aria-hidden={!plus}>
        <div className="cal-head">
          <button className="icon-btn" onClick={() => move(-1)} aria-label="前の月">
            ‹
          </button>
          <b>
            {cur.y}年{cur.m + 1}月
          </b>
          <button className="icon-btn" onClick={() => move(1)} disabled={isThisMonth} aria-label="次の月">
            ›
          </button>
        </div>
        <div className="cal-grid">
          {WD.map((w, i) => (
            <div key={w} className={`cal-wd ${i === 0 ? 'sun' : i === 6 ? 'sat' : ''}`}>
              {w}
            </div>
          ))}
          {cells.map((d, i) => {
            if (!d) return <div key={`e${i}`} />;
            const x = dayInfo(s, d);
            const future = d > today(s);
            return (
              <button key={d} className={`cal-day ${d === sel ? 'sel' : ''} ${d === today(s) ? 'today' : ''}`} disabled={future} onClick={() => setSel(d)}>
                <small>{Number(d.slice(8))}</small>
                <span className="cal-mood">{x.last ? <MoodFace value={x.last.value as MoodValue} size={26} /> : <span className="cal-dot" />}</span>
                <span className="cal-sub">
                  {x.sleep && !x.sleep.unknown ? `${Math.round((sleepHours(x.sleep) ?? 0) * 10) / 10}h` : ''}
                </span>
                {x.adv && (
                  <span className="cal-stamp">
                    <ItemIcon it={item(x.adv.itemId)} size="sm" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="cal-sum">
          <div>
            <small>気分を記録した日</small>
            <b>{moodDays}日</b>
          </div>
          <div>
            <small>睡眠の平均</small>
            <b>{fmtDur(sleepAvg)}</b>
          </div>
          <div>
            <small>おみやげ</small>
            <b>{gifts}こ</b>
          </div>
        </div>

        <div className="cal-detail">
          <b>
            {selDt.getMonth() + 1}/{selDt.getDate()}（{WD[selDt.getDay()]}）
          </b>
          {!detail.moods.length && !detail.sleep && !detail.adv && !detail.journals.length && <p className="muted small">この日の記録はありません</p>}
          {detail.moods.length > 0 && (
            <div className="cal-row">
              {detail.moods.map((m) => (
                <button key={m.id} className="day-mood" onClick={() => nav.open({ k: 'moodEdit', id: m.id })} aria-label={`${fmtTime(m.at)}の気分：${MOODS.find((x) => x.value === m.value)?.label}`}>
                  <MoodFace value={m.value as MoodValue} size={28} />
                  <small>{fmtTime(m.at)}</small>
                </button>
              ))}
              <span className="muted small">{Array.from(new Set(detail.moods.flatMap((m) => m.reasons))).join('・')}</span>
            </div>
          )}
          {detail.sleep && (
            <button className="cal-line" onClick={() => nav.open({ k: 'sleepEdit', id: detail.sleep!.id })}>
              🌙 {detail.sleep.unknown ? '時刻はわからない' : `${detail.sleep.approx ? '約 ' : ''}${fmtTime(detail.sleep.startedAt)} → ${fmtTime(detail.sleep.endedAt!)}（${fmtDur(sleepHours(detail.sleep))}）`}
            </button>
          )}
          {detail.adv && (
            <button className="cal-line" onClick={() => nav.open({ k: 'adventure', id: detail.adv!.id })}>
              🎁 おみやげ「{item(detail.adv.itemId).title}」
            </button>
          )}
          {detail.journals.map((j) => (
            <button key={j.id} className="cal-line journal" onClick={() => nav.open({ k: 'journal', id: j.id })}>
              📓 {j.content}
            </button>
          ))}
        </div>
      </div>

      {!plus && (
        <div className="cal-lock">
          <div className="cal-lock-card">
            <b>📅 カレンダーは{PREMIUM_NAME}の機能です</b>
            <p className="small">気分の色・睡眠・おみやげを、月ごとにひと目で見返せます。</p>
            <p className="muted small">記録そのものは、きろくの「日ごとの記録」と「睡眠」で、いつでも全部見られます。</p>
            <p className="muted tiny">
              {PREMIUM_NAME}（{PREMIUM_PRICE_LABEL}）。試作版では決済はありません。せっていの「デモ用有料会員モード」をオンにすると見られます。
            </p>
            <button className="btn soft block" onClick={nav.close}>
              とじる
            </button>
          </div>
        </div>
      )}
    </Sheet>
  );
}
