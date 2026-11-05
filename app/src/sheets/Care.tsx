import { useEffect, useRef, useState } from 'react';
import { LuuImg } from '../components/LuuImg';
import { useGame } from '../game/store';
import { useNav, runRec } from '../nav';
import { Confirm, MoodFace, Sheet, fmtDateTime } from '../components/ui';
import { spriteUrl } from '../assets';
import { sound } from '../sound';
import { isCrisisText } from '../secure';
import { LIMITS, MAX_TASKS, MOOD_PER_DAY, SHRINK_AFTER_DAYS, STARS } from '../config';
import { dayKey, doneToday, nowIso, onCare, recordSoloNight, returnHome, setCompletionTime, setWakeTime, startOuting, TIME_RANGES, today, uid } from '../game/logic';
import { HOTLINES, HABIT_MAP, MOOD_REASONS, MOOD_REPLIES, MOODS, recommend, RECS, REST_IDEAS, suggestHabits, SUPPORT_LINK, WALK_KINDS, OUTINGS, OUTING_REPLIES, withYou, WHEN_NAMES, type RecId } from '../data/content';
import type { CareTask, MoodValue, OutingKind } from '../types';

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

// ------------------------------------------------------------ 気分記録
export function MoodSheet({ value: initial, editId }: { value?: MoodValue; editId?: string }) {
  const { s, update } = useGame();
  const nav = useNav();
  const todayMoods = s.moods.filter((m) => dayKey(m.at) === today(s));
  // 今日の記録が上限に達していたら、新しく足さずに最後の記録を書きかえる
  const full = !editId && todayMoods.length >= MOOD_PER_DAY;
  const editing = editId ? s.moods.find((m) => m.id === editId) : undefined;
  const [value, setValue] = useState<MoodValue | undefined>(editing?.value ?? initial);
  const [reasons, setReasons] = useState<string[]>(editing?.reasons ?? []);
  const [note, setNote] = useState(editing?.note ?? '');
  const [del, setDel] = useState(false);
  const label = MOODS.find((m) => m.value === value)?.label;

  function save() {
    if (!value) return;
    if (editing) {
      update((d) => {
        const m = d.moods.find((x) => x.id === editId);
        if (m) Object.assign(m, { value, reasons, note: note.trim() || undefined });
      });
      nav.close();
      return;
    }
    sound.se('pet');
    update((d, f) => {
      d.moods.push({ id: uid(), at: nowIso(d), value, reasons, note: note.trim() || undefined });
      onCare(d, f, 'mood', { starKey: `care:mood:${today(d)}`, stars: STARS.moodFirstOfDay });
    });
    // 命にかかわる気持ちが書かれていたら、まず相談先を出す（判定だけで、どこにも送らない）
    if (isCrisisText(note)) return nav.open({ k: 'help', crisis: true });
    nav.open({ k: 'recs', recs: recommend(value, reasons), reply: pick(MOOD_REPLIES[value]), low: value <= 2 });
  }

  return (
    <Sheet title={editing ? '気分の記録を編集' : 'いまの気分'} onClose={nav.close}>
      {full ? (
        <>
          <div className="reply">
            <LuuImg sprite="ureshii" alt="" />
            <div className="bubble static">今日は{MOOD_PER_DAY}回も気分をおしえてくれたね。ありがとう！つづきはまた明日きかせてね</div>
          </div>
          <p className="muted small center">記録の中身を直したいときは「きろく」から開いてね</p>
          <button className="btn primary block" onClick={nav.close}>
            とじる
          </button>
        </>
      ) : (
        !editing && <p className="limit-note">今日の気分の記録：あと{MOOD_PER_DAY - todayMoods.length}回（1日{MOOD_PER_DAY}回まで）</p>
      )}
      {!full && (<>
      <div className="mood-pick">
        {MOODS.map((m) => (
          <button key={m.value} className={`mood-btn lg ${value === m.value ? 'on' : ''}`} onClick={() => setValue(m.value)}>
            <MoodFace value={m.value} size={46} />
            <small>{m.label}</small>
          </button>
        ))}
      </div>
      {value && (
        <>
          <p className="center muted">「{label}」なんだね</p>
          <div className="field">
            <div className="label">関係していそうなこと（任意・いくつでも）</div>
            <div className="chips">
              {MOOD_REASONS.map((r) => (
                <button key={r} className={`tag ${reasons.includes(r) ? 'on' : ''}`} onClick={() => setReasons(reasons.includes(r) ? reasons.filter((x) => x !== r) : [...reasons, r])}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <div className="label">メモ（任意・あなただけが見られます）</div>
            <textarea rows={3} value={note} maxLength={LIMITS.moodNote} onChange={(e) => setNote(e.target.value.slice(0, LIMITS.moodNote))} placeholder="書かなくても大丈夫" />
            <div className="counter">{note.length}/{LIMITS.moodNote}</div>
          </div>
          <button className="btn primary block" onClick={save}>
            {editing ? '保存する' : '記録する'}
          </button>
          {editing && (
            <button className="btn ghost block danger-text" onClick={() => setDel(true)}>
              この記録を削除
            </button>
          )}
        </>
      )}
      </>)}
      {del && (
        <Confirm
          text="この気分の記録を削除しますか？"
          okLabel="削除"
          danger
          cancel={() => setDel(false)}
          ok={() => {
            update((d) => {
              d.moods = d.moods.filter((m) => m.id !== editId);
            });
            nav.close();
          }}
        />
      )}
    </Sheet>
  );
}

// ------------------------------------------------------------ おすすめ
export function RecsSheet({ recs, reply, low }: { recs: RecId[]; reply?: string; low?: boolean }) {
  const { s, toast } = useGame();
  const nav = useNav();
  return (
    <Sheet title="記録したよ" onClose={nav.close}>
      <div className="reply">
        <LuuImg sprite={low ? 'p_amae' : 'ureshii'} alt="" />
        <div className="bubble static">{reply ?? 'ありがとう'}</div>
      </div>
      <div className="label">よかったら、こんなことはどう？</div>
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
      <button className="btn ghost block" onClick={nav.close}>
        今はいい（{s.pet.name}のところへ戻る）
      </button>
      {low && (
        <button className="btn soft block" onClick={() => nav.open({ k: 'help' })}>
          📞 つらいときの相談先
        </button>
      )}
      {low && (
        <div className="support">
          つらい気持ちが続くときは、ひとりで抱えこまず、身近な人や相談窓口に話してみてね。
          <br />
          <a href={SUPPORT_LINK.url} target="_blank" rel="noreferrer">
            {SUPPORT_LINK.label}
          </a>
        </div>
      )}
    </Sheet>
  );
}

// ------------------------------------------------------------ 呼吸法
const IN_SEC = 4;
const OUT_SEC = 5;
export function BreathingSheet({ minutes: m0 }: { minutes?: 1 | 3 }) {
  const { s, update } = useGame();
  const nav = useNav();
  const [minutes, setMinutes] = useState<1 | 3 | undefined>(m0);
  const [started, setStarted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const [stopped, setStopped] = useState(false);
  const t0 = useRef(0);
  const total = (minutes ?? 1) * 60;

  useEffect(() => {
    if (!started || done || stopped) return;
    t0.current = Date.now() - elapsed * 1000;
    const t = window.setInterval(() => {
      const e = (Date.now() - t0.current) / 1000;
      if (e >= total) {
        setElapsed(total);
        setDone(true);
        sound.se('chime');
        update((d, f) => onCare(d, f, 'breathing', { detail: `${minutes}分`, starKey: `care:breathing:${today(d)}`, stars: STARS.care, minutes }));
      } else setElapsed(e);
    }, 200);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, done, stopped]);

  const cyc = IN_SEC + OUT_SEC;
  const phase = elapsed % cyc < IN_SEC ? 'in' : 'out';
  const remain = Math.max(0, Math.ceil(total - elapsed));

  return (
    <Sheet title="呼吸法" onClose={nav.close} full>
      {!minutes ? (
        <div className="stack center">
          <p className="muted">どのくらいやってみる？</p>
          <button className="btn primary block" onClick={() => setMinutes(1)}>
            1分
          </button>
          <button className="btn soft block" onClick={() => setMinutes(3)}>
            3分
          </button>
        </div>
      ) : done ? (
        <div className="stack center">
          <LuuImg className="done-luu" sprite={'ureshii'} alt="" />
          <h3>おつかれさま</h3>
          <p className="muted">{minutes}分、呼吸に意識をむけられたね。</p>
          <button className="btn primary block" onClick={nav.close}>
            {s.pet.name}のところへ戻る
          </button>
        </div>
      ) : stopped ? (
        <div className="stack center">
          <LuuImg className="done-luu" sprite={'tereru'} alt="" />
          <h3>ここまででも大丈夫</h3>
          <p className="muted">やってみようと思えたことが、もう十分だよ。</p>
          <button className="btn primary block" onClick={nav.close}>
            とじる
          </button>
        </div>
      ) : (
        <div className="breath">
          <div className={`breath-circle ${started ? phase : ''}`} style={{ ['--in' as string]: `${IN_SEC}s`, ['--out' as string]: `${OUT_SEC}s` }}>
            <LuuImg sprite={started && phase === 'out' ? 'tereru' : 'g_lookup'} alt="" />
          </div>
          <div className="breath-word">{!started ? '準備ができたらはじめよう' : phase === 'in' ? '吸って…' : 'ゆっくり はいて…'}</div>
          <p className="muted small center">ペースは目安です。苦しくならない、楽な呼吸で大丈夫。</p>
          {started && (
            <div className="progress">
              <div style={{ width: `${(elapsed / total) * 100}%` }} />
            </div>
          )}
          {started && <div className="muted small">のこり {Math.floor(remain / 60)}:{String(remain % 60).padStart(2, '0')}</div>}
          {!started ? (
            <button className="btn primary block" onClick={() => setStarted(true)}>
              はじめる（{minutes}分）
            </button>
          ) : (
            <button className="btn ghost block" onClick={() => setStopped(true)}>
              途中でやめる
            </button>
          )}
        </div>
      )}
    </Sheet>
  );
}

// ------------------------------------------------------------ 日記
export function JournalSheet({ id, prompt }: { id?: string; prompt?: string }) {
  const { s, update, toast } = useGame();
  const nav = useNav();
  const existing = id ? s.journals.find((j) => j.id === id) : undefined;
  const [text, setText] = useState((existing?.content ?? prompt ?? '').slice(0, LIMITS.journal));
  // その日の気分の顔も、日記と一緒に見えるように
  const jd = existing ? dayKey(existing.createdAt) : today(s);
  const dayMoods = s.moods.filter((m) => dayKey(m.at) === jd);
  const [del, setDel] = useState(false);
  function save() {
    if (!text.trim()) return;
    if (existing) {
      update((d) => {
        const j = d.journals.find((x) => x.id === id);
        if (j) Object.assign(j, { content: text, updatedAt: nowIso(d) });
      });
      toast('保存したよ');
    } else {
      // つらい気持ちが書かれた日は、星のお知らせを出さずに相談先を優先する
      const crisis = isCrisisText(text);
      update((d, f) => {
        d.journals.unshift({ id: uid(), createdAt: nowIso(d), updatedAt: nowIso(d), content: text });
        onCare(d, f, 'journal', crisis ? {} : { starKey: `care:journal:${today(d)}`, stars: STARS.care });
        if (crisis) (f.messages.length = 0), (f.bond = 0), (f.stars = 0);
      });
    }
    if (isCrisisText(text)) return nav.open({ k: 'help', crisis: true });
    nav.close();
  }
  return (
    <Sheet
      title={existing ? `日記（${fmtDateTime(existing.createdAt)}）` : '日記をかく'}
      onClose={nav.close}
      full
      footer={
        <div className="row gap">
          {existing && (
            <button className="btn ghost danger-text" onClick={() => setDel(true)}>
              削除
            </button>
          )}
          <button className="btn primary grow" disabled={!text.trim()} onClick={save}>
            保存する
          </button>
        </div>
      }
    >
      {dayMoods.length > 0 && (
        <div className="journal-moods">
          <span className="muted small">{existing ? 'この日の気分' : '今日の気分'}</span>
          {dayMoods.map((m) => (
            <span key={m.id} className="jm">
              <MoodFace value={m.value} size={26} />
              <small>{m.reasons.join('・')}</small>
            </span>
          ))}
        </div>
      )}
      <p className="muted small">長さは関係ないよ。ひとことでも、思いついたままでも。日記はこの端末の中だけに保存されます。</p>
      <textarea className="journal" autoFocus value={text} maxLength={LIMITS.journal} onChange={(e) => setText(e.target.value.slice(0, LIMITS.journal))} placeholder="今日はどんな日だった？" />
      <div className={`counter ${text.length >= LIMITS.journal ? 'max' : ''}`}>
        {text.length >= LIMITS.journal ? 'ここまでで1つの日記だよ。つづきは新しい日記に書いてね　' : ''}
        {text.length}/{LIMITS.journal}
      </div>
      {del && (
        <Confirm
          text="この日記を削除しますか？"
          okLabel="削除"
          danger
          cancel={() => setDel(false)}
          ok={() => {
            update((d) => {
              d.journals = d.journals.filter((j) => j.id !== id);
            });
            nav.close();
          }}
        />
      )}
    </Sheet>
  );
}

// ------------------------------------------------------------ セルフケアタスク
const REPEAT_LABEL: Record<CareTask['repeat'], string> = { daily: '毎日', weekdays: '平日', weekends: '週末' };
export { tasksForToday } from '../game/logic';
import { tasksForToday } from '../game/logic';
export function TasksSheet() {
  const { s, update } = useGame();
  const nav = useNav();
  const [title, setTitle] = useState('');
  const [repeat, setRepeat] = useState<CareTask['repeat']>('daily');
  const [when, setWhen] = useState<NonNullable<CareTask['when']>>('any');
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [del, setDel] = useState<string | null>(null);
  const ms = Date.now() + s.debug.timeOffsetMs;
  const todays = tasksForToday(s.tasks, ms);
  const doneN = todays.filter((t) => doneToday(s, 'task', t.id)).length;
  // チェックしたときの、るうのリアクション
  const [cheer, setCheer] = useState<{ line: string; n: number } | null>(null);
  const [popId, setPopId] = useState<string | null>(null);
  const others = s.tasks.filter((t) => t.isActive && !todays.includes(t));
  const paused = s.tasks.filter((t) => !t.isActive);
  const activeN = s.tasks.filter((t) => t.isActive).length;
  const full = activeN >= MAX_TASKS;
  // 最近の気分の「関係していそうなこと」も見て、まだ入れていない習慣を提案
  const recentReasons = s.moods.filter((m) => ms - new Date(m.at).getTime() < 7 * 86400_000).flatMap((m) => m.reasons);
  const recs = suggestHabits(s.player?.goals ?? [], recentReasons, s.tasks.map((t) => t.libId ?? ''), 3);
  // できない日が続いたら「小さい版にしてみる？」（責めずに、ちょうどいい大きさへ）
  const week = Math.floor(ms / (7 * 86400_000));
  const lastDays = Array.from({ length: SHRINK_AFTER_DAYS }, (_, i) => dayKey(ms - (i + 1) * 86400_000));
  const shrink = todays.find(
    (t) =>
      t.libId &&
      t.size === 'normal' &&
      !s.rewardKeys[`shrink:${t.id}:${week}`] &&
      (!t.createdAt || ms - new Date(t.createdAt).getTime() > SHRINK_AFTER_DAYS * 86400_000) &&
      lastDays.every((d) => !s.completions.some((c) => c.kind === 'task' && c.taskId === t.id && c.day === d))
  );
  const lowWeek = lastDays.every((d) => s.moods.some((m) => dayKey(m.at) === d && m.value <= 2));
  const bigOnes = todays.filter((t) => t.libId && t.size === 'normal');
  const setSize = (id: string, size: 'small' | 'normal') =>
    update((d) => {
      const x = d.tasks.find((y) => y.id === id);
      const h = x?.libId ? HABIT_MAP[x.libId] : null;
      if (x && h) Object.assign(x, { size, title: size === 'small' ? h.small : h.normal });
    });

  function toggle(t: CareTask) {
    if (doneToday(s, 'task', t.id)) {
      update((d) => {
        d.completions = d.completions.filter((c) => !(c.kind === 'task' && c.taskId === t.id && c.day === today(d)));
      });
      return;
    }
    update((d, f) => {
      const granted = d.ledger.filter((l) => l.action === 'task' && l.day === today(d)).length;
      onCare(d, f, 'task', { taskId: t.id, detail: t.title, starKey: granted < STARS.taskMaxPerDay ? `care:task:${t.id}:${today(d)}` : undefined, stars: STARS.task });
      // このシートの中でも喜ぶので、おへやに戻ったときの反応は1回にまとめる
      if (d.lastCare) d.lastCare.seen = true;
    });
    sound.se('chime');
    const lines = ['できたね！', 'すごい、えらい！', 'やったね〜！', 'ひとつ前に進んだね', '自分を大事にしてるね'];
    setCheer({ line: `「${t.title}」${lines[Math.floor(Math.random() * lines.length)]}`, n: Date.now() });
    setPopId(t.id);
    window.setTimeout(() => setPopId(null), 900);
  }
  function add() {
    if (!title.trim() || full) return;
    update((d) => {
      d.tasks.push({ id: uid(), title: title.trim(), source: 'custom', repeat, isActive: true, when, createdAt: nowIso(d) });
    });
    setTitle('');
  }
  const row = (t: CareTask, today: boolean) => {
    const done = doneToday(s, 'task', t.id);
    return (
      <div key={t.id} className={`task ${done ? 'done' : ''}`}>
        {today ? (
          <button className={`check ${done ? 'on' : ''} ${popId === t.id ? 'pop' : ''}`} onClick={() => toggle(t)} aria-label="達成">
            {done ? '✓' : ''}
            {popId === t.id && (
              <span className="check-burst">
                {Array.from({ length: 8 }, (_, i) => (
                  <b key={i} style={{ ['--a' as string]: `${i * 45}deg` }}>✦</b>
                ))}
              </span>
            )}
          </button>
        ) : (
          <span className="check off" />
        )}
        {editing === t.id ? (
          <input className="grow" value={editText} maxLength={LIMITS.task} autoFocus onChange={(e) => setEditText(e.target.value)} />
        ) : (
          <button className="grow task-title" onClick={() => setOpenRow(openRow === t.id ? null : t.id)}>
            {t.title}
            <small>
              {t.when && t.when !== 'any' ? `${WHEN_NAMES[t.when]}・` : ''}
              {REPEAT_LABEL[t.repeat]}
              {t.libId ? `・${t.size === 'normal' ? 'ふつう版' : '小さい版'}` : ''}
            </small>
          </button>
        )}
        {editing === t.id && (
          <button
            className="btn tiny primary"
            onClick={() => {
              update((d) => {
                const x = d.tasks.find((y) => y.id === t.id);
                if (x && editText.trim()) x.title = editText.trim();
              });
              setEditing(null);
            }}
          >
            保存
          </button>
        )}
        {editing !== t.id && (
          <button className="btn tiny ghost more" onClick={() => setOpenRow(openRow === t.id ? null : t.id)} aria-label="そのほか">
            ⋯
          </button>
        )}
        {openRow === t.id && editing !== t.id && (
          <div className="task-actions">
            {t.libId && (
              <button className="btn tiny soft" onClick={() => setSize(t.id, t.size === 'normal' ? 'small' : 'normal')}>
                {t.size === 'normal' ? '小さい版にする' : 'ふつう版にする'}
              </button>
            )}
            <button
              className="btn tiny ghost"
              onClick={() => {
                setEditing(t.id);
                setEditText(t.title);
                setOpenRow(null);
              }}
            >
              編集
            </button>
            <button
              className="btn tiny ghost"
              onClick={() => {
                update((d) => void (d.tasks.find((y) => y.id === t.id)!.isActive = false));
                setOpenRow(null);
              }}
            >
              おやすみにする
            </button>
            <button className="btn tiny ghost danger-text" onClick={() => setDel(t.id)}>
              削除
            </button>
            {t.libId && <div className="task-reason">{HABIT_MAP[t.libId].reason}</div>}
          </div>
        )}
      </div>
    );
  };
  return (
    <Sheet title="セルフケアタスク" onClose={nav.close} full>
      <div className="task-luu">
        <LuuImg key={cheer?.n ?? 0} sprite={cheer ? 'ureshii' : 'smile'} className={cheer ? 'cheer-hop' : ''} />
        <div className="bubble static">{cheer ? cheer.line : doneN === 0 ? 'できそうなものから、ひとつだけでも大丈夫だよ' : `今日は${doneN}つできたね`}</div>
      </div>
      {todays.length > 0 && (
        <div className="task-progress">
          {todays.map((t) => (
            <i key={t.id} className={doneToday(s, 'task', t.id) ? 'on' : ''}>✦</i>
          ))}
          <span>
            {doneN}/{todays.length}
          </span>
        </div>
      )}
      <p className="muted small">できたらチェック。できない日があっても大丈夫だよ（星がもらえるのは1日{STARS.taskMaxPerDay}件まで）。</p>
      {shrink && (
        <div className="shrink-card">
          <div>
            <b>{s.pet.name}</b>「{shrink.title}、ここ{SHRINK_AFTER_DAYS}日はむずかしかったみたい。小さい版にしてみる？」
          </div>
          <div className="small muted">→ {HABIT_MAP[shrink.libId!].small}</div>
          <div className="row gap">
            <button className="btn tiny ghost" onClick={() => update((d) => void (d.rewardKeys[`shrink:${shrink.id}:${week}`] = true))}>
              このままで
            </button>
            <button className="btn tiny primary" onClick={() => setSize(shrink.id, 'small')}>
              小さくする
            </button>
          </div>
        </div>
      )}
      {!shrink && lowWeek && bigOnes.length > 0 && !s.rewardKeys[`shrinkall:${week}`] && (
        <div className="shrink-card">
          <div>
            <b>{s.pet.name}</b>「ここ数日、しんどい日が続いてるね。今週はぜんぶ小さめでいこうか？」
          </div>
          <div className="row gap">
            <button className="btn tiny ghost" onClick={() => update((d) => void (d.rewardKeys[`shrinkall:${week}`] = true))}>
              このままで
            </button>
            <button
              className="btn tiny primary"
              onClick={() => {
                bigOnes.forEach((t) => setSize(t.id, 'small'));
                update((d) => void (d.rewardKeys[`shrinkall:${week}`] = true));
              }}
            >
              小さめにする
            </button>
          </div>
        </div>
      )}
      <div className="label row between">
        <span>今日のタスク</span>
        <span className="muted">
          習慣 {activeN}/{MAX_TASKS}
        </span>
      </div>
      {todays.length ? todays.map((t) => row(t, true)) : <div className="empty">今日のタスクはありません</div>}
      {others.length > 0 && (
        <>
          <div className="label">ほかの日のタスク</div>
          {others.map((t) => row(t, false))}
        </>
      )}
      {paused.length > 0 && (
        <>
          <div className="label">おやすみ中</div>
          {paused.map((t) => (
            <div key={t.id} className="task paused">
              <span className="check off" />
              <span className="grow task-title">{t.title}</span>
              <button
                className="btn tiny soft"
                disabled={full}
                onClick={() => update((d) => void (d.tasks.find((y) => y.id === t.id)!.isActive = true))}
              >
                再開
              </button>
              <button className="btn tiny ghost danger-text" onClick={() => setDel(t.id)}>
                削除
              </button>
            </div>
          ))}
        </>
      )}
      <div className="label">{s.pet.name}のおすすめ</div>
      {full && <p className="muted small">習慣は{MAX_TASKS}つまで。ふやすより、今ある習慣をたいせつにしようね（入れかえたいときは「おやすみ」か「削除」してね）。</p>}
      <div className="rec-habits">
        {recs.map((h) => (
          <div key={h.id} className="rec-habit">
            <div className="grow">
              <b>{h.small}</b>
              <small className="muted">
                {WHEN_NAMES[h.when]}・ふつう版：{h.normal}
              </small>
              <div className="rh-reason">💬 {h.reason}</div>
            </div>
            <button
              className="btn tiny primary"
              disabled={full}
              onClick={() =>
                update((d) => {
                  d.tasks.push({ id: uid(), title: h.small, source: 'suggested', repeat: 'daily', isActive: true, libId: h.id, size: 'small', when: h.when, createdAt: nowIso(d) });
                })
              }
            >
              追加
            </button>
          </div>
        ))}
      </div>
      <div className="program-card">
        <b>テーマプログラム</b> <span className="badge-soon">るうプラス・準備中</span>
        <div className="small muted">「2週間で眠りを整える」「休み方を練習する1週間」のように、日ごとに少しずつ変わるガイドつきのプログラムです。</div>
      </div>
      <div className="label">自分で追加</div>
      <div className="add-task">
        <input value={title} maxLength={LIMITS.task} onChange={(e) => setTitle(e.target.value)} placeholder="例：ストレッチを1分" onKeyDown={(e) => e.key === 'Enter' && add()} />
        <select value={repeat} onChange={(e) => setRepeat(e.target.value as CareTask['repeat'])}>
          <option value="daily">毎日</option>
          <option value="weekdays">平日</option>
          <option value="weekends">週末</option>
        </select>
        <select value={when} onChange={(e) => setWhen(e.target.value as NonNullable<CareTask['when']>)}>
          <option value="any">いつでも</option>
          <option value="morning">朝</option>
          <option value="day">昼</option>
          <option value="night">夜</option>
        </select>
        <button className="btn primary" onClick={add} disabled={!title.trim() || full}>
          追加
        </button>
      </div>
      {del && (
        <Confirm
          text="このタスクを削除しますか？（これまでの達成記録は残ります）"
          okLabel="削除"
          danger
          cancel={() => setDel(null)}
          ok={() => {
            update((d) => {
              d.tasks = d.tasks.filter((t) => t.id !== del);
            });
            setDel(null);
          }}
        />
      )}
    </Sheet>
  );
}

// ------------------------------------------------------------ 散歩・軽い運動
export function WalkSheet() {
  const { s, update } = useGame();
  const nav = useNav();
  const [kind, setKind] = useState<OutingKind>('walk');
  const [done, setDone] = useState(false);
  const [onlyRec, setOnlyRec] = useState(false);
  const [range, setRange] = useState<number | null>(null);
  const k = WALK_KINDS.find((w) => w.id === kind)!;
  const o = OUTINGS[kind];
  if (s.outing) {
    const ok = OUTINGS[s.outing.kind];
    const min = Math.max(0, Math.round((Date.now() + s.debug.timeOffsetMs - new Date(s.outing.startedAt).getTime()) / 60_000));
    return (
      <Sheet title="おでかけ中" onClose={nav.close}>
        <div className="reply">
          <LuuImg sprite="o_go" alt="" />
          <div className="bubble static">
            いま{ok.place}で{ok.label}中だよ（{min}分）
          </div>
        </div>
        <button className="btn primary block" onClick={() => goHome(update, nav)}>
          🏠 ただいま
        </button>
      </Sheet>
    );
  }
  return (
    <Sheet title="散歩・軽い運動" onClose={nav.close}>
      {done ? (
        <div className="stack center">
          <LuuImg className="done-luu" sprite={'d_jump'} alt="" />
          <h3>{k.label}、おつかれさま！</h3>
          <p className="muted">体を動かしてくれてありがとう。</p>
          <button className="btn primary block" onClick={nav.close}>
            とじる
          </button>
        </div>
      ) : (
        <>
          <div className="reply">
            <LuuImg sprite="o_go" alt="" />
            <div className="bubble static">{s.pet.name}もいっしょに行く！</div>
          </div>
          <div className="choice3">
            {WALK_KINDS.map((w) => (
              <button key={w.id} className={kind === w.id ? 'on' : ''} onClick={() => setKind(w.id as OutingKind)}>
                <span>{w.emoji}</span>
                {w.label}
              </button>
            ))}
          </div>
          <p className="muted small center">
            {o.place}へおでかけ。終わったら「ただいま」を押してね。距離や時間は関係ないよ。
          </p>
          <button
            className="btn primary block"
            onClick={() => {
              sound.se('morning');
              update((d) => startOuting(d, kind));
              nav.close();
            }}
          >
            🎒 いっしょにでかける
          </button>
          {!onlyRec ? (
            <button className="btn ghost block" onClick={() => setOnlyRec(true)}>
              もうやってきた（記録だけ）
            </button>
          ) : (
            <div className="card">
              <div className="label">どのくらい？（えらばなくてもOK）</div>
              <div className="chips">
                {TIME_RANGES.map((r, i) => (
                  <button key={r.label} className={`tag ${range === i ? 'on' : ''}`} onClick={() => setRange(range === i ? null : i)}>
                    {r.label}
                  </button>
                ))}
              </div>
              <button
                className="btn soft block"
                onClick={() => {
                  const r = range != null ? TIME_RANGES[range] : null;
                  update((d, f) => onCare(d, f, 'walk', { detail: k.label, starKey: `care:walk:${today(d)}`, stars: STARS.care, minutes: r?.minutes, range: r?.label, approx: true }));
                  setDone(true);
                }}
              >
                {k.label}を記録する
              </button>
            </div>
          )}
          {doneToday(s, 'walk') && <p className="muted small center">今日はもう記録しているよ。何回記録しても大丈夫（星は1日1回）。</p>}
        </>
      )}
    </Sheet>
  );
}

/** ただいま（おへやのボタン・シートの両方から） */
export function goHome(update: ReturnType<typeof useGame>['update'], nav: ReturnType<typeof useNav>, auto = false) {
  let r: ReturnType<typeof returnHome> = null;
  sound.se('chime');
  update((d, f) => {
    r = returnHome(d, f);
  });
  const res = r as ReturnType<typeof returnHome>;
  if (res) nav.open({ k: 'outingBack', kind: res.kind, min: res.min, auto: auto || res.auto, compId: res.compId });
  else nav.close();
}

export function OutingBackSheet({ kind, min, auto, compId }: { kind: OutingKind; min: number; auto?: boolean; compId?: string }) {
  const { s, update } = useGame();
  const nav = useNav();
  // time：時間の確認 → feel：どうだった？ → 返事
  const [step, setStep] = useState<'time' | 'pick' | 'feel'>(auto ? 'pick' : 'time');
  const [reply, setReply] = useState<string | null>(null);
  const o = OUTINGS[kind];
  const you = s.player?.nickname ?? '';
  const setTime = (r: { minutes?: number; range?: string } | null) => {
    if (compId) update((d) => setCompletionTime(d, compId, r));
    setStep('feel');
  };
  const say = reply
    ? withYou(reply, you, s.pet.name)
    : step === 'pick'
      ? auto
        ? `ぷは〜。ちょっと長くなったから、さきに帰ってきたよ。${o.label}、何分くらいだった？`
        : 'そっか、どのくらいだった？'
      : step === 'time'
        ? `ぷは〜、ただいま！${min}分くらい、いっしょに${o.label}したね`
        : `${o.label}、おつかれさま！どうだった？`;
  return (
    <Sheet title="ただいま！" onClose={nav.close}>
      <div className="reply">
        <LuuImg sprite="o_back" alt="" />
        <div className="bubble static">{say}</div>
      </div>
      {reply ? (
        <button className="btn primary block" onClick={nav.close}>
          おへやにもどる
        </button>
      ) : step === 'time' ? (
        <div className="row gap">
          <button className="btn primary grow" onClick={() => setStep('feel')}>
            あってる
          </button>
          <button className="btn soft grow" onClick={() => setStep('pick')}>
            ちがうかも
          </button>
        </div>
      ) : step === 'pick' ? (
        <>
          <div className="chips center-chips">
            {TIME_RANGES.map((r) => (
              <button key={r.label} className="tag" onClick={() => setTime({ minutes: r.minutes, range: r.label })}>
                {r.label}
              </button>
            ))}
          </div>
          <button className="btn ghost block" onClick={() => setTime(auto ? null : { minutes: min })}>
            {auto ? 'わからない' : 'やっぱりそのまま'}
          </button>
        </>
      ) : (
        <>
          <div className="choice3">
            {(
              [
                ['good', '😊', 'すっきり'],
                ['ok', '🙂', 'まあまあ'],
                ['tired', '😮‍💨', 'つかれた'],
              ] as const
            ).map(([id, e, label]) => (
              <button
                key={id}
                onClick={() => {
                  sound.se('pet');
                  setReply(pick(OUTING_REPLIES[id]));
                }}
              >
                <span>{e}</span>
                {label}
              </button>
            ))}
          </div>
          <button className="btn ghost block" onClick={nav.close}>
            とじる
          </button>
        </>
      )}
    </Sheet>
  );
}

// ------------------------------------------------------------ ひと休み
export function RestSheet() {
  const { s, toast } = useGame();
  const nav = useNav();
  return (
    <Sheet title="ひと休み" onClose={nav.close}>
      <div className="reply">
        <LuuImg sprite={'kutsurogi'} alt="" />
        <div className="bubble static">なにもしない時間も、たいせつだよ</div>
      </div>
      <ul className="soft-list">
        {REST_IDEAS.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
      <button
        className="btn primary block"
        onClick={() => {
          toast(`${s.pet.name}「ちょっとひと息つけたね」`);
          nav.close();
        }}
      >
        ひと休みできた
      </button>
    </Sheet>
  );
}

export function SleepInfoSheet() {
  const nav = useNav();
  const { s } = useGame();
  return (
    <Sheet title="睡眠記録" onClose={nav.close}>
      <p>
        寝るときにおへやの<b>「おやすみ」</b>、起きたら<b>「おはよう」</b>を押すと、ボタンを押した間の時間を「睡眠の目安」として記録します。
      </p>
      <p className="muted small">実際に眠っていた時間を計測するものではありません。押し忘れたときは「きろく」から時刻を直せます。</p>
      <p>眠っているあいだに、{s.pet.name}は夢の中で冒険に出かけます。</p>
      <div className="row gap">
        <button
          className="btn soft grow"
          onClick={() => {
            nav.close();
            nav.setTab('kiroku');
          }}
        >
          睡眠の記録を見る
        </button>
        <button
          className="btn primary grow"
          onClick={() => {
            nav.close();
            nav.setTab('home');
          }}
        >
          おへやへ
        </button>
      </div>
    </Sheet>
  );
}

// ------------------------------------------------------------ おはようのあとの気分ひとこと
export function MorningMoodSheet({ advId }: { advId: string | null }) {
  const { s, update } = useGame();
  const nav = useNav();
  const next = () => (advId ? nav.open({ k: 'adventure', id: advId }) : nav.close());
  return (
    <Sheet title="おはよう" onClose={next}>
      <div className="reply">
        <LuuImg sprite="g_yawn" />
        <div className="bubble static">ふぁ〜…おはよう！{s.player?.nickname ? `${s.player.nickname}、` : ''}けさの気分はどう？</div>
      </div>
      <div className="mood-pick">
        {MOODS.map((m) => (
          <button
            key={m.value}
            className="mood-btn lg"
            onClick={() => {
              sound.se('pet');
              update((d, f) => {
                const tm = d.moods.filter((x) => dayKey(x.at) === today(d));
                if (tm.length < MOOD_PER_DAY) d.moods.push({ id: uid(), at: nowIso(d), value: m.value, reasons: [] });
                onCare(d, f, 'mood', { starKey: `care:mood:${today(d)}`, stars: STARS.moodFirstOfDay });
                if (d.lastCare) d.lastCare.seen = true;
              });
              next();
            }}
          >
            <MoodFace value={m.value} size={44} />
            <small>{m.label}</small>
          </button>
        ))}
      </div>
      <button className="btn ghost block" onClick={next}>
        あとで{advId ? '（冒険の結果を見る）' : ''}
      </button>
    </Sheet>
  );
}

// ------------------------------------------------------------ 何時ごろ起きた？（押し忘れ・るうが先に起きた朝）
export function WakeAskSheet({ sessId, advId, auto }: { sessId: string; advId: string | null; auto?: boolean }) {
  const { s, update } = useGame();
  const nav = useNav();
  const you = s.player?.nickname ? `${s.player.nickname}は` : '';
  const todayMoods = s.moods.filter((m) => dayKey(m.at) === today(s));
  const next = () => {
    if (todayMoods.length >= MOOD_PER_DAY) return advId ? nav.open({ k: 'adventure', id: advId }) : nav.close();
    nav.open({ k: 'morningMood', advId });
  };
  const choose = (h: number | null | 'keep') => {
    update((d) => setWakeTime(d, sessId, h));
    next();
  };
  return (
    <Sheet title="おはよう" onClose={() => choose('keep')}>
      <div className="reply">
        <LuuImg sprite="g_yawn" />
        <div className="bubble static">{auto ? `おはよう！さきに起きちゃった。${you}何時ごろ起きた？` : `よく寝たね〜。${you}何時ごろ起きた？`}</div>
      </div>
      <div className="chips center-chips">
        {[5, 6, 7, 8, 9, 10].map((h) => (
          <button key={h} className="tag" onClick={() => choose(h)}>
            {h}時台
          </button>
        ))}
      </div>
      <div className="row gap">
        <button className="btn soft grow" onClick={() => choose('keep')}>
          {auto ? 'それより後' : 'いま起きた'}
        </button>
        <button className="btn ghost grow" onClick={() => choose(null)}>
          おぼえてない
        </button>
      </div>
      <p className="muted tiny center">だいたいで大丈夫。睡眠のきろくに使うよ</p>
    </Sheet>
  );
}

// ------------------------------------------------------------ るうが先に寝た夜（あとから記録・冒険なし）
export function SoloNightSheet() {
  const { s, update } = useGame();
  const nav = useNav();
  const [bed, setBed] = useState<number | null | undefined>(undefined);
  const [wake, setWake] = useState<number | null | undefined>(undefined);
  const close = () => {
    update((d) => void (d.rewardKeys[`solo:${today(d)}`] = true));
    nav.close();
  };
  return (
    <Sheet title="おはよう" onClose={close}>
      <div className="reply">
        <LuuImg sprite="tereru" />
        <div className="bubble static">きのうはぐっすりねちゃった。こんやはいっしょに冒険いこうね</div>
      </div>
      <p className="muted small center">よかったら、きのうの睡眠も記録できるよ（しなくても大丈夫）</p>
      <div className="label">何時ごろ寝た？</div>
      <div className="chips">
        {(
          [
            [22, '22時ごろ'],
            [23, '23時ごろ'],
            [0, '0時ごろ'],
            [1, '1時以降'],
            [null, 'おぼえてない'],
          ] as const
        ).map(([h, l]) => (
          <button key={l} className={`tag ${bed === h ? 'on' : ''}`} onClick={() => setBed(h)}>
            {l}
          </button>
        ))}
      </div>
      <div className="label">何時ごろ起きた？</div>
      <div className="chips">
        {(
          [
            [6, '6時台'],
            [7, '7時台'],
            [8, '8時台'],
            [9, '9時以降'],
            [null, 'おぼえてない'],
          ] as const
        ).map(([h, l]) => (
          <button key={l} className={`tag ${wake === h ? 'on' : ''}`} onClick={() => setWake(h)}>
            {l}
          </button>
        ))}
      </div>
      <button
        className="btn primary block"
        disabled={bed === undefined && wake === undefined}
        onClick={() => {
          update((d) => recordSoloNight(d, bed ?? null, wake ?? null));
          nav.close();
        }}
      >
        記録する
      </button>
      <button className="btn ghost block" onClick={close}>
        記録しない
      </button>
    </Sheet>
  );
}

// ------------------------------------------------------------ つらいときは（相談窓口）
export function HelpSheet({ crisis }: { crisis?: boolean }) {
  const { s } = useGame();
  const nav = useNav();
  return (
    <Sheet title="つらいときは" onClose={nav.close} full>
      <div className="reply">
        <LuuImg sprite="p_amae" alt="" />
        <div className="bubble static">
          {crisis ? `話してくれて、ありがとう。${s.pet.name}はここにいるよ。でも、その気持ちはひとりで抱えないでほしいな` : `つらいときは、ひとりで抱えなくていいんだよ`}
        </div>
      </div>
      <p className="small">
        いますぐ誰かと話したいときは、ここに電話できます。名前を言わなくても大丈夫です。
      </p>
      <div className="hotlines">
        {HOTLINES.map((h) => (
          <a key={h.tel} className="hotline" href={`tel:${h.tel.replace(/-/g, '')}`}>
            <span className="hl-name">{h.name}</span>
            <span className="hl-tel">📞 {h.tel}</span>
            <span className="muted tiny">{h.note}</span>
          </a>
        ))}
      </div>
      <div className="card">
        <b>電話がにがてなときは</b>
        <p className="small">LINEやチャットで相談できる窓口もあります。</p>
        <a href={SUPPORT_LINK.url} target="_blank" rel="noreferrer">
          {SUPPORT_LINK.label}
        </a>
      </div>
      <p className="small">身近な人に「ちょっと話を聞いて」と送るだけでも大丈夫。命の危険を感じるときは、迷わず 119 に電話してください。</p>
      <p className="muted tiny">このアプリはセルフケアを手助けするもので、医療や相談のかわりにはなりません。書いたことは、この端末の外には送られません。</p>
      <button className="btn primary block" onClick={nav.close}>
        {s.pet.name}のところへもどる
      </button>
    </Sheet>
  );
}
