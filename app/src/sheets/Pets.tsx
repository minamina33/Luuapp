import { useState } from 'react';
import { useGame } from '../game/store';
import { useNav } from '../nav';
import { Sheet } from '../components/ui';
import { Egg } from '../components/Egg';
import { LuuImg } from '../components/LuuImg';
import { COLOR_MAP } from '../data/colors';
import { BOND_NAMES, EGG_NIGHTS, STAGE_DAYS, STAGE_NAMES } from '../config';
import { bondLevel, charmsFor, chooseEgg, switchPet, today } from '../game/logic';
import { CHARMS, MAX_CHARMS, type CharmId } from '../data/charms';
import { constellationsOf, yearsOf } from '../data/sky';
import { ConstellationSvg } from '../components/Sky';
import { sound } from '../sound';
import type { ColorId, Pet } from '../types';

const HINT: Record<ColorId, string> = {
  milk: 'ちゃいろの水玉',
  caramel: 'オレンジのしましま',
  lavender: 'むらさきの水玉',
  mint: 'みどりのなみなみ',
  cocoa: 'こげ茶のしましま',
  gray: 'はいいろのなみなみ',
  sakura: 'ピンクのハート',
  sora: 'みずいろの水玉',
  yuki: 'きらきらの星（めずらしい！）',
};
const stageOfPet = (p: Pet) => {
  let st = 1;
  STAGE_DAYS.forEach((d, i) => p.activeDays.length >= d && (st = i + 1));
  return st;
};

// ------------------------------------------------------------ たまごを選ぶ
export function EggsSheet() {
  const { s, update } = useGame();
  const nav = useNav();
  const [sel, setSel] = useState<ColorId | null>(null);
  const offer = s.eggOffer;
  if (!offer) return null;
  return (
    <Sheet title="たまごを選ぶ" onClose={nav.close}>
      <p className="muted small center">
        {s.pet.name}が見つけてきたたまご。どれを温める？
        <br />
        模様で、どんな子が生まれるかなんとなくわかるかも。
      </p>
      <div className="egg-row">
        {offer.choices.map((c) => (
          <button key={c} className={`egg-pick ${sel === c ? 'on' : ''}`} onClick={() => (sound.se('tap'), setSel(c))}>
            <Egg color={c} size={78} wobble={sel === c} />
            <small>{HINT[c]}</small>
          </button>
        ))}
      </div>
      <button
        className="btn primary block"
        disabled={!sel}
        onClick={() => {
          if (!sel) return;
          sound.se('chime');
          update((d) => chooseEgg(d, sel));
          nav.close();
        }}
      >
        このたまごを温める
      </button>
      <p className="muted tiny center">「おやすみ」を{EGG_NIGHTS}晩すると生まれるよ。あとで選んでも大丈夫です。</p>
    </Sheet>
  );
}

// ------------------------------------------------------------ 生まれた子に名前をつける
export function NewPetSheet({ id }: { id: string }) {
  const { s, update, toast } = useGame();
  const nav = useNav();
  const p = s.otherPets.find((x) => x.id === id) ?? (s.pet.id === id ? s.pet : undefined);
  const [name, setName] = useState(p?.name ?? 'るう');
  if (!p) return null;
  const save = (move: boolean) => {
    update((d) => {
      const t = d.otherPets.find((x) => x.id === id) ?? (d.pet.id === id ? d.pet : undefined);
      if (t) t.name = name.trim() || t.name;
      if (move) switchPet(d, id);
    });
    if (move) {
      sound.se('pop');
      toast(`${name}がおへやに来たよ`);
      nav.setTab('home');
    }
    nav.close();
  };
  return (
    <Sheet title="あたらしいなかま" onClose={() => save(false)}>
      <div className="newpet">
        <LuuImg sprite="g_lookup" color={p.color} className="newpet-img" />
        <div className="muted small">{COLOR_MAP[p.color].name}のるう</div>
        <div className="field">
          <div className="label">名前をつけてあげよう</div>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={10} />
        </div>
        <button className="btn primary block" onClick={() => save(true)}>
          おへやに出す
        </button>
        <button className="btn ghost block" onClick={() => save(false)}>
          あとで（いまの子といっしょにいる）
        </button>
        <p className="muted tiny center">「なかまたち」から、いつでも切り替えられます。どの子も成長や思い出はそのまま残ります。</p>
      </div>
    </Sheet>
  );
}

// ------------------------------------------------------------ なかまたち
export function PetsSheet() {
  const { s, update, toast } = useGame();
  const nav = useNav();
  const pets = [s.pet, ...s.otherPets];
  return (
    <Sheet title="なかまたち" onClose={nav.close}>
      <p className="muted small">おへやに出す子を選べます。成長が進むのと、夜の冒険に行くのは、おへやにいる子です。</p>
      <div className="pet-list">
        {pets.map((p) => {
          const st = stageOfPet(p);
          const lv = bondLevel(p.totalBondPoints);
          const here = p.id === s.pet.id;
          return (
            <div key={p.id} className={`pet-card ${here ? 'here' : ''}`}>
              <LuuImg sprite="sit" color={p.color} className="pet-img" />
              <div className="grow">
                <b>{p.name}</b> <small className="muted">{COLOR_MAP[p.color].name}</small>
                <div className="small">
                  {STAGE_NAMES[st - 1]}・{BOND_NAMES[lv - 1]}
                </div>
                <div className="muted tiny">いっしょに過ごした日 {p.activeDays.length}日・みつけたもの {Object.keys(p.found).length}種</div>
              </div>
              {here ? (
                <span className="here-tag">おへやにいる</span>
              ) : (
                <button
                  className="btn tiny primary"
                  onClick={() => {
                    sound.se('pop');
                    update((d) => switchPet(d, p.id));
                    toast(`${p.name}がおへやに来たよ`);
                    nav.close();
                    nav.setTab('home');
                  }}
                >
                  おへやに出す
                </button>
              )}
            </div>
          );
        })}
        {s.egg && (
          <div className="pet-card egg-card">
            <Egg color={s.egg.color} size={46} wobble />
            <div className="grow">
              <b>たまご</b>
              <div className="muted tiny">あと{s.egg.nightsLeft}晩で生まれるよ</div>
            </div>
          </div>
        )}
        {s.eggOffer && (
          <button className="pet-card egg-card" onClick={() => nav.open({ k: 'eggs' })}>
            <Egg color={s.eggOffer.choices[0]} size={46} />
            <div className="grow">
              <b>たまごを選ぶ</b>
              <div className="muted tiny">{s.pet.name}が見つけたたまごが待ってるよ</div>
            </div>
            <span className="chev">›</span>
          </button>
        )}
      </div>
      {pets.length === 1 && !s.egg && !s.eggOffer && <p className="muted small center">{s.pet.name}が「おとな」になると、新しいなかまのたまごを見つけてくるよ。</p>}
    </Sheet>
  );
}

// ------------------------------------------------------------ 冒険かばん（おまもり）
export function CharmsSheet() {
  const { s } = useGame();
  const nav = useNav();
  const bag = charmsFor(s, today(s));
  return (
    <Sheet title={`${s.pet.name}の冒険かばん`} onClose={nav.close}>
      <p className="muted small">
        今日のケアで、おまもりがかばんに入ります。今夜の冒険に持っていって、行き先や出会いがすこし変わるよ（{MAX_CHARMS}つまで）。ケアをしなかった日も、冒険はいつも通り行けます。
      </p>
      <div className="bag-row big">
        {Array.from({ length: MAX_CHARMS }, (_, i) => (
          <span key={i} className={`bag-slot ${bag[i] ? 'on' : ''}`}>
            {bag[i] ? CHARMS[bag[i]].icon : ''}
          </span>
        ))}
      </div>
      <div className="charm-list">
        {(Object.keys(CHARMS) as CharmId[]).map((c) => (
          <div key={c} className={`charm-row ${bag.includes(c) ? 'in' : ''}`}>
            <span className="charm-ico">{CHARMS[c].icon}</span>
            <span className="grow">
              <b>{CHARMS[c].name}</b>
              <small className="muted">
                {CHARMS[c].care}をすると入る
                <br />
                {CHARMS[c].effect}
              </small>
            </span>
            {bag.includes(c) && <span className="here-tag">かばんの中</span>}
          </div>
        ))}
      </div>
    </Sheet>
  );
}

// ------------------------------------------------------------ 星座帳
export function SkySheet() {
  const { s, update, toast } = useGame();
  const nav = useNav();
  const years = yearsOf(s.sky.stars);
  const thisYear = new Date(Date.now() + s.debug.timeOffsetMs).getFullYear();
  const [year, setYear] = useState(years[0] ?? thisYear);
  const cs = constellationsOf(s.sky.stars, year);
  const cur = [...cs].reverse().find((c) => !c.done) ?? null;
  const done = cs.filter((c) => c.done);
  const count = s.sky.stars.filter((x) => x.y === year).length;
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState('');
  return (
    <Sheet title="星座帳" onClose={nav.close} full>
      <p className="muted small">タスクをした夜（ほしのおまもりを持って眠った夜）に、星がひとつ灯ります。星がつながると星座になって、名前をつけられます。1年で1枚の星空になります。</p>
      {years.length > 1 && (
        <div className="year-chips">
          {years.map((y) => (
            <button key={y} className={`month-chip ${y === year ? 'new' : ''}`} onClick={() => setYear(y)}>
              {y}年の星空
            </button>
          ))}
        </div>
      )}
      <div className="sky-panel">
        <div className="sky-title">
          {year}年の星空 <small>星 {count}こ・星座 {done.length}こ</small>
        </div>
        {done.length === 0 && !cur?.lit && <div className="sky-empty">まだ星はありません。タスクをして眠ると、最初の星が灯るよ。</div>}
        <div className="sky-grid">
          {done.map((c) => (
            <button
              key={c.key}
              className="sky-cell"
              onClick={() => {
                setEditing(c.key);
                setName(s.sky.names[c.key] ?? '');
              }}
            >
              <ConstellationSvg c={c} size={88} />
              <small>{s.sky.names[c.key] || `その${c.index + 1}（名前をつける）`}</small>
            </button>
          ))}
          {cur && cur.lit > 0 && year === (years[0] ?? thisYear) && (
            <div className="sky-cell making">
              <ConstellationSvg c={cur} size={88} />
              <small>
                つくっている星座
                <br />
                あと{cur.total - cur.lit}こ
              </small>
            </div>
          )}
        </div>
      </div>
      {editing && (
        <div className="card">
          <b>この星座に名前をつける</b>
          <div className="muted tiny">ヒント：{cs.find((c) => c.key === editing)?.pattern.hint}にも見えるかも</div>
          <input value={name} maxLength={14} onChange={(e) => setName(e.target.value)} placeholder="例：がんばった春のうさぎ座" />
          <div className="row gap" style={{ marginTop: 8 }}>
            <button className="btn ghost grow" onClick={() => setEditing(null)}>
              やめる
            </button>
            <button
              className="btn primary grow"
              onClick={() => {
                update((d) => void (d.sky.names[editing] = name.trim()));
                setEditing(null);
                toast('名前をつけたよ');
              }}
            >
              保存
            </button>
          </div>
        </div>
      )}
    </Sheet>
  );
}
