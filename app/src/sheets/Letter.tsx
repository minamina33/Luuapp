import { useState } from 'react';
import { useGame } from '../game/store';
import { useNav } from '../nav';
import { Confirm, Sheet } from '../components/ui';
import { LuuImg } from '../components/LuuImg';
import { asset } from '../assets';
import { FEEDBACK_URL } from '../config';
import { seal, unseal, SEALED_PREFIX } from '../secure';
import { dayKey, fmtDur, sleepHours } from '../game/logic';
import { withYou } from '../data/content';
import { CATEGORY_NAMES, item } from '../data/items';
import type { CareKind, GameState, Pet } from '../types';

const KIND_LABEL: Partial<Record<CareKind, string>> = {
  task: 'セルフケアタスク',
  breathing: '呼吸法',
  journal: '日記',
  walk: '散歩・軽い運動',
  mood: '気分の記録',
  sleep: 'おやすみの記録',
};
const monthOf = (iso: string) => dayKey(iso).slice(0, 7);
const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);

/**
 * その月の手紙を書く子：記録済みならその子、なければその月にいちばん長くおへやにいた子
 * （今月はいまおへやにいる子）。読んだ時点で記録して、あとで切り替えても変わらないようにする
 */
export function letterAuthor(s: GameState, month: string, current: string): Pet {
  const pets = [s.pet, ...s.otherPets];
  const saved = s.letterAuthors?.[month];
  const hit = saved && pets.find((p) => p.id === saved);
  if (hit) return hit;
  if (month === current) return s.pet;
  const days = (p: Pet) => p.activeDays.filter((d) => d.slice(0, 7) === month).length;
  return [...pets].sort((a, b) => days(b) - days(a) || (a.id === s.pet.id ? -1 : 1))[0];
}
const monthOfNow = (s: GameState) => dayKey(Date.now() + s.debug.timeOffsetMs).slice(0, 7);

/** その月の記録をまとめる（診断や評価はしない） */
export function monthSummary(s: GameState, month: string, author?: Pet) {
  const moods = s.moods.filter((m) => monthOf(m.at) === month);
  const moodDays = new Set(moods.map((m) => dayKey(m.at))).size;
  const lowDays = new Set(moods.filter((m) => m.value <= 2).map((m) => dayKey(m.at))).size;
  const goodCount = moods.filter((m) => m.value >= 4).length;
  const half = (d: string) => Number(d.slice(8, 10)) <= 15;
  const first = avg(moods.filter((m) => half(dayKey(m.at))).map((m) => m.value));
  const second = avg(moods.filter((m) => !half(dayKey(m.at))).map((m) => m.value));
  const sleeps = s.sleeps.filter((x) => x.endedAt && monthOf(x.startedAt) === month);
  const sleepAvg = sleeps.length ? avg(sleeps.map((x) => sleepHours(x) ?? 0)) : null;
  const comps = s.completions.filter((c) => c.day.slice(0, 7) === month && c.kind !== 'mood' && c.kind !== 'sleep');
  const byKind: Record<string, number> = {};
  comps.forEach((c) => (byKind[c.kind] = (byKind[c.kind] ?? 0) + 1));
  const top = Object.entries(byKind).sort((a, b) => b[1] - a[1])[0];
  const journals = s.journals.filter((j) => monthOf(j.createdAt) === month).length;
  // 冒険は、手紙を書く子が行ったぶんだけ数える（1匹目の古い記録は petId なし）
  const advs = s.adventures.filter((a) => monthOf(a.createdAt) === month && (!author || (a.petId ?? 'pet1') === author.id));
  const newItems = Object.entries(s.discovered).filter(([, at]) => monthOf(at) === month).map(([id]) => id);
  const crafted = s.album.filter((a) => monthOf(a.at) === month && a.title.includes('をつくった')).length;
  return { moods: moods.length, moodDays, lowDays, goodCount, first, second, sleeps: sleeps.length, sleepAvg, comps: comps.length, top, journals, advs: advs.length, newItems, crafted };
}
export function hasRecords(s: GameState, month: string) {
  const m = monthSummary(s, month);
  return m.moods + m.sleeps + m.comps + m.journals + m.advs > 0;
}
/** 先月のふりかえりがまだ読まれていなければ、その月（YYYY-MM） */
export function unreadLetter(s: GameState, nowMs: number): string | null {
  const d = new Date(nowMs);
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  const prev = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  return !s.lettersSeen.includes(prev) && hasRecords(s, prev) ? prev : null;
}

function letterText(s: GameState, month: string, ongoing: boolean, author: Pet) {
  const m = monthSummary(s, month, author);
  const mm = Number(month.slice(5));
  const L: string[] = [];
  L.push(`{you}へ`);
  L.push(ongoing ? `${mm}月もここまで、いっしょにいてくれてありがとう。` : `${mm}月も、いっしょにいてくれてありがとう。`);
  if (m.moods === 0) L.push('気分の記録はお休みだったね。それでも大丈夫だよ。');
  else {
    L.push(`${m.moodDays}日、気分を教えてくれたね。`);
    if (m.lowDays > 0) L.push('つらい日もあったけど、そのたびに教えてくれて、うれしかったよ。');
    if (m.goodCount >= Math.max(2, m.moods / 2)) L.push('「よい」って教えてくれた日も、たくさんあったね。');
    if (m.first && m.second && m.second - m.first >= 0.5) L.push('月の後半は、すこしおだやかな日が増えたみたい。');
    else if (m.first && m.second && m.first - m.second >= 0.7) L.push('さいきんは、すこしつかれ気味だったかな。むりしないでね。');
  }
  if (m.sleeps > 0) L.push(`おやすみの記録は${m.sleeps}晩。ボタンのあいだの時間は、平均${fmtDur(m.sleepAvg)}だったよ。`);
  if (m.top) L.push(`いちばん続けたのは「${KIND_LABEL[m.top[0] as CareKind] ?? m.top[0]}」。${m.top[1] >= 5 ? `${m.top[1]}回も！` : `${m.top[1]}回やってみたね。`}`);
  if (m.journals > 0) L.push(`日記も${m.journals}回書いてくれたね。`);
  if (m.advs > 0) L.push(`{me}は夜の冒険に${m.advs}回行って、新しいものを${m.newItems.length}こ見つけたよ。`);
  if (m.crafted > 0) L.push(`いっしょに${m.crafted}こ、ものづくりもしたね。`);
  L.push(ongoing ? '月のおわりまで、{you}のペースでいこうね。' : 'これからも、{you}のペースでいこうね。');
  return withYou(L.join('\n'), s.player?.nickname ?? '', author.name);
}

export function LetterSheet({ month }: { month: string }) {
  const { s, update } = useGame();
  const nav = useNav();
  const now = monthOfNow(s);
  const ongoing = month === now;
  const author = letterAuthor(s, month, now);
  const m = monthSummary(s, month, author);
  const close = () => {
    if (!ongoing && (!s.lettersSeen.includes(month) || !s.letterAuthors?.[month]))
      update((d) => {
        if (!d.lettersSeen.includes(month)) d.lettersSeen.push(month);
        d.letterAuthors = { ...(d.letterAuthors ?? {}), [month]: author.id };
      });
    nav.close();
  };
  return (
    <Sheet title={`${Number(month.slice(5))}月のふりかえり${ongoing ? '（ここまで）' : ''}`} onClose={close} full>
      <div className="letter">
        <LuuImg sprite="p_amae" color={author.color} className="letter-luu" />
        <div className="letter-paper">
          {letterText(s, month, ongoing, author)
            .split('\n')
            .map((l, i) => (
              <p key={i}>{l}</p>
            ))}
          <p className="letter-sign">{author.name}より</p>
        </div>
        <div className="stat-row wrap">
          <div className="stat">
            <small>気分を記録した日</small>
            <b>{m.moodDays}日</b>
          </div>
          <div className="stat">
            <small>おやすみの記録</small>
            <b>{m.sleeps}晩</b>
          </div>
          <div className="stat">
            <small>セルフケア</small>
            <b>{m.comps}回</b>
          </div>
          <div className="stat">
            <small>新しく見つけたもの</small>
            <b>{m.newItems.length}こ</b>
          </div>
        </div>
        {m.newItems.length > 0 && (
          <div className="letter-items">
            {m.newItems.slice(0, 12).map((id) => (
              <span key={id} title={`${item(id).title}（${CATEGORY_NAMES[item(id).category]}）`}>
                {item(id).img ? <img src={asset(`${item(id).img}.webp`)} alt="" /> : item(id).icon}
              </span>
            ))}
          </div>
        )}
        <p className="muted tiny center">数は「できた日」を数えているだけです。できなかった日を気にしなくて大丈夫。</p>
        <button className="btn primary block" onClick={close}>
          とじる
        </button>
      </div>
    </Sheet>
  );
}

// ------------------------------------------------------------ 引き継ぎ（バックアップ）
const PREFIX = 'LUU1:';
function decode(code: string): GameState | null {
  try {
    const t = code.trim();
    if (!t.startsWith(PREFIX)) return null;
    const s = JSON.parse(decodeURIComponent(escape(atob(t.slice(PREFIX.length))))) as GameState;
    return s && s.pet && s.version === 1 ? s : null;
  } catch {
    return null;
  }
}
export function BackupSheet() {
  const { s, importState, toast } = useGame();
  const nav = useNav();
  const [pass, setPass] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [input, setInput] = useState('');
  const [inPass, setInPass] = useState('');
  const [pending, setPending] = useState<GameState | null>(null);
  const [err, setErr] = useState('');
  const sealedIn = input.trim().startsWith(SEALED_PREFIX);
  const make = async () => {
    setBusy(true);
    const c = await seal(JSON.stringify(s), pass);
    setBusy(false);
    setCode(c);
    try {
      await navigator.clipboard.writeText(c);
      toast('コピーしました');
    } catch {
      setShowCode(true);
      toast('自動でコピーできなかったので、下の文字列を長押しでコピーしてね');
    }
  };
  return (
    <Sheet title="データの引き継ぎ" onClose={nav.close} full>
      <div className="card">
        <b>引き継ぎコードをつくる</b>
        <p className="muted small">いまの記録・るうたち・アイテムを、あいことばで鍵をかけたコードにします。日記やメモも入っているので、あいことばを知らない人には読めないようにしてあります。</p>
        <label className="field">
          <div className="label">あいことば（4文字以上・わすれないでね）</div>
          <input type="password" value={pass} maxLength={64} onChange={(e) => (setPass(e.target.value), setCode(''))} placeholder="自分だけがわかることば" />
        </label>
        <button className="btn primary block" disabled={pass.length < 4 || busy} onClick={make}>
          {busy ? 'つくっています…' : code ? 'もう一度コピーする' : 'コードをつくってコピー'}
        </button>
        {code && (
          <button className="btn ghost block" onClick={() => setShowCode(!showCode)}>
            {showCode ? 'コードをかくす' : 'コードを表示'}
          </button>
        )}
        {showCode && code && <textarea className="code-box" readOnly value={code} rows={4} onFocus={(e) => e.currentTarget.select()} />}
        <p className="muted tiny">あいことばはアプリにも保存しません。わすれると、そのコードは開けなくなります。</p>
      </div>
      <div className="card">
        <b>引き継ぎコードを貼りつける</b>
        <p className="muted small">別の端末やブラウザで作ったコードを貼りつけると、その内容に置きかわります。</p>
        <textarea className="code-box" rows={4} value={input} onChange={(e) => (setInput(e.target.value), setErr(''))} placeholder="LUU2: から始まる文字列" />
        {sealedIn && (
          <label className="field">
            <div className="label">そのコードのあいことば</div>
            <input type="password" value={inPass} onChange={(e) => (setInPass(e.target.value), setErr(''))} />
          </label>
        )}
        {err && <p className="danger-text small">{err}</p>}
        <button
          className="btn soft block"
          disabled={!input.trim() || (sealedIn && !inPass)}
          onClick={async () => {
            let d: GameState | null = null;
            if (sealedIn) {
              const t = await unseal(input, inPass);
              if (t === null) return setErr('あいことばがちがうか、コードがとちゅうで切れているみたい。');
              try {
                const g = JSON.parse(t) as GameState;
                d = g && g.pet && g.version === 1 ? g : null;
              } catch {
                d = null;
              }
            } else d = decode(input); // 前の形式（LUU1）も読める
            if (!d) setErr('コードを読みこめませんでした。最初から最後まで全部貼りつけてね。');
            else setPending(d);
          }}
        >
          読みこむ
        </button>
      </div>
      {pending && (
        <Confirm
          text={
            <>
              「{pending.pet.name}」のデータに置きかえますか？
              <br />
              <span className="muted small">いまの端末の記録は消えます（先にコピーしておくと安心です）。</span>
            </>
          }
          okLabel="置きかえる"
          danger
          cancel={() => setPending(null)}
          ok={() => {
            importState(pending);
            setPending(null);
            nav.close();
            toast('データを引き継ぎました');
          }}
        />
      )}
    </Sheet>
  );
}

export function testReport(s: GameState) {
  const now = Date.now() + s.debug.timeOffsetMs;
  const start = s.player?.createdAt ?? new Date(now).toISOString();
  const days = Math.max(1, Math.round((now - new Date(start).getTime()) / 86400_000) + 1);
  const opened = new Set(s.completions.map((c) => c.day));
  const last14 = Array.from({ length: 14 }, (_, i) => (opened.has(dayKey(now - (13 - i) * 86400_000)) ? '●' : '・')).join('');
  const kinds: Record<string, number> = {};
  s.completions.forEach((c) => (kinds[c.kind] = (kinds[c.kind] ?? 0) + 1));
  const lines = [
    '【るう テスト記録】',
    `はじめた日：${start.slice(0, 10)}（${days}日目）`,
    `ケアをした日数：${opened.size}日`,
    `直近14日（●=ケアした日）：${last14}`,
    `気分の記録：${s.moods.length}回（平均 ${s.moods.length ? (s.moods.reduce((a, m) => a + m.value, 0) / s.moods.length).toFixed(1) : '-'}）`,
    `ケアの内訳：${Object.entries(kinds).map(([k, v]) => `${k} ${v}`).join(' / ') || 'なし'}`,
    `日記：${s.journals.length}件（中身はふくみません）`,
    `睡眠の記録：${s.sleeps.filter((x) => x.endedAt).length}晩 / 冒険：${s.adventures.length}回`,
    `習慣：${s.tasks.filter((t) => t.isActive).length}つ（おやすみ中 ${s.tasks.filter((t) => !t.isActive).length}）`,
    `るう：ふれあい${s.pet.activeDays.length}日・なかま${1 + s.otherPets.length}匹 / 星座の星：${s.sky?.stars.length ?? 0}`,
    `設定：音 ${s.settings.muted ? 'オフ' : 'オン'} / 演出ひかえめ ${s.settings.reduceMotion ? 'オン' : 'オフ'}`,
    `ホーム画面から起動：${isStandalone() ? 'はい' : 'いいえ'}`,
  ];
  return lines.join('\n');
}
export function isStandalone() {
  try {
    return window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
  } catch {
    return false;
  }
}

export function TestSheet() {
  const { s, toast } = useGame();
  const nav = useNav();
  const [text] = useState(() => testReport(s));
  const [show, setShow] = useState(false);
  return (
    <Sheet title="テストに協力してくれてありがとう" onClose={nav.close} full>
      <div className="card">
        <b>テストの記録をコピー</b>
        <p className="muted small">使った日数や、使った機能の回数だけをまとめます。日記やメモの中身はふくみません。コピーして、アンケートに貼りつけてください。</p>
        <button
          className="btn primary block"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(text);
              toast('コピーしました');
            } catch {
              setShow(true);
              toast('下の文字を長押しでコピーしてね');
            }
          }}
        >
          コピーする
        </button>
        <button className="btn ghost block" onClick={() => setShow(!show)}>
          {show ? '内容をかくす' : '内容を見る'}
        </button>
        {show && <textarea className="code-box" readOnly rows={12} value={text} />}
      </div>
      <div className="card">
        <b>感想を送る</b>
        <p className="muted small">気になったこと、うれしかったこと、やめたくなった理由など、なんでも教えてください。</p>
        {FEEDBACK_URL ? (
          <a className="btn soft block center" href={FEEDBACK_URL} target="_blank" rel="noreferrer">
            感想フォームを開く
          </a>
        ) : (
          <div className="muted small center">（感想フォームは準備中です）</div>
        )}
      </div>
      <InstallGuide />
    </Sheet>
  );
}

/** ホーム画面に追加する方法と、データが消えないための注意 */
export function InstallGuide() {
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
  return (
    <div className="card install">
      <b>ホーム画面に追加して使ってね</b>
      {isStandalone() ? (
        <p className="small">ホーム画面から開いています。このまま使ってください 👍</p>
      ) : (
        <>
          <ol className="small">
            {ios ? (
              <>
                <li>Safariで開く（ほかのアプリの中で開いているときは、Safariで開き直す）</li>
                <li>下の共有ボタン（□に↑）をタップ</li>
                <li>「ホーム画面に追加」を選ぶ</li>
              </>
            ) : (
              <>
                <li>Chromeで開く</li>
                <li>右上の「︙」をタップ</li>
                <li>「ホーム画面に追加」（または「アプリをインストール」）を選ぶ</li>
              </>
            )}
          </ol>
          <p className="muted tiny">記録はこのスマホのブラウザの中だけに保存されます。ブラウザのまま使っていて、しばらく開かない日が続くと、記録が消えてしまうことがあります。ホーム画面に追加すると消えにくくなります。心配なときは「データの引き継ぎ」からコードをコピーしておいてね。</p>
        </>
      )}
    </div>
  );
}
