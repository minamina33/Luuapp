import { useState } from 'react';
import { useGame } from '../game/store';
import { spriteUrl } from '../assets';
import { GOALS, HABIT_MAP, suggestHabits, WHEN_NAMES, SUPPORT_LINK } from '../data/content';
import { MAX_TASKS } from '../config';
import { giftOnce, nowIso, seasonCheck, uid, welcome } from '../game/logic';
import { sound } from '../sound';

export default function Onboarding() {
  const { update } = useGame();
  const [step, setStep] = useState(0);
  const [nick, setNick] = useState('');
  const [name, setName] = useState('るう');
  const [goals, setGoals] = useState<string[]>([]);
  const suggested = suggestHabits(goals.length ? goals : ['rhythm', 'calm'], [], [], 6);
  const [picked, setPicked] = useState<string[] | null>(null);
  const tasks = picked ?? suggested.slice(0, 3).map((h) => h.id);
  const [agree, setAgree] = useState(false);

  function finish() {
    update((d, f) => {
      d.player = { id: uid(), nickname: nick.trim() || 'あなた', createdAt: nowIso(d), goals, premiumDemo: false };
      d.pet.name = name.trim() || 'るう';
      // はじめは「小さい版」から。あとで大きさを変えられる
      d.tasks = tasks.map((id) => {
        const h = HABIT_MAP[id];
        return { id: uid(), title: h.small, source: 'suggested' as const, repeat: 'daily' as const, isActive: true, libId: id, size: 'small' as const, when: h.when, createdAt: nowIso(d) };
      });
      d.album.push({ id: uid(), at: nowIso(d), kind: 'start', title: `${d.pet.name}とであった日` });
      welcome(d);
      giftOnce(d, f, 'gift:hello', 'col_hello', 'はじめましてのおみやげ', `${d.pet.name}が「よろしくね」って持ってきてくれたよ`);
      seasonCheck(d, f);
    });
  }

  return (
    <div className="onboard">
      <div className="ob-dots">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={i <= step ? 'on' : ''} />
        ))}
      </div>
      {step === 0 && (
        <div className="ob-step">
          <img className="ob-luu" src={spriteUrl('sit')} alt="" />
          <h1>はじめまして</h1>
          <p>
            ふわっと寄り添ってくれる、垂れ耳のうさぎ。
            <br />
            小さなセルフケアをするたびに、いっしょに少しずつ育っていきます。
          </p>
          <button className="btn primary block" onClick={() => setStep(1)}>
            はじめる
          </button>
        </div>
      )}
      {step === 1 && (
        <div className="ob-step">
          <img className="ob-luu sm" src={spriteUrl('g_lookup')} alt="" />
          <h2>あなたのことは、なんて呼べばいい？</h2>
          <input autoFocus value={nick} onChange={(e) => setNick(e.target.value)} placeholder="ニックネーム" maxLength={12} />
          <button className="btn primary block" onClick={() => setStep(2)}>
            つぎへ
          </button>
        </div>
      )}
      {step === 2 && (
        <div className="ob-step">
          <img className="ob-luu sm" src={spriteUrl('tereru')} alt="" />
          <h2>この子の名前は？</h2>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={10} />
          <p className="muted small">あとから変えられます</p>
          <button className="btn primary block" onClick={() => setStep(3)}>
            つぎへ
          </button>
        </div>
      )}
      {step === 3 && (
        <div className="ob-step">
          <h2>どんなことを大切にしたい？</h2>
          <p className="muted small">いくつでも。あとで変えても大丈夫。</p>
          <div className="goal-list">
            {GOALS.map((g) => (
              <button
                key={g.id}
                className={`goal ${goals.includes(g.id) ? 'on' : ''}`}
                onClick={() => {
                  setGoals(goals.includes(g.id) ? goals.filter((x) => x !== g.id) : [...goals, g.id]);
                  setPicked(null);
                }}
              >
                <span>{g.emoji}</span>
                {g.label}
              </button>
            ))}
          </div>
          <button className="btn primary block" onClick={() => setStep(4)}>
            つぎへ
          </button>
        </div>
      )}
      {step === 4 && (
        <div className="ob-step">
          <h2>小さな習慣から、はじめてみよう</h2>
          <p className="muted small">
            {name || 'るう'}が、えらんでくれたことに合わせて考えたよ。まずは「小さい版」から。{MAX_TASKS}つまで、あとで追加・変更できます。
          </p>
          <div className="goal-list">
            {suggested.map((h) => {
              const on = tasks.includes(h.id);
              return (
                <button
                  key={h.id}
                  className={`goal habit ${on ? 'on' : ''}`}
                  onClick={() => setPicked(on ? tasks.filter((x) => x !== h.id) : tasks.length >= MAX_TASKS ? tasks : [...tasks, h.id])}
                >
                  <span>{on ? '✓' : '＋'}</span>
                  <span className="grow">
                    {h.small}
                    <small className="habit-meta">
                      {WHEN_NAMES[h.when]}・{h.reason}
                    </small>
                  </span>
                </button>
              );
            })}
          </div>
          <button className="btn primary block" onClick={() => setStep(5)}>
            つぎへ
          </button>
        </div>
      )}
      {step === 5 && (
        <div className="ob-step">
          <h2>{name || 'るう'}とのくらしかた</h2>
          <div className="howto">
            <div>
              <img src={spriteUrl('ureshii')} alt="" />
              <span>
                <b>気分の記録や小さなセルフケア</b>
                <br />
                で星がたまって、{name || 'るう'}が少しずつ育つよ
              </span>
            </div>
            <div>
              <img src={spriteUrl('g_sleep')} alt="" />
              <span>
                <b>夜は「おやすみ」</b>
                <br />
                {name || 'るう'}もいっしょに眠って、夢の中で冒険に出かけるよ
              </span>
            </div>
            <div>
              <img src={spriteUrl('p_amae')} alt="" />
              <span>
                <b>朝は「おはよう」</b>
                <br />
                冒険のおみやげを持って帰ってくるよ
              </span>
            </div>
          </div>
          <p className="muted small">できない日があっても大丈夫。{name || 'るう'}が弱ったり、成長が戻ったりすることはありません。</p>
          <div className="consent">
            <b>試作版について</b>
            <ul>
              <li>セルフケアの習慣づくりを手助けするアプリで、医療・診断・治療を目的としたものではありません。</li>
              <li>記録はこのスマホ（ブラウザ）の中だけに保存され、外には送られません。ホーム画面に追加して使うと、記録が消えにくくなります。</li>
              <li>
                つらい気持ちが続くときは、ひとりで抱えこまず、身近な人や相談窓口に話してください（
                <a href={SUPPORT_LINK.url} target="_blank" rel="noreferrer">
                  相談窓口の一覧
                </a>
                ）。
              </li>
            </ul>
            <label className="agree">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
              わかりました
            </label>
          </div>
          <button
            className="btn primary block"
            disabled={!agree}
            onClick={() => {
              sound.se('chime');
              finish();
            }}
          >
            {name || 'るう'}のおへやへ
          </button>
        </div>
      )}
    </div>
  );
}
